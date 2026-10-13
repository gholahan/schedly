from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.agent.models import AIMessage


class AIConversationCreateRequest(BaseModel):
    """Request to create a new chat window / conversation."""

    title: str | None = Field(
        default=None,
        max_length=255,
        description="Optional title for the chat window.",
    )


class AIConversationUpdateRequest(BaseModel):
    """Request to rename an existing chat window."""

    title: str = Field(
        min_length=1,
        max_length=255,
        description="New title for the chat window.",
    )


class AIConversationResponse(BaseModel):
    """Conversation metadata returned for chat windows."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class AIMessageRequest(BaseModel):
    """Request sent by the frontend to Schedly's AI chat endpoint."""

    conversation_id: UUID | None = Field(
        default=None,
        description="Existing conversation ID. Omit to start a new chat window.",
    )
    content: str = Field(
        min_length=1,
        max_length=10000,
        description="The user's message to Schedly.",
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class AIMessageResponse(BaseModel):
    """Assistant message returned to the frontend."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: Literal["assistant"] = "assistant"
    content: str
    created_at: datetime


class PaginatedAIMessages(BaseModel):
    messages: list[AIMessage]
    next_cursor: UUID | None