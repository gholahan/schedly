from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.database.session import SessionDep
from app.modules.agent.schema import (
    AIConversationCreateRequest,
    AIConversationResponse,
    AIConversationUpdateRequest,
    AIMessageRequest,
    AIMessageResponse,
    PaginatedAIMessages,
)
from app.modules.agent.services import (
    create_conversation,
    delete_conversation,
    get_conversation,
    get_conversation_messages,
    list_user_conversations,
    process_chat_message,
    update_conversation_title,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.model import User

router = APIRouter(prefix="/agent", tags=["Agent"])


# ---------------------------------------------------------------------------
# Chat Windows / Conversations
# ---------------------------------------------------------------------------

@router.post(
    "/conversations",
    response_model=AIConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat window",
)
async def create_chat_window(
    session: SessionDep,
    body: AIConversationCreateRequest | None = None,
    current_user: User = Depends(get_current_user),
) -> AIConversationResponse:
    """Create a new independent chat window / conversation."""
    title = body.title if body else None
    conversation = await create_conversation(
        user_id=current_user.id,
        session=session,
        title=title,
    )
    return AIConversationResponse.model_validate(conversation)


@router.get(
    "/conversations",
    response_model=list[AIConversationResponse],
    summary="List all chat windows",
)
async def list_chat_windows(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[AIConversationResponse]:
    """List all chat windows / conversations for the authenticated user, ordered by most recent."""
    conversations = await list_user_conversations(
        user_id=current_user.id,
        session=session,
        limit=limit,
        offset=offset,
    )
    return [AIConversationResponse.model_validate(c) for c in conversations]


@router.get(
    "/conversations/{conversation_id}",
    response_model=AIConversationResponse,
    summary="Get chat window details",
)
async def get_chat_window(
    conversation_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> AIConversationResponse:
    """Get metadata for a specific chat window."""
    conversation = await get_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        session=session,
    )
    return AIConversationResponse.model_validate(conversation)


@router.patch(
    "/conversations/{conversation_id}",
    response_model=AIConversationResponse,
    summary="Rename chat window",
)
async def rename_chat_window(
    conversation_id: UUID,
    body: AIConversationUpdateRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> AIConversationResponse:
    """Rename an existing chat window."""
    conversation = await update_conversation_title(
        conversation_id=conversation_id,
        user_id=current_user.id,
        title=body.title,
        session=session,
    )
    return AIConversationResponse.model_validate(conversation)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete chat window",
)
async def delete_chat_window(
    conversation_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Delete a chat window and all of its associated messages."""
    await delete_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        session=session,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Chat & Messages
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=AIMessageResponse)
async def send_ai_message(
    body: AIMessageRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> AIMessageResponse:
    """Send a message to Schedly's AI calendar assistant.

    If `conversation_id` is omitted, a new chat window will automatically be created.
    """
    return await process_chat_message(
        user_id=current_user.id,
        content=body.content,
        session=session,
        conversation_id=body.conversation_id,
    )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=PaginatedAIMessages,
)
async def list_conversation_messages(
    conversation_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: UUID | None = Query(
        default=None,
        description="Return messages after this message ID.",
    ),
) -> PaginatedAIMessages:
    return await get_conversation_messages(
        conversation_id=conversation_id,
        session=session,
        user_id=current_user.id,
        limit=limit,
        cursor=cursor,
    )
