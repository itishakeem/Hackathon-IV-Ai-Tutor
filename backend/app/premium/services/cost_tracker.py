"""Cost tracking and rate limiting for premium LLM features.

All LLM usage is logged to the llm_usage table for cost visibility
and rate limiting (10 calls/user/day).
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.llm_usage import LlmUsage

# Anthropic claude-sonnet-4-20250514 pricing (per token)
SONNET_INPUT_COST = 3.00 / 1_000_000   # $3.00 per million input tokens
SONNET_OUTPUT_COST = 15.00 / 1_000_000  # $15.00 per million output tokens

DAILY_RATE_LIMIT = 10


def calculate_cost(usage) -> float:
    """Calculate USD cost for an Anthropic API response usage object.

    Args:
        usage: Anthropic Usage object with .input_tokens and .output_tokens

    Returns:
        Rounded cost in USD to 6 decimal places.
    """
    return round(
        usage.input_tokens * SONNET_INPUT_COST
        + usage.output_tokens * SONNET_OUTPUT_COST,
        6,
    )


async def check_rate_limit(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Raise HTTP 429 if the user has reached 10 LLM calls today (UTC).

    Args:
        db: Async SQLAlchemy session
        user_id: UUID of the requesting user

    Raises:
        HTTPException: 429 if daily limit reached
    """
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    result = await db.execute(
        select(func.count(LlmUsage.id))
        .where(LlmUsage.user_id == user_id)
        .where(LlmUsage.created_at >= today_start)
    )
    count = result.scalar_one()
    if count >= DAILY_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit of 10 LLM calls reached. Resets at midnight UTC.",
        )


async def log_usage(
    db: AsyncSession,
    user_id: uuid.UUID,
    feature: str,
    usage,
) -> LlmUsage:
    """Insert a new LlmUsage row after a successful LLM call.

    Args:
        db: Async SQLAlchemy session
        user_id: UUID of the user who triggered the call
        feature: "assessment" or "synthesis"
        usage: Anthropic Usage object with .input_tokens and .output_tokens

    Returns:
        The persisted LlmUsage row.
    """
    tokens_used = usage.input_tokens + usage.output_tokens
    cost_usd = calculate_cost(usage)

    row = LlmUsage(
        user_id=user_id,
        feature=feature,
        tokens_used=tokens_used,
        cost_usd=cost_usd,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
