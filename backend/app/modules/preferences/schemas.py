from datetime import time

from pydantic import BaseModel, ConfigDict, Field


class PreferencesResponse(BaseModel):
    """User preferences response."""

    model_config = ConfigDict(from_attributes=True)

    # Locale and scheduling defaults
    timezone: str
    locale: str

    # Working schedule
    working_days: list[str]
    working_hours_start: time
    working_hours_end: time

    # Meeting preferences
    default_meeting_duration_minutes: int
    buffer_minutes: int
    minimum_notice_minutes: int
    scheduling_horizon_days: int
    selected_calendar_ids: list[str]


class PreferencesUpdateRequest(BaseModel):
    """Update user preferences (all fields optional)."""

    timezone: str | None = Field(default=None, max_length=64)
    locale: str | None = Field(default=None, max_length=16)
    working_days: list[str] | None = None
    working_hours_start: time | None = None
    working_hours_end: time | None = None
    default_meeting_duration_minutes: int | None = Field(default=None, ge=5, le=480)
    buffer_minutes: int | None = Field(default=None, ge=0, le=240)
    minimum_notice_minutes: int | None = Field(default=None, ge=0, le=43200)
    scheduling_horizon_days: int | None = Field(default=None, ge=1, le=365)
    selected_calendar_ids: list[str] | None = None
