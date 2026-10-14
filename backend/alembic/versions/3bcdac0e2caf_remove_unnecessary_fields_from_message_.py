
"""remove unnecessary fields from message table

Revision ID: 3bcdac0e2caf
Revises: 680ed9f310c9
Create Date: 2026-10-14 13:10:55.989979
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "3bcdac0e2caf"
down_revision: Union[str, None] = "680ed9f310c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(
        op.f("ix_ai_messages_tool_call_id"),
        table_name="ai_messages",
    )
    op.drop_column("ai_messages", "response_metadata")
    op.drop_column("ai_messages", "tool_call_id")
    op.drop_column("ai_messages", "name")
    op.drop_column("ai_messages", "additional_kwargs")


def downgrade() -> None:
    op.add_column(
        "ai_messages",
        sa.Column(
            "additional_kwargs",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "ai_messages",
        sa.Column("name", sa.VARCHAR(length=100), nullable=True),
    )
    op.add_column(
        "ai_messages",
        sa.Column("tool_call_id", sa.VARCHAR(length=255), nullable=True),
    )
    op.add_column(
        "ai_messages",
        sa.Column(
            "response_metadata",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_ai_messages_tool_call_id"),
        "ai_messages",
        ["tool_call_id"],
        unique=False,
    )
