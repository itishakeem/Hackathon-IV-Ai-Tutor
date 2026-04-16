from pydantic import BaseModel


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: dict[str, str]


class QuizQuestionsResponse(BaseModel):
    chapter_id: str
    questions: list[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str]  # {"q1": "A", "q2": "C", ...}


class QuizResultItem(BaseModel):
    id: str
    correct: bool


class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    results: list[QuizResultItem]


class QuizAnswerItem(BaseModel):
    id: str
    question: str
    correct_answer: str


class QuizAnswersResponse(BaseModel):
    chapter_id: str
    answers: list[QuizAnswerItem]
