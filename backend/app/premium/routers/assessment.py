"""Assessment router — POST /premium/assess-answer.

Pro tier only. Every call logged to llm_usage.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.premium import require_pro
from app.premium.schemas.assessment import AssessmentRequest, AssessmentResponse
from app.premium.services.assessment_service import assess_answer

router = APIRouter()


@router.post("/assess-answer", response_model=AssessmentResponse)
async def assess_answer_endpoint(
    body: AssessmentRequest,
    current_user: Annotated[dict, Depends(require_pro)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AssessmentResponse:
    """LLM-graded assessment of a free-text student answer.

    Pro tier only. Logs usage to llm_usage table.
    Rate limited to 10 calls/user/day.
    """
    return await assess_answer(
        db=db,
        chapter_id=body.chapter_id,
        question=body.question,
        student_answer=body.student_answer,
        user_id=body.user_id,
    )
