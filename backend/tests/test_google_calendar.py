import pytest
from httpx import AsyncClient
from app.modules.google_calendar.token_encryption import EncryptedToken
from sqlalchemy.engine import default

def test_token_encrypt_decrypt():
    # EncryptedToken uses settings.google_token_encryption_key
    encryptor = EncryptedToken()
    token_str = "ya29.a0AfH6SM..."
    dialect = default.DefaultDialect()

    encrypted = encryptor.process_bind_param(token_str, dialect)
    assert encrypted != token_str
    assert encrypted is not None

    decrypted = encryptor.process_result_value(encrypted, dialect)
    assert decrypted == token_str

async def test_connect_redirects(auth_client: AsyncClient):
    response = await auth_client.get("/calendar/google/connect", follow_redirects=False)
    # Returns 307 or 302 RedirectResponse to Google OAuth URL
    assert response.status_code in (302, 307)
    assert "accounts.google.com" in response.headers.get("location", "")

async def test_callback_missing_state(auth_client: AsyncClient):
    response = await auth_client.get("/calendar/google/callback", follow_redirects=False)
    # Missing state or code redirects or returns error (302/307 or 400)
    assert response.status_code in (302, 307, 400)
