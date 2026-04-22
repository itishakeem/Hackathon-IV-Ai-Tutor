# Feature Specification: Course Companion FTE — Phase 2 (Hybrid Intelligence)

**Feature Branch**: `001-hybrid-intelligence`
**Created**: 2026-04-17
**Status**: Draft

## Context

Phase 1 is complete: a Zero-Backend-LLM FastAPI tutor serving 5 course chapters with
rule-based quiz grading and streak tracking. Phase 2 adds exactly **two** premium
endpoints where LLM calls are explicitly permitted and clearly isolated from Phase 1 code.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — LLM-Graded Assessment (Priority: P1)

A Pro-tier student submits a free-text written answer to a conceptual question.
The system evaluates the reasoning quality, scores it out of 100, and returns
structured feedback with strengths, improvement areas, and a pointer back to the
relevant chapter section — all grounded in the actual chapter content.

**Why this priority**: Rule-based grading cannot evaluate open-ended reasoning.
This is the highest-value differentiator for Pro users and directly supports
learning outcomes.

**Independent Test**: Can be fully tested by submitting a written answer to
`POST /premium/assess-answer` with a valid Pro JWT and verifying a structured
score + feedback response is returned that references chapter content.

**Acceptance Scenarios**:

1. **Given** a Pro user with a valid token, **When** they POST a written answer with a valid `chapter_id`, question, and `student_answer`, **Then** the system returns a score (0–100), feedback string, strengths list, improvements list, and a `suggested_reading` section reference.
2. **Given** a Free or Premium (non-Pro) user, **When** they POST to `/premium/assess-answer`, **Then** the system returns HTTP 403 with message "This feature requires Pro plan. Upgrade at /pricing".
3. **Given** a Pro user, **When** the `chapter_id` does not exist, **Then** the system returns HTTP 404.
4. **Given** a Pro user, **When** `student_answer` is fewer than 10 characters, **Then** the system returns HTTP 422 with a validation error.
5. **Given** a valid assessment request, **When** the LLM call completes, **Then** usage is logged to `llm_usage` with `feature=assessment`, `tokens_used`, and `cost_usd`.

---

### User Story 2 — Cross-Chapter Synthesis (Priority: P2)

A Pro-tier student selects 2–5 chapters and provides a focus topic. The system
fetches all selected chapter content, sends it to the LLM, and returns a synthesis
narrative, key cross-chapter connections, a knowledge graph of concept relationships,
and a recommended next chapter — with every connection citing its source chapter.

**Why this priority**: Multi-document reasoning is impossible without an LLM. This
enables the "big picture" understanding that is the goal of the course.

**Independent Test**: Can be fully tested by posting `["chapter-01","chapter-02","chapter-03"]`
to `POST /premium/synthesize` and verifying synthesis text, key_connections, and
knowledge_graph are non-empty and each connection references a chapter.

**Acceptance Scenarios**:

1. **Given** a Pro user, **When** they POST `chapter_ids` (2–5 valid IDs) and a `focus_topic`, **Then** the system returns `synthesis` text, `key_connections` list, `knowledge_graph` list, and `recommended_next` chapter ID.
2. **Given** a Free or Premium (non-Pro) user, **When** they POST to `/premium/synthesize`, **Then** the system returns HTTP 403 with message "This feature requires Pro plan. Upgrade at /pricing".
3. **Given** a Pro user, **When** `chapter_ids` contains fewer than 2 or more than 5 entries, **Then** the system returns HTTP 422.
4. **Given** a Pro user, **When** any `chapter_id` in the list does not exist, **Then** the system returns HTTP 404 identifying the missing chapter.
5. **Given** a valid synthesis request, **When** complete, **Then** each `key_connections` entry cites the source chapter(s) it was derived from, and usage is logged to `llm_usage` with `feature=synthesis`.

---

### User Story 3 — Usage Cost Dashboard (Priority: P3)

A Pro user can view their own LLM usage history — how many tokens were consumed,
cost per call, and which features were used — so they can understand their spending.

**Why this priority**: Cost visibility builds trust and helps users manage their
Pro subscription value.

**Independent Test**: After making at least one assessment or synthesis call,
`GET /premium/usage/{user_id}` returns a list of usage records with feature,
tokens, cost, and timestamp.

**Acceptance Scenarios**:

1. **Given** a Pro user who has made LLM calls, **When** they GET `/premium/usage/{user_id}`, **Then** the system returns a list of usage records with `feature`, `tokens_used`, `cost_usd`, and `created_at`.
2. **Given** a user requesting another user's usage, **When** `user_id` in path differs from token subject, **Then** the system returns HTTP 403.
3. **Given** a Pro user with no LLM calls yet, **When** they GET their usage, **Then** the system returns an empty list with HTTP 200.

---

### Edge Cases

- What happens when the Anthropic API is unavailable or times out? → Return HTTP 503 with "Assessment service temporarily unavailable. Please try again."
- What if the LLM returns malformed/unparseable JSON for the synthesis knowledge graph? → Return HTTP 502 with "Failed to parse synthesis response. Please retry."
- What if `student_answer` exceeds 2,000 characters? → Truncate to 2,000 chars before sending to LLM; this is documented as a known limit.
- What if `focus_topic` is omitted in synthesis request? → Default to "General synthesis across selected chapters".
- What if a Pro user's JWT has expired mid-request? → Return HTTP 401 (standard JWT expiry handling, no special case).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /premium/assess-answer` accepting `chapter_id`, `question`, `student_answer` (min 10 chars), and `user_id`.
- **FR-002**: System MUST expose `POST /premium/synthesize` accepting `chapter_ids` (2–5 items), `focus_topic` (optional), and `user_id`.
- **FR-003**: System MUST expose `GET /premium/usage/{user_id}` returning the caller's LLM usage history as a list.
- **FR-004**: Both POST endpoints MUST verify JWT `tier` claim equals `"pro"`; all other tiers (including `"premium"`) receive HTTP 403 with message "This feature requires Pro plan. Upgrade at /pricing".
- **FR-005**: Assessment endpoint MUST fetch chapter content from Supabase Storage before constructing the LLM prompt, grounding the evaluation in that content only.
- **FR-006**: Synthesis endpoint MUST fetch all requested chapters from Supabase Storage before the LLM call.
- **FR-007**: Assessment response MUST include: `score` (int 0–100), `max_score` (100), `feedback` (string), `strengths` (list of strings), `improvements` (list of strings), `suggested_reading` (string referencing a chapter section).
- **FR-008**: Synthesis response MUST include: `synthesis` (string), `key_connections` (list of strings each citing source chapter), `knowledge_graph` (list of `{from, to, relationship}` objects), `recommended_next` (chapter_id string).
- **FR-009**: Every completed LLM call MUST produce a row in `llm_usage` with `user_id`, `feature`, `tokens_used`, `cost_usd`, `created_at`.
- **FR-010**: All premium code MUST reside in `backend/app/premium/`; Phase 1 routers MUST NOT import from `app.premium`.
- **FR-011**: Every LLM call site MUST be annotated with `# HYBRID — LLM CALL` comment.
- **FR-012**: `student_answer` MUST be validated for minimum length of 10 characters (HTTP 422 if shorter).
- **FR-013**: `chapter_ids` MUST be validated for count between 2 and 5 inclusive (HTTP 422 otherwise).
- **FR-014**: Usage endpoint MUST verify `token.sub == user_id`; return HTTP 403 for mismatches.
- **FR-015**: `student_answer` longer than 2,000 characters MUST be silently truncated before the LLM call.
- **FR-016**: New env vars MUST be documented in `backend/.env.example`: `ANTHROPIC_API_KEY`, `LLM_MODEL`, `MAX_TOKENS_ASSESSMENT`, `MAX_TOKENS_SYNTHESIS`.

### Key Entities

- **AssessmentRequest**: chapter_id (str), question (str), student_answer (str, 10–2000 chars), user_id (UUID)
- **AssessmentResponse**: score (int 0–100), max_score (int=100), feedback (str), strengths (list[str]), improvements (list[str]), suggested_reading (str)
- **SynthesisRequest**: chapter_ids (list[str], 2–5), focus_topic (str, optional), user_id (UUID)
- **SynthesisResponse**: synthesis (str), key_connections (list[str]), knowledge_graph (list[{from, to, relationship}]), recommended_next (str)
- **LlmUsageRecord**: id (UUID), user_id (UUID FK → users), feature (enum: assessment | synthesis), tokens_used (int), cost_usd (float), created_at (timestamp)
- **UsageResponse**: list of LlmUsageRecord

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pro users receive assessment score and structured feedback within 15 seconds of submission for any single chapter.
- **SC-002**: Pro users receive a synthesis response within 30 seconds for up to 5 chapters.
- **SC-003**: 100% of completed LLM calls produce a `llm_usage` row — zero unlogged calls.
- **SC-004**: Free and non-Pro users are blocked at both premium endpoints with the upgrade message — 0% bypass rate.
- **SC-005**: Assessment feedback references content exclusively from the requested chapter — no out-of-scope facts in response.
- **SC-006**: Every `key_connections` entry in synthesis output includes a source chapter reference, verifiable by manual inspection.
- **SC-007**: Phase 1 test suite (`pytest tests/unit/ tests/integration/`) passes with zero regressions after Phase 2 code is merged.
- **SC-008**: `GET /premium/usage/{user_id}` returns accurate count and cumulative `cost_usd` matching the actual LLM calls recorded.
