"""Premium package — Pro-tier LLM features (Phase 2 Hybrid Intelligence).

All LLM calls are isolated within this package.
Import anthropic ONLY inside app/premium/.
"""
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


async def require_pro(current_user: dict = Depends(get_current_user)) -> dict:
    """FastAPI dependency: enforces Pro tier gate on premium endpoints."""
    if current_user.get("tier") != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires Pro plan. Upgrade at /pricing",
        )
    return current_user
