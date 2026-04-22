"""Pydantic schemas for the LLM-graded assessment feature."""
import uuid

from pydantic import BaseModel, Field


class AssessmentRequest(BaseModel):
    chapter_id: str = Field(..., description="Must be one of chapter-01 through chapter-05")
    question: str = Field(..., description="The question the student is answering")
    student_answer: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Free-text answer. Silently truncated to 2000 chars server-side.",
    )
    user_id: uuid.UUID = Field(..., description="UUID of the authenticated user")


class AssessmentResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score from 0 to 100")
    max_score: int = Field(default=100)
    feedback: str = Field(..., description="Narrative feedback from the LLM")
    strengths: list[str] = Field(..., description="What the student did well")
    improvements: list[str] = Field(..., description="What could be improved")
    suggested_reading: str = Field(
        ..., description="Reference to a chapter section (e.g., 'chapter-01 section: Agent vs Chatbot')"
    )
