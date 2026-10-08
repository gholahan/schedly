"""encrypt existing Google Calendar tokens

Revision ID: c24e93d5c8a1
Revises: 8f4d283dcbf8
Create Date: 2026-10-08 14:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from cryptography.fernet import Fernet

from app.core.config import settings


revision: str = "c24e93d5c8a1"
down_revision: Union[str, None] = "8f4d283dcbf8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _fernet() -> Fernet:
    return Fernet(settings.google_token_encryption_key.encode("ascii"))


def upgrade() -> None:
    connection = op.get_bind()
    fernet = _fernet()
    rows = connection.execute(
        sa.text(
            "SELECT id, access_token, refresh_token "
            "FROM google_connections"
        )
    ).mappings().all()

    for row in rows:
        connection.execute(
            sa.text(
                "UPDATE google_connections "
                "SET access_token = :access_token, refresh_token = :refresh_token "
                "WHERE id = :id"
            ),
            {
                "id": row["id"],
                "access_token": fernet.encrypt(row["access_token"].encode("utf-8")).decode("ascii"),
                "refresh_token": (
                    fernet.encrypt(row["refresh_token"].encode("utf-8")).decode("ascii")
                    if row["refresh_token"] is not None
                    else None
                ),
            },
        )


def downgrade() -> None:
    raise RuntimeError(
        "Refusing to downgrade Google Calendar token encryption because doing so "
        "would restore plaintext tokens."
    )
