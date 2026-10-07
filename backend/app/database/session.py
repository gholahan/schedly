from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings

if not settings.database_url:
    raise ValueError("Database URL not available")

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0
    },
    execution_options={
        "compiled_cache": None
    }
)

async def get_session():
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]