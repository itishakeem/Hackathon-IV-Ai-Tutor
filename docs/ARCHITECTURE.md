# Course Companion FTE — System Architecture
## Agent Factory Hackathon IV | Zero-Backend-LLM → Hybrid Intelligence

---

## Section 1: System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COURSE COMPANION FTE                                 │
│              AI Agent Development Course — Three-Phase Platform             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Phase 1: Zero-Backend-LLM      Phase 2: Hybrid Intelligence              │
│   ┌─────────────────────┐        ┌─────────────────────────────┐           │
│   │  FastAPI Backend    │───────▶│  FastAPI + Anthropic SDK    │           │
│   │  No LLM calls       │        │  LLM isolated in /premium/  │           │
│   └─────────────────────┘        └─────────────────────────────┘           │
│                                                                             │
│   Phase 3: Web Application                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  Next.js 16 App Router + Tailwind CSS v4 + framer-motion           │  │
│   │  Luxury dark-mode UI — Linear × Vercel × Stripe aesthetic          │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tech Stack Summary**

| Layer       | Technology                        | Version      |
|-------------|-----------------------------------|--------------|
| Frontend    | Next.js (App Router)              | 16.2.4       |
| Styling     | Tailwind CSS v4 + framer-motion   | 12.38.0      |
| Backend     | FastAPI + Uvicorn                 | 0.115.x      |
| ORM         | SQLAlchemy async + asyncpg        | 2.0.x        |
| Database    | Neon PostgreSQL (serverless)      | PostgreSQL 16 |
| Storage     | Cloudflare R2 / Supabase Storage  | —            |
| LLM         | Anthropic claude-sonnet-4-20250514| Phase 2 only |
| Auth        | JWT HS256, 7-day expiry           | python-jose  |
| State mgmt  | Zustand                           | 5.x          |

---

## Section 2: Phase 1 — Zero-Backend-LLM Architecture

**Core constraint**: The FastAPI backend makes zero LLM calls. All intelligence is pre-authored (quiz questions, chapter content) or rule-based (progress scoring, freemium gating).

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 — REQUEST FLOW                                │
│                                                                          │
│  Browser / Next.js                  FastAPI                              │
│  ┌─────────────┐  JWT Bearer        ┌─────────────────────────────────┐ │
│  │ Zustand     │──────────────────▶ │ /auth/login  /auth/register     │ │
│  │ Auth Store  │◀── JWT token ───── │   bcrypt hash · JWT sign        │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  GET /chapters     ┌─────────────────────────────────┐ │
│  │ ChapterList │──────────────────▶ │ /chapters                       │ │
│  │ ChapterPage │◀── markdown ─────  │   R2/Supabase Storage fetch     │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  GET /quizzes      ┌─────────────────────────────────┐ │
│  │ QuizPage    │──────────────────▶ │ /quizzes/{chapterId}            │ │
│  │             │◀── questions ───── │   Pre-authored JSON             │ │
│  │             │── POST /quizzes ─▶ │ /quizzes/{chapterId}/submit     │ │
│  │             │◀── score/results   │   Rule-based scoring            │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  GET /progress     ┌─────────────────────────────────┐ │
│  │ Dashboard   │──────────────────▶ │ /progress                       │ │
│  │             │◀── stats/history   │   Neon PostgreSQL query          │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  GET /access       ┌─────────────────────────────────┐ │
│  │ ChapterPage │──────────────────▶ │ /access/{chapterId}             │ │
│  │ (freemium)  │◀── {allowed:bool}  │   Tier check (free/premium/pro) │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────┐  GET /search       ┌─────────────────────────────────┐ │
│  │ SearchBar   │──────────────────▶ │ /search?q=...                   │ │
│  │             │◀── results         │   In-memory index (startup)     │ │
│  └─────────────┘                   └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Startup sequence**:
```
uvicorn start
    │
    ├─ lifespan()
    │      └─ build_search_index(db)   ← loads all chapter content into RAM
    │
    └─ HTTP server ready on :8001
```

**Freemium gate logic** (`/access/{chapterId}`):
- `chapter-01`, `chapter-02`, `chapter-03` → allowed for all tiers
- `chapter-04`, `chapter-05` → blocked for `tier = "free"`, allowed for `premium` / `pro`

---

## Section 3: Phase 2 — Hybrid Intelligence (Premium Features)

**LLM isolation principle**: `import anthropic` appears ONLY inside `app/premium/`. The rest of the codebase has zero dependency on the Anthropic SDK. Routes are always registered; the service raises HTTP 503 if `ANTHROPIC_API_KEY` is absent.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                PHASE 2 — HYBRID INTELLIGENCE LAYER                       │
│                                                                          │
│  app/premium/                                                            │
│  ├── routers/                                                            │
│  │   ├── assessment.py    POST /premium/assessment                       │
│  │   ├── synthesis.py     POST /premium/synthesis                        │
│  │   └── usage.py         GET  /premium/usage                            │
│  │                                                                       │
│  ├── services/                                                           │
│  │   ├── assessment_service.py  ──▶ Anthropic SDK (tool_use)            │
│  │   ├── synthesis_service.py   ──▶ Anthropic SDK (tool_use)            │
│  │   └── cost_tracker.py        ──▶ Log tokens + cost to DB             │
│  │                                                                       │
│  ├── prompts/                                                            │
│  │   ├── assessment_prompt.md   (rubric + instructions)                 │
│  │   └── synthesis_prompt.md    (cross-chapter analysis template)       │
│  │                                                                       │
│  └── schemas/                                                            │
│      ├── assessment.py    AssessmentResponse (score, feedback, ...)      │
│      ├── synthesis.py     SynthesisResponse (connections, graph edges)   │
│      └── usage.py         UsageSummary                                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LLM Call Pattern (both services)                                │   │
│  │                                                                  │   │
│  │  1. check_rate_limit(db, user_id)  ← 10 calls/user/day (UTC)   │   │
│  │  2. fetch chapter content from R2/Supabase                      │   │
│  │  3. format prompt from template                                 │   │
│  │  4. client.messages.create(                                     │   │
│  │       model="claude-sonnet-4-20250514",                         │   │
│  │       tools=[TOOL_SCHEMA],                                      │   │
│  │       tool_choice={"type": "tool", "name": "submit_*"},         │   │
│  │     )                                                           │   │
│  │  5. extract tool_use block from response                        │   │
│  │  6. log_usage(db, user_id, feature, response.usage)             │   │
│  │  7. return typed Pydantic schema                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Rate limiting: 10 LLM calls / user / day (resets midnight UTC)          │
│  Model: claude-sonnet-4-20250514                                         │
│  Max tokens: assessment=1000, synthesis=3000                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section 4: Phase 3 — Next.js Frontend Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  FRONTEND FILE STRUCTURE (src/)                          │
│                                                                          │
│  app/                                                                    │
│  ├── (auth)/                                                             │
│  │   ├── login/page.tsx          Client — JWT login form                │
│  │   └── register/page.tsx       Client — registration form             │
│  │                                                                       │
│  ├── (dashboard)/                 Layout: Navbar + no sidebar           │
│  │   ├── layout.tsx                                                      │
│  │   ├── dashboard/page.tsx       SSR — progress, charts, activity      │
│  │   ├── learn/                                                          │
│  │   │   ├── page.tsx             Chapter list                           │
│  │   │   └── [chapterId]/page.tsx Chapter reader + freemium gate        │
│  │   ├── quiz/[chapterId]/page.tsx  Client — interactive quiz           │
│  │   └── premium/page.tsx         Client — assessment/synthesis forms   │
│  │                                                                       │
│  ├── about/page.tsx               Static — mission, tech stack          │
│  ├── contact/page.tsx             Client — contact form                  │
│  ├── premium/page.tsx             Marketing — pricing/features          │
│  └── page.tsx                     Landing — hero, features, pricing     │
│                                                                          │
│  components/                                                             │
│  ├── layout/      Navbar.tsx  Footer.tsx  Sidebar.tsx                   │
│  ├── chapters/    ChapterList  ChapterReader  ChapterNav                │
│  ├── quiz/        QuizCard  QuizResult  QuizProgress                    │
│  ├── dashboard/   ProgressChart  StreakCard  BadgeCard                  │
│  ├── premium/     AssessmentForm  SynthesisForm                         │
│  └── ui/          GradientText  GlassCard  GradientButton               │
│                   AnimatedCounter  ScrollReveal  MeshBackground          │
│                   PageTransition  GradientBorder                         │
│                                                                          │
│  lib/                                                                    │
│  ├── api.ts         Axios client + JWT interceptor + 401 redirect       │
│  ├── animations.ts  framer-motion variants (fadeInUp, stagger, glow)    │
│  └── utils.ts       cn() Tailwind class merger                          │
│                                                                          │
│  hooks/                                                                  │
│  ├── useAuth.ts       Zustand auth store + localStorage rehydrate       │
│  ├── useChapters.ts   Chapter list fetch + cache                        │
│  └── useProgress.ts   Dashboard progress fetch                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Auth flow**:
```
Login form
    │
    ├─ POST /auth/login ──▶ FastAPI ──▶ JWT token (HS256, 7d)
    │
    ├─ authStore.setAuth(token, user)
    │       └─ localStorage.setItem("auth", JSON.stringify({token, user}))
    │
    ├─ Axios interceptor: headers["Authorization"] = "Bearer " + token
    │
    └─ On 401: authStore.clearAuth() + router.push("/login")
```

**Freemium gating (frontend)**:
- `ChapterList`: chapters 4-5 show lock icon + "Premium" badge for `tier === "free"`
- `ChapterPage`: calls `GET /access/{chapterId}` → shows upgrade Dialog if `!access.allowed`

---

## Section 5: Database Schema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     NEON POSTGRESQL SCHEMA                               │
│                                                                          │
│  users                                                                   │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ id           UUID  PK  default=uuid4                   │             │
│  │ email        VARCHAR(255)  UNIQUE  NOT NULL  INDEX      │             │
│  │ hashed_pwd   VARCHAR(255)  NOT NULL                     │             │
│  │ tier         VARCHAR(20)   NOT NULL  default='free'     │             │
│  │              CHECK(tier IN ('free','premium','pro'))    │             │
│  │ created_at   TIMESTAMPTZ  server_default=now()          │             │
│  └────────────────────────────────────────────────────────┘             │
│         │                                                                │
│         │ 1:N                                                            │
│         ▼                                                                │
│  progress                                                                │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ id           UUID  PK                                  │             │
│  │ user_id      UUID  FK→users.id  NOT NULL               │             │
│  │ chapter_id   VARCHAR  NOT NULL                         │             │
│  │ completed    BOOL  default=false                       │             │
│  │ completed_at TIMESTAMPTZ  nullable                     │             │
│  │ UNIQUE(user_id, chapter_id)                            │             │
│  └────────────────────────────────────────────────────────┘             │
│         │                                                                │
│  quiz_attempts                                                           │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ id           UUID  PK                                  │             │
│  │ user_id      UUID  FK→users.id  NOT NULL               │             │
│  │ chapter_id   VARCHAR  NOT NULL                         │             │
│  │ score        INTEGER  NOT NULL                         │             │
│  │ total        INTEGER  NOT NULL                         │             │
│  │ answers      JSONB                                     │             │
│  │ created_at   TIMESTAMPTZ  server_default=now()          │             │
│  └────────────────────────────────────────────────────────┘             │
│                                                                          │
│  llm_usage  (Phase 2 only)                                               │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ id           UUID  PK                                  │             │
│  │ user_id      UUID  FK→users.id  NOT NULL               │             │
│  │ feature      VARCHAR  ('assessment' | 'synthesis')     │             │
│  │ tokens_used  INTEGER  NOT NULL                         │             │
│  │ cost_usd     FLOAT    NOT NULL                         │             │
│  │ created_at   TIMESTAMPTZ  server_default=now()          │             │
│  └────────────────────────────────────────────────────────┘             │
│                                                                          │
│  search_index  (populated at startup, read-only at runtime)              │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ id           UUID  PK                                  │             │
│  │ chapter_id   VARCHAR  NOT NULL  INDEX                  │             │
│  │ heading      VARCHAR  NOT NULL                         │             │
│  │ content      TEXT     NOT NULL                         │             │
│  └────────────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section 6: Deployment Topology

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT TOPOLOGY                                 │
│                                                                          │
│  Users                                                                   │
│    │                                                                     │
│    │  HTTPS                                                              │
│    ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Vercel (Edge Network)                                          │    │
│  │  Next.js 16 — SSR + SSG + Client components                    │    │
│  │  Auto-scaling, global CDN, zero-config deploy                  │    │
│  └──────────────────────────┬──────────────────────────────────────┘    │
│                              │  HTTPS API calls                         │
│                              │  Authorization: Bearer <JWT>             │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Fly.io (fly.toml)                                              │    │
│  │  FastAPI + Uvicorn — 1 machine, auto-scale                      │    │
│  │  PORT 8080 (internal), exposed via Fly proxy                   │    │
│  └──────┬───────────────────┬────────────────────┬────────────────┘    │
│         │                   │                    │                      │
│         ▼                   ▼                    ▼                      │
│  ┌────────────┐   ┌──────────────────┐   ┌────────────────────┐        │
│  │ Neon DB    │   │ Cloudflare R2 /  │   │ Anthropic API      │        │
│  │ PostgreSQL │   │ Supabase Storage │   │ claude-sonnet-4    │        │
│  │ serverless │   │ Chapter markdown │   │ (Phase 2 only)     │        │
│  │ connection │   │ + quiz JSON      │   │                    │        │
│  │ pooling    │   │                  │   │                    │        │
│  └────────────┘   └──────────────────┘   └────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Environment variables** (backend `.env`):

| Variable                    | Purpose                               |
|-----------------------------|---------------------------------------|
| `DATABASE_URL`              | Neon PostgreSQL connection string     |
| `SUPABASE_URL`              | Supabase project URL                  |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (storage read)  |
| `SUPABASE_BUCKET`           | Storage bucket name for chapters      |
| `SECRET_KEY`                | JWT signing secret (HS256)            |
| `ANTHROPIC_API_KEY`         | Phase 2 only — LLM calls              |
| `LLM_MODEL`                 | `claude-sonnet-4-20250514`            |

**Environment variables** (frontend `.env.local`):

| Variable               | Purpose                         |
|------------------------|---------------------------------|
| `NEXT_PUBLIC_API_URL`  | FastAPI base URL                |

---

## Section 7: API Reference

| Method | Path                             | Auth | Tier     | Description                        |
|--------|----------------------------------|------|----------|------------------------------------|
| POST   | `/auth/register`                 | —    | —        | Create account (email + password)  |
| POST   | `/auth/login`                    | —    | —        | Returns JWT token                  |
| GET    | `/chapters`                      | JWT  | any      | List all 5 chapter metadata        |
| GET    | `/chapters/{id}`                 | JWT  | any      | Full chapter markdown content      |
| GET    | `/access/{chapterId}`            | JWT  | any      | `{allowed: bool}` freemium gate    |
| GET    | `/quizzes/{chapterId}`           | JWT  | any      | 5 questions (answers hidden)       |
| POST   | `/quizzes/{chapterId}/submit`    | JWT  | any      | Submit answers → score + results   |
| GET    | `/progress`                      | JWT  | any      | User's chapter completion + stats  |
| POST   | `/progress/{chapterId}/complete` | JWT  | any      | Mark chapter as complete           |
| GET    | `/search?q=`                     | JWT  | any      | Full-text search across chapters   |
| GET    | `/health`                        | —    | —        | `{status: "ok"}`                   |
| POST   | `/premium/assessment`            | JWT  | pro      | LLM-graded open-ended assessment   |
| POST   | `/premium/synthesis`             | JWT  | pro      | Cross-chapter concept synthesis    |
| GET    | `/premium/usage`                 | JWT  | pro      | Token usage + cost history         |

---

## Section 8: Security Model

- **Password storage**: bcrypt hashing via `passlib[bcrypt]` — no plaintext ever stored
- **JWT**: HS256, 7-day expiry, signed with `SECRET_KEY` from environment
- **CORS**: Allow-all origins (`"*"`) — acceptable for hackathon; tighten for production
- **Tier enforcement**: Server-side on every premium route — client-side gating is cosmetic only
- **Rate limiting**: 10 LLM calls/user/day enforced in database (not in-memory — survives restarts)
- **LLM isolation**: `import anthropic` only in `app/premium/` — zero LLM surface in core API
