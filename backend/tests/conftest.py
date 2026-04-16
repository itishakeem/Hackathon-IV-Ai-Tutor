"""Test configuration and shared fixtures. NO LLM imports."""
import json
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# NO LLM imports

# ── In-memory SQLite engine for unit tests ──────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Mock content for R2/Supabase storage ───────────────────────────────────
MOCK_CHAPTER_CONTENT = """# Introduction to AI Agents

## What is an AI Agent?
An AI agent is a software system that perceives its environment, reasons about it, and takes actions to achieve goals. Unlike a simple chatbot, an agent can use tools, plan multi-step tasks, and adapt to changing conditions.

## Agent vs Chatbot
A chatbot responds to a single message at a time. An AI agent can execute a sequence of steps, call external APIs, read files, and maintain context across a long-horizon task.

## Types of Agents
- **Reactive agents**: respond directly to current input without memory
- **Deliberative agents**: plan ahead using a world model
- **Hybrid agents**: combine both approaches for flexible behavior

## Summary
- AI agents perceive, reason, and act in a goal-directed loop
- Agents differ from chatbots by their ability to use tools and plan
- Three main types: reactive, deliberative, and hybrid
"""

MOCK_QUIZ_DATA = {
    "chapter_id": "chapter-01",
    "questions": [
        {
            "id": "q1",
            "question": "Which of the following best describes the perceive-reason-act-observe loop?",
            "options": {
                "A": "A chatbot response pattern",
                "B": "The core cycle of an AI agent",
                "C": "A database query pattern",
                "D": "A network protocol",
            },
            "correct_answer": "B",
        },
        {
            "id": "q2",
            "question": "What is the most significant difference between an AI agent and a chatbot?",
            "options": {
                "A": "Chatbots are faster",
                "B": "Agents use more memory",
                "C": "Agents can use tools and plan multi-step tasks",
                "D": "Chatbots are more intelligent",
            },
            "correct_answer": "C",
        },
        {
            "id": "q3",
            "question": "Which type of agent maintains a world model for planning?",
            "options": {
                "A": "Reactive agent",
                "B": "Deliberative agent",
                "C": "Simple reflex agent",
                "D": "None of the above",
            },
            "correct_answer": "B",
        },
        {
            "id": "q4",
            "question": "A hybrid agent combines which two approaches?",
            "options": {
                "A": "Supervised and unsupervised learning",
                "B": "Online and offline processing",
                "C": "Reactive and deliberative behaviors",
                "D": "Rule-based and neural approaches",
            },
            "correct_answer": "C",
        },
        {
            "id": "q5",
            "question": "What distinguishes an AI agent from a traditional software program?",
            "options": {
                "A": "It runs faster",
                "B": "It uses more RAM",
                "C": "It can adapt and take goal-directed actions autonomously",
                "D": "It requires internet access",
            },
            "correct_answer": "C",
        },
    ],
}


# ── Database fixtures ───────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create fresh in-memory SQLite tables for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── HTTP client fixtures ────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def async_client(db_session: AsyncSession):
    """AsyncClient wired to the FastAPI app with test DB and mocked storage."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    mock_chapter = patch(
        "app.services.r2_service.get_chapter",
        return_value=MOCK_CHAPTER_CONTENT,
    )
    mock_quiz = patch(
        "app.services.quiz_service.get_quiz",
        return_value=MOCK_QUIZ_DATA,
    )
    # SQLite doesn't support ILIKE — mock search at the router import level
    from unittest.mock import AsyncMock as _AsyncMock
    _mock_search_fn = _AsyncMock(return_value=[
        {
            "chapter_id": "chapter-01",
            "chapter_title": "Introduction to AI Agents",
            "excerpt": "An AI agent is a software system that perceives its environment...",
        }
    ])
    mock_search = patch("app.routers.search.keyword_search", _mock_search_fn)
    # Mock startup to avoid real Supabase calls during test app init
    mock_startup = patch("app.main.build_search_index", new=_AsyncMock())

    with mock_chapter, mock_quiz, mock_search, mock_startup:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def auth_headers(async_client: AsyncClient):
    """Register a test user and return Bearer auth headers."""
    resp = await async_client.post(
        "/auth/register",
        json={"email": "testuser@example.com", "password": "TestPass123!"},
    )
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def auth_headers_with_user_id(async_client: AsyncClient):
    """Register a test user and return (headers, user_id)."""
    import base64

    resp = await async_client.post(
        "/auth/register",
        json={"email": "testuser2@example.com", "password": "TestPass123!"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    # Decode user_id from JWT payload
    payload_b64 = token.split(".")[1]
    pad = (4 - len(payload_b64) % 4) % 4
    payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=" * pad))
    user_id = payload["sub"]
    return {"Authorization": f"Bearer {token}"}, user_id
