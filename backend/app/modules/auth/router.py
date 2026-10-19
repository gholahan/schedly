from fastapi import APIRouter, HTTPException, Response, Request, Depends
from jose import JWTError
from sqlmodel import select

from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_access_token,
)
# from app.core.config import settings
from app.database.session import SessionDep
from app.modules.auth.schema import (
    SignupRequest, LoginRequest,
    SignupResponse, LoginResponse, RefreshResponse, LogoutResponse, UserResponse,
)
from app.modules.auth.service import (
    get_user_by_email, create_user,
    save_refresh_token, verify_refresh_token, revoke_refresh_token,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.google_calendar.model import GoogleConnection

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=SignupResponse)
async def signup(payload: SignupRequest, response: Response, session: SessionDep):
    if await get_user_by_email(payload.email, session):
        raise HTTPException(status_code=409, detail="Email already exists")

    user = await create_user(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        session=session,
    )

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(str(user.id))

    await save_refresh_token(user.id, refresh_token, session)

    # Set both tokens as httpOnly cookies
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=True, samesite="lax", max_age=60 * 15,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=True, samesite="lax", max_age=60 * 60 * 24 * 30,  # 30 days
    )

    # New user has no Google Calendar yet
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        plan=user.plan,
        credits=user.credits,
        has_google_calendar=False,
        created_at=user.created_at,
    )

    return SignupResponse(user=user_response, access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(session: SessionDep, user=Depends(get_current_user)):
    # Check if user has Google Calendar connected
    result = await session.exec(
        select(GoogleConnection).where(GoogleConnection.user_id == user.id)
    )
    has_google_calendar = result.first() is not None

    # Build UserResponse with has_google_calendar
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        plan=user.plan,
        credits=user.credits,
        has_google_calendar=has_google_calendar,
        created_at=user.created_at,
    )


@router.post("/login", response_model=LoginResponse, status_code=200)
async def login(payload: LoginRequest, response: Response, session: SessionDep):
    user = await get_user_by_email(payload.email, session)

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(str(user.id))

    await save_refresh_token(user.id, refresh_token, session)

    # Set both tokens as httpOnly cookies
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=True, samesite="lax", max_age=60 * 15,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=True, samesite="lax", max_age=60 * 60 * 24 * 30,  # 30 days
    )

    # Check if user has Google Calendar
    result = await session.exec(
        select(GoogleConnection).where(GoogleConnection.user_id == user.id)
    )
    has_google_calendar = result.first() is not None

    # Build UserResponse with has_google_calendar
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        plan=user.plan,
        credits=user.credits,
        has_google_calendar=has_google_calendar,
        created_at=user.created_at,
    )

    return LoginResponse(user=user_response, access_token=access_token)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: Request, response: Response, session: SessionDep):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload["sub"]

    if not await verify_refresh_token(user_id, token, session):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    # Generate new access token
    new_access_token = create_access_token({"sub": user_id})

    # Set new access_token as httpOnly cookie
    response.set_cookie(
        key="access_token", value=new_access_token,
        httponly=True, secure=True, samesite="lax", max_age=60 * 15,  # 15 minutes
    )

    return RefreshResponse(access_token=new_access_token)


@router.post("/logout", response_model=LogoutResponse)
async def logout(request: Request, response: Response, session: SessionDep):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_access_token(refresh_token)
            user_id = payload.get("sub")
            if user_id:
                await revoke_refresh_token(user_id, refresh_token, session)
        except Exception:
            pass

    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    return LogoutResponse(message="Logged out")
