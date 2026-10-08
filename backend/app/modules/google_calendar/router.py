import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from sqlmodel import select

from app.modules.auth.dependencies import get_current_user
from app.core.config import settings
from app.database.session import SessionDep
from app.database.redis import RedisDep
from app.modules.auth.model import User
from app.modules.google_calendar.model import GoogleConnection
from app.modules.google_calendar.oauth import exchange_code_for_tokens


router = APIRouter(
    prefix="/calendar/google",
    tags=["Google Calendar"],
)

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar",
]

OAUTH_STATE_TTL = 600  # 10 minutes


@router.get("/connect")
async def connect_google_calendar(
    redis: RedisDep,
    current_user: User = Depends(get_current_user),
):
    state = secrets.token_urlsafe(32)

    await redis.set(f"oauth:google:{state}", str(current_user.id), ex=OAUTH_STATE_TTL)

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )

    authorization_url, _ = flow.oauth2session.authorization_url(
        "https://accounts.google.com/o/oauth2/auth",
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )
    print(f"Redirecting user {current_user.id} to Google OAuth URL: {authorization_url}")

    return RedirectResponse(url=authorization_url)


@router.get("/callback")
async def google_callback(
    session: SessionDep,
    redis: RedisDep,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
):
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth failed: {error}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth code or state")

    # 1. Validate state and recover user_id
    redis_key = f"oauth:google:{state}"
    user_id = await redis.get(redis_key)

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    # 2. Consume state immediately
    await redis.delete(redis_key)

    # 3. Exchange authorization code for Google tokens
    try:
        tokens = exchange_code_for_tokens(code, state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange Google authorization code: {e}")

    # 4. Check whether user already has a connection
    result = await session.execute(
        select(GoogleConnection).where(GoogleConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()

    if connection:
        connection.access_token = tokens["access_token"]

        if tokens["refresh_token"]:
            connection.refresh_token = tokens["refresh_token"]

        connection.token_expires_at = tokens["token_expires_at"]
        connection.updated_at = datetime.now(timezone.utc)

    else:
        connection = GoogleConnection(
            user_id=user_id,
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_expires_at=tokens["token_expires_at"],
        )
        session.add(connection)

    await session.commit()

    return RedirectResponse(url=f"{settings.frontend_url}/dashboard/calendar?connected=true")
