import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("user_id", "chapter_id", name="uq_progress_user_chapter"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chapter_id: Mapped[str] = mapped_column(String(50), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Streak: +1 per calendar day a chapter is completed; resets to 0 if gap > 1 day
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Tracks last day of any chapter completion for streak calculation
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<Progress user={self.user_id} chapter={self.chapter_id} streak={self.streak_days}>"
