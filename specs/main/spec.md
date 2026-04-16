# Feature Specification: Course Companion FTE — Phase 1

**Feature Branch**: `main`
**Created**: 2026-04-09
**Status**: Draft

## Project Identity
- Name: Course Companion FTE
- Topic: AI Agent Development
- Phase: 1 (Zero-Backend-LLM — strictly enforced)
- Stack: FastAPI + Cloudflare R2 + Neon PostgreSQL + ChatGPT App

## Course Content Structure
The course covers AI Agent Development with these modules:

Module 1: Introduction to AI Agents
- What is an AI Agent?
- Agent vs Chatbot differences
- Types of agents (reactive, deliberative, hybrid)

Module 2: Claude Agent SDK
- SDK setup and installation
- Creating your first agent
- Agent instructions and tools

Module 3: Model Context Protocol (MCP)
- What is MCP?
- MCP servers and clients
- Building custom MCP tools

Module 4: Agent Skills (SKILL.md)
- What are agent skills?
- Writing effective SKILL.md files
- Skill triggers and workflows

Module 5: Multi-Agent Systems
- Agent-to-Agent (A2A) protocol
- Orchestration patterns
- Production deployment

## Required API Endpoints

### Content APIs
```
GET  /chapters                        → list all chapters with metadata
GET  /chapters/{chapter_id}           → get full chapter content from R2
GET  /chapters/{chapter_id}/next      → return next chapter id and title
GET  /chapters/{chapter_id}/previous  → return previous chapter id and title
GET  /chapters/{chapter_id}/summary   → return chapter key points (static)
```

### Search API
```
GET  /search?q={query}                → keyword search across all chapters
```
Search implementation: Pre-built keyword index in PostgreSQL. On app startup, chapter content is loaded from R2 and stored in a `search_index` table. Queries use `ILIKE` against the indexed text. No per-request R2 reads for search.

### Quiz APIs
```
GET  /quizzes/{chapter_id}            → get quiz questions (no answers)
POST /quizzes/{chapter_id}/submit     → grade with answer key, return score
GET  /quizzes/{chapter_id}/answers    → get correct answers (after attempt)
```

### Progress APIs
```
GET  /progress/{user_id}              → get completion %, streaks, badges
PUT  /progress/{user_id}/chapter      → mark chapter complete
PUT  /progress/{user_id}/quiz         → record quiz score
DELETE /progress/{user_id}/reset      → reset progress
```

### Access Control APIs
```
GET  /access/check?user_id={id}&chapter_id={id}  → freemium gate check
```

### Health
```
GET  /health                          → API health check
```

## Freemium Rules
- Free users: access Module 1 only (chapters 1-3)
- Premium users: full access to all 5 modules
- Gate must return clear reason when blocking access

## Database Schema

### users table
- id (UUID, primary key)
- email (string, unique)
- tier (enum: free, premium, pro)
- created_at (timestamp)

### progress table
- id (UUID)
- user_id (UUID, foreign key)
- chapter_id (string)
- completed (boolean)
- completed_at (timestamp)
- streak_days (integer) — incremented by 1 each calendar day a chapter is completed; resets to 0 if no chapter completion for >1 calendar day
- last_activity_date (date) — used to determine streak continuity

### search_index table
- id (UUID)
- chapter_id (string)
- chapter_title (string)
- content_text (text) — full chapter markdown text
- indexed_at (timestamp)

### quiz_attempts table
- id (UUID)
- user_id (UUID)
- chapter_id (string)
- score (integer)
- total_questions (integer)
- attempted_at (timestamp)

## Non-Functional Requirements

- **Performance**: p95 latency ≤ 500ms for content endpoints (R2 reads); ≤ 200ms for progress and quiz endpoints (DB only)
- **Scalability**: Backend MUST handle 100+ concurrent users without degradation (stateless FastAPI + connection pooling)
- **Availability**: No SLA defined for hackathon; target best-effort uptime on Fly.io/Railway free tier
- **Observability**: Structured logging on all requests (method, path, status code, duration_ms)

## Hard Constraints (NON-NEGOTIABLE)
- ZERO LLM API calls in backend — instant disqualification if violated
- All quiz grading is rule-based using answer keys stored in R2
- Content served verbatim from Cloudflare R2 (no transformation)
- No summarization logic anywhere in backend
- No prompt orchestration or agent loops in backend

## Content Storage (Cloudflare R2)

One chapter file per module (5 chapters total). Sub-topics are `##` headings within each chapter file. Each chapter has exactly one corresponding quiz file.

Bucket structure:
```
/chapters/chapter-01.md   ← Module 1: Introduction to AI Agents
/chapters/chapter-02.md   ← Module 2: Claude Agent SDK
/chapters/chapter-03.md   ← Module 3: Model Context Protocol (MCP)
/chapters/chapter-04.md   ← Module 4: Agent Skills (SKILL.md)
/chapters/chapter-05.md   ← Module 5: Multi-Agent Systems
/quizzes/quiz-01.json
/quizzes/quiz-02.json
/quizzes/quiz-03.json
/quizzes/quiz-04.json
/quizzes/quiz-05.json
```

Quiz JSON format:
```json
{
  "chapter_id": "chapter-01",
  "questions": [
    {
      "id": "q1",
      "question": "What is an AI Agent?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }
  ]
}
```

## Authentication & Security

- All non-public endpoints MUST be protected by JWT Bearer token middleware.
- `user_id` is extracted from the JWT payload — it MUST NOT be accepted as a raw query parameter on protected routes.
- Public endpoints (no auth required): `GET /health`, `GET /chapters` (metadata list), `GET /chapters/{id}` (content — access gated separately by freemium check).
- Auth endpoints required: `POST /auth/register`, `POST /auth/login` → return signed JWT.
- Token signing algorithm: HS256 using `SECRET_KEY`.
- Token payload MUST include: `sub` (user UUID), `tier` (free/premium/pro), `exp`.
- Progress and quiz endpoints extract `user_id` from `token.sub`; path param `user_id` MUST match `token.sub` (or return 403).

## Environment Variables Required
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- DATABASE_URL (Neon PostgreSQL)
- SECRET_KEY (JWT auth, HS256)

## Clarifications

### Session 2026-04-09
- Q: How are API endpoints authenticated? → A: JWT Bearer token middleware on all protected endpoints; `user_id` extracted from token payload (Option A)
- Q: Chapter-to-module mapping? → A: One chapter per module (5 total); sub-topics are `##` headings within each chapter file (Option A)
- Q: How is streak_days defined and incremented? → A: +1 per calendar day a chapter is completed; resets to 0 if >1 day gap; tracked via last_activity_date field (Option A)
- Q: Search implementation mechanism? → A: Pre-built DB index populated at startup from R2; queries use PostgreSQL ILIKE (Option A)
- Q: Acceptable p95 response latency targets? → A: ≤500ms content endpoints (R2 reads); ≤200ms progress/quiz endpoints (DB only)
