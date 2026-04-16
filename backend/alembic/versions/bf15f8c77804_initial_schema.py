"""initial_schema

Revision ID: bf15f8c77804
Revises:
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "bf15f8c77804"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "tier",
            sa.String(20),
            nullable=False,
            server_default="free",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("tier IN ('free', 'premium', 'pro')", name="ck_users_tier"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- progress ---
    op.create_table(
        "progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chapter_id", sa.String(50), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "chapter_id", name="uq_progress_user_chapter"),
    )
    op.create_index("ix_progress_user_id", "progress", ["user_id"])

    # --- quiz_attempts ---
    op.create_table(
        "quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chapter_id", sa.String(50), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column(
            "attempted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_quiz_attempts_user_id", "quiz_attempts", ["user_id"])

    # --- search_index ---
    op.create_table(
        "search_index",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("chapter_id", sa.String(50), nullable=False),
        sa.Column("chapter_title", sa.String(255), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=False),
        sa.Column(
            "indexed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_search_index_chapter_id", "search_index", ["chapter_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_search_index_chapter_id", table_name="search_index")
    op.drop_table("search_index")

    op.drop_index("ix_quiz_attempts_user_id", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")

    op.drop_index("ix_progress_user_id", table_name="progress")
    op.drop_table("progress")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
