"""Calendar business logic.

All functions accept a pre-authenticated Google Calendar API client
(``googleapiclient.discovery.Resource``) so they remain testable and
decoupled from credential-fetching.  Credential acquisition is handled
by ``google_calendar.client.get_google_calendar_client``.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Any
import zoneinfo

from googleapiclient.discovery import Resource

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Calendar list
# ---------------------------------------------------------------------------

async def list_user_calendars(client: Resource) -> list[dict[str, Any]]:
    """Return all calendars visible to the authenticated user.

    Filters out calendars for which the user has no usable access role
    (``none`` or unknown values).  Pagination is handled automatically.
    """
    logger.info("Listing Google calendars for user (minAccessRole=freeBusyReader)...")
    writable_roles = {"owner", "writer", "reader", "freeBusyReader"}
    calendars: list[dict[str, Any]] = []
    page_token: str | None = None

    while True:
        kwargs: dict[str, Any] = {"minAccessRole": "freeBusyReader"}
        if page_token:
            kwargs["pageToken"] = page_token

        response = client.calendarList().list(**kwargs).execute()

        for item in response.get("items", []):
            role = item.get("accessRole", "")
            if role not in writable_roles:
                continue
            calendars.append(
                {
                    "id": item["id"],
                    "name": item.get("summary", ""),
                    "description": item.get("description"),
                    "timezone": item.get("timeZone"),
                    "is_primary": item.get("primary", False),
                    "primary": item.get("primary", False),
                    "access_role": role,
                    "background_color": item.get("backgroundColor"),
                    "selected": item.get("selected", False),
                }
            )

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    logger.info("Found %d usable Google calendar(s)", len(calendars))
    return calendars


# ---------------------------------------------------------------------------
# Event retrieval
# ---------------------------------------------------------------------------

async def fetch_events(
    client: Resource,
    start_time: datetime,
    end_time: datetime,
    calendar_id: str = "primary",
    query: str | None = None,
    max_results: int = 20,
) -> list[dict[str, Any]]:
    """Return events in *calendar_id* that fall within [start_time, end_time).

    ``start_time`` and ``end_time`` must be timezone-aware datetimes.
    Recurring event instances are expanded individually.
    """
    logger.info(
        "Fetching Google events: calendar_id=%s, start=%s, end=%s, query=%r, max_results=%d",
        calendar_id,
        start_time,
        end_time,
        query,
        max_results,
    )
    response = (
        client.events()
        .list(
            calendarId=calendar_id,
            timeMin=_to_rfc3339(start_time),
            timeMax=_to_rfc3339(end_time),
            q=query,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )

    items = response.get("items", [])
    logger.info("Fetched %d Google event(s) from calendar '%s'", len(items), calendar_id)
    return [_normalise_event(e, calendar_id=calendar_id) for e in items]


async def fetch_events_all_calendars(
    client: Resource,
    start_time: datetime,
    end_time: datetime,
    query: str | None = None,
    max_results_per_calendar: int = 20,
    selected_calendar_ids: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Fetch events across all accessible calendars.

    Retrieves the calendar list once, then fetches events from each calendar
    sequentially to avoid SSL/thread-safety issues with the Google API client.
    Per-calendar failures are logged and skipped rather than crashing the call.

    Prioritizes user-owned calendars over holiday/shared calendars for better
    performance until user preferences provide explicit filtering.

    Args:
        selected_calendar_ids: Calendar IDs to query. Empty/None = all accessible calendars.
    """
    calendars = await list_user_calendars(client)

    # Apply calendar filter from preferences
    # Semantic: empty or None = "all accessible calendars"
    if selected_calendar_ids:
        # Non-empty: filter to selected calendars only
        filtered_calendars = [c for c in calendars if c["id"] in selected_calendar_ids]
    else:
        # Empty or None: use all accessible calendars
        filtered_calendars = calendars

    # Prioritize user calendars: primary and owned calendars first,
    # then classroom/group calendars, holiday calendars last
    primary_cals = [c for c in filtered_calendars if c.get("is_primary")]
    user_cals = [c for c in filtered_calendars if not c.get("is_primary") and not c["id"].endswith("#holiday@group.v.calendar.google.com")]
    holiday_cals = [c for c in filtered_calendars if c["id"].endswith("#holiday@group.v.calendar.google.com")]

    # Query in priority order
    ordered_calendars = primary_cals + user_cals + holiday_cals
    calendar_ids = [c["id"] for c in ordered_calendars] or ["primary"]

    logger.info(
        "Fetching events across %d calendar(s) (primary: %d, user: %d, holiday: %d)%s",
        len(calendar_ids),
        len(primary_cals),
        len(user_cals),
        len(holiday_cals),
        f" [filtered from {len(calendars)} total]" if selected_calendar_ids else "",
    )

    all_events: list[dict[str, Any]] = []
    calendars_checked = 0

    for cal_id in calendar_ids:
        calendars_checked += 1
        try:
            response = (
                client.events()
                .list(
                    calendarId=cal_id,
                    timeMin=_to_rfc3339(start_time),
                    timeMax=_to_rfc3339(end_time),
                    q=query,
                    maxResults=max_results_per_calendar,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
            events = [_normalise_event(e, calendar_id=cal_id) for e in response.get("items", [])]
            if events:
                logger.info("Found %d event(s) in calendar '%s'", len(events), cal_id)
            all_events.extend(events)
        except Exception as exc:
            logger.warning("Failed to fetch events from calendar '%s': %s", cal_id, exc)
            continue

    all_events.sort(key=lambda e: e["start_time"])
    logger.info(
        "Fetched %d total event(s) across %d calendar(s)",
        len(all_events),
        calendars_checked,
    )
    return all_events


async def fetch_event(
    client: Resource,
    event_id: str,
    calendar_id: str = "primary",
) -> dict[str, Any]:
    """Return a single event by ID."""
    logger.info("Fetching single Google event: event_id=%s, calendar_id=%s", event_id, calendar_id)
    raw = client.events().get(calendarId=calendar_id, eventId=event_id).execute()
    event = _normalise_event(raw, calendar_id=calendar_id)
    logger.info(
        "Fetched Google event '%s' successfully: title=%r",
        event_id,
        event.get("title"),
    )
    return event


# ---------------------------------------------------------------------------
# Free / busy
# ---------------------------------------------------------------------------

async def query_freebusy(
    client: Resource,
    start_time: datetime,
    end_time: datetime,
    calendar_ids: list[str],
) -> dict[str, Any]:
    """Check free/busy across *calendar_ids* in one freebusy.query call.

    Returns a dict with:
    - ``is_free``    – True when no busy interval covers [start, end)
    - ``busy``       – deduplicated list of busy intervals
    - ``conflicts``  – events overlapping [start, end) expressed as intervals
    """
    logger.info(
        "Querying Google freebusy: start=%s, end=%s, %d calendar(s)",
        start_time,
        end_time,
        len(calendar_ids),
    )
    body = {
        "timeMin": _to_rfc3339(start_time),
        "timeMax": _to_rfc3339(end_time),
        "items": [{"id": cal_id} for cal_id in calendar_ids],
    }
    response = client.freebusy().query(body=body).execute()

    # Collect and deduplicate busy intervals across all calendars.
    # Overlapping intervals from different calendars are merged so the same
    # blocked period is never counted twice.
    raw_intervals: list[tuple[datetime, datetime]] = []
    for cal_id in calendar_ids:
        cal_data = response.get("calendars", {}).get(cal_id, {})
        for interval in cal_data.get("busy", []):
            start = _parse_dt(interval["start"])
            end = _parse_dt(interval["end"])
            raw_intervals.append((start, end))

    merged = _merge_intervals(raw_intervals)
    is_free = not any(s < end_time and e > start_time for s, e in merged)

    logger.info(
        "Freebusy result: is_free=%s, %d merged busy interval(s)",
        is_free,
        len(merged),
    )
    return {
        "is_free": is_free,
        "busy": [
            {"start": s.isoformat(), "end": e.isoformat()} for s, e in merged
        ],
    }


# ---------------------------------------------------------------------------
# Slot finding
# ---------------------------------------------------------------------------

async def find_available_slots(
    client: Resource,
    date_from: date,
    date_to: date,
    duration_minutes: int,
    calendar_ids: list[str],
    working_hours_start: time = time(9, 0),
    working_hours_end: time = time(17, 0),
    working_days: list[str] | None = None,
    buffer_minutes: int = 0,
    minimum_notice_minutes: int = 0,
    preferred_start_time: time | None = None,
    preferred_end_time: time | None = None,
    max_results: int = 5,
    user_timezone: str = "UTC",
) -> list[dict[str, Any]]:
    """Find open meeting slots across the given date range.

    Queries freebusy for the entire range in one request, then walks
    each working day in ``working_hours_start``–``working_hours_end``
    (narrowed by ``preferred_*`` times when set) in ``duration_minutes``
    steps, skipping blocked intervals.

    ``working_days`` is a list of lowercase weekday names, e.g.
    ``["monday", "tuesday", …]``.  Defaults to Mon–Fri.
    """
    import zoneinfo

    logger.info(
        "Finding available slots: date_from=%s, date_to=%s, duration=%d min, %d calendar(s), tz=%s",
        date_from,
        date_to,
        duration_minutes,
        len(calendar_ids),
        user_timezone,
    )

    if working_days is None:
        working_days = ["monday", "tuesday", "wednesday", "thursday", "friday"]

    tz = _get_zoneinfo(user_timezone)
    now_utc = datetime.now(timezone.utc)
    earliest = now_utc + timedelta(minutes=minimum_notice_minutes)

    # Stretch the freebusy window to cover the full date range.
    window_start = datetime.combine(date_from, time.min, tzinfo=tz)
    window_end = datetime.combine(date_to, time(23, 59, 59), tzinfo=tz)

    body = {
        "timeMin": _to_rfc3339(window_start),
        "timeMax": _to_rfc3339(window_end),
        "items": [{"id": cal_id} for cal_id in calendar_ids],
    }
    response = client.freebusy().query(body=body).execute()

    raw_intervals: list[tuple[datetime, datetime]] = []
    for cal_id in calendar_ids:
        cal_data = response.get("calendars", {}).get(cal_id, {})
        for interval in cal_data.get("busy", []):
            raw_intervals.append((_parse_dt(interval["start"]), _parse_dt(interval["end"])))

    busy = _merge_intervals(raw_intervals)

    # Walk candidate slots day by day.
    slots: list[dict[str, Any]] = []
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    step = timedelta(minutes=duration_minutes)

    current_date = date_from
    while current_date <= date_to and len(slots) < max_results:
        if day_names[current_date.weekday()] not in working_days:
            current_date += timedelta(days=1)
            continue

        day_start = preferred_start_time or working_hours_start
        day_end = preferred_end_time or working_hours_end

        slot_start = datetime.combine(current_date, day_start, tzinfo=tz)
        slot_end_limit = datetime.combine(current_date, day_end, tzinfo=tz)

        while slot_start + step <= slot_end_limit and len(slots) < max_results:
            candidate_end = slot_start + step

            # Respect minimum notice.
            if slot_start < earliest:
                slot_start = slot_start + step
                continue

            # Check against merged busy intervals.
            blocked = any(
                b_start < candidate_end and b_end > slot_start
                for b_start, b_end in busy
            )

            if not blocked:
                slots.append(
                    {
                        "start": slot_start.isoformat(),
                        "end": candidate_end.isoformat(),
                        "duration_minutes": duration_minutes,
                    }
                )

            slot_start = candidate_end

        current_date += timedelta(days=1)

    logger.info("Found %d available slot(s)", len(slots))
    return slots


# ---------------------------------------------------------------------------
# Event write operations
# ---------------------------------------------------------------------------

async def create_calendar_event(
    client: Resource,
    title: str,
    start_time: datetime,
    end_time: datetime,
    timezone: str,
    calendar_id: str = "primary",
    description: str | None = None,
    location: str | None = None,
    attendees: list[str] | None = None,
) -> dict[str, Any]:
    """Insert a new event and return the created event."""
    logger.info(
        "Creating Google Calendar event: title=%r, start=%s, end=%s, tz=%s, calendar_id=%s, location=%r, attendees=%s",
        title,
        start_time,
        end_time,
        timezone,
        calendar_id,
        location,
        attendees,
    )
    start_dt = _localize_dt(start_time, timezone)
    end_dt = _localize_dt(end_time, timezone)
    body: dict[str, Any] = {
        "summary": title,
        "start": {"dateTime": _to_rfc3339(start_dt), "timeZone": timezone},
        "end": {"dateTime": _to_rfc3339(end_dt), "timeZone": timezone},
    }
    if description:
        body["description"] = description
    if location:
        body["location"] = location
    if attendees:
        body["attendees"] = [{"email": addr} for addr in attendees]

    raw = client.events().insert(calendarId=calendar_id, body=body).execute()
    event = _normalise_event(raw, calendar_id=calendar_id)
    logger.info(
        "Created Google Calendar event successfully: id=%s, title=%r, html_link=%s",
        event.get("id"),
        event.get("title"),
        event.get("html_link"),
    )
    return event


async def update_calendar_event(
    client: Resource,
    event_id: str,
    calendar_id: str = "primary",
    title: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    timezone: str | None = None,
    description: str | None = None,
    location: str | None = None,
    attendees: list[str] | None = None,
) -> dict[str, Any]:
    """Patch only the supplied fields; all others remain unchanged."""
    logger.info(
        "Updating Google Calendar event: event_id=%s, calendar_id=%s, title=%r, start=%s, end=%s, tz=%s, location=%r, attendees=%s",
        event_id,
        calendar_id,
        title,
        start_time,
        end_time,
        timezone,
        location,
        attendees,
    )
    patch: dict[str, Any] = {}
    if title is not None:
        patch["summary"] = title
    if description is not None:
        patch["description"] = description
    if location is not None:
        patch["location"] = location
    if attendees is not None:
        patch["attendees"] = [{"email": addr} for addr in attendees]

    if start_time is not None or end_time is not None or timezone is not None:
        # Fetch the current event to fill in any missing time component.
        current = client.events().get(calendarId=calendar_id, eventId=event_id).execute()

        def _extract_dt(field: str) -> datetime:
            raw = current.get(field, {})
            return _parse_dt(raw.get("dateTime") or raw.get("date", ""))

        resolved_tz = timezone or current.get("start", {}).get("timeZone", "UTC")
        resolved_start = _localize_dt(start_time or _extract_dt("start"), resolved_tz)
        resolved_end = _localize_dt(end_time or _extract_dt("end"), resolved_tz)

        patch["start"] = {"dateTime": _to_rfc3339(resolved_start), "timeZone": resolved_tz}
        patch["end"] = {"dateTime": _to_rfc3339(resolved_end), "timeZone": resolved_tz}

    raw = (
        client.events()
        .patch(calendarId=calendar_id, eventId=event_id, body=patch)
        .execute()
    )
    event = _normalise_event(raw, calendar_id=calendar_id)
    logger.info(
        "Updated Google Calendar event successfully: id=%s, title=%r",
        event.get("id"),
        event.get("title"),
    )
    return event


async def delete_calendar_event(
    client: Resource,
    event_id: str,
    calendar_id: str = "primary",
) -> dict[str, Any]:
    """Delete an event. Returns a confirmation dict."""
    logger.info(
        "Deleting Google Calendar event: event_id=%s, calendar_id=%s",
        event_id,
        calendar_id,
    )
    client.events().delete(calendarId=calendar_id, eventId=event_id).execute()
    logger.info(
        "Deleted Google Calendar event successfully: event_id=%s",
        event_id,
    )
    return {"deleted": True, "event_id": event_id, "calendar_id": calendar_id}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_zoneinfo(tz_name: str) -> timezone | zoneinfo.ZoneInfo:
    """Safely obtain a tzinfo object for a given timezone string."""
    import zoneinfo

    if not tz_name or tz_name.upper() in ("UTC", "GMT"):
        return timezone.utc
    try:
        return zoneinfo.ZoneInfo(tz_name)
    except Exception:
        return timezone.utc


def _localize_dt(dt: datetime, tz_name: str) -> datetime:
    """Ensure datetime has timezone awareness, attaching or converting to tz_name."""
    tz = _get_zoneinfo(tz_name)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt.astimezone(tz)


def _to_rfc3339(dt: datetime) -> str:
    """Return an RFC 3339 string. Naive datetimes are treated as UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _parse_dt(value: str) -> datetime:
    """Parse an RFC 3339 / ISO 8601 string into a timezone-aware datetime."""
    if not value:
        raise ValueError("Cannot parse empty datetime string")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _merge_intervals(
    intervals: list[tuple[datetime, datetime]],
) -> list[tuple[datetime, datetime]]:
    """Sort and merge overlapping datetime intervals."""
    if not intervals:
        return []
    sorted_ivs = sorted(intervals, key=lambda x: x[0])
    merged = [sorted_ivs[0]]
    for start, end in sorted_ivs[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def _normalise_event(raw: dict[str, Any], calendar_id: str = "primary") -> dict[str, Any]:
    """Map a Google Calendar API event dict to Schedly's common shape."""
    start = raw.get("start", {})
    end = raw.get("end", {})
    return {
        "id": raw.get("id", ""),
        "calendar_id": calendar_id or raw.get("organizer", {}).get("email", "primary"),
        "title": raw.get("summary", "(No title)"),
        "start_time": start.get("dateTime") or start.get("date", ""),
        "end_time": end.get("dateTime") or end.get("date", ""),
        "timezone": start.get("timeZone"),
        "description": raw.get("description"),
        "location": raw.get("location"),
        "attendees": [
            a["email"] for a in raw.get("attendees", []) if "email" in a
        ],
        "status": raw.get("status", "confirmed"),
        "html_link": raw.get("htmlLink"),
    }
