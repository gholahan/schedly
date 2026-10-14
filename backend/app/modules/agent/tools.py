"""LangGraph tool definitions for Schedly.

All 8 tools:
1. list_calendars  — list accessible calendars
2. get_events      — events within a time range
3. get_event       — single event by ID
4. check_free      — availability across all user calendars
5. find_slots      — open meeting slots respecting preferences
6. create_event    — insert calendar event
7. update_event    — patch event fields
8. delete_event    — remove event

Each tool accepts LangGraph's ``RunnableConfig`` to extract the
authenticated user's Google Calendar client and database session.
Outputs are predictable JSON-compatible dictionaries.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time
from typing import Any

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from pydantic import BaseModel, Field, model_validator

from app.modules.agent.services import (
    get_google_client_from_config,
    get_user_preferences,
)
from app.modules.google_calendar import service as cal_service

logger = logging.getLogger(__name__)


# ============================================================
# Shared schemas
# ============================================================

class CalendarEvent(BaseModel):
    """Common event fields returned by calendar tools."""

    id: str
    calendar_id: str
    title: str
    start_time: datetime
    end_time: datetime
    timezone: str | None = None
    description: str | None = None
    location: str | None = None
    attendees: list[str] = Field(default_factory=list)
    status: str = "confirmed"
    html_link: str | None = None


class TimeRangeInput(BaseModel):
    """A validated time interval."""

    start_time: datetime = Field(
        description="Inclusive start of the requested time interval (ISO 8601 with timezone)."
    )
    end_time: datetime = Field(
        description="Exclusive end of the requested time interval (ISO 8601 with timezone)."
    )

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time")
        return self


# ============================================================
# 1. Calendar Read
# ============================================================

@tool
async def list_calendars(config: RunnableConfig) -> dict[str, Any]:
    """List the calendars available to the authenticated user.

    Returns calendar IDs, names, timezones, primary status,
    and the user's access role for each calendar. Excludes calendars
    the user cannot read.
    """
    logger.info(" [TOOL:list_calendars] Invoked by LLM")
    try:
        client, _, _ = await get_google_client_from_config(config)
        calendars = await cal_service.list_user_calendars(client)
        logger.info(" [TOOL:list_calendars] Found %d calendar(s)", len(calendars))
        return {
            "success": True,
            "calendars": calendars,
            "count": len(calendars),
        }
    except Exception as exc:
        logger.error(" [TOOL:list_calendars] Failed: %s", exc, exc_info=True)
        return {"success": False, "error": str(exc), "calendars": []}


class GetEventsInput(BaseModel):
    start_time: datetime = Field(
        description="Inclusive start of the interval (ISO 8601 with timezone)."
    )
    end_time: datetime = Field(
        description="Exclusive end of the interval (ISO 8601 with timezone)."
    )
    calendar_id: str | None = Field(
        default=None,
        description="Calendar ID to query. Omit to fetch events across all accessible calendars.",
    )
    query: str | None = Field(
        default=None,
        description="Optional text to search for in event titles/descriptions.",
    )
    max_results: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of events to return per calendar.",
    )

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time")
        return self


@tool(args_schema=GetEventsInput)
async def get_events(
    start_time: datetime,
    end_time: datetime,
    config: RunnableConfig,
    calendar_id: str | None = None,
    query: str | None = None,
    max_results: int = 20,
) -> dict[str, Any]:
    """Retrieve events within a time range.

    Omit calendar_id to fetch events across all accessible calendars in
    a single call. Provide a specific calendar_id to query only that calendar.
    """
    logger.info(
        " [TOOL:get_events] Invoked by LLM: calendar_id=%s, start_time=%s, end_time=%s, query=%r, max_results=%d",
        calendar_id or "ALL",
        start_time,
        end_time,
        query,
        max_results,
    )
    try:
        client, user_id, session = await get_google_client_from_config(config)

        # Get user preferences for calendar filtering
        prefs = await get_user_preferences(user_id, session)
        selected_calendar_ids = prefs.selected_calendar_ids if prefs else None

        if calendar_id:
            events = await cal_service.fetch_events(
                client=client,
                start_time=start_time,
                end_time=end_time,
                calendar_id=calendar_id,
                query=query,
                max_results=max_results,
            )
        else:
            events = await cal_service.fetch_events_all_calendars(
                client=client,
                start_time=start_time,
                end_time=end_time,
                query=query,
                max_results_per_calendar=max_results,
                selected_calendar_ids=selected_calendar_ids,
            )
        logger.info(
            " [TOOL:get_events] Retrieved %d event(s) from calendar '%s'",
            len(events),
            calendar_id or "ALL",
        )
        return {
            "success": True,
            "calendar_id": calendar_id or "all",
            "events": events,
            "count": len(events),
        }
    except Exception as exc:
        logger.error(" [TOOL:get_events] Failed: %s", exc, exc_info=True)
        return {"success": False, "error": str(exc), "events": []}


class GetEventInput(BaseModel):
    event_id: str = Field(description="ID of the event to retrieve.")
    calendar_id: str = Field(
        default="primary",
        description="Calendar containing the event.",
    )


@tool(args_schema=GetEventInput)
async def get_event(
    event_id: str,
    config: RunnableConfig,
    calendar_id: str = "primary",
) -> dict[str, Any]:
    """Retrieve the details of one calendar event by its ID."""
    logger.info(
        " [TOOL:get_event] Invoked by LLM: event_id=%s, calendar_id=%s",
        event_id,
        calendar_id,
    )
    try:
        client, _, _ = await get_google_client_from_config(config)
        event = await cal_service.fetch_event(
            client=client,
            event_id=event_id,
            calendar_id=calendar_id,
        )
        logger.info(
            " [TOOL:get_event] Successfully retrieved event '%s' (title=%r)",
            event_id,
            event.get("title") if event else None,
        )
        return {"success": True, "event": event}
    except Exception as exc:
        logger.error(
            " [TOOL:get_event] Failed for event_id=%s: %s",
            event_id,
            exc,
            exc_info=True,
        )
        return {"success": False, "error": str(exc), "event": None}


# ============================================================
# 2. Scheduling
# ============================================================

@tool(args_schema=TimeRangeInput)
async def check_free(
    start_time: datetime,
    end_time: datetime,
    config: RunnableConfig,
) -> dict[str, Any]:
    """Check whether the user is busy during a specific time interval.

    Queries all readable calendars the user has access to via
    Google Calendar's freebusy endpoint in a single batch request,
    excluding unreadable calendars and merging overlapping blocks.
    """
    logger.info(
        " [TOOL:check_free] Invoked by LLM: start_time=%s, end_time=%s",
        start_time,
        end_time,
    )
    try:
        client, user_id, session = await get_google_client_from_config(config)

        # Get user preferences for calendar filtering
        prefs = await get_user_preferences(user_id, session)

        cal_list = await cal_service.list_user_calendars(client)

        if prefs and prefs.selected_calendar_ids:
            calendar_ids = [c["id"] for c in cal_list if c["id"] in prefs.selected_calendar_ids]
        else:
            calendar_ids = [c["id"] for c in cal_list] or ["primary"]

        logger.info(
            "[TOOL:check_free] Checking availability across %d calendar(s)%s",
            len(calendar_ids),
            f" [filtered from {len(cal_list)} total]" if prefs and prefs.selected_calendar_ids else "",
        )

        result = await cal_service.query_freebusy(
            client=client,
            start_time=start_time,
            end_time=end_time,
            calendar_ids=calendar_ids,
        )
        logger.info(
            " [TOOL:check_free] Finished check: is_free=%s (%d busy block(s))",
            result["is_free"],
            len(result["busy"]),
        )
        return {
            "success": True,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "is_free": result["is_free"],
            "busy_intervals": result["busy"],
            "calendars_checked": calendar_ids,
        }
    except Exception as exc:
        logger.error(" [TOOL:check_free] Failed: %s", exc, exc_info=True)
        return {
            "success": False,
            "error": str(exc),
            "is_free": None,
            "busy_intervals": [],
        }


class FindSlotsInput(BaseModel):
    date_from: date = Field(description="First date to search (YYYY-MM-DD).")
    date_to: date = Field(description="Last date to search, inclusive (YYYY-MM-DD).")
    duration_minutes: int = Field(
        ge=5,
        le=480,
        description="Required duration of the meeting in minutes.",
    )
    preferred_start_time: time | None = Field(
        default=None,
        description="Preferred earliest time of day (HH:MM:SS).",
    )
    preferred_end_time: time | None = Field(
        default=None,
        description="Preferred latest time of day (HH:MM:SS).",
    )
    max_results: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of available slots to return.",
    )

    @model_validator(mode="after")
    def validate_dates_and_hours(self):
        if self.date_to < self.date_from:
            raise ValueError("date_to must be on or after date_from")
        if (
            self.preferred_start_time is not None
            and self.preferred_end_time is not None
            and self.preferred_end_time <= self.preferred_start_time
        ):
            raise ValueError("preferred_end_time must be later than preferred_start_time")
        return self


@tool(args_schema=FindSlotsInput)
async def find_slots(
    date_from: date,
    date_to: date,
    duration_minutes: int,
    config: RunnableConfig,
    preferred_start_time: time | None = None,
    preferred_end_time: time | None = None,
    max_results: int = 5,
) -> dict[str, Any]:
    """Find suitable available meeting slots across a date range.

    Considers existing events across all user calendars and incorporates
    the user's stored scheduling preferences (working hours, working days,
    buffer, minimum notice) when available.
    """
    logger.info(
        " [TOOL:find_slots] Invoked by LLM: date_range=%s to %s, duration=%d min, preferred_start=%s, preferred_end=%s, max_results=%d",
        date_from,
        date_to,
        duration_minutes,
        preferred_start_time,
        preferred_end_time,
        max_results,
    )
    try:
        client, user_id, session = await get_google_client_from_config(config)

        # Get user preferences
        prefs = await get_user_preferences(user_id, session)

        # Get all calendars
        cal_list = await cal_service.list_user_calendars(client)

        # Apply calendar filter from preferences
        # Semantic: empty or None = "all accessible calendars"
        if prefs and prefs.selected_calendar_ids:
            calendar_ids = [c["id"] for c in cal_list if c["id"] in prefs.selected_calendar_ids]
        else:
            calendar_ids = [c["id"] for c in cal_list] or ["primary"]

        working_hours_start = prefs.working_hours_start if prefs else time(9, 0)
        working_hours_end = prefs.working_hours_end if prefs else time(17, 0)
        working_days = prefs.working_days if prefs else None
        buffer_minutes = prefs.buffer_minutes if prefs else 0
        minimum_notice_minutes = prefs.minimum_notice_minutes if prefs else 0
        user_timezone = prefs.timezone if prefs else "UTC"

        logger.info(
            "[TOOL:find_slots] User preferences applied: tz=%s, working_hours=%s-%s, working_days=%s, buffer=%dm, notice=%dm, %d calendar(s)%s",
            user_timezone,
            working_hours_start,
            working_hours_end,
            working_days,
            buffer_minutes,
            minimum_notice_minutes,
            len(calendar_ids),
            f" [filtered from {len(cal_list)} total]" if prefs and prefs.selected_calendar_ids else "",
        )

        slots = await cal_service.find_available_slots(
            client=client,
            date_from=date_from,
            date_to=date_to,
            duration_minutes=duration_minutes,
            calendar_ids=calendar_ids,
            working_hours_start=working_hours_start,
            working_hours_end=working_hours_end,
            working_days=working_days,
            buffer_minutes=buffer_minutes,
            minimum_notice_minutes=minimum_notice_minutes,
            preferred_start_time=preferred_start_time,
            preferred_end_time=preferred_end_time,
            max_results=max_results,
            user_timezone=user_timezone,
        )

        logger.info(" [TOOL:find_slots] Found %d available slot(s)", len(slots))

        return {
            "success": True,
            "slots": slots,
            "count": len(slots),
            "timezone": user_timezone,
        }
    except Exception as exc:
        logger.error(" [TOOL:find_slots] Failed: %s", exc, exc_info=True)
        return {"success": False, "error": str(exc), "slots": []}


# ============================================================
# 3. Calendar Write
# ============================================================

class CreateEventInput(BaseModel):
    title: str = Field(description="Title of the event.")
    start_time: datetime = Field(
        description="Event start datetime (ISO 8601 with timezone)."
    )
    end_time: datetime = Field(
        description="Event end datetime (ISO 8601 with timezone)."
    )
    timezone: str = Field(
        description="IANA timezone string (e.g., 'UTC', 'Africa/Lagos', 'America/New_York')."
    )
    calendar_id: str = Field(
        default="primary",
        description="Calendar where the event will be created.",
    )
    description: str | None = Field(
        default=None,
        description="Optional event description or notes.",
    )
    location: str | None = Field(
        default=None,
        description="Optional location of the event (physical address or meeting link).",
    )
    attendees: list[str] = Field(
        default_factory=list,
        description="Optional list of attendee email addresses.",
    )

    @model_validator(mode="after")
    def validate_event_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time")
        return self


@tool(args_schema=CreateEventInput)
async def create_event(
    title: str,
    start_time: datetime,
    end_time: datetime,
    timezone: str,
    config: RunnableConfig,
    calendar_id: str = "primary",
    description: str | None = None,
    location: str | None = None,
    attendees: list[str] | None = None,
) -> dict[str, Any]:
    """Creates a calendar event with start and end times, handling timezones correctly, and optionally including attendees and location."""
    logger.info(
        " [TOOL:create_event] Invoked by LLM: title=%r, start=%s, end=%s, tz=%s, calendar_id=%s, location=%r, attendees=%s",
        title,
        start_time,
        end_time,
        timezone,
        calendar_id,
        location,
        attendees,
    )
    try:
        client, _, _ = await get_google_client_from_config(config)
        event = await cal_service.create_calendar_event(
            client=client,
            title=title,
            start_time=start_time,
            end_time=end_time,
            timezone=timezone,
            calendar_id=calendar_id,
            description=description,
            location=location,
            attendees=attendees,
        )
        logger.info(
            " [TOOL:create_event] Created event successfully: id=%s, title=%r, html_link=%s",
            event.get("id"),
            event.get("title"),
            event.get("html_link"),
        )
        return {"success": True, "event": event}
    except Exception as exc:
        logger.error(
            " [TOOL:create_event] Failed to create event %r: %s",
            title,
            exc,
            exc_info=True,
        )
        return {"success": False, "error": str(exc), "event": None}


class UpdateEventInput(BaseModel):
    event_id: str = Field(description="ID of the event to update.")
    calendar_id: str = Field(
        default="primary",
        description="Calendar containing the event.",
    )
    title: str | None = Field(default=None, description="New title.")
    start_time: datetime | None = Field(
        default=None,
        description="New start datetime (ISO 8601 with timezone).",
    )
    end_time: datetime | None = Field(
        default=None,
        description="New end datetime (ISO 8601 with timezone).",
    )
    timezone: str | None = Field(default=None, description="New IANA timezone.")
    description: str | None = Field(default=None, description="New description.")
    location: str | None = Field(default=None, description="New location.")
    attendees: list[str] | None = Field(
        default=None,
        description="Complete replacement list of attendee emails.",
    )

    @model_validator(mode="after")
    def validate_updated_times(self):
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError("end_time must be later than start_time")
        return self


@tool(args_schema=UpdateEventInput)
async def update_event(
    event_id: str,
    config: RunnableConfig,
    calendar_id: str = "primary",
    title: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    timezone: str | None = None,
    description: str | None = None,
    location: str | None = None,
    attendees: list[str] | None = None,
) -> dict[str, Any]:
    """Update selected fields of an existing calendar event.

    Fields not supplied remain unchanged.
    """
    logger.info(
        " [TOOL:update_event] Invoked by LLM: event_id=%s, calendar_id=%s, title=%r, start=%s, end=%s, tz=%s, location=%r, attendees=%s",
        event_id,
        calendar_id,
        title,
        start_time,
        end_time,
        timezone,
        location,
        attendees,
    )
    try:
        client, _, _ = await get_google_client_from_config(config)
        event = await cal_service.update_calendar_event(
            client=client,
            event_id=event_id,
            calendar_id=calendar_id,
            title=title,
            start_time=start_time,
            end_time=end_time,
            timezone=timezone,
            description=description,
            location=location,
            attendees=attendees,
        )
        logger.info(
            " [TOOL:update_event] Updated event successfully: id=%s, title=%r",
            event_id,
            event.get("title"),
        )
        return {"success": True, "event": event}
    except Exception as exc:
        logger.error(
            " [TOOL:update_event] Failed to update event %s: %s",
            event_id,
            exc,
            exc_info=True,
        )
        return {"success": False, "error": str(exc), "event": None}


class DeleteEventInput(BaseModel):
    event_id: str = Field(description="ID of the event to delete.")
    calendar_id: str = Field(
        default="primary",
        description="Calendar containing the event.",
    )


@tool(args_schema=DeleteEventInput)
async def delete_event(
    event_id: str,
    config: RunnableConfig,
    calendar_id: str = "primary",
) -> dict[str, Any]:
    """Delete a calendar event after the required confirmation."""
    logger.info(
        " [TOOL:delete_event] Invoked by LLM: event_id=%s, calendar_id=%s",
        event_id,
        calendar_id,
    )
    try:
        client, _, _ = await get_google_client_from_config(config)
        result = await cal_service.delete_calendar_event(
            client=client,
            event_id=event_id,
            calendar_id=calendar_id,
        )
        logger.info(
            " [TOOL:delete_event] Deleted event %s from calendar '%s'",
            event_id,
            calendar_id,
        )
        return {"success": True, **result}
    except Exception as exc:
        logger.error(
            " [TOOL:delete_event] Failed to delete event %s: %s",
            event_id,
            exc,
            exc_info=True,
        )
        return {"success": False, "error": str(exc)}


# ============================================================
# Tool registry
# ============================================================

calendar_tools = [
    list_calendars,
    get_events,
    get_event,
    check_free,
    find_slots,
    create_event,
    update_event,
    delete_event,
]
 
tools = calendar_tools
