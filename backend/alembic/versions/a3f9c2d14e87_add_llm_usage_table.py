"""add_llm_usage_table

Revision ID: a3f9c2d14e87
Revises: bf15f8c77804
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a3f9c2d14e87"
down_revision: Union[str, None] = "bf15f8c77804"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "llm_usage",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("feature", sa.String(20), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=False),
        sa.Column("cost_usd", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "feature IN ('assessment', 'synthesis')",
            name="ck_llm_usage_feature",
        ),
    )
    op.create_index(
        "idx_llm_usage_user_date",
        "llm_usage",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_llm_usage_user_date", table_name="llm_usage")
    op.drop_table("llm_usage")
