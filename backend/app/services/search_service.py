"""Search service — ILIKE keyword search against pre-built DB index. NO LLM."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# NO LLM imports — ILIKE only, zero embeddings

_EXCERPT_WINDOW = 200  # characters around the first match to return as excerpt


def _extract_excerpt(content: str, query: str) -> str:
    """Return a ~200-char window around the first case-insensitive match."""
    lower_content = content.lower()
    lower_query = query.lower()
    pos = lower_content.find(lower_query)
    if pos == -1:
        return content[:_EXCERPT_WINDOW]
    start = max(0, pos - 80)
    end = min(len(content), pos + len(lower_query) + 120)
    excerpt = content[start:end]
    if start > 0:
        excerpt = "…" + excerpt
    if end < len(content):
        excerpt = excerpt + "…"
    return excerpt


async def keyword_search(db: AsyncSession, query: str) -> list[dict]:
    """Search search_index table with ILIKE. Returns list of match dicts.

    Each result contains: chapter_id, chapter_title, excerpt.
    NO LLM, NO embeddings.
    """
    pattern = f"%{query}%"
    result = await db.execute(
        text(
            """
            SELECT chapter_id, chapter_title, content_text
            FROM search_index
            WHERE content_text ILIKE :pattern
               OR chapter_title ILIKE :pattern
            ORDER BY chapter_id
            """
        ),
        {"pattern": pattern},
    )
    rows = result.fetchall()

    hits = []
    for row in rows:
        hits.append(
            {
                "chapter_id": row.chapter_id,
                "chapter_title": row.chapter_title,
                "excerpt": _extract_excerpt(row.content_text, query),
            }
        )
    return hits
