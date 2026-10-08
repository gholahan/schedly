from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.google_calendar.router import router as google_calendar_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(google_calendar_router)


@api_router.get("/")
async def welcome_root():
    return {"message": "Welcome to Schedly!"}
