from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import api_router
from app.core.logging import configure_logging
from app.modules.agent.gragh import setup_graph

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with setup_graph():
        yield


app = FastAPI(
    title="schedly",
    version="1.0.0",
    description="schedly is a scheduling application that allows users to manage their calendar",
    lifespan=lifespan,
)

app.include_router(api_router)
