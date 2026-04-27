"""Auth router — register, login, password reset, and profile. NO LLM imports."""
import base64
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.services.auth_service import (
    confirm_password_reset,
    login_user,
    register_user,
    request_password_reset,
)

# NO LLM imports

router = APIRouter()


async def _get_user_from_token(token_payload: dict, db: AsyncSession) -> User:
    """Look up the DB User row from a JWT payload dict."""
    user_id = token_payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = await register_user(db, body.email, body.password, body.name)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = await login_user(db, body.email, body.password)
    return TokenResponse(access_token=token)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await request_password_reset(db, body.email)
    return MessageResponse(message="Code sent if email exists")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await confirm_password_reset(db, body.email, body.code, body.new_password)
    return MessageResponse(message="Password reset successful")


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    token_payload: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await _get_user_from_token(token_payload, db)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        name=user.name or "",
        tier=user.tier,
        avatar=user.avatar,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_me(
    token_payload: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    name: Annotated[str | None, Form()] = None,
    avatar: Annotated[UploadFile | None, File()] = None,
):
    user = await _get_user_from_token(token_payload, db)

    if name is not None:
        user.name = name.strip()

    if avatar is not None:
        if not avatar.content_type or not avatar.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Avatar must be an image")
        contents = await avatar.read()
        if len(contents) > 2 * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Avatar must be under 2MB")
        b64 = base64.b64encode(contents).decode()
        user.avatar = f"data:{avatar.content_type};base64,{b64}"

    await db.commit()
    await db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        name=user.name or "",
        tier=user.tier,
        avatar=user.avatar,
    )
