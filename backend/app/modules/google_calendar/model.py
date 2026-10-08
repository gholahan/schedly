from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlmodel import SQLModel, Field

from app.modules.google_calendar.token_encryption import EncryptedToken


class GoogleConnection(SQLModel, table=True):
    __tablename__ = "google_connections"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(
        foreign_key="users.id",
        unique=True,
        index=True,
        ondelete="CASCADE",
    )

    access_token: str = Field(
        sa_column=Column(EncryptedToken(), nullable=False),
        exclude=True,
        repr=False,
    )
    refresh_token: str | None = Field(
        default=None,
        sa_column=Column(EncryptedToken(), nullable=True),
        exclude=True,
        repr=False,
    )
    token_expires_at: datetime | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )
