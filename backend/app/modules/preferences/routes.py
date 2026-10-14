from fastapi import APIRouter, Depends, status

from app.database.session import SessionDep
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.model import User
from app.modules.preferences.schemas import (
    PreferencesResponse,
    PreferencesUpdateRequest,
)
from app.modules.preferences.service import (
    get_or_create_preferences,
    reset_preferences,
    update_preferences,
)

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get(
    "",
    response_model=PreferencesResponse,
    summary="Get user preferences",
)
async def get_preferences(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PreferencesResponse:
    """Get the authenticated user's preferences, creating defaults if none exist."""
    preferences = await get_or_create_preferences(current_user.id, session)
    return PreferencesResponse.model_validate(preferences)


@router.patch(
    "",
    response_model=PreferencesResponse,
    summary="Update user preferences",
)
async def update_user_preferences(
    body: PreferencesUpdateRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PreferencesResponse:
    """Update user preferences. Only supplied fields are updated."""
    # Extract non-None fields from request
    update_fields = {k: v for k, v in body.model_dump().items() if v is not None}

    preferences = await update_preferences(
        user_id=current_user.id,
        session=session,
        **update_fields,
    )
    return PreferencesResponse.model_validate(preferences)


@router.post(
    "/reset",
    response_model=PreferencesResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset preferences to defaults",
)
async def reset_user_preferences(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PreferencesResponse:
    """Reset user preferences to system defaults."""
    preferences = await reset_preferences(current_user.id, session)
    return PreferencesResponse.model_validate(preferences)
