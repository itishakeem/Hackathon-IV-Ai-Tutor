"""Quiz service — rule-based grading using static answer keys. NO LLM."""
from app.core.r2_client import get_quiz
from app.schemas.quiz import (
    QuizAnswerItem,
    QuizAnswersResponse,
    QuizQuestion,
    QuizQuestionsResponse,
    QuizResult,
    QuizResultItem,
)

# NO LLM imports — grading uses == comparison against answer keys only


def get_quiz_questions(chapter_id: str) -> QuizQuestionsResponse:
    """Fetch quiz from storage and return questions WITHOUT correct_answer fields."""
    data = get_quiz(chapter_id)
    questions = []
    for q in data["questions"]:
        questions.append(
            QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                # correct_answer deliberately excluded
            )
        )
    return QuizQuestionsResponse(chapter_id=chapter_id, questions=questions)


def grade_quiz(chapter_id: str, submitted: dict[str, str]) -> QuizResult:
    """Grade submitted answers against the answer key using == only. NO LLM.

    submitted: {"q1": "A", "q2": "B", ...}
    Returns QuizResult with per-question correctness and overall score.
    """
    data = get_quiz(chapter_id)
    answer_key: dict[str, str] = {q["id"]: q["correct_answer"] for q in data["questions"]}
    total = len(answer_key)

    results = []
    score = 0
    for qid, correct in answer_key.items():
        user_answer = submitted.get(qid, "")
        is_correct = user_answer == correct  # strict equality — no heuristics
        if is_correct:
            score += 1
        results.append(QuizResultItem(id=qid, correct=is_correct))

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0
    return QuizResult(score=score, total=total, percentage=percentage, results=results)


def get_quiz_answers(chapter_id: str) -> QuizAnswersResponse:
    """Fetch quiz from storage and return full answer data including correct_answer."""
    data = get_quiz(chapter_id)
    answers = [
        QuizAnswerItem(
            id=q["id"],
            question=q["question"],
            correct_answer=q["correct_answer"],
        )
        for q in data["questions"]
    ]
    return QuizAnswersResponse(chapter_id=chapter_id, answers=answers)
