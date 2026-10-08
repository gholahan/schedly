from typing import Annotated
from fastapi import Depends
from redis.asyncio import Redis, from_url
from app.core.config import settings


async def get_redis() -> Redis:
    client = from_url(settings.redis_url, decode_responses=True, ssl_cert_reqs="required")
    try:
        yield client
    finally:
        await client.aclose()


RedisDep = Annotated[Redis, Depends(get_redis)]
