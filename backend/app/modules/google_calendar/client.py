from app.core.config import settings
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import Resource, build
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.modules.google_calendar.model import GoogleConnection


GOOGLE_CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar",
]


async def get_google_calendar_client(
    user_id: UUID,
    session: AsyncSession,
) -> Resource:
    """
    Return an authenticated Google Calendar API client
    for the given Schedly user.
    """

    result = await session.execute(
        select(GoogleConnection).where(
            GoogleConnection.user_id == user_id
        )
    )

    connection = result.scalar_one_or_none()

    if connection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar is not connected",
        )

    if not connection.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Calendar connection cannot be refreshed",
        )

    credentials = Credentials(
        token=connection.access_token,
        refresh_token=connection.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=GOOGLE_CALENDAR_SCOPES,
    )

    if credentials.expired:
        try:
            credentials.refresh(Request())
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google Calendar authorization has expired. Please reconnect Google Calendar.",
            ) from exc

        connection.access_token = credentials.token

        if credentials.expiry:
            connection.token_expires_at = credentials.expiry

        connection.updated_at = datetime.now(timezone.utc)

        session.add(connection)
        await session.commit()
        await session.refresh(connection)

    return build(
        "calendar",
        "v3",
        credentials=credentials,
        cache_discovery=False,
    )