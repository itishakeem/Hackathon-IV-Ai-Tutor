"""LLM-Graded Assessment service — Phase 2 Hybrid Intelligence.

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
from app.premium.schemas.assessment import AssessmentResponse
from app.premium.services.cost_tracker import check_rate_limit, log_usage

# ── Prompt template ──────────────────────────────────────────────────────────

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "assessment_prompt.md"
_PROMPT_TEMPLATE: str = _PROMPT_PATH.read_text(encoding="utf-8")

# ── Anthropic tool schema ─────────────────────────────────────────────────────

ASSESSMENT_TOOL_SCHEMA = {
    "name": "submit_assessment",
    "description": "Submit the structured assessment result for a student's answer.",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Numeric score from 0 to 100",
            },
            "feedback": {
                "type": "string",
                "description": "Narrative feedback paragraph",
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of things the student did well",
            },
            "improvements": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of areas for improvement",
            },
            "suggested_reading": {
                "type": "string",
                "description": "Chapter section reference (e.g. 'chapter-01 section: Agent vs Chatbot')",
            },
        },
        "required": ["score", "feedback", "strengths", "improvements", "suggested_reading"],
    },
}


# ── Public helpers ────────────────────────────────────────────────────────────

def build_assessment_prompt(
    chapter_id: str,
    chapter_content: str,
    question: str,
) -> str:
    """Return the formatted system prompt for the assessment LLM call.

    Exposed as a module-level function so unit tests can verify structure
    without triggering any database or Anthropic calls.
    """
    return _PROMPT_TEMPLATE.format(
        chapter_id=chapter_id,
        chapter_content=chapter_content,
    )


# ── Service entry point ───────────────────────────────────────────────────────

async def assess_answer(
    db: AsyncSession,
    chapter_id: str,
    question: str,
    student_answer: str,
    user_id: uuid.UUID,
) -> AssessmentResponse:
    """Evaluate a student's answer against chapter content using Claude Sonnet.

    Steps:
      1. Validate chapter_id against the known allowlist (SSRF prevention)
      2. Check daily rate limit (raises 429 if exceeded)
      3. Fetch chapter content from Supabase Storage
      4. Build system prompt from template
      5. # HYBRID — LLM CALL — invoke Claude via tool_use for structured output
      6. Log token usage to llm_usage table
      7. Return AssessmentResponse

    Raises:
        HTTPException 404 — chapter not in allowlist
        HTTPException 429 — rate limit exceeded
        HTTPException 503 — Anthropic service unavailable
        HTTPException 502 — unexpected LLM response shape
    """
    # Step 1: Validate chapter_id against allowlist
    if chapter_id not in CHAPTER_IDS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter '{chapter_id}' not found.",
        )

    # Step 2: Check daily rate limit before spending tokens
    await check_rate_limit(db, user_id)

    # Step 3: Fetch chapter content from Supabase Storage
    try:
        chapter_content = get_chapter(chapter_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter '{chapter_id}' not found.",
        )

    # Step 4: Build system prompt
    system_prompt = build_assessment_prompt(
        chapter_id=chapter_id,
        chapter_content=chapter_content,
        question=question,
    )

    # Silently truncate to 2000 chars (Pydantic enforces min; we enforce max here)
    answer = student_answer[:2000]

    # Step 5: # HYBRID — LLM CALL
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=settings.MAX_TOKENS_ASSESSMENT,
            system=system_prompt,
            tools=[ASSESSMENT_TOOL_SCHEMA],
            tool_choice={"type": "tool", "name": "submit_assessment"},
            messages=[
                {
                    "role": "user",
                    "content": f"Question: {question}\n\nAnswer: {answer}",
                }
            ],
        )
    except anthropic.APIConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assessment service temporarily unavailable. Please try again.",
        ) from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assessment service temporarily unavailable. Please try again.",
        ) from exc

    # Step 6: Log usage to llm_usage table
    await log_usage(db, user_id, "assessment", response.usage)

    # Step 7: Parse and return structured result
    try:
        result = response.content[0].input
        return AssessmentResponse(
            score=result["score"],
            max_score=100,
            feedback=result["feedback"],
            strengths=result["strengths"],
            improvements=result["improvements"],
            suggested_reading=result["suggested_reading"],
        )
    except (IndexError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to parse assessment response. Please retry.",
        ) from exc
