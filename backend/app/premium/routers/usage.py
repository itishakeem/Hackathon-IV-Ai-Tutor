"""Usage dashboard router — GET /premium/usage/{user_id}.

Users can only view their own usage records.
No LLM calls — read-only query of llm_usage table.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.llm_usage import LlmUsage
from app.premium.schemas.usage import LlmUsageRecord, UsageResponse

router = APIRouter()


@router.get("/usage/{user_id}", response_model=UsageResponse)
async def get_usage(
    user_id: uuid.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UsageResponse:
    """Return all LLM usage records for a user with running total cost.

    The authenticated user may only view their own records.
    Raises 403 if user_id does not match the token subject.
    """
    # Ownership check — token sub must match the requested user_id
    if current_user["sub"] != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own usage.",
        )

    result = await db.execute(
        select(LlmUsage)
        .where(LlmUsage.user_id == user_id)
        .order_by(LlmUsage.created_at.desc())
    )
    rows = result.scalars().all()

    records = [LlmUsageRecord.model_validate(row) for row in rows]
    total_cost = round(sum(r.cost_usd for r in records), 6)

    return UsageResponse(
        user_id=user_id,
        records=records,
        total_cost=total_cost,
    )
