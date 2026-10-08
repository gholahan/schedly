from datetime import datetime, timezone

from app.core.config import settings

from google_auth_oauthlib.flow import Flow


GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar",
]


def exchange_code_for_tokens(code: str, state: str) -> dict:
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
        state=state,
    )

    flow.fetch_token(code=code, code_verifier=None)

    credentials = flow.credentials

    expiry = credentials.expiry
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_expires_at": expiry,
    }