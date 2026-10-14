from datetime import datetime, time, timezone
from uuid import UUID, uuid4

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


class UserPreferences(SQLModel, table=True):
    __tablename__ = "user_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_preferences_user_id"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
    )

    # Locale and scheduling defaults
    timezone: str = Field(default="UTC", max_length=64)
    locale: str = Field(default="en", max_length=16)

    # Working schedule
    working_days: list[str] = Field(
        default_factory=lambda: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
        ],
        sa_column=Column(JSON, nullable=False),
    )
    working_hours_start: time = Field(default=time(9, 0))
    working_hours_end: time = Field(default=time(17, 0))

    # Meeting preferences
    default_meeting_duration_minutes: int = Field(
        default=30,
        ge=5,
        le=480,
    )
    buffer_minutes: int = Field(
        default=0,
        ge=0,
        le=240,
    )
    minimum_notice_minutes: int = Field(
        default=0,
        ge=0,
        le=43200,
    )
    scheduling_horizon_days: int = Field(
        default=30,
        ge=1,
        le=365,
    )
    selected_calendar_ids: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )


    # Metadata
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )