"""Auth router — register, login, and password reset. NO LLM imports."""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.auth_service import (
    confirm_password_reset,
    login_user,
    register_user,
    request_password_reset,
)

# NO LLM imports

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = await register_user(db, body.email, body.password)
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
