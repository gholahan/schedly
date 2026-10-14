from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.modules.auth.model import User
from app.modules.auth.service import revoke_all_user_tokens
from app.modules.users.repository import (
    delete_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
)


async def get_profile(user_id: UUID, session: AsyncSession) -> User:
    user = await get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def update_profile(
    user: User,
    session: AsyncSession,
    name: str | None = None,
    email: str | None = None,
    avatar_url: str | None = None,
) -> User:
    fields: dict = {}

    if name is not None:
        fields["name"] = name

    if email is not None and email != user.email:
        existing = await get_user_by_email(email, session)
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        fields["email"] = email

    if avatar_url is not None:
        fields["avatar_url"] = avatar_url

    if not fields:
        # Nothing to update — return as-is
        return user

    return await update_user(user, session, **fields)


async def change_password(
    user: User,
    session: AsyncSession,
    current_password: str,
    new_password: str,
) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await update_user(user, session, password_hash=hash_password(new_password))


async def delete_account(
    user: User,
    session: AsyncSession,
    password: str,
) -> None:
    """Confirm password, revoke all tokens, then hard-delete the user."""
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Password is incorrect")

    await revoke_all_user_tokens(user.id, session)
    await delete_user(user, session)
