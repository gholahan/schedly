
"""add avatar_url to users table

Revision ID: 2b2e4bc7de58
Revises: ad7cfb62fb38
Create Date: 2026-10-14 22:03:21.857550
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2b2e4bc7de58"
down_revision: Union[str, None] = "ad7cfb62fb38"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
