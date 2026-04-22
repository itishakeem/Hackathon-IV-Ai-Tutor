"""Integration tests for premium endpoints (Phase 2).

All Anthropic SDK calls are mocked — no real API calls made.
Uses the same SQLite in-memory database as the Phase 1 test suite.
"""
import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import User

# ── Shared mock data ────────────────────────────────────────────────────────

MOCK_CHAPTER_CONTENT = """# Introduction to AI Agents

## What is an AI Agent?
An AI agent is a software system that perceives its environment, reasons about it,
and takes actions to achieve goals.

## Agent vs Chatbot
A chatbot responds to a single message. An agent can execute multi-step tasks,
call external APIs, and maintain context.

## Summary
- Agents perceive, reason, and act
- Agents differ from chatbots by using tools and planning
"""

# Pre-built mock Anthropic response for assessment
def _make_mock_anthropic_response(feature: str = "assessment"):
    """Build a MagicMock that mimics an Anthropic messages.create() response."""
    mock_response = MagicMock()
    mock_response.usage = MagicMock()
    mock_response.usage.input_tokens = 500
    mock_response.usage.output_tokens = 300

    if feature == "assessment":
        tool_input = {
            "score": 85,
            "feedback": "Good understanding of agent autonomy.",
            "strengths": ["Correctly identified action-taking capability"],
            "improvements": ["Mention memory and planning aspects"],
            "suggested_reading": "chapter-01 section: Agent vs Chatbot",
        }
    else:
        tool_input = {
            "synthesis": "Across these chapters a progression emerges...",
            "key_connections": ["Agents need tools [chapter-01]"],
            "knowledge_graph": [{"from": "AI Agent", "to": "MCP", "relationship": "uses"}],
            "recommended_next": "chapter-02",
        }

    content_block = MagicMock()
    content_block.input = tool_input
    mock_response.content = [content_block]
    return mock_response


# ── Fixtures ────────────────────────────────────────────────────────────────

from tests.conftest import TEST_DATABASE_URL, TestSessionLocal, test_engine  # noqa: E402


@pytest_asyncio.fixture(scope="function")
async def premium_db_session():
    """In-memory SQLite session for premium tests — creates all tables fresh."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def premium_client(premium_db_session: AsyncSession):
    """AsyncClient wired with mocked storage and mocked startup."""

    async def override_get_db():
        yield premium_db_session

    app.dependency_overrides[get_db] = override_get_db

    mock_startup = patch("app.main.build_search_index", new=AsyncMock())
    mock_chapter = patch(
        "app.core.r2_client.get_chapter",
        return_value=MOCK_CHAPTER_CONTENT,
    )

    with mock_startup, mock_chapter:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            yield client

    app.dependency_overrides.clear()


async def _register_user(db: AsyncSession, email: str, tier: str) -> tuple[str, str]:
    """Insert a user directly and return (token, user_id)."""
    import bcrypt

    hashed = bcrypt.hashpw(b"TestPass123!", bcrypt.gensalt()).decode()
    user = User(email=email, hashed_password=hashed, tier=tier)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(sub=str(user.id), tier=user.tier)
    return token, str(user.id)


# ── T015: Assessment integration tests ─────────────────────────────────────

@pytest.mark.asyncio
class TestAssessEndpoint:

    async def test_assess_pro_user(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Pro user gets 200 with all required response fields."""
        token, user_id = await _register_user(
            premium_db_session, "pro@test.com", "pro"
        )
        mock_resp = _make_mock_anthropic_response("assessment")

        with patch(
            "app.premium.services.assessment_service.anthropic.Anthropic"
        ) as MockAnth:
            MockAnth.return_value.messages.create.return_value = mock_resp

            resp = await premium_client.post(
                "/premium/assess-answer",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "chapter_id": "chapter-01",
                    "question": "Explain the difference between an AI Agent and a Chatbot",
                    "student_answer": "An agent can take autonomous actions using tools and memory.",
                    "user_id": user_id,
                },
            )

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "score" in data
        assert "feedback" in data
        assert "strengths" in data
        assert "improvements" in data
        assert "suggested_reading" in data
        assert "max_score" in data
        assert data["max_score"] == 100

    async def test_assess_free_user(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Free user gets 403 Forbidden."""
        token, user_id = await _register_user(
            premium_db_session, "free@test.com", "free"
        )
        resp = await premium_client.post(
            "/premium/assess-answer",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_id": "chapter-01",
                "question": "What is an agent?",
                "student_answer": "An agent does stuff autonomously.",
                "user_id": user_id,
            },
        )
        assert resp.status_code == 403
        assert "Pro plan" in resp.json()["detail"]

    async def test_assess_short_answer(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Answer under 10 characters returns 422 Unprocessable Entity."""
        token, user_id = await _register_user(
            premium_db_session, "pro2@test.com", "pro"
        )
        resp = await premium_client.post(
            "/premium/assess-answer",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_id": "chapter-01",
                "question": "What is an agent?",
                "student_answer": "Short",  # < 10 chars
                "user_id": user_id,
            },
        )
        assert resp.status_code == 422

    async def test_assess_invalid_chapter(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Unknown chapter_id returns 404 Not Found."""
        token, user_id = await _register_user(
            premium_db_session, "pro3@test.com", "pro"
        )
        resp = await premium_client.post(
            "/premium/assess-answer",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_id": "chapter-99",
                "question": "What is an agent?",
                "student_answer": "An agent takes autonomous actions in the world.",
                "user_id": user_id,
            },
        )
        assert resp.status_code == 404
        assert "chapter-99" in resp.json()["detail"]

    async def test_assess_logs_usage(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Successful assessment inserts a row into llm_usage."""
        from sqlalchemy import select
        from app.models.llm_usage import LlmUsage

        token, user_id = await _register_user(
            premium_db_session, "pro4@test.com", "pro"
        )
        mock_resp = _make_mock_anthropic_response("assessment")

        with patch(
            "app.premium.services.assessment_service.anthropic.Anthropic"
        ) as MockAnth:
            MockAnth.return_value.messages.create.return_value = mock_resp

            resp = await premium_client.post(
                "/premium/assess-answer",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "chapter_id": "chapter-01",
                    "question": "Explain what an AI agent does.",
                    "student_answer": "An AI agent perceives the environment and takes goal-directed actions.",
                    "user_id": user_id,
                },
            )

        assert resp.status_code == 200, resp.text

        result = await premium_db_session.execute(
            select(LlmUsage).where(LlmUsage.user_id == uuid.UUID(user_id))
        )
        rows = result.scalars().all()
        assert len(rows) == 1
        assert rows[0].feature == "assessment"
        assert rows[0].tokens_used == 800  # 500 + 300
        assert rows[0].cost_usd > 0


# ── T023: Synthesis integration tests ──────────────────────────────────────

@pytest.mark.asyncio
class TestSynthesizeEndpoint:

    async def test_synthesize_pro_user(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Pro user gets 200 with all required synthesis response fields."""
        token, user_id = await _register_user(
            premium_db_session, "synpro@test.com", "pro"
        )
        mock_resp = _make_mock_anthropic_response("synthesis")

        with patch(
            "app.premium.services.synthesis_service.anthropic.Anthropic"
        ) as MockAnth:
            MockAnth.return_value.messages.create.return_value = mock_resp

            resp = await premium_client.post(
                "/premium/synthesize",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "chapter_ids": ["chapter-01", "chapter-02", "chapter-03"],
                    "focus_topic": "How MCP connects agents to the real world",
                    "user_id": user_id,
                },
            )

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "synthesis" in data
        assert "key_connections" in data
        assert "knowledge_graph" in data
        assert "recommended_next" in data
        assert isinstance(data["key_connections"], list)
        assert isinstance(data["knowledge_graph"], list)

    async def test_synthesize_free_user(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Free user gets 403 Forbidden."""
        token, user_id = await _register_user(
            premium_db_session, "synfree@test.com", "free"
        )
        resp = await premium_client.post(
            "/premium/synthesize",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_ids": ["chapter-01", "chapter-02"],
                "user_id": user_id,
            },
        )
        assert resp.status_code == 403
        assert "Pro plan" in resp.json()["detail"]

    async def test_synthesize_too_few_chapters(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Single chapter_id returns 422 — minimum is 2."""
        token, user_id = await _register_user(
            premium_db_session, "synpro2@test.com", "pro"
        )
        resp = await premium_client.post(
            "/premium/synthesize",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_ids": ["chapter-01"],  # only 1 — below min_length=2
                "user_id": user_id,
            },
        )
        assert resp.status_code == 422

    async def test_synthesize_too_many_chapters(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Six chapter_ids returns 422 — maximum is 5."""
        token, user_id = await _register_user(
            premium_db_session, "synpro3@test.com", "pro"
        )
        resp = await premium_client.post(
            "/premium/synthesize",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_ids": [
                    "chapter-01", "chapter-02", "chapter-03",
                    "chapter-04", "chapter-05", "chapter-06",
                ],  # 6 — above max_length=5
                "user_id": user_id,
            },
        )
        assert resp.status_code == 422

    async def test_synthesize_logs_usage(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """Successful synthesis inserts a row with feature='synthesis' into llm_usage."""
        from sqlalchemy import select
        from app.models.llm_usage import LlmUsage

        token, user_id = await _register_user(
            premium_db_session, "synpro4@test.com", "pro"
        )
        mock_resp = _make_mock_anthropic_response("synthesis")

        with patch(
            "app.premium.services.synthesis_service.anthropic.Anthropic"
        ) as MockAnth:
            MockAnth.return_value.messages.create.return_value = mock_resp

            resp = await premium_client.post(
                "/premium/synthesize",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "chapter_ids": ["chapter-01", "chapter-02"],
                    "focus_topic": "Agent architecture overview",
                    "user_id": user_id,
                },
            )

        assert resp.status_code == 200, resp.text

        result = await premium_db_session.execute(
            select(LlmUsage).where(LlmUsage.user_id == uuid.UUID(user_id))
        )
        rows = result.scalars().all()
        assert len(rows) == 1
        assert rows[0].feature == "synthesis"
        assert rows[0].tokens_used == 800  # 500 + 300 from mock
        assert rows[0].cost_usd > 0


# ── T030: Usage dashboard integration tests ─────────────────────────────────

@pytest.mark.asyncio
class TestUsageDashboard:

    async def test_usage_dashboard_own_records(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """User can fetch their own usage records — 200 with records list and total_cost."""
        from app.models.llm_usage import LlmUsage

        token, user_id = await _register_user(
            premium_db_session, "usage1@test.com", "pro"
        )
        # Seed two llm_usage rows directly
        premium_db_session.add(
            LlmUsage(
                user_id=uuid.UUID(user_id),
                feature="assessment",
                tokens_used=800,
                cost_usd=0.006,
            )
        )
        premium_db_session.add(
            LlmUsage(
                user_id=uuid.UUID(user_id),
                feature="synthesis",
                tokens_used=1800,
                cost_usd=0.033,
            )
        )
        await premium_db_session.commit()

        resp = await premium_client.get(
            f"/premium/usage/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["user_id"] == user_id
        assert isinstance(data["records"], list)
        assert len(data["records"]) == 2
        assert "total_cost" in data
        assert data["total_cost"] == pytest.approx(0.039, abs=1e-6)
        # Verify each record has required fields
        for rec in data["records"]:
            assert "id" in rec
            assert "feature" in rec
            assert "tokens_used" in rec
            assert "cost_usd" in rec
            assert "created_at" in rec

    async def test_usage_dashboard_other_user(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """User cannot view another user's usage — 403 Forbidden."""
        token_a, user_id_a = await _register_user(
            premium_db_session, "usageA@test.com", "pro"
        )
        _token_b, user_id_b = await _register_user(
            premium_db_session, "usageB@test.com", "pro"
        )
        # User A tries to view User B's usage
        resp = await premium_client.get(
            f"/premium/usage/{user_id_b}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp.status_code == 403

    async def test_rate_limit_exceeded(
        self, premium_client: AsyncClient, premium_db_session: AsyncSession
    ):
        """After 10 llm_usage rows today, the next LLM call returns 429."""
        from app.models.llm_usage import LlmUsage
        from datetime import datetime, timezone

        token, user_id = await _register_user(
            premium_db_session, "ratelimit@test.com", "pro"
        )
        # Seed 10 llm_usage rows with today's timestamp
        today = datetime.now(timezone.utc)
        for _ in range(10):
            premium_db_session.add(
                LlmUsage(
                    user_id=uuid.UUID(user_id),
                    feature="assessment",
                    tokens_used=500,
                    cost_usd=0.006,
                    created_at=today,
                )
            )
        await premium_db_session.commit()

        # 11th call should be blocked with 429
        resp = await premium_client.post(
            "/premium/assess-answer",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "chapter_id": "chapter-01",
                "question": "What is an AI agent?",
                "student_answer": "An AI agent perceives and acts autonomously.",
                "user_id": user_id,
            },
        )
        assert resp.status_code == 429
        assert "Daily limit" in resp.json()["detail"]
