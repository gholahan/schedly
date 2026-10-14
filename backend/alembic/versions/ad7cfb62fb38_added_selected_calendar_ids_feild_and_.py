
"""add selected_calendar_ids field and remove four optional preferences

Revision ID: ad7cfb62fb38
Revises: 3bcdac0e2caf
Create Date: 2026-10-14 14:16:50.898785
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "ad7cfb62fb38"
down_revision: Union[str, None] = "3bcdac0e2caf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_preferences",
        sa.Column("selected_calendar_ids", sa.JSON(), nullable=False),
    )
    op.drop_column("user_preferences", "auto_decline_conflicts")
    op.drop_column("user_preferences", "preferred_meeting_end")
    op.drop_column("user_preferences", "allow_weekend_scheduling")
    op.drop_column("user_preferences", "preferred_meeting_start")


def downgrade() -> None:
    op.add_column(
        "user_preferences",
        sa.Column(
            "preferred_meeting_start",
            postgresql.TIME(),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "user_preferences",
        sa.Column(
            "allow_weekend_scheduling",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.add_column(
        "user_preferences",
        sa.Column(
            "preferred_meeting_end",
            postgresql.TIME(),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "user_preferences",
        sa.Column(
            "auto_decline_conflicts",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.drop_column("user_preferences", "selected_calendar_ids")
