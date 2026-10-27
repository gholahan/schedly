from datetime import datetime, timezone
from unittest.mock import AsyncMock
from langchain_core.runnables import RunnableConfig

from app.modules.agent.tools import (
    list_calendars,
    get_events,
    check_free,
    find_slots,
    create_event,
    delete_event,
)

async def test_list_calendars(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.list_user_calendars",
        AsyncMock(return_value=[{"id": "primary", "name": "Primary Calendar"}])
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    res = await list_calendars.ainvoke(config)
    assert res["success"] is True
    assert len(res["calendars"]) == 1
    assert res["calendars"][0]["id"] == "primary"

async def test_get_events(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.fetch_events",
        AsyncMock(return_value=[{"id": "evt1", "title": "Meeting"}])
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    start = datetime.now(timezone.utc)
    end = datetime.now(timezone.utc)
    res = await get_events.ainvoke({
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "calendar_id": "primary",
    }, config=config)
    assert res["success"] is True
    assert len(res["events"]) == 1

async def test_check_free(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.list_user_calendars",
        AsyncMock(return_value=[{"id": "primary"}])
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.query_freebusy",
        AsyncMock(return_value={"is_free": True, "busy": []})
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    start = datetime.now(timezone.utc)
    end = datetime.now(timezone.utc)
    res = await check_free.ainvoke({
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }, config=config)
    assert res["success"] is True
    assert res["is_free"] is True

async def test_find_slots(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.list_user_calendars",
        AsyncMock(return_value=[{"id": "primary"}])
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.find_available_slots",
        AsyncMock(return_value=[{"start": "2026-10-27T10:00:00Z", "end": "2026-10-27T10:30:00Z"}])
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    res = await find_slots.ainvoke({
        "date_from": "2026-10-27",
        "date_to": "2026-10-27",
        "duration_minutes": 30,
    }, config=config)
    assert res["success"] is True
    assert len(res["slots"]) == 1

async def test_create_event(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.create_calendar_event",
        AsyncMock(return_value={"id": "new_evt", "title": "New Event"})
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    start = datetime.now(timezone.utc)
    end = datetime.now(timezone.utc)
    res = await create_event.ainvoke({
        "title": "New Event",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "timezone": "UTC",
    }, config=config)
    assert res["success"] is True
    assert res["event"]["id"] == "new_evt"

async def test_delete_event(monkeypatch, test_user):
    mock_client = AsyncMock()
    monkeypatch.setattr(
        "app.modules.agent.tools.get_google_client_from_config",
        AsyncMock(return_value=(mock_client, test_user.id, AsyncMock()))
    )
    monkeypatch.setattr(
        "app.modules.agent.tools.get_user_preferences",
        AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.modules.google_calendar.service.delete_calendar_event",
        AsyncMock(return_value={"deleted": True, "event_id": "evt1"})
    )

    config: RunnableConfig = {"configurable": {"user_id": str(test_user.id), "session": AsyncMock()}}
    res = await delete_event.ainvoke({
        "event_id": "evt1",
    }, config=config)
    assert res["success"] is True
    assert res["deleted"] is True
