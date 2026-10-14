from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.modules.preferences.models import UserPreferences


async def get_user_preferences(
    user_id: UUID,
    session: AsyncSession,
) -> UserPreferences | None:
    """Retrieve user preferences by user ID."""
    result = await session.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_user_preferences(
    user_id: UUID,
    session: AsyncSession,
    **fields,
) -> UserPreferences:
    """Create new user preferences with optional overrides."""
    preferences = UserPreferences(user_id=user_id, **fields)
    session.add(preferences)
    await session.flush()
    await session.refresh(preferences)
    return preferences


async def update_user_preferences(
    preferences: UserPreferences,
    session: AsyncSession,
    **fields,
) -> UserPreferences:
    """Update existing user preferences with provided fields."""
    from datetime import datetime, timezone

    for key, value in fields.items():
        if hasattr(preferences, key):
            setattr(preferences, key, value)

    preferences.updated_at = datetime.now(timezone.utc)
    session.add(preferences)
    await session.flush()
    await session.refresh(preferences)
    return preferences


async def delete_user_preferences(
    user_id: UUID,
    session: AsyncSession,
) -> None:
    """Delete user preferences."""
    result = await session.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    preferences = result.scalar_one_or_none()
    if preferences:
        await session.delete(preferences)
        await session.flush()
