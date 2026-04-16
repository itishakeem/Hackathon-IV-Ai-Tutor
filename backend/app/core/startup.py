"""Startup routines — called once when the FastAPI app initialises."""
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.r2_client import CHAPTER_IDS, CHAPTER_TITLES, get_chapter

logger = logging.getLogger(__name__)


async def build_search_index(db: AsyncSession) -> None:
    """Read all chapter content from R2 and upsert into the search_index table.

    Uses INSERT … ON CONFLICT(chapter_id) DO UPDATE so re-runs are idempotent.
    No content transformation — raw markdown is stored verbatim.
    """
    indexed = 0
    errors = 0

    for chapter_id in CHAPTER_IDS:
        try:
            content = get_chapter(chapter_id)
            title = CHAPTER_TITLES.get(chapter_id, chapter_id)

            await db.execute(
                text(
                    """
                    INSERT INTO search_index (id, chapter_id, chapter_title, content_text, indexed_at)
                    VALUES (gen_random_uuid(), :chapter_id, :chapter_title, :content_text, now())
                    ON CONFLICT (chapter_id) DO UPDATE
                        SET chapter_title = EXCLUDED.chapter_title,
                            content_text  = EXCLUDED.content_text,
                            indexed_at    = EXCLUDED.indexed_at
                    """
                ),
                {
                    "chapter_id": chapter_id,
                    "chapter_title": title,
                    "content_text": content,
                },
            )
            indexed += 1
            logger.info("Indexed chapter: %s", chapter_id)
        except KeyError:
            logger.warning("Chapter not found in R2, skipping: %s", chapter_id)
            errors += 1
        except Exception:
            logger.exception("Failed to index chapter: %s", chapter_id)
            errors += 1

    await db.commit()
    logger.info(
        "Search index built: %d chapters indexed, %d errors", indexed, errors
    )
