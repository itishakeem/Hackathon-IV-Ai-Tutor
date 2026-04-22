---
id: "003"
title: Next.js Web App Phase 3 Plan
stage: plan
date: 2026-04-19
surface: agent
model: claude-sonnet-4-6
feature: 002-nextjs-web-app
branch: 002-nextjs-web-app
user: Abdul Hakeem
command: /sp.plan
labels: ["plan", "nextjs", "frontend", "phase3", "ssr", "zustand", "axios", "recharts", "shadcn"]
links:
  spec: specs/002-nextjs-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-nextjs-web-app/plan.md
  - specs/002-nextjs-web-app/research.md
  - specs/002-nextjs-web-app/data-model.md
  - specs/002-nextjs-web-app/quickstart.md
  - specs/002-nextjs-web-app/contracts/frontend-api-contract.md
tests:
  - n/a (plan stage — no tests)
---

## Prompt

Generate Phase 3 implementation plan for Next.js Web App.

## Context
- Backend fully running at http://localhost:8000
- All 17+ API endpoints available
- Building Next.js 15 frontend with App Router

## Plan Must Cover
1. Project Initialization — pnpm create next-app, all deps, tsconfig strict, next.config.ts
2. Dependencies — exact versions: shadcn/ui, zustand, axios, react-markdown+remark-gfm, recharts, next-themes, react-hot-toast, lucide-react
3. Component Build Order — types → api client → store → layout → auth → chapters → quiz → dashboard → premium
4. ADRs — App Router, Zustand, Axios, react-markdown, localStorage JWT
5. Responsive Design — 320px/768px/1280px breakpoints, sidebar hidden mobile, hamburger nav
6. API Integration — baseURL from env, JWT interceptor, 401→/login, 403→upgrade, loading pattern
7. Deployment — Vercel free tier, NEXT_PUBLIC_API_URL to Fly.io URL

## Response snapshot

**5 Phase 0 artifacts generated**:

**research.md** — 10 technology decisions documented:
1. App Router vs Pages Router → App Router (stable, RSC, per-page rendering control)
2. Zustand vs Redux → Zustand (3.4KB, persist middleware, zero Provider boilerplate)
3. Axios vs fetch → Axios (single interceptor for JWT + 401/403 handling across 17+ endpoints)
4. react-markdown vs MDX → react-markdown+remark-gfm+rehype-slug (runtime markdown from R2; MDX requires build-time content)
5. localStorage JWT vs httpOnly → localStorage (hackathon tradeoff; documented security implications)
6. next-themes → prevents FOUC via blocking `<head>` script; integrates with Tailwind `darkMode: 'class'`
7. react-hot-toast → callable outside React tree (from Axios interceptor); 5KB
8. Recharts → React-native LineChart for quiz score timeline
9. pnpm → content-addressable storage, deterministic lockfile
10. shadcn/ui → opt-in component copies; no runtime library overhead
Also includes full 19-endpoint API inventory.

**data-model.md** — All TypeScript interfaces:
- AuthToken, JwtPayload, AuthState (Zustand shape)
- ChapterMeta, ChapterContent, ChapterNav, AccessCheck
- QuizQuestion, QuizSubmit, QuizResult, QuestionResult
- ProgressResponse, ProgressUpdate, ChapterCompleteResponse
- AssessmentRequest/Response, SynthesisRequest/Response, GraphEdge
- LlmUsageRecord, UsageResponse
- ApiState<T>, FormState (generic UI state)
- State transition diagrams: Auth flow, Quiz flow, Chapter completion, Tier gating

**contracts/frontend-api-contract.md** — Per-endpoint contract:
- All 19 endpoints with method, path, auth, request/response JSON shapes
- Frontend action for each (what happens after successful response)
- Full error handling table: 401→clearAuth+redirect, 403→upgrade inline, 422→field errors, 429→rate limit toast, 503→AI unavailable toast

**quickstart.md** — 5 integration scenarios:
1. New user registration flow (SSG landing → register → dashboard)
2. Chapter read + complete flow (SSR list → SSR reader → mark complete)
3. Quiz submission flow (CSR quiz → submit → score → view answers)
4. Pro user AI assessment (premium page → assessment form → result)
5. Free user gate test (lock icons, upgrade modal, direct URL blocked)

**plan.md** — 14 implementation areas:
1. Project init (Low) — scaffold + deps + shadcn in one command sequence
2. TypeScript types (Low) — all interfaces in types/index.ts first
3. API client (Low) — Axios instance + request interceptor (JWT) + response interceptor (401→clearAuth)
4. Auth store (Low) — Zustand create + persist middleware → localStorage key 'auth-storage'
5. Root layout (Low) — ThemeProvider + Toaster + suppressHydrationWarning
6. Layout components (Medium) — Navbar (dark toggle + hamburger) + Sidebar (fixed desktop, Sheet mobile)
7. Landing page (Low) — SSG, no API calls, hardcoded chapter titles for build-time static
8. Auth pages (Low) — CSR LoginForm + RegisterForm + redirect guard
9. Chapter pages (Medium) — SSR ChapterList (merged with progress) + SSR ChapterReader (react-markdown + rehype outline)
10. Quiz page (Medium) — CSR state machine: loading→question→submitted, QuizCard + QuizResult
11. Dashboard (Medium) — SSR progress fetch + Recharts LineChart (client island)
12. Premium page (High) — CSR tier gate + AssessmentForm + SynthesisForm + usage table
13. Responsive design (Low) — Tailwind breakpoints documented per component
14. Deployment (Low) — Vercel, set NEXT_PUBLIC_API_URL to Fly.io URL

**Constitution Check**: All 7 principles PASS.

**ADR suggestions**: 3 flagged (App Router, JWT localStorage, Axios interceptor pattern).

**Agent context**: Updated CLAUDE.md with TypeScript 5.x + Node.js 20+ stack.

## Outcome

- Impact: Phase 3 fully planned — 5 artifacts, 14 implementation areas, 30 components, 8 pages, complete API contract
- Tests: n/a (plan stage)
- Files: 5 files created/updated (plan.md, research.md, data-model.md, quickstart.md, contracts/frontend-api-contract.md)
- Next prompts: `/sp.tasks` — break plan into atomic implementation tasks for Phase 3
- Reflection: Key architectural point: SSR pages need JWT to call backend server-side — need to pass token via Authorization header from server context; this requires either cookie-based token or a different SSR approach. The plan uses `getState()` from Zustand but that only works client-side. **This is a known limitation to address in tasks: SSR pages may need to use client-side fallback or pass token via cookies for server-side fetches.**

## Evaluation notes (flywheel)

- Failure modes observed: SSR + localStorage JWT is architecturally inconsistent — server components can't read localStorage. Resolved by noting in plan that SSR pages fetch after hydration (client-side) or use a different mechanism. This is a design tension to resolve in /sp.tasks.
- Graders run and results (PASS/FAIL): Constitution check 7/7 PASS
- Prompt variant (if applicable): /sp.plan with detailed context including backend endpoint list
- Next experiment: /sp.tasks — resolve the SSR+localStorage tension by deciding: (a) use CSR for all authenticated pages, or (b) use a token cookie for server-side reads only
