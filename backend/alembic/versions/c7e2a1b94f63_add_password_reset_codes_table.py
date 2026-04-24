"""add password_reset_codes table

Revision ID: c7e2a1b94f63
Revises: a3f9c2d14e87
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c7e2a1b94f63"
down_revision: Union[str, None] = "a3f9c2d14e87"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_codes_email", "password_reset_codes", ["email"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_codes_email", table_name="password_reset_codes")
    op.drop_table("password_reset_codes")
