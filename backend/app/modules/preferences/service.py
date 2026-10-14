from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.preferences.models import UserPreferences
from app.modules.preferences.repository import (
    create_user_preferences,
    delete_user_preferences,
    get_user_preferences,
    update_user_preferences,
)


async def get_or_create_preferences(
    user_id: UUID,
    session: AsyncSession,
) -> UserPreferences:
    """Get user preferences or create with defaults if they don't exist."""
    preferences = await get_user_preferences(user_id, session)
    if not preferences:
        preferences = await create_user_preferences(user_id, session)
        await session.commit()
    return preferences


async def update_preferences(
    user_id: UUID,
    session: AsyncSession,
    **fields,
) -> UserPreferences:
    """Update user preferences with provided fields."""
    preferences = await get_or_create_preferences(user_id, session)
    preferences = await update_user_preferences(preferences, session, **fields)
    await session.commit()
    return preferences


async def reset_preferences(
    user_id: UUID,
    session: AsyncSession,
) -> UserPreferences:
    """Reset user preferences to defaults by deleting and recreating."""
    await delete_user_preferences(user_id, session)
    preferences = await create_user_preferences(user_id, session)
    await session.commit()
    return preferences
