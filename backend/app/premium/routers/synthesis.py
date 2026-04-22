"""Synthesis router — POST /premium/synthesize.

Pro tier only. Every call logged to llm_usage.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.premium import require_pro
from app.premium.schemas.synthesis import SynthesisRequest, SynthesisResponse
from app.premium.services.synthesis_service import synthesize_chapters

router = APIRouter()


@router.post("/synthesize", response_model=SynthesisResponse)
async def synthesize_endpoint(
    body: SynthesisRequest,
    current_user: Annotated[dict, Depends(require_pro)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SynthesisResponse:
    """Cross-chapter synthesis connecting concepts across 2–5 chapters.

    Pro tier only. Logs usage to llm_usage table.
    Rate limited to 10 calls/user/day (shared with assessment).
    """
    return await synthesize_chapters(
        db=db,
        chapter_ids=body.chapter_ids,
        focus_topic=body.focus_topic,
        user_id=body.user_id,
    )
