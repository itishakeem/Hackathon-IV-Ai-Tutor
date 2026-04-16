"""Auth router — register and login. NO LLM imports."""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import login_user, register_user

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
