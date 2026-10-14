from uuid import UUID

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.model import User


async def get_user_by_id(user_id: UUID, session: AsyncSession) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(email: str, session: AsyncSession) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_user(user: User, session: AsyncSession, **fields) -> User:
    from datetime import datetime, timezone

    for key, value in fields.items():
        if hasattr(user, key):
            setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def delete_user(user: User, session: AsyncSession) -> None:
    """Hard-delete a user row."""
    await session.delete(user)
    await session.flush()
