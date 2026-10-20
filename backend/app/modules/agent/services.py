"""Agent service layer for Schedly.

Responsibilities
----------------
* ``get_tool_deps``: Injects ``user_id`` and a live DB session into LangGraph
  tools via ``RunnableConfig["configurable"]``.
* ``get_google_client_from_config``: Authenticates and returns the Google
  Calendar API client for the active user.
* Conversation and message persistence.
* ``process_chat_message``: Orchestrates full graph execution from FastAPI.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from langchain_core.messages import HumanMessage as LangHumanMessage
from langchain_core.runnables import RunnableConfig
from sqlalchemy import delete as sa_delete, func as sa_func, select as sa_select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.modules.agent.models import AIConversation, AIMessage
from app.modules.agent.schema import AIMessageResponse, PaginatedAIMessages
from app.modules.google_calendar.client import get_google_calendar_client
from app.modules.preferences.models import UserPreferences

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool dependency injection
# ---------------------------------------------------------------------------

async def get_tool_deps(config: RunnableConfig) -> tuple[UUID, AsyncSession]:
    """Extract ``user_id`` and ``session`` from LangGraph's configurable dict."""
    configurable: dict[str, Any] = config.get("configurable", {})

    raw_user_id = configurable.get("user_id")
    if raw_user_id is None:
        raise RuntimeError(
            "user_id is missing from LangGraph config. "
            "Ensure the route passes config={'configurable': {'user_id': ...}}"
        )
    user_id = UUID(str(raw_user_id))

    session: AsyncSession | None = configurable.get("session")
    if session is None:
        raise RuntimeError(
            "session is missing from LangGraph config. "
            "Ensure the route passes a live AsyncSession in configurable."
        )

    return user_id, session


async def get_google_client_from_config(config: RunnableConfig):
    """Return an authenticated Google Calendar client for the active user."""
    user_id, session = await get_tool_deps(config)
    client = await get_google_calendar_client(user_id, session)
    return client, user_id, session


async def get_user_preferences(
    user_id: UUID,
    session: AsyncSession,
) -> UserPreferences | None:
    """Return the user stored scheduling preferences, or None."""
    result = await session.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Conversation management
# ---------------------------------------------------------------------------

async def create_conversation(
    user_id: UUID,
    session: AsyncSession,
    title: str | None = None,
) -> AIConversation:
    """Create a new chat window / conversation."""
    conv_title = title.strip() if title and title.strip() else "New Chat"
    conversation = AIConversation(
        user_id=user_id,
        title=conv_title,
    )
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def get_conversation(
    conversation_id: UUID,
    user_id: UUID,
    session: AsyncSession,
) -> AIConversation:
    """Retrieve a specific conversation for the user."""
    result = await session.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


async def list_user_conversations(
    user_id: UUID,
    session: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> list[AIConversation]:
    """List all chat windows / conversations for the user, newest first."""
    result = await session.execute(
        select(AIConversation)
        .where(AIConversation.user_id == user_id)
        .order_by(AIConversation.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def update_conversation_title(
    conversation_id: UUID,
    user_id: UUID,
    title: str,
    session: AsyncSession,
) -> AIConversation:
    """Rename an existing conversation."""
    conversation = await get_conversation(conversation_id, user_id, session)
    conversation.title = title.strip()
    conversation.updated_at = datetime.now(timezone.utc)
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def delete_conversation(
    conversation_id: UUID,
    user_id: UUID,
    session: AsyncSession,
) -> None:
    """Delete a conversation and all its messages."""
    conversation = await get_conversation(conversation_id, user_id, session)
    await session.execute(
        sa_delete(AIMessage).where(AIMessage.conversation_id == conversation.id)
    )
    await session.delete(conversation)
    await session.commit()


async def get_or_create_conversation(
    user_id: UUID,
    session: AsyncSession,
    conversation_id: UUID | None = None,
) -> AIConversation:
    """Return an existing conversation or create a new one."""
    if conversation_id is not None:
        return await get_conversation(conversation_id, user_id, session)

    conversation = AIConversation(user_id=user_id)
    session.add(conversation)
    await session.flush()
    return conversation


# ---------------------------------------------------------------------------
# Message persistence
# ---------------------------------------------------------------------------

async def get_next_sequence_number(
    conversation_id: UUID,
    session: AsyncSession,
) -> int:
    """Return the next available sequence number for a conversation."""
    result = await session.execute(
        sa_select(sa_func.max(AIMessage.sequence_number)).where(
            AIMessage.conversation_id == conversation_id
        )
    )
    current_max: int | None = result.scalar_one_or_none()
    return (current_max or 0) + 1


async def persist_user_message(
    conversation_id: UUID,
    content: str,
    session: AsyncSession,
) -> AIMessage:
    """Save the user incoming message."""
    seq = await get_next_sequence_number(conversation_id, session)
    msg = AIMessage(
        conversation_id=conversation_id,
        sequence_number=seq,
        role="user",
        content=content,
    )
    session.add(msg)
    await session.flush()
    return msg


async def get_conversation_messages(
    conversation_id: UUID,
    session: AsyncSession,
    user_id: UUID,
    limit: int,
    cursor: UUID | None = None,
) -> PaginatedAIMessages:
    """Retrieve one chronological page of messages from a conversation."""
    conversation_result = await session.execute(
        select(AIConversation.id).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id,
        )
    )
    if conversation_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    query = select(AIMessage).where(AIMessage.conversation_id == conversation_id)
    if cursor is not None:
        cursor_result = await session.execute(
            select(AIMessage.sequence_number).where(
                AIMessage.id == cursor,
                AIMessage.conversation_id == conversation_id,
            )
        )
        cursor_sequence = cursor_result.scalar_one_or_none()
        if cursor_sequence is None:
            raise HTTPException(
                status_code=400,
                detail="Cursor does not belong to this conversation",
            )
        query = query.where(AIMessage.sequence_number > cursor_sequence)

    result = await session.execute(
        query
        .order_by(AIMessage.sequence_number.asc())
        .limit(limit + 1)
    )
    page = list(result.scalars().all())
    has_more = len(page) > limit
    messages = page[:limit]
    return PaginatedAIMessages(
        messages=messages,
        next_cursor=messages[-1].id if has_more else None,
    )


async def persist_assistant_message(
    conversation_id: UUID,
    content: str,
    session: AsyncSession,
    tool_calls: list[dict] | None = None,
    additional_kwargs: dict | None = None,
    response_metadata: dict | None = None,
) -> AIMessage:
    """Save the assistant response to the database."""
    seq = await get_next_sequence_number(conversation_id, session)
    msg = AIMessage(
        conversation_id=conversation_id,
        sequence_number=seq,
        role="assistant",
        content=content,
        tool_calls=tool_calls,
        additional_kwargs=additional_kwargs,
        response_metadata=response_metadata,
    )
    session.add(msg)
    await session.flush()
    return msg


# ---------------------------------------------------------------------------
# High-level chat invocation
# ---------------------------------------------------------------------------

async def process_chat_message(
    user_id: UUID,
    content: str,
    session: AsyncSession,
    conversation_id: UUID | None = None,
) -> AIMessageResponse:
    """Coordinate the full chat flow."""
    from app.modules.agent.gragh import graph as ai_graph, model
    from app.modules.agent.title_generator import generate_conversation_title, _fallback_title

    if ai_graph is None:
        raise RuntimeError(
            "LangGraph is not initialized. Ensure setup_graph() ran during startup."
        )

    conversation = await get_or_create_conversation(user_id, session, conversation_id)

    # Generate title for new conversations instantly using smart fallback, then refine in background via LLM
    is_new_conversation = conversation.title == "New Chat"
    if is_new_conversation:
        conversation.title = _fallback_title(content)
        logger.info(
            "Generated instant title for new conversation %s: %r",
            conversation.id,
            conversation.title,
        )

        async def background_generate_title(conv_id: UUID, user_msg: str, user_id_val: UUID):
            try:
                import asyncio
                from app.database.session import engine
                from app.modules.agent.title_generator import generate_conversation_title
                from app.modules.agent.gragh import model

                async with AsyncSession(engine, expire_on_commit=False) as bg_session:
                    new_title = await generate_conversation_title(user_msg, model)
                    if new_title and new_title != "New Chat":
                        res = await bg_session.execute(
                            select(AIConversation).where(
                                AIConversation.id == conv_id,
                                AIConversation.user_id == user_id_val,
                            )
                        )
                        conv_to_update = res.scalar_one_or_none()
                        if conv_to_update:
                            conv_to_update.title = new_title
                            bg_session.add(conv_to_update)
                            await bg_session.commit()
                            logger.info("Background LLM generated title updated for conversation %s: %r", conv_id, new_title)
            except Exception as bg_exc:
                logger.warning("Background title generation failed: %s", bg_exc)

        import asyncio
        asyncio.create_task(background_generate_title(conversation.id, content, user_id))

    conversation.updated_at = datetime.now(timezone.utc)
    session.add(conversation)

    await persist_user_message(conversation.id, content, session)

    prefs = await get_user_preferences(user_id, session)
    user_timezone = prefs.timezone if prefs else "UTC"

    config: dict[str, Any] = {
        "configurable": {
            "thread_id": str(conversation.id),
            "user_id": str(user_id),
            "session": session,
        }
    }

    try:
        result = await ai_graph.ainvoke(
            {
                "messages": [LangHumanMessage(content=content)],
                "user_timezone": user_timezone,
            },
            config=config,
        )
        last_message = result["messages"][-1]
        ai_content = str(last_message.content)

        # Extract tool calls from the assistant message
        tool_calls = None
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            tool_calls = [
                {
                    "name": tc.get("name"),
                    "args": tc.get("args"),
                    "id": tc.get("id"),
                }
                for tc in last_message.tool_calls
            ]
    except Exception as exc:
        logger.exception("LangGraph invocation failed for user %s: %s", user_id, exc)
        raise

    saved_msg = await persist_assistant_message(
        conversation_id=conversation.id,
        content=ai_content,
        session=session,
        tool_calls=tool_calls,
    )
    await session.commit()

    return AIMessageResponse(
        id=saved_msg.id,
        conversation_id=conversation.id,
        role="assistant",
        content=ai_content,
        created_at=saved_msg.created_at,
    )
