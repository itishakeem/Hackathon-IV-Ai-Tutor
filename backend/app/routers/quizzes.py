"""Quizzes router — rule-based fetch and grading. NO LLM imports."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz import (
    QuizAnswersResponse,
    QuizQuestionsResponse,
    QuizResult,
    QuizSubmitRequest,
)
from app.services.access_service import check_access, get_access_reason
from app.services.quiz_service import get_quiz_answers, get_quiz_questions, grade_quiz

# NO LLM imports

router = APIRouter()


def _assert_access(tier: str, chapter_id: str) -> None:
    if not check_access(tier, chapter_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_access_reason(tier, chapter_id),
        )


@router.get("/{chapter_id}", response_model=QuizQuestionsResponse)
async def fetch_questions(
    chapter_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Return quiz questions without correct answers."""
    _assert_access(user["tier"], chapter_id)
    try:
        return get_quiz_questions(chapter_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")


@router.post("/{chapter_id}/submit", response_model=QuizResult)
async def submit_quiz(
    chapter_id: str,
    body: QuizSubmitRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Grade submitted answers and record the attempt."""
    _assert_access(user["tier"], chapter_id)
    try:
        result = grade_quiz(chapter_id, body.answers)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Persist attempt
    attempt = QuizAttempt(
        user_id=uuid.UUID(user["sub"]),
        chapter_id=chapter_id,
        score=result.score,
        total_questions=result.total,
    )
    db.add(attempt)
    await db.commit()

    return result


@router.get("/{chapter_id}/answers", response_model=QuizAnswersResponse)
async def fetch_answers(
    chapter_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return correct answers. Requires ≥1 prior attempt."""
    _assert_access(user["tier"], chapter_id)

    user_id = uuid.UUID(user["sub"])
    result = await db.execute(
        select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.chapter_id == chapter_id,
        )
    )
    if result.first() is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete the quiz at least once before viewing answers",
        )

    try:
        return get_quiz_answers(chapter_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
