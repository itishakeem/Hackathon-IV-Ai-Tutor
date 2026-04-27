from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

# NO LLM imports — JWT only

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(sub: str, tier: str, email: str = "", name: str = "") -> str:
    """Create a signed HS256 JWT with sub, tier, email, and name embedded."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": sub,
        "tier": tier,
        "email": email,
        "name": name,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Decode and verify a JWT. Returns payload dict. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        sub: str = payload.get("sub")
        tier: str = payload.get("tier", "free")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """FastAPI dependency: validates JWT, returns payload with sub and tier."""
    return verify_token(token)


async def get_optional_user(
    token: Annotated[str | None, Depends(OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False))],
) -> dict | None:
    """FastAPI dependency: returns token payload if provided, None if not (public endpoints)."""
    if token is None:
        return None
    try:
        return verify_token(token)
    except HTTPException:
        return None
