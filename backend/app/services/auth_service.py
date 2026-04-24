"""Auth service — registration, login, and password reset. NO LLM imports."""
import logging
import random
import string
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.password_reset import PasswordResetCode
from app.models.user import User

logger = logging.getLogger(__name__)

# NO LLM imports


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def register_user(db: AsyncSession, email: str, password: str) -> str:
    """Hash password, insert User row, return signed JWT.

    Raises HTTP 409 if email already registered.
    """
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=email,
        hashed_password=_hash_password(password),
        tier="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return create_access_token(sub=str(user.id), tier=user.tier)


async def login_user(db: AsyncSession, email: str, password: str) -> str:
    """Verify credentials, return signed JWT.

    Raises HTTP 401 on invalid email or wrong password.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not _verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return create_access_token(sub=str(user.id), tier=user.tier)


async def request_password_reset(db: AsyncSession, email: str) -> None:
    """Generate 6-digit code, store it, print to console.

    Always returns without error even if email doesn't exist (no user enumeration).
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        return  # silently do nothing — response is always the same

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    reset = PasswordResetCode(email=email, code=code, expires_at=expires_at)
    db.add(reset)
    await db.commit()

    logger.info("PASSWORD RESET CODE for %s: %s (expires %s)", email, code, expires_at)
    print(f"\n{'='*50}\nPASSWORD RESET CODE\nEmail: {email}\nCode: {code}\nExpires: {expires_at}\n{'='*50}\n")


async def confirm_password_reset(db: AsyncSession, email: str, code: str, new_password: str) -> None:
    """Verify code, update hashed password, mark code used.

    Raises HTTP 400 on invalid/expired/used code.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.email == email)
        .where(PasswordResetCode.code == code)
        .where(PasswordResetCode.used.is_(False))
        .where(PasswordResetCode.expires_at > now)
        .order_by(PasswordResetCode.expires_at.desc())
    )
    reset = result.scalar_one_or_none()

    if reset is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code",
        )

    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.hashed_password = _hash_password(new_password)
    reset.used = True
    await db.commit()
