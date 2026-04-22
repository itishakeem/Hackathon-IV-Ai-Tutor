"""Integration tests for all API endpoints. NO LLM imports."""
import json
import base64
import pytest
import pytest_asyncio
from httpx import AsyncClient

# NO LLM imports

pytestmark = pytest.mark.asyncio


def _decode_token(token: str) -> dict:
    """Decode JWT payload without verification."""
    p2 = token.split(".")[1]
    pad = (4 - len(p2) % 4) % 4
    return json.loads(base64.urlsafe_b64decode(p2 + "=" * pad))


# ── Auth tests ──────────────────────────────────────────────────────────────

class TestAuth:
    async def test_register_success(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/auth/register",
            json={"email": "new@example.com", "password": "TestPass123!"},
        )
        assert resp.status_code == 201
        assert "access_token" in resp.json()
        assert resp.json()["token_type"] == "bearer"

    async def test_register_duplicate_email_returns_409(self, async_client: AsyncClient):
        data = {"email": "dup@example.com", "password": "TestPass123!"}
        await async_client.post("/auth/register", json=data)
        resp = await async_client.post("/auth/register", json=data)
        assert resp.status_code == 409

    async def test_login_success(self, async_client: AsyncClient):
        data = {"email": "login@example.com", "password": "TestPass123!"}
        await async_client.post("/auth/register", json=data)
        resp = await async_client.post("/auth/login", json=data)
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_login_wrong_password_returns_401(self, async_client: AsyncClient):
        data = {"email": "wrongpw@example.com", "password": "TestPass123!"}
        await async_client.post("/auth/register", json=data)
        resp = await async_client.post(
            "/auth/login", json={"email": data["email"], "password": "wrong"}
        )
        assert resp.status_code == 401


# ── Access control tests ────────────────────────────────────────────────────

class TestAccess:
    async def test_free_user_can_access_chapter01(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/access/check?user_id=abc&chapter_id=chapter-01",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["allowed"] is True

    async def test_free_user_blocked_from_chapter04(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/access/check?user_id=abc&chapter_id=chapter-04",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["allowed"] is False
        assert resp.json()["reason"] is not None

    async def test_free_user_blocked_from_chapter05(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/access/check?user_id=abc&chapter_id=chapter-05",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["allowed"] is False


# ── Chapter tests ───────────────────────────────────────────────────────────

class TestChapters:
    async def test_list_chapters_returns_five(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get("/chapters", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 5

    async def test_get_chapter_content_not_empty(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get("/chapters/chapter-01", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json().get("content", "")) > 100

    async def test_get_chapter_next_navigation(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/chapters/chapter-01/next", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data is not None
        assert "chapter_id" in data

    async def test_get_chapter_previous_navigation(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/chapters/chapter-02/previous", headers=auth_headers
        )
        assert resp.status_code == 200

    async def test_free_user_blocked_from_chapter04(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get("/chapters/chapter-04", headers=auth_headers)
        assert resp.status_code == 403

    async def test_chapter_summary_has_key_points(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/chapters/chapter-01/summary", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "key_points" in data or "summary" in data


# ── Search tests ────────────────────────────────────────────────────────────

class TestSearch:
    async def test_search_returns_results_for_known_term(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get("/search?q=agent", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_search_result_has_required_fields(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get("/search?q=agent", headers=auth_headers)
        assert resp.status_code == 200
        result = resp.json()[0]
        assert "chapter_id" in result
        assert "excerpt" in result


# ── Quiz tests ──────────────────────────────────────────────────────────────

class TestQuizzes:
    async def test_get_questions_no_correct_answer(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/quizzes/chapter-01", headers=auth_headers
        )
        assert resp.status_code == 200
        questions = resp.json()["questions"]
        assert len(questions) > 0
        for q in questions:
            assert "correct_answer" not in q

    async def test_submit_all_correct_returns_perfect_score(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        answers = {"q1": "B", "q2": "C", "q3": "B", "q4": "C", "q5": "C"}
        resp = await async_client.post(
            "/quizzes/chapter-01/submit",
            json={"answers": answers},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 5
        assert data["percentage"] == 100.0

    async def test_get_answers_before_attempt_returns_403(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/quizzes/chapter-02/answers", headers=auth_headers
        )
        assert resp.status_code == 403

    async def test_get_answers_after_attempt_returns_200(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        # First submit
        await async_client.post(
            "/quizzes/chapter-01/submit",
            json={"answers": {"q1": "B", "q2": "C", "q3": "B", "q4": "C", "q5": "C"}},
            headers=auth_headers,
        )
        # Then get answers
        resp = await async_client.get(
            "/quizzes/chapter-01/answers", headers=auth_headers
        )
        assert resp.status_code == 200
        answers = resp.json()["answers"]
        assert len(answers) > 0
        assert any("correct_answer" in a for a in answers)


# ── Progress tests ──────────────────────────────────────────────────────────

class TestProgress:
    async def test_get_progress_initial_state(
        self, async_client: AsyncClient, auth_headers_with_user_id
    ):
        headers, user_id = auth_headers_with_user_id
        resp = await async_client.get(f"/progress/{user_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_chapters"] == 5
        assert data["completed_chapters"] == []
        assert data["streak"] == 0
        assert data["quiz_scores"] == []
        assert data["avg_quiz_score"] is None
        assert data["chapters"] == []

    async def test_mark_chapter_complete_sets_streak(
        self, async_client: AsyncClient, auth_headers_with_user_id
    ):
        headers, user_id = auth_headers_with_user_id
        resp = await async_client.put(
            f"/progress/{user_id}/chapter",
            json={"chapter_id": "chapter-01"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["completed"] is True
        assert data["streak_days"] == 1

    async def test_same_day_completion_streak_unchanged(
        self, async_client: AsyncClient, auth_headers_with_user_id
    ):
        headers, user_id = auth_headers_with_user_id
        # First completion
        await async_client.put(
            f"/progress/{user_id}/chapter",
            json={"chapter_id": "chapter-01"},
            headers=headers,
        )
        # Same day again
        resp = await async_client.put(
            f"/progress/{user_id}/chapter",
            json={"chapter_id": "chapter-01"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["streak_days"] == 1

    async def test_other_user_progress_returns_403(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        resp = await async_client.get(
            "/progress/00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
        assert resp.status_code == 403

    async def test_reset_progress_clears_data(
        self, async_client: AsyncClient, auth_headers_with_user_id
    ):
        headers, user_id = auth_headers_with_user_id
        # Record some progress
        await async_client.put(
            f"/progress/{user_id}/chapter",
            json={"chapter_id": "chapter-01"},
            headers=headers,
        )
        # Reset
        resp = await async_client.delete(
            f"/progress/{user_id}/reset", headers=headers
        )
        assert resp.status_code == 204

        # Verify cleared
        resp = await async_client.get(f"/progress/{user_id}", headers=headers)
        assert resp.json()["completed_chapters"] == []
        assert resp.json()["quiz_scores"] == []
        assert resp.json()["avg_quiz_score"] is None
