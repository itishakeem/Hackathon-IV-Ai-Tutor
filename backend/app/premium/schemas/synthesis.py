"""Pydantic schemas for the cross-chapter synthesis feature."""
import uuid

from pydantic import BaseModel, Field


class SynthesisRequest(BaseModel):
    chapter_ids: list[str] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="2–5 chapter IDs to synthesize. Each must exist in CHAPTER_METADATA.",
    )
    focus_topic: str = Field(
        default="General synthesis across selected chapters",
        description="Optional topic to focus the synthesis around",
    )
    user_id: uuid.UUID = Field(..., description="UUID of the authenticated user")


class GraphEdge(BaseModel):
    from_: str = Field(..., alias="from", description="Source concept")
    to: str = Field(..., description="Target concept")
    relationship: str = Field(
        ..., description="Relationship label (e.g., 'uses', 'extends', 'requires')"
    )

    model_config = {"populate_by_name": True}


class SynthesisResponse(BaseModel):
    synthesis: str = Field(..., description="Narrative connecting the selected chapters")
    key_connections: list[str] = Field(
        ..., description="Each entry must cite source chapter(s) with [chapter-XX] notation"
    )
    knowledge_graph: list[GraphEdge] = Field(
        ..., description="List of concept relationship edges"
    )
    recommended_next: str = Field(
        ..., description="chapter_id of the recommended next chapter"
    )
