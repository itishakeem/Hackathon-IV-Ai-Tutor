"""Cross-Chapter Synthesis service — Phase 2 Hybrid Intelligence.

All LLM calls are isolated in this module.
Import anthropic ONLY here within app/premium/.
"""
import uuid
from pathlib import Path

import anthropic
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.r2_client import CHAPTER_IDS, get_chapter
from app.premium.schemas.synthesis import GraphEdge, SynthesisResponse
from app.premium.services.cost_tracker import check_rate_limit, log_usage

# ── Prompt template ──────────────────────────────────────────────────────────

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "synthesis_prompt.md"
_PROMPT_TEMPLATE: str = _PROMPT_PATH.read_text(encoding="utf-8")

# ── Anthropic tool schema ─────────────────────────────────────────────────────

SYNTHESIS_TOOL_SCHEMA = {
    "name": "submit_synthesis",
    "description": "Submit the structured synthesis result connecting concepts across chapters.",
    "input_schema": {
        "type": "object",
        "properties": {
            "synthesis": {
                "type": "string",
                "description": "Narrative paragraph connecting the selected chapters",
            },
            "key_connections": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Each entry must cite at least one [chapter-XX] reference",
            },
            "knowledge_graph": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "from": {"type": "string"},
                        "to": {"type": "string"},
                        "relationship": {"type": "string"},
                    },
                    "required": ["from", "to", "relationship"],
                },
                "description": "List of concept relationship edges",
            },
            "recommended_next": {
                "type": "string",
                "description": "chapter_id of the single best next chapter to read",
            },
        },
        "required": ["synthesis", "key_connections", "knowledge_graph", "recommended_next"],
    },
}


# ── Public helpers ────────────────────────────────────────────────────────────

def build_synthesis_prompt(
    chapter_contents: dict[str, str],
    focus_topic: str,
) -> str:
    """Return the formatted system prompt for the synthesis LLM call.

    Exposed as a module-level function so unit tests can verify structure
    without triggering any database or Anthropic calls.

    Args:
        chapter_contents: Mapping of chapter_id → content text
        focus_topic: The topic to focus the synthesis around
    """
    chapters_xml = "\n\n".join(
        f'<chapter id="{cid}">\n{content}\n</chapter>'
        for cid, content in chapter_contents.items()
    )
    return _PROMPT_TEMPLATE.format(
        chapters_content=chapters_xml,
        focus_topic=focus_topic,
    )


# ── Service entry point ───────────────────────────────────────────────────────

async def synthesize_chapters(
    db: AsyncSession,
    chapter_ids: list[str],
    focus_topic: str,
    user_id: uuid.UUID,
) -> SynthesisResponse:
    """Connect concepts across 2–5 chapters using Claude Sonnet.

    Steps:
      1. Validate every chapter_id against the known allowlist (SSRF prevention)
      2. Check daily rate limit (raises 429 if exceeded)
      3. Fetch content for each chapter from Supabase Storage
      4. Build multi-chapter XML prompt from template
      5. # HYBRID — LLM CALL — invoke Claude via tool_use for structured output
      6. Log token usage to llm_usage table
      7. Parse knowledge_graph edges (handle 'from' → alias 'from_')
      8. Return SynthesisResponse

    Raises:
        HTTPException 404 — any chapter_id not in allowlist
        HTTPException 429 — rate limit exceeded
        HTTPException 503 — Anthropic service unavailable
        HTTPException 502 — unexpected LLM response shape
    """
    # Step 1: Validate all chapter_ids against allowlist before any I/O
    for cid in chapter_ids:
        if cid not in CHAPTER_IDS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter '{cid}' not found.",
            )

    # Step 2: Check daily rate limit
    await check_rate_limit(db, user_id)

    # Step 3: Fetch chapter content for all requested chapters
    chapter_contents: dict[str, str] = {}
    for cid in chapter_ids:
        try:
            chapter_contents[cid] = get_chapter(cid)
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter '{cid}' not found.",
            )

    # Step 4: Build system prompt with multi-chapter XML blocks
    system_prompt = build_synthesis_prompt(
        chapter_contents=chapter_contents,
        focus_topic=focus_topic,
    )

    # Step 5: # HYBRID — LLM CALL
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=settings.MAX_TOKENS_SYNTHESIS,
            system=system_prompt,
            tools=[SYNTHESIS_TOOL_SCHEMA],
            tool_choice={"type": "tool", "name": "submit_synthesis"},
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Synthesize the provided chapters focusing on: {focus_topic}. "
                        f"Chapters covered: {', '.join(chapter_ids)}."
                    ),
                }
            ],
        )
    except anthropic.APIConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Synthesis service temporarily unavailable. Please try again.",
        ) from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Synthesis service temporarily unavailable. Please try again.",
        ) from exc

    # Step 6: Log usage to llm_usage table
    await log_usage(db, user_id, "synthesis", response.usage)

    # Step 7: Parse result — knowledge_graph uses 'from' key (Python reserved word)
    try:
        result = response.content[0].input
        graph_edges = [
            GraphEdge.model_validate(edge) for edge in result["knowledge_graph"]
        ]
        return SynthesisResponse(
            synthesis=result["synthesis"],
            key_connections=result["key_connections"],
            knowledge_graph=graph_edges,
            recommended_next=result["recommended_next"],
        )
    except (IndexError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to parse synthesis response. Please retry.",
        ) from exc
