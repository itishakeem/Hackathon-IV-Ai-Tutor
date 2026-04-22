"""Pydantic schemas for the LLM usage dashboard."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LlmUsageRecord(BaseModel):
    id: uuid.UUID
    feature: str = Field(..., description='"assessment" or "synthesis"')
    tokens_used: int
    cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}


class UsageResponse(BaseModel):
    user_id: uuid.UUID
    records: list[LlmUsageRecord]
    total_cost: float = Field(..., description="Sum of all cost_usd values in records")
