---
description: "Task list for Course Companion FTE Phase 1 implementation"
---

# Tasks: Course Companion FTE — Phase 1

**Input**: Design documents from `specs/main/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, contracts/openapi.yaml ✅

**Tests**: Unit and integration tests included (quiz grading and streak logic are
business-critical deterministic functions; integration tests validate Zero-LLM compliance).

**Organization**: Tasks are grouped by milestone, ordered by dependency. Each milestone
after Foundation can be independently validated.

**Zero-LLM Constraint**: Every task in Milestone 5 (Routers) has an explicit
acceptance criterion: no import of `openai`, `anthropic`, `langchain`, or any LLM SDK.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Milestone label (M1–M9)
- Include exact file paths in descriptions

---

## Phase 1: Setup — Project Foundation (Milestone 1)

**Purpose**: Initialize repo structure so all subsequent tasks have a home.

- [x] T001 Initialize backend Python project with `uv init` in `backend/`
- [x] T002 [P] Create `backend/pyproject.toml` with all dependencies (fastapi, uvicorn, sqlalchemy, alembic, asyncpg, python-jose, passlib, boto3, pydantic-settings, httpx, pytest, pytest-asyncio)
- [x] T003 [P] Create full folder skeleton: `backend/app/{routers,models,schemas,services,core}/`, `backend/tests/{unit,integration}/`, `backend/skills/`, `backend/content/`, `backend/quizzes/`, `chatgpt-app/`
- [x] T004 [P] Create `backend/.env.example` with all 6 required env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, DATABASE_URL, SECRET_KEY)
- [x] T005 [P] Create `backend/.env` (local dev values — git-ignored) and `backend/.gitignore`

**Checkpoint**: `uv run python -c "import fastapi"` succeeds from `backend/`

---

## Phase 2: Foundational — Config, Database, Security (Milestone 2)

**Purpose**: Core infrastructure that ALL routers depend on. MUST complete before any router.

**⚠️ CRITICAL**: No router task can begin until this phase is complete.

- [x] T006 Create `backend/app/core/config.py` — pydantic-settings `Settings` class loading all 6 env vars; expose singleton `settings = Settings()`
- [x] T007 Create `backend/app/core/database.py` — async SQLAlchemy engine with asyncpg, `pool_size=5`, `pool_pre_ping=True`; `AsyncSessionLocal` factory; `get_db` FastAPI dependency
- [x] T008 [P] Create `backend/app/core/security.py` — `create_access_token(sub, tier)`, `verify_token(token) -> dict`, `get_current_user(token, db)` FastAPI dependency using python-jose HS256; NO LLM imports
- [x] T009 [P] Create `backend/app/models/user.py` — SQLAlchemy `User` model (id UUID PK, email unique, hashed_password, tier enum CHECK, created_at)
- [x] T010 [P] Create `backend/app/models/progress.py` — SQLAlchemy `Progress` model (id, user_id FK, chapter_id, completed, completed_at, streak_days, last_activity_date DATE); UNIQUE(user_id, chapter_id)
- [x] T011 [P] Create `backend/app/models/quiz_attempt.py` — SQLAlchemy `QuizAttempt` model (id, user_id FK, chapter_id, score, total_questions, attempted_at)
- [x] T012 [P] Create `backend/app/models/search_index.py` — SQLAlchemy `SearchIndex` model (id, chapter_id UNIQUE, chapter_title, content_text TEXT, indexed_at)
- [x] T013 [P] Create `backend/app/models/__init__.py` exporting all 4 models
- [x] T014 Setup Alembic: `alembic init backend/alembic`; configure `env.py` to use async engine and import all models; set `target_metadata = Base.metadata`
- [x] T015 Generate initial migration: `alembic revision --autogenerate -m "initial_schema"`; verify SQL in generated file matches plan.md table definitions
- [x] T016 Run migration against Neon: `alembic upgrade head`; verify all 4 tables exist in Neon console

**Checkpoint**: `alembic current` shows `head`; `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` returns 4 tables.

---

## Phase 3: Cloudflare R2 + Startup Indexer (Milestone 3)

**Purpose**: R2 client and search index builder — required before Chapters and Search routers.

- [x] T017 Create `backend/app/core/r2_client.py` — boto3 S3 client pointed at `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`; `get_chapter(chapter_id) -> str` returns verbatim UTF-8 text; `get_quiz_key(chapter_id) -> dict` returns parsed JSON; NO content transformation
- [x] T018 Create `backend/app/core/startup.py` — `build_search_index(db, r2)` async function: reads all 5 chapters from R2, upserts rows into `search_index` table with `ON CONFLICT(chapter_id) DO UPDATE`
- [x] T019 Create `backend/app/main.py` — FastAPI app with `lifespan` context manager calling `build_search_index` on startup; register all routers (stubs for now); add request logging middleware (method, path, status, duration_ms)

**Checkpoint**: `GET /health` returns 200; startup logs show "Search index built: 5 chapters indexed".

---

## Phase 4: Content Files (Milestone 4)

**Purpose**: Course content and quiz answer keys — required before Chapters and Quizzes routers.
All tasks in this milestone are parallel (different files).

- [x] T020 [P] Write `backend/content/chapter-01.md` — Module 1: Introduction to AI Agents (## What is an AI Agent, ## Agent vs Chatbot, ## Types of Agents, ## Summary with 3 static key points)
- [x] T021 [P] Write `backend/content/chapter-02.md` — Module 2: Claude Agent SDK (## SDK Setup, ## Creating Your First Agent, ## Agent Instructions and Tools, ## Summary)
- [x] T022 [P] Write `backend/content/chapter-03.md` — Module 3: Model Context Protocol (## What is MCP, ## MCP Servers and Clients, ## Building Custom MCP Tools, ## Summary)
- [x] T023 [P] Write `backend/content/chapter-04.md` — Module 4: Agent Skills (## What Are Agent Skills, ## Writing Effective SKILL.md Files, ## Skill Triggers and Workflows, ## Summary)
- [x] T024 [P] Write `backend/content/chapter-05.md` — Module 5: Multi-Agent Systems (## Agent-to-Agent Protocol, ## Orchestration Patterns, ## Production Deployment, ## Summary)
- [x] T025 [P] Write `backend/quizzes/quiz-01.json` — 5 questions for Module 1 with options A-D and correct_answer field; covers chapter-01 content
- [x] T026 [P] Write `backend/quizzes/quiz-02.json` — 5 questions for Module 2; covers chapter-02 content
- [x] T027 [P] Write `backend/quizzes/quiz-03.json` — 5 questions for Module 3; covers chapter-03 content
- [x] T028 [P] Write `backend/quizzes/quiz-04.json` — 5 questions for Module 4; covers chapter-04 content
- [x] T029 [P] Write `backend/quizzes/quiz-05.json` — 5 questions for Module 5; covers chapter-05 content
- [x] T030 Write `backend/scripts/upload_to_r2.py` — script to upload all content/ and quizzes/ files to R2 bucket using boto3; run once to populate bucket
- [x] T031 Run `python backend/scripts/upload_to_r2.py`; verify all 10 files appear in R2 bucket (5 chapters + 5 quizzes)

**Checkpoint**: `python -c "from app.core.r2_client import get_chapter; import asyncio; print(asyncio.run(get_chapter('chapter-01'))[:100])"` prints chapter content.

---

## Phase 5: Auth Router (Milestone 5a)

**Purpose**: JWT auth endpoints — required before any protected router can be tested.

- [x] T032 Create `backend/app/schemas/auth.py` — Pydantic `RegisterRequest(email, password)`, `LoginRequest(email, password)`, `TokenResponse(access_token, token_type)`
- [x] T033 Create `backend/app/services/auth_service.py` — `register_user(db, email, password)` hashes password with passlib bcrypt, inserts User row, returns JWT; `login_user(db, email, password)` verifies hash, returns JWT; raises HTTPException on conflict/invalid creds; NO LLM imports
- [x] T034 Create `backend/app/routers/auth.py` — `POST /auth/register` (201 + token), `POST /auth/login` (200 + token); import from auth_service only; NO LLM imports
- [x] T035 Register auth router in `backend/app/main.py`

**Checkpoint**: `POST /auth/register` returns JWT; `POST /auth/login` with same creds returns JWT; `POST /auth/login` with wrong password returns 401.

---

## Phase 6: Access + Freemium Service (Milestone 5b)

**Purpose**: Freemium gate — required before Chapters and Quizzes routers.

- [x] T036 Create `backend/app/schemas/access.py` — Pydantic `AccessCheckResponse(allowed: bool, reason: str | None, tier: str)`
- [x] T037 Create `backend/app/services/access_service.py` — `FREEMIUM_GATES = {"free": ["chapter-01","chapter-02","chapter-03"]}`; `check_access(user_tier, chapter_id) -> bool`; `get_access_reason(user_tier, chapter_id) -> str | None`; pure function, no DB, no LLM
- [x] T038 Create `backend/app/routers/access.py` — `GET /access/check?chapter_id={id}` extracts user from JWT, calls access_service, returns AccessCheckResponse; NO LLM imports
- [x] T039 Register access router in `backend/app/main.py`

**Checkpoint**: Free user token + chapter-04 → `{"allowed": false, "reason": "Premium required", "tier": "free"}`; free user + chapter-01 → `{"allowed": true}`.

---

## Phase 7: Health + Chapters Router (Milestone 5c)

**Purpose**: Core content delivery — the primary user-facing feature.

- [x] T040 Create `backend/app/routers/health.py` — `GET /health` returns `{"status": "ok", "version": "1.0.0"}`; no auth, no DB; NO LLM imports
- [x] T041 Create `backend/app/schemas/chapter.py` — Pydantic `ChapterMeta(chapter_id, title, module, locked)`, `ChapterContent(chapter_id, title, content)`, `ChapterNav(chapter_id, title)`, `ChapterSummary(chapter_id, key_points)`
- [x] T042 Create `backend/app/services/r2_service.py` — `CHAPTER_METADATA` static list of 5 chapters; `get_chapter_content(chapter_id) -> ChapterContent` calls r2_client verbatim; `get_chapter_summary(chapter_id, content) -> list[str]` extracts `## Summary` section lines; NO LLM, NO summarization
- [x] T043 Create `backend/app/routers/chapters.py`:
  - `GET /chapters` — public, returns CHAPTER_METADATA list with locked=true for free users on ch-04/05
  - `GET /chapters/{chapter_id}` — calls check_access, fetches from R2 verbatim, returns ChapterContent
  - `GET /chapters/{chapter_id}/next` — static lookup from CHAPTER_METADATA order
  - `GET /chapters/{chapter_id}/previous` — static lookup
  - `GET /chapters/{chapter_id}/summary` — check_access, fetch R2, extract ## Summary section only
  - NO LLM imports anywhere
- [x] T044 Register health and chapters routers in `backend/app/main.py`

**Checkpoint**: `GET /chapters/chapter-01` with free user JWT returns markdown content; `GET /chapters/chapter-04` with free user JWT returns 403 with `"Premium required"`; `GET /chapters/chapter-01/next` returns `{"chapter_id": "chapter-02", "title": "Claude Agent SDK"}`.

---

## Phase 8: Search Router (Milestone 5d)

**Purpose**: Keyword search against pre-built DB index.

- [x] T045 Create `backend/app/services/search_service.py` — `keyword_search(db, query: str) -> list[dict]` executes `SELECT * FROM search_index WHERE content_text ILIKE :q OR chapter_title ILIKE :q`; extracts 200-char excerpt window around first match; NO LLM, NO embeddings
- [x] T046 Create `backend/app/routers/search.py` — `GET /search?q={query}` requires JWT, validates q minLength=2, calls search_service, returns list of SearchResult; NO LLM imports
- [x] T047 Register search router in `backend/app/main.py`

**Checkpoint**: After startup index built, `GET /search?q=agent` returns ≥1 result with chapter_id and excerpt; `GET /search?q=x` (1 char) returns 422.

---

## Phase 9: Quiz Router (Milestone 5e)

**Purpose**: Rule-based quiz fetch and grading — NO LLM.

- [x] T048 Create `backend/app/schemas/quiz.py` — Pydantic `QuizQuestion(id, question, options)`, `QuizQuestionsResponse(chapter_id, questions)`, `QuizSubmitRequest(answers: dict[str,str])`, `QuizResultItem(id, correct)`, `QuizResult(score, total, percentage, results)`, `QuizAnswerItem(id, question, correct_answer, explanation)`, `QuizAnswersResponse`
- [x] T049 Create `backend/app/services/quiz_service.py`:
  - `get_quiz_questions(chapter_id) -> QuizQuestionsResponse` — fetches R2 JSON, strips `correct_answer` from response
  - `grade_quiz(chapter_id, submitted: dict) -> QuizResult` — fetches R2 JSON answer key, compares with `==` only, counts correct; NO LLM, NO heuristic scoring
  - `get_quiz_answers(chapter_id) -> QuizAnswersResponse` — fetches R2 JSON, returns full data including correct_answer
- [x] T050 Create `backend/app/routers/quizzes.py`:
  - `GET /quizzes/{chapter_id}` — check_access, return questions without answers
  - `POST /quizzes/{chapter_id}/submit` — check_access, grade_quiz, insert QuizAttempt row, return QuizResult
  - `GET /quizzes/{chapter_id}/answers` — check_access, verify ≥1 attempt exists else 403, return answers
  - NO LLM imports
- [x] T051 Register quizzes router in `backend/app/main.py`

**Checkpoint**: `POST /quizzes/chapter-01/submit` with all correct answers returns `{"score": 5, "total": 5, "percentage": 100.0}`; with all wrong answers returns score=0; answers endpoint returns 403 before any attempt, correct answers after attempt.

---

## Phase 10: Progress Router (Milestone 5f)

**Purpose**: Streak tracking and completion progress — deterministic calendar logic only.

- [x] T052 Create `backend/app/schemas/progress.py` — Pydantic `ProgressResponse`, `ChapterCompleteRequest(chapter_id)`, `ChapterCompleteResponse(streak_days, chapter_id, completed)`, `QuizScoreRequest(chapter_id, score, total_questions)`
- [x] T053 Create `backend/app/services/progress_service.py`:
  - `get_progress(db, user_id) -> ProgressResponse` — queries progress + quiz_attempts tables, computes completion_percentage and avg_quiz_score
  - `complete_chapter(db, user_id, chapter_id) -> ChapterCompleteResponse` — upserts progress row; streak logic: same calendar day = no change, next day = +1, gap >1 day = reset to 1; sets last_activity_date = today
  - `record_quiz_score(db, user_id, chapter_id, score, total)` — inserts QuizAttempt row
  - `reset_progress(db, user_id)` — deletes all progress + quiz_attempts rows for user
  - NO LLM imports
- [x] T054 Create `backend/app/routers/progress.py`:
  - `GET /progress/{user_id}` — verify token.sub == user_id else 403
  - `PUT /progress/{user_id}/chapter` — verify token.sub == user_id, call complete_chapter
  - `PUT /progress/{user_id}/quiz` — verify token.sub == user_id, call record_quiz_score
  - `DELETE /progress/{user_id}/reset` — verify token.sub == user_id, call reset_progress
  - NO LLM imports
- [x] T055 Register progress router in `backend/app/main.py`

**Checkpoint**: Complete chapter-01 on day 1 → streak=1; complete chapter-02 next day → streak=2; skip 2 days, complete chapter-03 → streak=1 (reset); `GET /progress/{user_id}` shows 3 completed chapters, correct avg_score, streak=1.

---

## Phase 11: Agent Skills (Milestone 6)

**Purpose**: SKILL.md files that define the ChatGPT App's tutoring behaviors. All parallel.

- [x] T056 [P] Write `backend/skills/concept-explainer.md` — Metadata (name, triggers: "explain", "what is", "how does"), Purpose, Workflow (fetch chapter via GET /chapters/{id}, explain using content only, adjust complexity, no invented facts), Response Templates, Key Principles (grounded in content, no hallucination)
- [x] T057 [P] Write `backend/skills/quiz-master.md` — Metadata (triggers: "quiz", "test me", "practice"), Purpose, Workflow (GET /quizzes/{id} → present questions one-by-one → POST submit → celebrate or explain wrong answers), Response Templates, Key Principles
- [x] T058 [P] Write `backend/skills/socratic-tutor.md` — Metadata (triggers: "help me think", "I'm stuck"), Purpose, Workflow (guide with questions referencing chapter content, never give direct answers), Response Templates, Key Principles
- [x] T059 [P] Write `backend/skills/progress-motivator.md` — Metadata (triggers: "my progress", "streak", "how am I doing"), Purpose, Workflow (GET /progress/{user_id} → celebrate streaks/completions → suggest next chapter via GET /chapters/{id}/next), Response Templates, Key Principles

**Checkpoint**: Each SKILL.md has all 5 required sections (Metadata, Purpose, Workflow, Response Templates, Key Principles); trigger keywords present; no LLM instructions in workflow (ChatGPT handles LLM behavior from these specs).

---

## Phase 12: ChatGPT App (Milestone 7)

**Purpose**: ChatGPT App manifest and system prompt wiring all skills and API actions.

- [x] T060 Write `chatgpt-app/openapi.yaml` — copy of `specs/main/contracts/openapi.yaml` with production server URL; verify all 19 endpoints present
- [x] T061 Write `chatgpt-app/manifest.yaml` — OpenAI App manifest with: name, description_for_model (references all 4 SKILL.md behaviors), auth config, API url pointing to openapi.yaml; system prompt instructs ChatGPT to only answer from content returned by API, say "not covered" for out-of-scope questions
- [x] T062 Write `chatgpt-app/system-prompt.md` — Full system prompt text incorporating all 4 skill workflows; includes grounding instruction: "Answer only using content from GET /chapters/{chapter_id}. If question is not in retrieved content, respond: 'That topic isn't covered in this module.'"

**Checkpoint**: Manifest YAML is valid YAML with all required OpenAI App fields; system prompt references all 4 skills by name; all 19 API actions present in openapi.yaml.

---

## Phase 13: Tests (Milestone 8)

**Purpose**: Unit tests for business-critical deterministic logic; integration tests for API flows.

- [x] T063 Write `backend/tests/conftest.py` — async test engine (SQLite in-memory for unit tests), `async_client` fixture using httpx AsyncClient + test app, `auth_headers` fixture (register + login → headers), mock R2 fixture returning test chapter/quiz content
- [x] T064 [P] Write `backend/tests/unit/test_quiz_grading.py` — parametrized tests:
  - all correct answers → score == total
  - all wrong answers → score == 0
  - empty submission → score == 0
  - partial submission → score == correct count
  - extra keys in submission → ignored
  - Verify: no LLM import in quiz_service.py (grep check in test)
- [x] T065 [P] Write `backend/tests/unit/test_streak_logic.py` — tests for complete_chapter():
  - first completion → streak_days == 1
  - same calendar day second completion → streak_days unchanged
  - next calendar day completion → streak_days += 1
  - gap of 2 days → streak_days resets to 1
  - gap of 10 days → streak_days resets to 1
- [x] T066 Write `backend/tests/integration/test_api_endpoints.py` — full flow tests:
  - Auth: register → duplicate email 409 → login → wrong password 401
  - Access: free user chapter-01 allowed, chapter-04 blocked (403)
  - Chapters: list all → get chapter-01 content verbatim → next/previous nav
  - Search: startup index present → query returns results → short query 422
  - Quizzes: get questions (no answers) → submit all correct → get answers (after attempt) → answers before attempt 403
  - Progress: complete chapter → check streak → complete next day → streak increments → reset
- [x] T067 Run full test suite: `cd backend && uv run pytest tests/ -v`; all tests pass

**Checkpoint**: `pytest tests/ -v` shows all green; zero failures; quiz grading test file includes assertion that `quiz_service.py` has no LLM imports.

---

## Phase 14: Deployment (Milestone 9)

**Purpose**: Production-ready deployment configuration. All file tasks are parallel.

- [x] T068 [P] Write `backend/Dockerfile` — `FROM python:3.11-slim`; install uv; copy requirements; `RUN alembic upgrade head`; `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]`
- [x] T069 [P] Write `backend/fly.toml` — app name `course-companion-fte`, region `iad`, port 8080, health check on `GET /health` every 30s, VM 256MB shared CPU
- [x] T070 [P] Write `backend/requirements.txt` — pinned versions matching research.md dependency list
- [x] T071 Write `backend/README.md` — deployment steps: (1) Neon DB setup + connection string, (2) R2 bucket creation + upload script, (3) `fly secrets set ...` for all 6 env vars, (4) `fly deploy`, (5) verify `/health`, (6) load test command with `hey`

**Checkpoint**: `docker build -t course-companion .` succeeds from `backend/`; `fly.toml` has valid TOML syntax; README has all 6 provisioning steps.

---

## Phase 15: Polish & Cross-Cutting (Final)

- [x] T072 [P] Add structured request logging middleware to `backend/app/main.py` — logs method, path, status_code, duration_ms as JSON on every request
- [x] T073 [P] Audit all backend Python files: `grep -r "openai\|anthropic\|langchain\|llama" backend/app/` must return zero results — document result in PR description
- [x] T074 [P] Add `backend/app/core/exceptions.py` — custom HTTPExceptions for common errors (FreemiumGateException, ChapterNotFoundException, InvalidTokenException) with consistent error response format
- [x] T075 Run load test: `hey -n 500 -c 50 -H "Authorization: Bearer {token}" http://localhost:8080/chapters/chapter-01`; verify p95 ≤ 500ms in output
- [x] T076 Verify `GET /progress/{user_id}` p95 ≤ 200ms: `hey -n 500 -c 50 -H "Authorization: Bearer {token}" http://localhost:8080/progress/{user_id}`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational: Config + DB + Security) ← BLOCKS ALL
        ├── Phase 3 (R2 + Startup)
        │     └── Phase 4 (Content Files) → can run IN PARALLEL with Phase 3
        ├── Phase 5a (Auth Router)
        │     ├── Phase 5b (Access + Freemium)
        │     │     ├── Phase 5c (Health + Chapters) ← needs Phase 3 + 4 + 5b
        │     │     ├── Phase 5d (Search) ← needs Phase 3 + 4 + 5b
        │     │     ├── Phase 5e (Quizzes) ← needs Phase 3 + 4 + 5b
        │     │     └── Phase 5f (Progress) ← needs Phase 5b
        │     └── Phase 6 (Skills) ← independent after Phase 1
        └── Phase 7 (ChatGPT App) ← needs Phase 6
Phase 8 (Tests) ← needs all Phase 5a-5f
Phase 9 (Deploy) ← can run in parallel with Phase 8
Phase 15 (Polish) ← final
```

### Critical Path (Sequential — minimum to get /chapters working)

T001 → T006 → T007 → T009-T013 → T014 → T015 → T016 → T017 → T018 → T019 → T031 → T033 → T034 → T037 → T038 → T042 → T043

### Parallel Opportunities

Within Phase 2 (after T007 DB ready):
```
T008 (security.py)     # parallel
T009 (user model)      # parallel
T010 (progress model)  # parallel
T011 (quiz_attempt)    # parallel
T012 (search_index)    # parallel
```

Within Phase 4 (all content files):
```
T020 chapter-01  T021 chapter-02  T022 chapter-03  T023 chapter-04  T024 chapter-05
T025 quiz-01     T026 quiz-02     T027 quiz-03     T028 quiz-04     T029 quiz-05
```

Within Phase 5 routers (after Phase 5b complete):
```
Phase 5c (Chapters)  Phase 5d (Search)  Phase 5e (Quizzes)  Phase 5f (Progress)
```

Within Phase 11 (all SKILL.md files):
```
T056 concept-explainer  T057 quiz-master  T058 socratic-tutor  T059 progress-motivator
```

---

## Implementation Strategy

### MVP First (Phases 1–7 only, ~2/3 of tasks)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: R2 + Startup Indexer
4. Complete Phase 4: Content Files (parallel with Phase 3)
5. Complete Phase 5a: Auth Router
6. Complete Phase 5b: Access + Freemium
7. Complete Phase 5c: Health + Chapters Router
8. **STOP and VALIDATE**: Free user gets chapters 1-3, blocked on 4-5. Content verbatim. Zero LLM.
9. Complete Phase 5d–5f: Search, Quiz, Progress routers
10. Complete Phase 6: Skills
11. Complete Phase 7: ChatGPT App Manifest
12. **DEMO READY**: Full Phase 1 functional

### After MVP: Tests + Deploy

13. Complete Phase 8: Tests (validate latency targets)
14. Complete Phase 9: Deploy to Fly.io
15. Complete Phase 15: Polish + LLM audit

---

## Notes

- [P] tasks = different files, no intra-phase dependencies — safe to run in parallel
- Every router task has explicit acceptance criterion that includes Zero-LLM validation
- T073 (LLM grep audit) is a hard gate before demo — must return zero results
- Streak logic in T053/T065 is the most edge-case-rich logic — test first
- Startup indexer (T018) must complete before any search query can succeed
- Content files (T020-T029) can be seeded with substantive educational content — quality matters for ChatGPT App grounding
