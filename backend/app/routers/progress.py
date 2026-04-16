"""Progress router — streak tracking and completion. NO LLM imports."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.progress import (
    ChapterCompleteRequest,
    ChapterCompleteResponse,
    ProgressResponse,
    QuizScoreRequest,
)
from app.services.progress_service import (
    complete_chapter,
    get_progress,
    record_quiz_score,
    reset_progress,
)

# NO LLM imports

router = APIRouter()


def _assert_own_resource(token_sub: str, user_id: str) -> None:
    """Raise 403 if the token's sub doesn't match the requested user_id."""
    if token_sub != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot access another user's progress",
        )


@router.get("/{user_id}", response_model=ProgressResponse)
async def get_user_progress(
    user_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _assert_own_resource(user["sub"], user_id)
    return await get_progress(db, uuid.UUID(user_id))


@router.put("/{user_id}/chapter", response_model=ChapterCompleteResponse)
async def mark_chapter_complete(
    user_id: str,
    body: ChapterCompleteRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _assert_own_resource(user["sub"], user_id)
    return await complete_chapter(db, uuid.UUID(user_id), body.chapter_id)


@router.put("/{user_id}/quiz", status_code=status.HTTP_204_NO_CONTENT)
async def record_quiz(
    user_id: str,
    body: QuizScoreRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _assert_own_resource(user["sub"], user_id)
    await record_quiz_score(db, uuid.UUID(user_id), body.chapter_id, body.score, body.total_questions)


@router.delete("/{user_id}/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_user_progress(
    user_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _assert_own_resource(user["sub"], user_id)
    await reset_progress(db, uuid.UUID(user_id))
