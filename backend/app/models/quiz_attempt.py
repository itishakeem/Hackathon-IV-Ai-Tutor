import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

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
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<QuizAttempt user={self.user_id} chapter={self.chapter_id} score={self.score}/{self.total_questions}>"
