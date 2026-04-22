"""Progress service — deterministic streak + completion tracking. NO LLM."""
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Float, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import Progress
from app.models.quiz_attempt import QuizAttempt
from app.schemas.progress import (
    ChapterCompleteResponse,
    ChapterProgressItem,
    ProgressResponse,
    QuizScoreItem,
)

# NO LLM imports

_TOTAL_CHAPTERS = 5


async def get_progress(db: AsyncSession, user_id: uuid.UUID) -> ProgressResponse:
    """Compute full progress summary for a user."""
    result = await db.execute(
        select(Progress).where(Progress.user_id == user_id)
    )
    rows = result.scalars().all()

    chapters = [
        ChapterProgressItem(
            chapter_id=r.chapter_id,
            completed=r.completed,
            streak_days=r.streak_days,
        )
        for r in rows
    ]

    completed_chapter_ids = [r.chapter_id for r in rows if r.completed]
    completed_count = len(completed_chapter_ids)
    completion_pct = round((completed_count / _TOTAL_CHAPTERS) * 100, 1)
    current_streak = max((r.streak_days for r in rows), default=0)

    # All quiz attempts for this user
    attempts_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at.asc())
    )
    attempts = attempts_result.scalars().all()

    quiz_scores = [
        QuizScoreItem(
            chapter_id=a.chapter_id,
            score=round((a.score / a.total_questions) * 100) if a.total_questions > 0 else 0,
            attempted_at=a.attempted_at,
        )
        for a in attempts
    ]

    avg_quiz_score: float | None = None
    if quiz_scores:
        avg_quiz_score = round(sum(s.score for s in quiz_scores) / len(quiz_scores), 1)

    return ProgressResponse(
        user_id=str(user_id),
        completed_chapters=completed_chapter_ids,
        quiz_scores=quiz_scores,
        streak=current_streak,
        total_chapters=_TOTAL_CHAPTERS,
        completion_percentage=completion_pct,
        avg_quiz_score=avg_quiz_score,
        chapters=chapters,
    )


async def complete_chapter(
    db: AsyncSession, user_id: uuid.UUID, chapter_id: str
) -> ChapterCompleteResponse:
    """Mark a chapter complete and update streak using calendar-day logic.

    Streak rules (deterministic, NO LLM):
    - Same calendar day as last_activity_date → streak unchanged
    - Next consecutive calendar day → streak += 1
    - Gap > 1 day → streak resets to 1
    - First completion ever → streak = 1
    """
    today: date = datetime.now(timezone.utc).date()

    result = await db.execute(
        select(Progress).where(
            Progress.user_id == user_id,
            Progress.chapter_id == chapter_id,
        )
    )
    row = result.scalar_one_or_none()

    if row is None:
        row = Progress(
            user_id=user_id,
            chapter_id=chapter_id,
            completed=True,
            completed_at=datetime.now(timezone.utc),
            streak_days=1,
            last_activity_date=today,
        )
        db.add(row)
    else:
        last = row.last_activity_date

        if last is None:
            new_streak = 1
        elif last == today:
            new_streak = row.streak_days
        elif (today - last).days == 1:
            new_streak = row.streak_days + 1
        else:
            new_streak = 1

        row.completed = True
        row.completed_at = datetime.now(timezone.utc)
        row.streak_days = new_streak
        row.last_activity_date = today

    await db.commit()
    await db.refresh(row)

    return ChapterCompleteResponse(
        chapter_id=chapter_id,
        completed=row.completed,
        streak_days=row.streak_days,
    )


async def record_quiz_score(
    db: AsyncSession,
    user_id: uuid.UUID,
    chapter_id: str,
    score: int,
    total_questions: int,
) -> None:
    """Insert a QuizAttempt row."""
    attempt = QuizAttempt(
        user_id=user_id,
        chapter_id=chapter_id,
        score=score,
        total_questions=total_questions,
    )
    db.add(attempt)
    await db.commit()


async def reset_progress(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Delete all Progress and QuizAttempt rows for a user."""
    await db.execute(delete(Progress).where(Progress.user_id == user_id))
    await db.execute(delete(QuizAttempt).where(QuizAttempt.user_id == user_id))
    await db.commit()
