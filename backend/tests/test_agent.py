import pytest
from httpx import AsyncClient

async def test_create_conversation(auth_client: AsyncClient):
    response = await auth_client.post(
        "/agent/conversations",
        json={"title": "Test Chat"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Chat"
    assert "id" in data

async def test_list_conversations(auth_client: AsyncClient):
    await auth_client.post("/agent/conversations", json={"title": "Chat 1"})
    response = await auth_client.get("/agent/conversations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

async def test_get_conversation(auth_client: AsyncClient):
    create_res = await auth_client.post("/agent/conversations", json={"title": "Chat Get"})
    conv_id = create_res.json()["id"]

    response = await auth_client.get(f"/agent/conversations/{conv_id}")
    assert response.status_code == 200
    assert response.json()["id"] == conv_id

async def test_update_conversation_title(auth_client: AsyncClient):
    create_res = await auth_client.post("/agent/conversations", json={"title": "Old Title"})
    conv_id = create_res.json()["id"]

    response = await auth_client.patch(
        f"/agent/conversations/{conv_id}",
        json={"title": "New Title"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"

async def test_delete_conversation(auth_client: AsyncClient):
    create_res = await auth_client.post("/agent/conversations", json={"title": "To Delete"})
    conv_id = create_res.json()["id"]

    response = await auth_client.delete(f"/agent/conversations/{conv_id}")
    assert response.status_code == 204

    res = await auth_client.get(f"/agent/conversations/{conv_id}")
    assert res.status_code == 404

async def test_send_chat_message(auth_client: AsyncClient):
    response = await auth_client.post(
        "/agent/chat",
        json={"content": "Hello Schedly"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "conversation_id" in data

async def test_get_messages_paginated(auth_client: AsyncClient):
    chat_res = await auth_client.post(
        "/agent/chat",
        json={"content": "Hello message"}
    )
    conv_id = chat_res.json()["conversation_id"]

    response = await auth_client.get(f"/agent/conversations/{conv_id}/messages")
    assert response.status_code == 200
    data = response.json()
    assert "messages" in data
    assert len(data["messages"]) >= 1
