"""Auth service — registration and login. NO LLM imports."""
import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.user import User

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
