from datetime import datetime

from pydantic import BaseModel


class ChapterProgressItem(BaseModel):
    chapter_id: str
    completed: bool
    streak_days: int


class QuizScoreItem(BaseModel):
    chapter_id: str
    score: int
    attempted_at: datetime


class ProgressResponse(BaseModel):
    user_id: str
    completed_chapters: list[str]
    quiz_scores: list[QuizScoreItem]
    streak: int
    total_chapters: int
    completion_percentage: float
    avg_quiz_score: float | None
    chapters: list[ChapterProgressItem]


class ChapterCompleteRequest(BaseModel):
    chapter_id: str


class ChapterCompleteResponse(BaseModel):
    chapter_id: str
    completed: bool
    streak_days: int


class QuizScoreRequest(BaseModel):
    chapter_id: str
    score: int
    total_questions: int
