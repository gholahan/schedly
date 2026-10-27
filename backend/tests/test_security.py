from datetime import timedelta
from jose import JWTError
import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
)

def test_hash_and_verify_password():
    password = "secretpassword"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_create_and_decode_access_token():
    data = {"sub": "12345678-1234-5678-1234-567812345678"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["sub"] == data["sub"]

def test_expired_token_raises():
    data = {"sub": "12345678-1234-5678-1234-567812345678"}
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    with pytest.raises(JWTError):
        decode_access_token(token)

def test_create_refresh_token_is_unique():
    user_id = "12345678-1234-5678-1234-567812345678"
    token1 = create_refresh_token(user_id)
    token2 = create_refresh_token(user_id)
    assert token1 != token2
