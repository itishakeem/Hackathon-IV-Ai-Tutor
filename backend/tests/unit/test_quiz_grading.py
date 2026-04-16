"""Unit tests for quiz grading logic. Deterministic only — NO LLM."""
import importlib
import importlib.util

import pytest

from app.services.quiz_service import grade_quiz
from tests.conftest import MOCK_QUIZ_DATA

# NO LLM imports

# Correct answers for MOCK_QUIZ_DATA
CORRECT_ANSWERS = {q["id"]: q["correct_answer"] for q in MOCK_QUIZ_DATA["questions"]}
TOTAL = len(CORRECT_ANSWERS)


def _grade(submitted: dict):
    """Helper: grade against mock data."""
    with pytest.MonkeyPatch().context() as mp:
        mp.setattr("app.core.r2_client.get_quiz", lambda _: MOCK_QUIZ_DATA)
        return grade_quiz("chapter-01", submitted)


# ── Core grading tests ──────────────────────────────────────────────────────

def test_all_correct_answers_returns_perfect_score():
    """All correct answers → score == total."""
    result = _grade(CORRECT_ANSWERS.copy())
    assert result.score == TOTAL
    assert result.total == TOTAL
    assert result.percentage == 100.0
    assert all(r.correct for r in result.results)


def test_all_wrong_answers_returns_zero():
    """All wrong answers → score == 0."""
    wrong = {qid: "X" for qid in CORRECT_ANSWERS}
    result = _grade(wrong)
    assert result.score == 0
    assert result.total == TOTAL
    assert result.percentage == 0.0
    assert all(not r.correct for r in result.results)


def test_empty_submission_returns_zero():
    """Empty submission → score == 0 (missing answers treated as wrong)."""
    result = _grade({})
    assert result.score == 0
    assert result.total == TOTAL


def test_partial_submission_returns_correct_count():
    """Partial answers → score == number of correct answers submitted."""
    partial = {qid: ans for qid, ans in list(CORRECT_ANSWERS.items())[:2]}
    result = _grade(partial)
    assert result.score == 2
    assert result.total == TOTAL


def test_extra_keys_in_submission_are_ignored():
    """Extra question IDs not in the quiz are silently ignored."""
    with_extra = CORRECT_ANSWERS.copy()
    with_extra["q99"] = "A"
    with_extra["q100"] = "B"
    result = _grade(with_extra)
    assert result.score == TOTAL  # extra keys don't affect score
    assert result.total == TOTAL


@pytest.mark.parametrize("score,total,expected_pct", [
    (5, 5, 100.0),
    (4, 5, 80.0),
    (3, 5, 60.0),
    (1, 5, 20.0),
    (0, 5, 0.0),
])
def test_percentage_calculation(score, total, expected_pct):
    """Percentage is computed as round(score/total*100, 1)."""
    correct_keys = list(CORRECT_ANSWERS.keys())[:score]
    wrong_keys = list(CORRECT_ANSWERS.keys())[score:]
    answers = {}
    for k in correct_keys:
        answers[k] = CORRECT_ANSWERS[k]
    for k in wrong_keys:
        answers[k] = "X"
    result = _grade(answers)
    assert result.score == score
    assert result.percentage == expected_pct


def test_results_list_has_entry_per_question():
    """QuizResult.results has one entry per question in the quiz."""
    result = _grade(CORRECT_ANSWERS.copy())
    assert len(result.results) == TOTAL
    result_ids = {r.id for r in result.results}
    assert result_ids == set(CORRECT_ANSWERS.keys())


def test_grading_uses_strict_equality_not_heuristics():
    """Grading uses == only: lowercase answer doesn't match uppercase correct."""
    # Correct answers are uppercase ("B", "C", etc.)
    lowercase_answers = {qid: ans.lower() for qid, ans in CORRECT_ANSWERS.items()}
    result = _grade(lowercase_answers)
    assert result.score == 0  # strict == comparison fails on case mismatch


# ── Zero-LLM compliance test ────────────────────────────────────────────────

def test_quiz_service_has_no_llm_imports():
    """Verify quiz_service.py imports no LLM libraries."""
    import app.services.quiz_service as qs_module
    source_file = qs_module.__file__
    with open(source_file, "r", encoding="utf-8") as f:
        source = f.read()

    forbidden = ["openai", "anthropic", "langchain", "llama", "cohere", "huggingface"]
    for lib in forbidden:
        assert lib not in source.lower(), (
            f"quiz_service.py imports forbidden LLM library: {lib}"
        )
