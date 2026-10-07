from fastapi import FastAPI

from app.api import api_router

app = FastAPI(
    title="schedly",
    version="1.0.0",
    description="schedly is a scheduling application that allows users to manage their calendar",
)

app.include_router(api_router)

