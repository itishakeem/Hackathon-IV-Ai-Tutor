"""Chapters router — content delivery from Supabase Storage. NO LLM imports."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, get_optional_user
from app.schemas.chapter import ChapterContent, ChapterMeta, ChapterNav, ChapterSummary
from app.services.access_service import check_access, get_access_reason
from app.services.r2_service import (
    get_chapter_content,
    get_chapter_list,
    get_chapter_summary,
    get_next_chapter,
    get_previous_chapter,
)

# NO LLM imports

router = APIRouter()


@router.get("", response_model=list[ChapterMeta])
async def list_chapters(
    user: Annotated[dict | None, Depends(get_optional_user)],
):
    """List all chapters. Free users see chapters 4-5 as locked."""
    tier = user["tier"] if user else "free"
    return get_chapter_list(tier)


@router.get("/{chapter_id}", response_model=ChapterContent)
async def get_chapter(
    chapter_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Fetch full chapter content verbatim. Enforces freemium gate."""
    tier = user["tier"]
    if not check_access(tier, chapter_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_access_reason(tier, chapter_id),
        )
    try:
        return get_chapter_content(chapter_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")


@router.get("/{chapter_id}/next", response_model=ChapterNav | None)
async def next_chapter(chapter_id: str):
    """Return the next chapter id and title (no auth required)."""
    result = get_next_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No next chapter")
    return result


@router.get("/{chapter_id}/previous", response_model=ChapterNav | None)
async def previous_chapter(chapter_id: str):
    """Return the previous chapter id and title (no auth required)."""
    result = get_previous_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No previous chapter")
    return result


@router.get("/{chapter_id}/summary", response_model=ChapterSummary)
async def chapter_summary(
    chapter_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Return static key points from the chapter's ## Summary section. NO LLM."""
    tier = user["tier"]
    if not check_access(tier, chapter_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_access_reason(tier, chapter_id),
        )
    try:
        return get_chapter_summary(chapter_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
