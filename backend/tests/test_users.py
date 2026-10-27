import pytest
from httpx import AsyncClient

async def test_get_me(auth_client: AsyncClient):
    response = await auth_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"

async def test_patch_me_name(auth_client: AsyncClient):
    response = await auth_client.patch(
        "/users/me",
        json={"name": "Updated Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"

async def test_change_password_success(auth_client: AsyncClient):
    response = await auth_client.post(
        "/users/me/change-password",
        json={
            "current_password": "password123",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 204

async def test_change_password_wrong_current(auth_client: AsyncClient):
    response = await auth_client.post(
        "/users/me/change-password",
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 400

async def test_delete_me(auth_client: AsyncClient):
    response = await auth_client.request(
        "DELETE",
        "/users/me",
        json={"password": "password123"}
    )
    assert response.status_code == 204

    # Verify user is gone
    res = await auth_client.get("/users/me")
    assert res.status_code == 401
