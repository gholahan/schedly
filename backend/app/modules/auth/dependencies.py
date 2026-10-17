from fastapi import Depends, HTTPException, Request
from jose import JWTError

from app.core.security import decode_access_token
from app.database.session import SessionDep
from app.modules.auth.service import get_user_by_id
from uuid import UUID


async def get_current_user(request: Request, session: SessionDep):
    # Read access_token from httpOnly cookie instead of Authorization header
    access_token = request.cookies.get("access_token")

    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_access_token(access_token)
        user_id = UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
