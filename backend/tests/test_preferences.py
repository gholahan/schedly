import pytest
from httpx import AsyncClient

async def test_get_preferences_creates_defaults(auth_client: AsyncClient):
    response = await auth_client.get("/preferences")
    assert response.status_code == 200
    data = response.json()
    assert data["timezone"] == "UTC"
    assert data["default_meeting_duration_minutes"] == 30

async def test_patch_preferences(auth_client: AsyncClient):
    response = await auth_client.patch(
        "/preferences",
        json={"timezone": "America/New_York", "default_meeting_duration_minutes": 45}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["timezone"] == "America/New_York"
    assert data["default_meeting_duration_minutes"] == 45

async def test_reset_preferences(auth_client: AsyncClient):
    # First update
    await auth_client.patch(
        "/preferences",
        json={"timezone": "Europe/London"}
    )
    # Then reset
    response = await auth_client.post("/preferences/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["timezone"] == "UTC"
