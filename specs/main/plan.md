# Implementation Plan: Course Companion FTE — Phase 1

**Branch**: `main` | **Date**: 2026-04-09 | **Spec**: specs/main/spec.md
**Input**: Feature specification from `specs/main/spec.md`

## Summary

Build a Zero-Backend-LLM FastAPI backend serving an AI Agent Development course
to a ChatGPT App frontend. Backend is purely deterministic: serves chapter content
from Cloudflare R2, tracks progress in Neon PostgreSQL, grades quizzes via static
answer keys, enforces freemium access, and provides ILIKE keyword search against a
startup-built DB index. ChatGPT handles all explanation, tutoring, and adaptation.

## Technical Context

**Language/Version**: Python 3.11
**Primary Dependencies**: FastAPI 0.110, SQLAlchemy 2.0 async, asyncpg, boto3, python-jose
**Storage**: Neon PostgreSQL (asyncpg) + Cloudflare R2 (boto3 S3-compatible)
**Testing**: pytest + pytest-asyncio + httpx AsyncClient
**Target Platform**: Fly.io (Docker, Linux)
**Performance Goals**: content endpoints ≤500ms p95; progress/quiz ≤200ms p95
**Constraints**: ZERO LLM calls in backend; content verbatim from R2; quiz grading
rule-based only; freemium gate server-side enforced
**Scale/Scope**: 5 chapters, 5 quizzes, 100+ concurrent users

## Constitution Check

*GATE: Must pass before implementation. Re-check after each router is added.*

- [x] **Gate 1 — Zero-LLM**: No imports of `openai`, `anthropic`, `langchain`,
  `llama_index`, or any LLM SDK anywhere in `backend/`. CI lint check required.
- [x] **Gate 2 — Verbatim content**: `r2_service.py` reads raw bytes from R2 and
  returns decoded UTF-8 text. No transformation, summarization, or modification.
- [x] **Gate 3 — Rule-based grading**: `quiz_service.py` fetches answer key from
  R2 JSON, compares submitted answers with `==`, returns integer score. No scoring
  model or heuristic.
- [x] **Gate 4 — Freemium enforced**: `access_service.check_access()` called in
  every chapter and quiz endpoint before returning content. Returns 403 with reason
  on block.
- [x] **Gate 5 — Secrets via env**: All credentials loaded from `.env` via
  `pydantic-settings`. No hardcoded strings for keys, URLs, or tokens.

## Project Structure

### Documentation

```
specs/main/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology decisions
└── contracts/
    └── openapi.yaml     # Full OpenAPI 3.1 spec
```

### Source Code

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, lifespan startup, router registration
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py              # GET /health
│   │   ├── auth.py                # POST /auth/register, POST /auth/login
│   │   ├── chapters.py            # GET /chapters, /chapters/{id}, /next, /previous, /summary
│   │   ├── search.py              # GET /search?q=
│   │   ├── quizzes.py             # GET /quizzes/{id}, POST submit, GET answers
│   │   ├── progress.py            # GET/PUT/DELETE /progress/{user_id}
│   │   └── access.py              # GET /access/check
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User SQLAlchemy model
│   │   ├── progress.py            # Progress SQLAlchemy model
│   │   ├── quiz_attempt.py        # QuizAttempt SQLAlchemy model
│   │   └── search_index.py        # SearchIndex SQLAlchemy model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                # RegisterRequest, LoginRequest, TokenResponse
│   │   ├── chapter.py             # ChapterMeta, ChapterContent, ChapterSummary
│   │   ├── quiz.py                # QuizQuestions, QuizSubmit, QuizResult, QuizAnswers
│   │   ├── progress.py            # ProgressResponse, ChapterComplete, QuizScore
│   │   └── access.py              # AccessCheckResponse
│   ├── services/
│   │   ├── __init__.py
│   │   ├── r2_service.py          # boto3 R2 client, get_chapter(), get_quiz_key()
│   │   ├── quiz_service.py        # grade_quiz() — rule-based only, NO LLM
│   │   ├── progress_service.py    # update_streak(), get_progress(), reset_progress()
│   │   ├── search_service.py      # keyword_search(), build_index()
│   │   └── access_service.py      # check_access() freemium gate
│   └── core/
│       ├── __init__.py
│       ├── config.py              # pydantic-settings Settings class
│       ├── database.py            # async engine, session factory, get_db dependency
│       ├── security.py            # create_token(), verify_token(), get_current_user()
│       └── startup.py             # build_search_index() called on app lifespan startup
├── skills/
│   ├── concept-explainer.md
│   ├── quiz-master.md
│   ├── socratic-tutor.md
│   └── progress-motivator.md
├── content/                       # Local copies for upload to R2
│   ├── chapter-01.md
│   ├── chapter-02.md
│   ├── chapter-03.md
│   ├── chapter-04.md
│   └── chapter-05.md
├── quizzes/                       # Local copies for upload to R2
│   ├── quiz-01.json
│   ├── quiz-02.json
│   ├── quiz-03.json
│   ├── quiz-04.json
│   └── quiz-05.json
├── tests/
│   ├── conftest.py                # async engine, test DB, mock R2, auth fixtures
│   ├── unit/
│   │   ├── test_quiz_grading.py   # parametrized correct/incorrect/partial answers
│   │   └── test_streak_logic.py   # same-day, next-day, gap>1 day cases
│   └── integration/
│       └── test_api_endpoints.py  # full flow per router using httpx AsyncClient
├── alembic/
│   ├── env.py
│   ├── versions/                  # migration scripts
│   └── alembic.ini
├── .env.example
├── requirements.txt
├── Dockerfile
└── fly.toml

chatgpt-app/
├── manifest.yaml                  # OpenAI App manifest
└── openapi.yaml                   # Symlink or copy of contracts/openapi.yaml
```

## Phase 0: Research

**Status**: Complete — see `specs/main/research.md`

All NEEDS CLARIFICATION items resolved:
- Auth mechanism: JWT HS256 ✅
- Chapter mapping: 1 file per module ✅
- Streak logic: calendar-day, last_activity_date ✅
- Search: ILIKE on startup-built index ✅
- Performance targets: ≤500ms/≤200ms ✅

## Phase 1: Data Model

### Table Definitions

#### users
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    tier        VARCHAR(20) NOT NULL DEFAULT 'free'
                CHECK (tier IN ('free', 'premium', 'pro')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### progress
```sql
CREATE TABLE progress (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id         VARCHAR(50) NOT NULL,
    completed          BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at       TIMESTAMPTZ,
    streak_days        INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    UNIQUE(user_id, chapter_id)
);
```

#### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id      VARCHAR(50) NOT NULL,
    score           INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### search_index
```sql
CREATE TABLE search_index (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id    VARCHAR(50) UNIQUE NOT NULL,
    chapter_title VARCHAR(255) NOT NULL,
    content_text  TEXT NOT NULL,
    indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration Strategy

- Alembic autogenerate from SQLAlchemy models
- Single initial migration: `001_initial_schema.py`
- Run on startup via `alembic upgrade head` in Dockerfile CMD or startup script
- Connection: asyncpg via `DATABASE_URL` env var

### Connection Pooling (Neon)

```python
# core/database.py
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,   # handles Neon cold starts
    connect_args={"server_settings": {"jit": "off"}}  # Neon recommended
)
```

## Phase 1: API Contracts

### 1. Health Router — `routers/health.py`
**Complexity**: Low

```
GET /health
  Auth: None (public)
  Response 200: {"status": "ok", "version": "1.0.0"}
```

### 2. Auth Router — `routers/auth.py`
**Complexity**: Low

```
POST /auth/register
  Auth: None
  Body: {"email": string, "password": string}
  Response 201: {"access_token": string, "token_type": "bearer"}
  Error 409: email already registered

POST /auth/login
  Auth: None
  Body: {"email": string, "password": string}
  Response 200: {"access_token": string, "token_type": "bearer"}
  Error 401: invalid credentials
```

Token payload: `{"sub": "<uuid>", "tier": "free|premium|pro", "exp": <unix>}`

### 3. Chapters Router — `routers/chapters.py`
**Complexity**: Medium (R2 reads + freemium gate)

```
GET /chapters
  Auth: None (public)
  Response 200: [{"chapter_id": string, "title": string, "module": int, "locked": bool}]
  Note: locked=true for free users on chapters 4-5

GET /chapters/{chapter_id}
  Auth: Bearer JWT (optional — anonymous gets free chapters only)
  Freemium: check access_service before returning content
  Response 200: {"chapter_id": string, "title": string, "content": string (verbatim MD)}
  Error 403: {"detail": "Premium required", "upgrade_url": "/upgrade"}
  Error 404: chapter not found in R2

GET /chapters/{chapter_id}/next
  Auth: None
  Response 200: {"chapter_id": string, "title": string} | null

GET /chapters/{chapter_id}/previous
  Auth: None
  Response 200: {"chapter_id": string, "title": string} | null

GET /chapters/{chapter_id}/summary
  Auth: Bearer JWT
  Freemium: enforced
  Response 200: {"chapter_id": string, "key_points": [string]}
  Note: key_points are STATIC — pre-written in chapter file as a ## Summary section,
        NOT generated by LLM
```

### 4. Search Router — `routers/search.py`
**Complexity**: Low (DB ILIKE only)

```
GET /search?q={query}
  Auth: Bearer JWT
  Query param: q (string, min 2 chars)
  Response 200: [{"chapter_id": string, "title": string, "excerpt": string}]
  Note: excerpt is a 200-char window around first match in content_text
  Implementation: SELECT * FROM search_index WHERE content_text ILIKE '%{q}%'
                  OR chapter_title ILIKE '%{q}%'
```

### 5. Quiz Router — `routers/quizzes.py`
**Complexity**: Medium (R2 key fetch + rule-based grading)

```
GET /quizzes/{chapter_id}
  Auth: Bearer JWT
  Freemium: enforced
  Response 200: {"chapter_id": string, "questions": [{"id": string, "question": string,
                 "options": [string]}]}
  Note: correct_answer field STRIPPED from response

POST /quizzes/{chapter_id}/submit
  Auth: Bearer JWT
  Freemium: enforced
  Body: {"answers": {"q1": "A", "q2": "C", ...}}
  Response 200: {"score": int, "total": int, "percentage": float,
                 "results": [{"id": string, "correct": bool}]}
  Note: grade_quiz() fetches quiz-{id}.json from R2, compares answers with ==, NO LLM

GET /quizzes/{chapter_id}/answers
  Auth: Bearer JWT
  Freemium: enforced
  Prerequisite: user must have at least one attempt (check quiz_attempts table)
  Response 200: {"questions": [{"id": string, "question": string,
                  "correct_answer": string, "explanation": string|null}]}
  Error 403: no attempt found
```

### 6. Progress Router — `routers/progress.py`
**Complexity**: Medium (streak logic)

```
GET /progress/{user_id}
  Auth: Bearer JWT (user_id must match token.sub)
  Response 200: {
    "user_id": string,
    "completion_percentage": float,
    "completed_chapters": [string],
    "streak_days": int,
    "total_quizzes": int,
    "avg_quiz_score": float
  }

PUT /progress/{user_id}/chapter
  Auth: Bearer JWT (user_id must match token.sub)
  Body: {"chapter_id": string}
  Response 200: {"streak_days": int, "chapter_id": string, "completed": true}
  Logic:
    1. Upsert progress row (completed=true, completed_at=now)
    2. Compare date.today() vs last_activity_date:
       - Same day → no streak change
       - Next calendar day → streak_days += 1
       - Gap > 1 day → streak_days = 1
    3. Set last_activity_date = date.today()

PUT /progress/{user_id}/quiz
  Auth: Bearer JWT (user_id must match token.sub)
  Body: {"chapter_id": string, "score": int, "total_questions": int}
  Response 200: {"recorded": true}
  Note: Inserts into quiz_attempts; does NOT affect streak

DELETE /progress/{user_id}/reset
  Auth: Bearer JWT (user_id must match token.sub)
  Response 200: {"reset": true}
  Note: Deletes all progress and quiz_attempts rows for user
```

### 7. Access Router — `routers/access.py`
**Complexity**: Low

```
GET /access/check?chapter_id={id}
  Auth: Bearer JWT
  Response 200: {"allowed": bool, "reason": string|null, "tier": string}
  Logic: FREEMIUM_GATES = {"free": ["chapter-01","chapter-02","chapter-03"]}
         if user.tier == "free" and chapter_id not in free_chapters → allowed=false
```

## Phase 1: Key Service Implementations

### `services/r2_service.py`
**Complexity**: Low

```python
# Key implementation — NO LLM, verbatim read
import boto3
from app.core.config import settings

def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

async def get_chapter(chapter_id: str) -> str:
    """Returns verbatim markdown text from R2. No transformation."""
    obj = r2_client.get_object(Bucket=settings.R2_BUCKET_NAME,
                               Key=f"chapters/{chapter_id}.md")
    return obj["Body"].read().decode("utf-8")

async def get_quiz_key(chapter_id: str) -> dict:
    """Returns parsed quiz JSON including correct_answer fields."""
    obj = r2_client.get_object(Bucket=settings.R2_BUCKET_NAME,
                               Key=f"quizzes/quiz-{chapter_id[-2:]}.json")
    return json.loads(obj["Body"].read())
```

### `services/quiz_service.py`
**Complexity**: Low — NO LLM, rule-based only

```python
async def grade_quiz(chapter_id: str, submitted: dict[str, str]) -> QuizResult:
    """Pure rule-based grading. Fetches answer key from R2, compares with ==."""
    quiz_data = await get_quiz_key(chapter_id)
    results = []
    score = 0
    for q in quiz_data["questions"]:
        correct = submitted.get(q["id"]) == q["correct_answer"]
        if correct:
            score += 1
        results.append({"id": q["id"], "correct": correct})
    return QuizResult(score=score, total=len(quiz_data["questions"]), results=results)
```

### `services/progress_service.py`
**Complexity**: Medium — streak calendar logic

```python
from datetime import date

async def update_chapter_completion(db, user_id: UUID, chapter_id: str) -> ProgressRow:
    today = date.today()
    row = await get_or_create_progress(db, user_id, chapter_id)
    row.completed = True
    row.completed_at = datetime.utcnow()

    if row.last_activity_date is None:
        row.streak_days = 1
    elif row.last_activity_date == today:
        pass  # same day — no change
    elif (today - row.last_activity_date).days == 1:
        row.streak_days += 1  # consecutive day
    else:
        row.streak_days = 1   # gap > 1 day — reset

    row.last_activity_date = today
    await db.commit()
    return row
```

### `core/startup.py`
**Complexity**: Medium — startup indexer

```python
async def build_search_index(db, r2):
    """Called on app startup. Loads chapters from R2, upserts search_index table."""
    chapters = [
        ("chapter-01", "Introduction to AI Agents"),
        ("chapter-02", "Claude Agent SDK"),
        ("chapter-03", "Model Context Protocol (MCP)"),
        ("chapter-04", "Agent Skills (SKILL.md)"),
        ("chapter-05", "Multi-Agent Systems"),
    ]
    for chapter_id, title in chapters:
        content = await r2.get_chapter(chapter_id)
        await db.execute(
            insert(SearchIndex)
            .values(chapter_id=chapter_id, chapter_title=title,
                    content_text=content, indexed_at=datetime.utcnow())
            .on_conflict_do_update(
                index_elements=["chapter_id"],
                set_={"content_text": content, "indexed_at": datetime.utcnow()}
            )
        )
    await db.commit()
```

## Phase 1: ChatGPT App Plan

### `chatgpt-app/manifest.yaml`
**Complexity**: Low

```yaml
schema_version: v1
name_for_human: Course Companion FTE
name_for_model: course_companion
description_for_human: >
  Your 24/7 AI tutor for the AI Agent Development course. Learn Claude Agent SDK,
  MCP, Agent Skills, and Multi-Agent Systems interactively.
description_for_model: >
  You are a Course Companion FTE — a Digital Full-Time Equivalent educational tutor
  for the AI Agent Development course. You have access to backend APIs that serve
  course content, quizzes, and progress data. Use your skills to explain concepts,
  guide quizzes, tutor via Socratic method, and celebrate progress.
  IMPORTANT: Only answer questions from the course content returned by the API.
  If information is not in the content, say "That's not covered in this module."
auth:
  type: oauth
api:
  type: openapi
  url: https://course-companion.fly.dev/openapi.json
```

### System Prompt Skills Structure

The ChatGPT App system prompt references 4 SKILL.md files:

1. **concept-explainer**: Triggered by "explain", "what is", "how does"
   - Fetch chapter content via `GET /chapters/{id}`
   - Explain using content only, adjust complexity to user level
   - Provide analogies, never invent facts outside content

2. **quiz-master**: Triggered by "quiz", "test me", "practice"
   - Fetch questions via `GET /quizzes/{id}` (no answers exposed)
   - Present one question at a time, encourage on correct, explain on wrong
   - Submit answers via `POST /quizzes/{id}/submit`

3. **socratic-tutor**: Triggered by "help me think", "I'm stuck"
   - Guide with questions, never give direct answers
   - Reference content section from `GET /chapters/{id}`

4. **progress-motivator**: Triggered by "my progress", "streak", "how am I doing"
   - Fetch via `GET /progress/{user_id}`
   - Celebrate streaks, completed chapters, quiz scores
   - Suggest next chapter via navigation API

## Phase 1: Content Creation Plan

All 5 chapter files follow this structure:
```markdown
# Module N: [Title]

## Overview
[2-3 sentence intro]

## [Sub-topic 1]
[Content]

## [Sub-topic 2]
[Content]

## [Sub-topic 3]
[Content]

## Summary
- Key point 1
- Key point 2
- Key point 3
(Static key points — NOT LLM generated — served verbatim by /chapters/{id}/summary)

## Further Reading
[Optional links]
```

| File | Module | Sub-topics |
|------|--------|-----------|
| chapter-01.md | Introduction to AI Agents | What is an AI Agent, Agent vs Chatbot, Types of agents |
| chapter-02.md | Claude Agent SDK | SDK setup, First agent, Instructions and tools |
| chapter-03.md | Model Context Protocol | What is MCP, Servers and clients, Building custom tools |
| chapter-04.md | Agent Skills | What are skills, Writing SKILL.md, Triggers and workflows |
| chapter-05.md | Multi-Agent Systems | A2A protocol, Orchestration patterns, Production deployment |

Quiz files: 5 questions per chapter, 4 options each, one correct answer stored in R2.

## Phase 1: Testing Plan

### Unit Tests

**`tests/unit/test_quiz_grading.py`** — Complexity: Low
```python
@pytest.mark.parametrize("submitted,expected_score", [
    ({"q1": "A", "q2": "B", "q3": "C"}, 3),  # all correct
    ({"q1": "B", "q2": "B", "q3": "C"}, 2),  # one wrong
    ({}, 0),                                    # empty submission
    ({"q1": "A"}, 1),                           # partial submission
])
async def test_grade_quiz(submitted, expected_score, mock_r2):
    result = await grade_quiz("chapter-01", submitted)
    assert result.score == expected_score
```

**`tests/unit/test_streak_logic.py`** — Complexity: Low
```python
# same-day completion → no streak change
# next calendar day → streak += 1
# gap of 2+ days → streak resets to 1
# first ever completion → streak = 1
```

### Integration Tests

**`tests/integration/test_api_endpoints.py`** — Complexity: Medium
- Full auth flow: register → login → get token
- Chapter access: free user blocked on chapter-04, allowed on chapter-01
- Quiz flow: get questions → submit answers → get score → get answers
- Progress flow: mark chapter complete → check streak → reset
- Search: query returns matching chapters

### Load Test Plan — Complexity: Low
Tool: `locust` or manual `hey` CLI
Target: `GET /chapters/chapter-01` (R2 read — slowest path)
Goal: p95 ≤ 500ms at 100 concurrent users
Command: `hey -n 1000 -c 100 -H "Authorization: Bearer {token}" https://course-companion.fly.dev/chapters/chapter-01`

## Phase 1: Deployment Plan

### Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN alembic upgrade head
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
```

### `fly.toml`
```toml
app = "course-companion-fte"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  [[http_service.checks]]
    path = "/health"
    interval = "30s"
    timeout = "5s"

[vm]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

### Provisioning Steps

1. **Neon PostgreSQL**:
   - Create project at neon.tech (free tier)
   - Copy connection string → `DATABASE_URL=postgresql+asyncpg://...`
   - Alembic runs migrations on first deploy

2. **Cloudflare R2**:
   - Create bucket `course-companion-content`
   - Create API token with Object Read & Write
   - Upload chapter and quiz files: `aws s3 cp content/ s3://course-companion-content/chapters/ --endpoint-url https://{ACCOUNT_ID}.r2.cloudflarestorage.com`

3. **Fly.io deploy**:
   ```bash
   fly auth login
   fly launch --no-deploy
   fly secrets set DATABASE_URL=... SECRET_KEY=... R2_ACCOUNT_ID=... \
     R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=...
   fly deploy
   ```

4. **Verify**:
   - `curl https://course-companion.fly.dev/health` → `{"status":"ok"}`
   - Search index built on startup → check logs

### `.env.example`
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
SECRET_KEY=your-256-bit-secret-key-here
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=course-companion-content
```

## Complexity Summary

| Area | Complexity | Notes |
|------|-----------|-------|
| Project setup & config | Low | Standard FastAPI boilerplate |
| Database models + Alembic | Low | 4 tables, standard SQLAlchemy |
| Auth (JWT HS256) | Low | python-jose, well-documented pattern |
| Health + Access routers | Low | Minimal logic |
| Search router (ILIKE) | Low | DB query only after startup indexer |
| Chapters router (R2 reads) | Medium | boto3 + freemium gate integration |
| Quiz router (rule-based) | Medium | R2 key fetch + grading logic |
| Progress router (streak) | Medium | Calendar-day logic edge cases |
| Startup indexer | Medium | boto3 + DB upsert on lifespan |
| ChatGPT App manifest | Low | YAML + SKILL.md files |
| Chapter/quiz content | Medium | 5 chapters × structured markdown |
| Tests | Medium | Async fixtures + mock R2 |
| Deployment | Low | Standard Fly.io Docker deploy |

## Complexity Tracking

No constitution violations. All features are within the Zero-Backend-LLM constraint.
No additional projects beyond the standard backend + chatgpt-app structure.
