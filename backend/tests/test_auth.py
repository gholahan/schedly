import pytest
from httpx import AsyncClient

async def test_signup_success(async_client: AsyncClient):
    response = await async_client.post(
        "/auth/signup",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert "access_token" in data
    assert "access_token" in async_client.cookies or response.cookies.get("access_token")

async def test_signup_duplicate_email(async_client: AsyncClient):
    payload = {
        "name": "User One",
        "email": "dup@example.com",
        "password": "password123"
    }
    res1 = await async_client.post("/auth/signup", json=payload)
    assert res1.status_code == 200

    res2 = await async_client.post("/auth/signup", json=payload)
    assert res2.status_code == 409

async def test_login_success(async_client: AsyncClient):
    await async_client.post(
        "/auth/signup",
        json={
            "name": "Login User",
            "email": "loginuser@example.com",
            "password": "password123"
        }
    )
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "loginuser@example.com"
    assert "access_token" in data

async def test_login_wrong_password(async_client: AsyncClient):
    await async_client.post(
        "/auth/signup",
        json={
            "name": "Login User 2",
            "email": "loginuser2@example.com",
            "password": "password123"
        }
    )
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "loginuser2@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

async def test_login_nonexistent_user(async_client: AsyncClient):
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "ghost@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 401

async def test_me_authenticated(auth_client: AsyncClient):
    response = await auth_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

async def test_me_unauthenticated(async_client: AsyncClient):
    response = await async_client.get("/auth/me")
    assert response.status_code == 401

async def test_refresh_success(auth_client: AsyncClient):
    response = await auth_client.post("/auth/refresh")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

async def test_logout_clears_cookies(auth_client: AsyncClient):
    response = await auth_client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out"
