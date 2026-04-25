"""Chapter content service — serves verbatim content from Supabase Storage. NO LLM."""
import re

from app.core.r2_client import CHAPTER_IDS, CHAPTER_TITLES, get_chapter
from app.schemas.chapter import ChapterContent, ChapterMeta, ChapterNav, ChapterSummary

# NO LLM imports

# Static chapter metadata list — order defines navigation.
CHAPTER_METADATA: list[ChapterMeta] = [
    ChapterMeta(
        chapter_id="chapter-01",
        title="Introduction to AI Agents",
        description="Core architectures, agent loops, tool use basics, and the fundamentals of autonomous AI systems.",
        module=1,
    ),
    ChapterMeta(
        chapter_id="chapter-02",
        title="Claude Agent SDK",
        description="SDK setup, agent types, memory patterns, and building your first Claude-powered agent.",
        module=2,
    ),
    ChapterMeta(
        chapter_id="chapter-03",
        title="Model Context Protocol (MCP)",
        description="MCP servers, resources & tools API, prompts API, and integrating external capabilities.",
        module=3,
    ),
    ChapterMeta(
        chapter_id="chapter-04",
        title="Agent Skills (SKILL.md)",
        description="Skill composition, error recovery, testing agents, and building reusable agent capabilities.",
        module=4,
    ),
    ChapterMeta(
        chapter_id="chapter-05",
        title="Multi-Agent Systems",
        description="Orchestration patterns, agent communication, parallel execution, and production deployment.",
        module=5,
    ),
]

_CHAPTER_INDEX: dict[str, int] = {
    ch.chapter_id: i for i, ch in enumerate(CHAPTER_METADATA)
}


def get_chapter_list(user_tier: str) -> list[ChapterMeta]:
    """Return full metadata list; lock chapters 4-5 for free-tier users."""
    from app.services.access_service import check_access

    result = []
    for ch in CHAPTER_METADATA:
        locked = not check_access(user_tier, ch.chapter_id)
        result.append(ch.model_copy(update={"locked": locked}))
    return result


def get_chapter_content(chapter_id: str) -> ChapterContent:
    """Fetch chapter from storage and return verbatim. Raises KeyError if missing."""
    content = get_chapter(chapter_id)
    title = CHAPTER_TITLES.get(chapter_id, chapter_id)
    return ChapterContent(chapter_id=chapter_id, title=title, content=content)


def get_next_chapter(chapter_id: str) -> ChapterNav | None:
    """Return the next chapter's id and title, or None if already last."""
    idx = _CHAPTER_INDEX.get(chapter_id)
    if idx is None or idx >= len(CHAPTER_METADATA) - 1:
        return None
    nxt = CHAPTER_METADATA[idx + 1]
    return ChapterNav(chapter_id=nxt.chapter_id, title=nxt.title)


def get_previous_chapter(chapter_id: str) -> ChapterNav | None:
    """Return the previous chapter's id and title, or None if already first."""
    idx = _CHAPTER_INDEX.get(chapter_id)
    if idx is None or idx <= 0:
        return None
    prev = CHAPTER_METADATA[idx - 1]
    return ChapterNav(chapter_id=prev.chapter_id, title=prev.title)


def get_chapter_summary(chapter_id: str) -> ChapterSummary:
    """Extract bullet points from the ## Summary section of a chapter.

    NO LLM — reads static text from storage only.
    """
    content = get_chapter(chapter_id)

    # Find the ## Summary section and extract bullet lines.
    summary_match = re.search(r"##\s+Summary\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
    if not summary_match:
        return ChapterSummary(chapter_id=chapter_id, key_points=[])

    summary_block = summary_match.group(1)
    # Extract numbered or bulleted lines (1. text or - text or ** text **)
    key_points = []
    for line in summary_block.splitlines():
        line = line.strip()
        # Match "1. text", "- text", or "**N. text**"
        m = re.match(r"^(?:\d+\.\s+|\*\*\d+\.\s+|-\s+|\*\s+)(.*?)(?:\*\*)?$", line)
        if m:
            point = m.group(1).strip().rstrip("*").strip()
            if point:
                key_points.append(point)

    return ChapterSummary(chapter_id=chapter_id, key_points=key_points)
