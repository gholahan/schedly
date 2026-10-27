import os
from cryptography.fernet import Fernet
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.types import String, UUID as SA_UUID

@compiles(INET, "sqlite")
def compile_inet_sqlite(element, compiler, **kw):
    return "TEXT"

@compiles(SA_UUID, "sqlite")
def compile_uuid_sqlite(element, compiler, **kw):
    return "CHAR(36)"

# Set test environment variables before config is loaded
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("LANGGRAPH_DB_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test_secret_key_1234567890")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test_google_client_id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test_google_client_secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GOOGLE_TOKEN_ENCRYPTION_KEY", Fernet.generate_key().decode())
os.environ.setdefault("OPENROUTER_API_KEY", "test_openrouter_api_key")

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.main import app
from app.database.session import get_session
from app.modules.auth.model import User, RefreshToken
from app.modules.google_calendar.model import GoogleConnection
from app.modules.preferences.models import UserPreferences
from app.modules.agent.models import AIConversation, AIMessage
from app.modules.auth.service import create_user, save_refresh_token
from app.core.security import hash_password, create_access_token, create_refresh_token

test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

async def override_get_session():
    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
async def mock_redis(monkeypatch):
    storage = {}

    class MockRedis:
        async def set(self, key, value, ex=None, **kwargs):
            storage[key] = value
            return True
        async def get(self, key):
            return storage.get(key)
        async def delete(self, key):
            return storage.pop(key, None)
        async def aclose(self):
            pass

    mock_r = MockRedis()
    monkeypatch.setattr("app.database.redis.from_url", lambda *args, **kwargs: mock_r)
    return mock_r

@pytest.fixture(autouse=True)
async def mock_langgraph(monkeypatch):
    class MockGraph:
        async def ainvoke(self, input, config=None):
            from langchain_core.messages import AIMessage as LC_AIMessage
            return {"messages": [LC_AIMessage(content="Mock assistant response")]}

    import app.modules.agent.gragh as agent_gragh
    monkeypatch.setattr(agent_gragh, "graph", MockGraph())

@pytest.fixture
async def test_user():
    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        user = await create_user(
            name="Test User",
            email="test@example.com",
            password_hash=hash_password("password123"),
            session=session,
        )
        return user

@pytest.fixture
async def auth_client(async_client, test_user):
    access_token = create_access_token({"sub": str(test_user.id)})
    refresh_token = create_refresh_token(str(test_user.id))

    async with AsyncSession(test_engine, expire_on_commit=False) as session:
        await save_refresh_token(test_user.id, refresh_token, session)

    async_client.cookies.set("access_token", access_token)
    async_client.cookies.set("refresh_token", refresh_token)
    return async_client
