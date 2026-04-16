import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SearchIndex(Base):
    __tablename__ = "search_index"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    chapter_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    chapter_title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    indexed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<SearchIndex chapter={self.chapter_id} title={self.chapter_title}>"
