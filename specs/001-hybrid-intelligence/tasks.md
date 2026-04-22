# Tasks: Course Companion FTE — Phase 2 (Hybrid Intelligence)

**Branch**: `001-hybrid-intelligence` | **Date**: 2026-04-17
**Input**: `specs/001-hybrid-intelligence/plan.md`, `spec.md`, `data-model.md`, `contracts/openapi-premium.yaml`
**Prerequisites**: Phase 1 fully deployed and all 76 Phase 1 tasks complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: LLM-Graded Assessment (P1)
- **[US2]**: Cross-Chapter Synthesis (P2)
- **[US3]**: Usage Dashboard (P3)

## Strict Rules

- Every LLM call **MUST** be marked with `# HYBRID — LLM CALL` comment
- Phase 1 files are **READ-ONLY** (only `backend/app/main.py` and `backend/app/core/config.py` are touch-permitted for registration and env vars)
- All tests **MUST** mock the Anthropic SDK — never call the real API in tests
- New `anthropic` SDK imported only inside `backend/app/premium/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `app/premium/` directory skeleton and wire up config. Blocks all milestones.

- [x] T001 Install `anthropic>=0.40.0` dependency: run `uv add "anthropic>=0.40.0"` in `backend/` and confirm `pyproject.toml` + `uv.lock` updated
- [x] T002 Add 4 new optional settings to `backend/app/core/config.py`: `ANTHROPIC_API_KEY: Optional[str] = None`, `LLM_MODEL: str = "claude-sonnet-4-20250514"`, `MAX_TOKENS_ASSESSMENT: int = 1000`, `MAX_TOKENS_SYNTHESIS: int = 3000`
- [x] T003 Add matching entries to `backend/.env.example`: `ANTHROPIC_API_KEY=sk-ant-your-key-here`, `LLM_MODEL=claude-sonnet-4-20250514`, `MAX_TOKENS_ASSESSMENT=1000`, `MAX_TOKENS_SYNTHESIS=3000`
- [x] T004 [P] Create `backend/app/premium/__init__.py` — exports `require_pro` FastAPI dependency that checks `current_user.tier == "pro"` and raises HTTP 403 `"This feature requires Pro plan. Upgrade at /pricing"` if not
- [x] T005 [P] Create `backend/app/premium/routers/__init__.py` (empty)
- [x] T006 [P] Create `backend/app/premium/services/__init__.py` (empty)
- [x] T007 [P] Create `backend/app/premium/schemas/__init__.py` (empty)
- [x] T008 [P] Create `backend/app/premium/prompts/` directory (place `.gitkeep` if needed)

**Checkpoint**: `backend/app/premium/` skeleton exists; `settings.ANTHROPIC_API_KEY` resolves; `require_pro` importable.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB model + migration + cost tracker. MUST complete before any user story implementation.

**⚠️ CRITICAL**: No LLM endpoint work can begin until this phase is complete.

- [x] T009 Create `backend/app/models/llm_usage.py` — SQLAlchemy 2.0 async `LlmUsage` model with fields: `id UUID PK`, `user_id UUID FK→users.id ON DELETE CASCADE NOT NULL`, `feature VARCHAR(20) NOT NULL CHECK IN ('assessment','synthesis')`, `tokens_used INTEGER NOT NULL`, `cost_usd FLOAT NOT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`; add `idx_llm_usage_user_date` index on `(user_id, created_at)`
- [x] T010 Export `LlmUsage` from `backend/app/models/__init__.py` by appending `from app.models.llm_usage import LlmUsage` (this is the only permitted edit to Phase 1 models package)
- [x] T011 Create Alembic migration `backend/alembic/versions/<hash>_add_llm_usage_table.py` — `upgrade()` creates `llm_usage` table and `idx_llm_usage_user_date` index; `downgrade()` drops both. Migration appended to existing Phase 1 chain (do not modify existing migrations).
- [x] T012 Create `backend/app/premium/services/cost_tracker.py` with: `SONNET_INPUT_COST = 3.00 / 1_000_000`, `SONNET_OUTPUT_COST = 15.00 / 1_000_000`, `calculate_cost(usage) -> float` (rounds to 6 decimals), `async log_usage(db, user_id, feature, usage)` inserts `LlmUsage` row, `async check_rate_limit(db, user_id)` counts today's rows and raises HTTP 429 `"Daily limit of 10 LLM calls reached. Resets at midnight UTC."` if count >= 10

**Checkpoint**: `uv run alembic upgrade head` succeeds; `llm_usage` table exists; `cost_tracker.py` importable; `calculate_cost` returns correct values for known inputs.

---

## Phase 3: User Story 1 — LLM-Graded Assessment (Priority: P1) 🎯 MVP

**Goal**: `POST /premium/assess-answer` — evaluates free-text student answers with Claude Sonnet, returns score + detailed feedback.

**Independent Test**: Pro user POSTs a valid answer → 200 with `score`, `feedback`, `strengths`, `improvements`, `suggested_reading`. Free user → 403. Short answer → 422. Invalid chapter → 404. Usage logged to `llm_usage`.

### Tests for User Story 1 ⚠️ Write FIRST — must FAIL before implementation

- [x] T013 [P] [US1] Write `backend/tests/unit/test_cost_calculator.py` — 4 unit tests: zero tokens → 0.0; typical assessment (500 input + 300 output) → correct USD; typical synthesis (1000 input + 2000 output) → correct USD; rounding to 6 decimal places. **No Anthropic SDK needed.**
- [x] T014 [P] [US1] Write `backend/tests/unit/test_prompt_builder.py` — 3 unit tests: assessment prompt contains chapter content; assessment prompt contains question text; prompt uses `<chapter_content>` XML wrapper. Reads prompt file from `backend/app/premium/prompts/assessment_prompt.md`. **No Anthropic SDK needed.**
- [x] T015 [P] [US1] Write assessment integration tests in `backend/tests/integration/test_premium_endpoints.py` — 5 tests using `pytest-asyncio` + `AsyncClient`; mock `anthropic.Anthropic` via `unittest.mock.patch` in conftest fixture returning pre-built `MagicMock` with `.content[0].input` dict and `.usage` object: `test_assess_pro_user` (200 + all fields), `test_assess_free_user` (403), `test_assess_short_answer` (422), `test_assess_invalid_chapter` (404), `test_assess_logs_usage` (asserts `llm_usage` row inserted)

### Implementation for User Story 1

- [x] T016 [US1] Write `backend/app/premium/prompts/assessment_prompt.md` — system prompt instructing Claude to evaluate the student's answer against the chapter content only; uses `{chapter_id}` and `{chapter_content}` placeholders; instructs use of `submit_assessment` tool; tone: constructive educator
- [x] T017 [P] [US1] Create `backend/app/premium/schemas/assessment.py` — Pydantic v2 models: `AssessmentRequest` (chapter_id str, question str, student_answer str min_length=10 max_length=2000, user_id UUID), `AssessmentResponse` (score int 0–100, max_score int=100, feedback str, strengths list[str], improvements list[str], suggested_reading str)
- [x] T018 [US1] Create `backend/app/premium/services/assessment_service.py`:
  - `ASSESSMENT_TOOL_SCHEMA` dict: name=`submit_assessment`, input_schema matching AssessmentResponse fields
  - `async assess_answer(db, chapter_id, question, student_answer, user_id) -> AssessmentResponse`:
    1. Call `check_rate_limit(db, user_id)`
    2. Fetch chapter content from Supabase Storage (reuse Phase 1 `supabase_client.storage.from_("chapters").download(...)`)
    3. Load `assessment_prompt.md` and format with `chapter_id`, `chapter_content`
    4. `# HYBRID — LLM CALL` — `client.messages.create(model=settings.LLM_MODEL, max_tokens=settings.MAX_TOKENS_ASSESSMENT, system=prompt, tools=[ASSESSMENT_TOOL_SCHEMA], tool_choice={"type":"tool","name":"submit_assessment"}, messages=[{"role":"user","content":f"Question: {question}\n\nAnswer: {student_answer[:2000]}"}])`
    5. Extract `response.content[0].input`
    6. `await log_usage(db, user_id, "assessment", response.usage)`
    7. Return `AssessmentResponse(**result)`
  - Wrap Anthropic errors in HTTP 503; wrap parse errors in HTTP 502
- [x] T019 [US1] Create `backend/app/premium/routers/assessment.py` — `APIRouter`; `POST /assess-answer`; depends on `require_pro` + `get_db` + `get_current_user`; calls `assess_answer` service; returns `AssessmentResponse`; raises 404 for unknown chapter
- [x] T020 [US1] Register assessment router in `backend/app/main.py` inside `if settings.ANTHROPIC_API_KEY:` guard block: `from app.premium.routers import assessment; app.include_router(assessment.router, prefix="/premium", tags=["premium"])`; add `logger.info("Premium routes registered")` after all registrations
- [x] T021 [US1] Verify tests T013–T015 now PASS: `uv run pytest tests/unit/test_cost_calculator.py tests/unit/test_prompt_builder.py tests/integration/test_premium_endpoints.py::test_assess_pro_user tests/integration/test_premium_endpoints.py::test_assess_free_user tests/integration/test_premium_endpoints.py::test_assess_short_answer tests/integration/test_premium_endpoints.py::test_assess_invalid_chapter tests/integration/test_premium_endpoints.py::test_assess_logs_usage -v`

**Checkpoint**: All 5 assessment integration tests + all unit tests PASS. `POST /premium/assess-answer` functional end-to-end with mocked LLM.

---

## Phase 4: User Story 2 — Cross-Chapter Synthesis (Priority: P2)

**Goal**: `POST /premium/synthesize` — connects concepts across 2–5 chapters with narrative synthesis, knowledge graph, and key connections.

**Independent Test**: Pro user POSTs 3 valid chapter_ids → 200 with `synthesis`, `key_connections`, `knowledge_graph`, `recommended_next`. Free user → 403. Single chapter → 422. Six chapters → 422. Usage logged.

### Tests for User Story 2 ⚠️ Write FIRST — must FAIL before implementation

- [x] T022 [P] [US2] Write synthesis unit tests in `backend/tests/unit/test_prompt_builder.py` — append 3 tests: synthesis prompt contains all chapter contents; synthesis prompt contains focus topic; synthesis prompt uses default focus topic when omitted
- [x] T023 [P] [US2] Append synthesis integration tests to `backend/tests/integration/test_premium_endpoints.py` — 5 tests: `test_synthesize_pro_user` (200 + all fields), `test_synthesize_free_user` (403), `test_synthesize_too_few_chapters` (422), `test_synthesize_too_many_chapters` (422), `test_synthesize_logs_usage` (asserts row inserted). Mock same `anthropic.Anthropic` fixture.

### Implementation for User Story 2

- [x] T024 [US2] Write `backend/app/premium/prompts/synthesis_prompt.md` — system prompt instructing Claude to connect concepts across chapters; uses `{focus_topic}` and `{chapters_content}` (multi-chapter XML blocks `<chapter id="{chapter_id}">{content}</chapter>`); instructs use of `submit_synthesis` tool; requires `[chapter-XX]` citation in every key connection
- [x] T025 [P] [US2] Create `backend/app/premium/schemas/synthesis.py` — Pydantic v2 models: `SynthesisRequest` (chapter_ids list[str] min_length=2 max_length=5, focus_topic str = "General synthesis across selected chapters", user_id UUID), `GraphEdge` (from_ str aliased "from", to str, relationship str), `SynthesisResponse` (synthesis str, key_connections list[str], knowledge_graph list[GraphEdge], recommended_next str)
- [x] T026 [US2] Create `backend/app/premium/services/synthesis_service.py`:
  - `SYNTHESIS_TOOL_SCHEMA` dict: name=`submit_synthesis`, input_schema matching SynthesisResponse fields
  - `async synthesize_chapters(db, chapter_ids, focus_topic, user_id) -> SynthesisResponse`:
    1. Validate each `chapter_id` against `CHAPTER_METADATA` allowlist; raise 404 on first unknown
    2. Call `check_rate_limit(db, user_id)`
    3. Fetch content for each chapter from Supabase Storage; build multi-chapter XML block
    4. Load `synthesis_prompt.md` and format with `focus_topic`, `chapters_content`
    5. `# HYBRID — LLM CALL` — `client.messages.create(model=settings.LLM_MODEL, max_tokens=settings.MAX_TOKENS_SYNTHESIS, system=prompt, tools=[SYNTHESIS_TOOL_SCHEMA], tool_choice={"type":"tool","name":"submit_synthesis"}, messages=[{"role":"user","content":f"Synthesize these chapters focusing on: {focus_topic}"}])`
    6. Extract `response.content[0].input`
    7. `await log_usage(db, user_id, "synthesis", response.usage)`
    8. Return `SynthesisResponse(**result)`
  - Wrap Anthropic errors in HTTP 503; parse errors in HTTP 502
- [x] T027 [US2] Create `backend/app/premium/routers/synthesis.py` — `APIRouter`; `POST /synthesize`; depends on `require_pro` + `get_db` + `get_current_user`; calls `synthesize_chapters` service; returns `SynthesisResponse`
- [x] T028 [US2] Register synthesis router in `backend/app/main.py` inside existing `if settings.ANTHROPIC_API_KEY:` guard block: `from app.premium.routers import synthesis; app.include_router(synthesis.router, prefix="/premium", tags=["premium"])`
- [x] T029 [US2] Verify tests T022–T023 now PASS: `uv run pytest tests/unit/test_prompt_builder.py tests/integration/test_premium_endpoints.py::test_synthesize_pro_user tests/integration/test_premium_endpoints.py::test_synthesize_free_user tests/integration/test_premium_endpoints.py::test_synthesize_too_few_chapters tests/integration/test_premium_endpoints.py::test_synthesize_too_many_chapters tests/integration/test_premium_endpoints.py::test_synthesize_logs_usage -v`

**Checkpoint**: All 5 synthesis integration tests PASS. `POST /premium/synthesize` functional with mocked LLM.

---

## Phase 5: User Story 3 — Usage Dashboard (Priority: P3)

**Goal**: `GET /premium/usage/{user_id}` — returns all LLM usage records for a user with running total cost.

**Independent Test**: Pro user fetches their own usage → 200 with `user_id`, `records[]`, `total_cost`. User fetching another user's usage → 403.

### Tests for User Story 3 ⚠️ Write FIRST — must FAIL before implementation

- [x] T030 [P] [US3] Append usage integration tests to `backend/tests/integration/test_premium_endpoints.py` — 3 tests: `test_usage_dashboard_own_records` (200 + list + total_cost), `test_usage_dashboard_other_user` (403), `test_rate_limit_exceeded` (429 after 10 usage rows seeded)

### Implementation for User Story 3

- [x] T031 [P] [US3] Create `backend/app/premium/schemas/usage.py` — Pydantic v2 models: `LlmUsageRecord` (id UUID, feature str, tokens_used int, cost_usd float, created_at datetime), `UsageResponse` (user_id UUID, records list[LlmUsageRecord], total_cost float)
- [x] T032 [US3] Create `backend/app/premium/routers/usage.py` — `APIRouter`; `GET /usage/{user_id}`; depends on `get_db` + `get_current_user`; verifies `current_user.id == user_id` else raise HTTP 403 `"You can only view your own usage"`; queries `LlmUsage` filtered by `user_id` ordered by `created_at DESC`; calculates `total_cost = sum(r.cost_usd for r in records)`; returns `UsageResponse`
- [x] T033 [US3] Register usage router in `backend/app/main.py` inside existing `if settings.ANTHROPIC_API_KEY:` guard block: `from app.premium.routers import usage; app.include_router(usage.router, prefix="/premium", tags=["premium"])`
- [x] T034 [US3] Verify tests T030 now PASS: `uv run pytest tests/integration/test_premium_endpoints.py::test_usage_dashboard_own_records tests/integration/test_premium_endpoints.py::test_usage_dashboard_other_user tests/integration/test_premium_endpoints.py::test_rate_limit_exceeded -v`

**Checkpoint**: All 3 usage tests PASS. `GET /premium/usage/{user_id}` functional.

---

## Phase 6: Polish & Deployment

**Purpose**: Full test suite confirmation, Fly.io secrets, and live verification.

- [x] T035 [P] Run full Phase 2 test suite: `uv run pytest tests/unit/test_cost_calculator.py tests/unit/test_prompt_builder.py tests/integration/test_premium_endpoints.py -v` — all 13 integration tests + 7 unit tests (20 total) must PASS
- [x] T036 [P] Run full Phase 1 + Phase 2 regression: `uv run pytest tests/ -v` — ALL tests (Phase 1 + Phase 2) must PASS; confirm zero-LLM audit still holds for Phase 1 routes (no `anthropic` import outside `app/premium/`)
- [ ] T037 Set Fly.io secrets (run when ready to deploy): `fly secrets set ANTHROPIC_API_KEY="sk-ant-..." LLM_MODEL="claude-sonnet-4-20250514" MAX_TOKENS_ASSESSMENT="1000" MAX_TOKENS_SYNTHESIS="3000" --app course-companion-fte`
- [ ] T038 Deploy: `fly deploy --app course-companion-fte` from `backend/` directory
- [ ] T039 Post-deploy verify premium routes present: `curl https://course-companion-fte.fly.dev/openapi.json | python -c "import sys,json; paths=json.load(sys.stdin)['paths']; print([p for p in paths if 'premium' in p])"` — expect 3 premium paths
- [ ] T040 Post-deploy verify Pro gate: `curl -X POST https://course-companion-fte.fly.dev/premium/assess-answer -H "Authorization: Bearer <free-token>" ...` — expect 403

**Checkpoint**: All 20 Phase 2 tests pass locally; premium endpoints live on Fly.io; Phase 1 tests unbroken.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1 Assessment)**: Depends on Phase 2 — can start after Foundation
- **Phase 4 (US2 Synthesis)**: Depends on Phase 2 — can run in parallel with Phase 3
- **Phase 5 (US3 Dashboard)**: Depends on Phase 2 — can run in parallel with Phase 3 and 4
- **Phase 6 (Polish/Deploy)**: Depends on Phase 3 + 4 + 5 all complete

### User Story Dependencies

- **US1 Assessment**: Foundational complete (T001–T012)
- **US2 Synthesis**: Foundational complete + `cost_tracker.py` (T012)
- **US3 Dashboard**: Foundational complete + `LlmUsage` model (T009–T010)

### Within Each User Story

- Tests written FIRST (RED) → Implementation (GREEN)
- Prompt file → Schemas → Service → Router → Register in main.py
- Verify tests PASS before moving to next story

### Parallel Opportunities

```bash
# Phase 1 parallel (different files):
T004 Create premium/__init__.py
T005 Create routers/__init__.py
T006 Create services/__init__.py
T007 Create schemas/__init__.py
T008 Create prompts/ directory

# Phase 3 parallel (tests can start while reading schemas):
T013 Write cost calculator unit tests
T014 Write prompt builder unit tests
T015 Write assessment integration tests

# Cross-story parallel (after Foundation):
T013-T021 US1 Assessment
T022-T029 US2 Synthesis    ← can start after T009 complete
T030-T034 US3 Dashboard    ← can start after T009 complete
```

---

## Implementation Strategy

### MVP First (US1 Only — Phase 1 + 2 + 3)

1. Complete Phase 1 (Setup T001–T008)
2. Complete Phase 2 (Foundation T009–T012)
3. Complete Phase 3 (Assessment T013–T021)
4. **STOP and VALIDATE**: Run T035 subset (assessment tests only)
5. Demo `POST /premium/assess-answer` with real Anthropic key

### Incremental Delivery

1. Setup + Foundation → skeleton ready
2. Add US1 Assessment → test independently → demo
3. Add US2 Synthesis → test independently → demo
4. Add US3 Dashboard → test independently → full suite
5. Deploy to Fly.io

---

## Notes

- `# HYBRID — LLM CALL` comment required on every `client.messages.create(...)` call
- `ANTHROPIC_API_KEY` must never appear in any API response
- `chapter_id` values must be validated against `CHAPTER_METADATA` allowlist before any Supabase fetch (SSRF prevention)
- Phase 1 files that may be touched: `backend/app/main.py` (router registration), `backend/app/core/config.py` (new settings fields), `backend/app/models/__init__.py` (export LlmUsage), `backend/.env.example` (new env vars)
- All other Phase 1 files are strictly READ-ONLY
- Tests mock `anthropic.Anthropic` — never call real API in CI/CD
