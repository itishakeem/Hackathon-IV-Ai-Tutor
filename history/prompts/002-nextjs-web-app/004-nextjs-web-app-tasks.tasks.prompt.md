---
id: "004"
title: Next.js Web App Phase 3 Tasks
stage: tasks
date: 2026-04-19
surface: agent
model: claude-sonnet-4-6
feature: 002-nextjs-web-app
branch: 002-nextjs-web-app
user: Abdul Hakeem
command: /sp.tasks
labels: ["tasks", "nextjs", "frontend", "phase3", "milestones", "tdd", "freemium"]
links:
  spec: specs/002-nextjs-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-nextjs-web-app/tasks.md
tests:
  - n/a (tasks stage — no tests)
---

## Prompt

Break Phase 3 Next.js Web App plan into atomic tasks.

10 milestones requested: Project Setup, Foundation Layer, Layout Components, Auth Pages, Landing Page, Chapter Pages, Quiz Pages, Dashboard Page, Premium Page, Polish & Integration.

Hard Constraints: No LLM calls in frontend; JWT in Zustand (not raw localStorage); all API calls loading + error states; TypeScript strict; all pages mobile responsive.

## Response snapshot

Generated `specs/002-nextjs-web-app/tasks.md` — **53 tasks** across 8 phases:

**Phase 1: Setup (T001–T008)** — 8 tasks
- T001: `pnpm create next-app frontend` scaffold
- T002: Single command to install all 9 runtime deps
- T003–T008: tsconfig strict, next.config.ts, .env.local, shadcn init + 10 components, Tailwind dark+typography, globals.css CSS variables

**Phase 2: Foundational (T009–T016)** — 8 tasks
- T009: types/index.ts — all 20+ TypeScript interfaces from data-model.md
- T010: lib/auth.ts — decodeJwt + isTokenExpired (no extra package)
- T011: lib/utils.ts — cn() + clsx + tailwind-merge install
- T012: store/authStore.ts — Zustand persist → localStorage key 'auth-storage'
- T013: lib/api.ts — Axios instance + request interceptor (JWT) + response interceptor (401→clearAuth) + 18 typed API functions
- T014–T016: useAuth, useProgress, useChapters hooks

**Phase 3: US1 Auth (T017–T027)** — 11 tasks — MVP milestone
- T017: Root layout (ThemeProvider + Toaster)
- T018–T020: Navbar, Sidebar, Footer
- T021: Dashboard layout with auth guard
- T022–T023: LoginForm + RegisterForm (inline errors, loading states)
- T024–T025: login/page.tsx + register/page.tsx
- T026: Landing page (SSG, hardcoded module cards, pricing table)
- T027: End-to-end auth test (5 scenarios)

**Phase 4: US2 Chapters (T028–T033)** — 6 tasks
- T028: ChapterList (grid, lock icons, completion badges, upgrade Dialog)
- T029: learn/page.tsx (client-side with hooks)
- T030: ChapterReader (react-markdown + remark-gfm + rehype-slug + Tailwind prose + outline sidebar)
- T031: ChapterNav (Prev/Next + Quiz button)
- T032: learn/[chapterId]/page.tsx (client-side, access check, upgrade modal)
- T033: End-to-end chapter test (6 scenarios)

**Phase 5: US3 Quiz (T034–T038)** — 5 tasks
- T034–T036: QuizProgress, QuizCard, QuizResult (parallel)
- T037: quiz/[chapterId]/page.tsx (state machine: loading→question→submitted)
- T038: End-to-end quiz test (7 scenarios)

**Phase 6: US4 Dashboard (T039–T043)** — 5 tasks
- T039–T040: StreakCard, BadgeCard (parallel)
- T041: ProgressChart (Recharts LineChart + empty state)
- T042: dashboard/page.tsx (client-side hooks, skeletons, avg score)
- T043: End-to-end dashboard test

**Phase 7: US5 Premium (T044–T047)** — 4 tasks
- T044: AssessmentForm (429/503 error handling, min 10 chars validation)
- T045: SynthesisForm (2–5 chapters constraint, knowledge graph edge list)
- T046: premium/page.tsx (tier gate: upgrade prompt vs Tabs, usage section)
- T047: End-to-end premium test (7 scenarios)

**Phase 8: Polish (T048–T053)** — 6 tasks
- T048–T050: Skeletons audit, empty states audit, toast notifications audit (parallel)
- T051: Full user journey test (register→learn→quiz→dashboard→premium)
- T052: Mobile 375px responsiveness test
- T053: Dark mode test (no FOUC, prose-invert, charts)

**Checklist gate**: 16/16 PASS — proceeded automatically.

## Outcome

- Impact: Phase 3 fully task-broken — 53 atomic tasks, 8 phases, clear dependency order, 5 parallel opportunity batches
- Tests: n/a (tasks stage)
- Files: 1 file created (tasks.md)
- Next prompts: `/sp.implement read phase 1 from specs/002-nextjs-web-app/tasks.md and execute phase 1`
- Reflection: Key design decision in tasks: chapter/quiz/dashboard pages use client-side hooks (not SSR) to avoid the localStorage+SSR tension from plan.md — simpler and fully correct for a hackathon. Premium page tier gate reads Zustand store client-side. Only landing page is true SSG.

## Evaluation notes (flywheel)

- Failure modes observed: SSR+localStorage tension resolved in tasks by making all authenticated pages client-side components using hooks — simpler than adding cookie-based token for SSR
- Graders run and results (PASS/FAIL): Checklist 16/16 PASS
- Prompt variant (if applicable): /sp.tasks with detailed milestone breakdown inline
- Next experiment: /sp.implement Phase 1 — scaffold + install + configure in one session
