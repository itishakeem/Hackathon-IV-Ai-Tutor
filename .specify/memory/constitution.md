<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial) → 1.0.0
Modified principles: N/A (initial write from template)
Added sections:
  - Core Principles (7 principles)
  - Technology Stack
  - Development Workflow
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check gates align with principles below
  - .specify/templates/spec-template.md ✅ No structural changes required
  - .specify/templates/tasks-template.md ✅ Phase structure aligns with three-phase delivery model
Deferred TODOs:
  - TODO(RATIFICATION_DATE): Set to today 2026-04-09 as initial ratification
-->

# Course Companion FTE Constitution

## Core Principles

### I. Zero-Backend-LLM by Default (NON-NEGOTIABLE)

The backend MUST perform zero LLM inference in Phase 1. All intelligent reasoning,
explanation, tutoring, and adaptation is delegated entirely to ChatGPT (the frontend
LLM). The backend is purely deterministic: it serves content verbatim, tracks progress,
grades quizzes via rule-based logic, enforces access control, and performs
keyword/semantic search without any model calls.

Any violation — LLM API calls, RAG summarization, prompt orchestration, or agent loops
in the backend — constitutes an immediate disqualification from Phase 1 evaluation.

**Rationale**: Near-zero marginal cost per user ($0.002–$0.004/user/month at 10K users),
predictable scaling, and simplified ops. ChatGPT subscribers bear LLM cost, not the
developer.

### II. Hybrid Intelligence is Selective and Premium (NON-NEGOTIABLE)

Backend LLM calls (Phase 2) MUST be:
- Feature-scoped: limited to at most 2 explicitly chosen hybrid features.
- User-initiated: never auto-triggered.
- Premium-gated: accessible only to paying users.
- Isolated: implemented on separate API routes, not mixed with Phase 1 logic.
- Cost-tracked: per-user LLM cost MUST be monitored and documented.

Teams MUST justify in writing why each hybrid feature cannot be delivered under
Zero-Backend-LLM design. The entire app MUST NOT be converted to hybrid.

**Rationale**: Prevents cost overruns, preserves core UX reliability, and ensures hybrid
adds demonstrable premium value.

### III. Spec-Driven Development (SDD) — Your Spec is Your Source Code

All features MUST originate from a written specification before implementation begins.
The spec, plan, and tasks artifacts are the authoritative source of truth. Agents
(Claude Code) manufacture code from specs; code without a corresponding spec is
out-of-compliance.

Development flow: Spec (`spec.md`) → Plan (`plan.md`) → Tasks (`tasks.md`) →
Implementation → PHR capture.

**Rationale**: Ensures reproducibility, auditability, and team alignment. Enables
AI-assisted manufacturing with consistent outputs.

### IV. Dual-Frontend, Shared Deterministic Backend

Phase 1 MUST deliver a ChatGPT App frontend (OpenAI Apps SDK) backed by a
deterministic FastAPI backend. Phase 3 MUST deliver a standalone Next.js/React web
frontend against the same consolidated FastAPI backend (with all features including LLM
calls for Phase 3).

Backend code MUST NOT be duplicated across frontends; the two frontends share one
backend codebase. Frontend code MUST be maintained in separate codebases.

**Rationale**: Maximizes reach (800M+ ChatGPT users + standalone web users) while
keeping infrastructure costs flat.

### V. Content Stored in Cloudflare R2 — Never in Backend Code

All course content (chapters, media assets, quiz banks) MUST reside in Cloudflare R2
object storage. The backend serves this content verbatim via signed URLs or direct
reads. Content MUST NOT be hardcoded into backend source files or generated at
runtime via LLM.

**Rationale**: Separation of content from compute allows independent content updates,
CDN-level performance, and zero per-request regeneration cost.

### VI. Freemium Access Control is Mandatory from Day One

Every content and quiz endpoint MUST enforce the freemium tier gate:
- Free tier: first 3 chapters, basic quizzes, ChatGPT tutoring.
- Premium ($9.99/mo): all chapters, all quizzes, progress tracking.
- Pro ($19.99/mo): Premium + Adaptive Path + LLM Assessments (Phase 2).
- Team ($49.99/mo): Pro + Analytics + Multiple seats.

Access checks MUST be performed server-side; the ChatGPT App MUST explain premium
upgrades gracefully to users who hit the gate.

**Rationale**: Monetization viability and cost-per-user sustainability depend on
enforcing access boundaries consistently.

### VII. Observability and Cost Transparency

Every deployed phase MUST include:
- Structured logging for all API requests (method, path, status, duration).
- Progress tracking persistence (completion percentages, streaks stored in database).
- Phase 2 only: per-user LLM cost tracking with documented estimates matching the
  approved cost analysis framework (Claude Sonnet pricing).

A cost analysis document (1-page Markdown/PDF) MUST be submitted as a deliverable
for each phase.

**Rationale**: Without cost visibility, hybrid features can generate uncontrolled spend.
Observability is a prerequisite for production readiness.

## Technology Stack

**Phase 1 (Required)**
- ChatGPT App Frontend: OpenAI Apps SDK
- Backend: FastAPI (Python) — deterministic only
- Content Storage: Cloudflare R2
- Database: Neon or Supabase (free tier → $25/mo)
- Compute: Fly.io or Railway (~$5–20/mo)

**Phase 2 Addition (Required)**
- Hybrid APIs: FastAPI routes calling Claude Sonnet (claude-sonnet-4-6 or equivalent)
- Max 2 hybrid features from: Adaptive Learning Path, LLM-Graded Assessments,
  Cross-Chapter Synthesis, AI Mentor Agent

**Phase 3 (Required)**
- Web Frontend: Next.js / React
- Consolidated Backend: FastAPI (Python) + LLM API Calls (all features)

**Agent Factory Stack Layers (Phase 1 active)**
- L3: FastAPI — HTTP interface + A2A
- L6: Runtime Skills + MCP — Domain knowledge + Tools (SKILL.md files required)

**Prohibited in Phase 1 Backend**
- LLM API calls of any kind
- RAG summarization
- Prompt orchestration
- Agent loops
- Runtime content generation

## Development Workflow

1. **Spec First**: Write or update `specs/<feature>/spec.md` before any code.
2. **Plan**: Generate `specs/<feature>/plan.md` with architecture decisions.
3. **Tasks**: Generate `specs/<feature>/tasks.md` with dependency-ordered tasks.
4. **Implement**: Execute tasks in order; commit after each logical group.
5. **PHR Capture**: Create a Prompt History Record under `history/prompts/` after every
   significant prompt or implementation session.
6. **Phase Gate**: Before advancing from Phase 1 → Phase 2, confirm:
   - Backend code review passes zero-LLM audit (no LLM API calls present).
   - All 6 required Phase 1 features are functional (Content Delivery, Navigation,
     Grounded Q&A, Rule-Based Quizzes, Progress Tracking, Freemium Gate).
   - ChatGPT App passes UX testing.
   - Cost analysis submitted.
7. **ADR on Significant Decisions**: Architectural decisions (framework choice, data
   model, API design, security strategy) MUST be surfaced for ADR documentation.
   ADRs live in `history/adr/`.

**Required Runtime Skills (SKILL.md files)**
- `concept-explainer`: Trigger keywords — "explain", "what is", "how does"
- `quiz-master`: Trigger keywords — "quiz", "test me", "practice"
- `socratic-tutor`: Trigger keywords — "help me think", "I'm stuck"
- `progress-motivator`: Trigger keywords — "my progress", "streak", "how am I doing"

**Required Deliverables per Phase**
- Source code (GitHub repo with README)
- Architecture diagram (PNG/PDF)
- Spec document (Markdown)
- Cost analysis (Markdown/PDF)
- API documentation (OpenAPI/Swagger)
- Demo video (MP4, 5 min) covering: intro, architecture, web frontend demo,
  ChatGPT App demo, Phase 2 features

## Governance

This constitution supersedes all other project practices and guidelines. It governs the
Course Companion FTE project for Panaversity Agent Factory Hackathon IV.

**Amendment Procedure**:
1. Propose amendment with rationale in a pull request or issue.
2. Any MAJOR change (principle removal, redefinition) requires team consensus and a
   new MAJOR version bump.
3. MINOR changes (new principle or material guidance expansion) require a MINOR bump.
4. PATCH changes (clarifications, wording) require only a PATCH bump.
5. Update `LAST_AMENDED_DATE` on every change; `RATIFICATION_DATE` is immutable.

**Compliance**:
- All PRs MUST include a Constitution Check section in the plan verifying no principles
  are violated.
- Complexity violations (e.g., adding a 3rd frontend) MUST be justified in the plan's
  Complexity Tracking table.
- Secrets and API keys MUST NOT be hardcoded; use `.env` files with documented
  variable names.
- The spec is the source of truth; code without a backing spec is non-compliant.

**Versioning Policy**: `MAJOR.MINOR.PATCH` per semantic versioning rules defined above.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
