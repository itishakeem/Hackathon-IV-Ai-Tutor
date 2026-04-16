"""Access / freemium gate router. NO LLM imports."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.access import AccessCheckResponse
from app.services.access_service import check_access, get_access_reason

# NO LLM imports

router = APIRouter()


@router.get("/check", response_model=AccessCheckResponse)
async def check_chapter_access(
    chapter_id: Annotated[str, Query(description="Chapter ID to check access for")],
    user: Annotated[dict, Depends(get_current_user)],
):
    """Check whether the authenticated user can access a given chapter."""
    tier = user["tier"]
    allowed = check_access(tier, chapter_id)
    reason = get_access_reason(tier, chapter_id)
    return AccessCheckResponse(allowed=allowed, reason=reason, tier=tier)
