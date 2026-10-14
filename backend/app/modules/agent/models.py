from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    ForeignKey,
    func,
)
from sqlmodel import Field, SQLModel


class AIConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"  # type: ignore

    __table_args__ = (
        Index("idx_ai_conversations_user", "user_id"),
        Index("idx_ai_conversations_user_updated", "user_id", "updated_at"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    title: str = Field(
        default="New Chat",
        sa_column=Column(String(255), nullable=False, server_default="New Chat"),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )


class AIMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"

    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'tool', 'system')",
            name="ck_ai_messages_role",
        ),
        UniqueConstraint(
            "conversation_id",
            "sequence_number",
            name="uq_ai_messages_conversation_sequence",
        ),
        Index(
            "ix_ai_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )

    # Identity
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    conversation_id: UUID = Field(
        sa_column=Column(
            ForeignKey("ai_conversations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )

    # Ordering within a conversation
    sequence_number: int = Field(
        sa_column=Column(Integer, nullable=False),
    )

    # Message content
    role: str = Field(
        sa_column=Column(String(20), nullable=False),
    )

    content: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )

    tool_calls: list[dict] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            index=True,
        ),
    )