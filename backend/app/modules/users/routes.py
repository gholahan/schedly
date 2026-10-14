from fastapi import APIRouter, Depends, Response, status

from app.database.session import SessionDep
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.model import User
from app.modules.users.schemas import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.modules.users.service import (
    change_password,
    delete_account,
    get_profile,
    update_profile,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get current user profile",
)
async def get_me(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Return the authenticated user's profile."""
    user = await get_profile(current_user.id, session)
    return ProfileResponse.model_validate(user)


@router.patch(
    "/me",
    response_model=ProfileResponse,
    summary="Update profile",
)
async def update_me(
    body: ProfileUpdateRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Update the authenticated user's name and/or email. Only supplied fields are changed."""
    user = await update_profile(
        user=current_user,
        session=session,
        name=body.name,
        email=body.email,
        avatar_url=body.avatar_url,
    )
    await session.commit()
    return ProfileResponse.model_validate(user)


@router.post(
    "/me/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Change password",
)
async def change_my_password(
    body: ChangePasswordRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Change the authenticated user's password. Requires the current password."""
    await change_password(
        user=current_user,
        session=session,
        current_password=body.current_password,
        new_password=body.new_password,
    )
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete account",
)
async def delete_me(
    body: DeleteAccountRequest,
    response: Response,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Permanently delete the authenticated user's account. Requires password confirmation."""
    await delete_account(
        user=current_user,
        session=session,
        password=body.password,
    )
    await session.commit()
    response.delete_cookie("refresh_token")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
