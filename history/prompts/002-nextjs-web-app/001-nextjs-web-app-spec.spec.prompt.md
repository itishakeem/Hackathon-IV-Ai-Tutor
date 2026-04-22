---
id: "001"
title: Next.js Web App Phase 3 Spec
stage: spec
date: 2026-04-18
surface: agent
model: claude-sonnet-4-6
feature: 002-nextjs-web-app
branch: 002-nextjs-web-app
user: Abdul Hakeem
command: /sp.specify
labels: ["spec", "nextjs", "frontend", "phase3", "web-app", "freemium", "premium"]
links:
  spec: specs/002-nextjs-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-nextjs-web-app/spec.md
  - specs/002-nextjs-web-app/checklists/requirements.md
tests:
  - n/a (spec stage — no tests)
---

## Prompt

# Feature Specification: Course Companion FTE — Phase 3 (Next.js Web App)

## Project Context
- Phase 1 backend: Complete (Zero-Backend-LLM FastAPI)
- Phase 2 backend: Complete (Hybrid Premium Features)
- Backend runs locally at: http://localhost:8000
- Now building: Full standalone Next.js Web App

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- State Management: Zustand
- API Client: Axios
- Auth: JWT stored in httpOnly cookies
- Charts: Recharts
- Package Manager: pnpm

## Project Structure
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── learn/page.tsx
│   │   ├── learn/[chapterId]/page.tsx
│   │   ├── quiz/[chapterId]/page.tsx
│   │   └── premium/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── auth/
│   ├── chapters/
│   ├── quiz/
│   ├── dashboard/
│   ├── premium/
│   └── layout/
├── lib/
│   ├── api.ts           # Axios client with JWT interceptor
│   ├── auth.ts
│   └── utils.ts
├── hooks/
├── store/
│   └── authStore.ts
├── types/
│   └── index.ts
├── .env.local
├── next.config.ts
└── package.json

## Required Pages
1. Landing Page (/) — hero, course overview, pricing table, CTAs
2. Auth Pages (/login, /register) — centered forms, JWT in httpOnly cookie
3. Chapter List (/learn) — 5 module cards, lock icon for free users
4. Chapter Reader (/learn/[chapterId]) — markdown rendering, nav, Mark Complete, outline sidebar
5. Quiz Page (/quiz/[chapterId]) — one-at-a-time questions, score, retry
6. Dashboard (/dashboard) — progress bar, streak, Recharts chart, average score
7. Premium Page (/premium) — Assessment + Synthesis tabs, usage dashboard, upgrade prompt for non-pro

## API Integration
All API calls to NEXT_PUBLIC_API_URL. Axios interceptor attaches JWT Bearer.
Handle: 401 → /login, 403 → upgrade prompt, 422 → inline validation errors.

## TypeScript Interfaces
User, AuthToken, Chapter, ChapterContent, ChapterNav, Quiz, QuizQuestion, QuizSubmit, QuizResult,
Progress, ProgressUpdate, AccessCheck, AssessmentRequest, AssessmentResponse,
SynthesisRequest, SynthesisResponse, LlmUsageRecord, UsageResponse

## Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Course Companion FTE

## Design Requirements
- Primary color: Indigo (#6366f1)
- Dark mode support
- Mobile responsive (320px → 1440px)
- Loading skeletons for all data fetches
- Toast notifications for success/error

## Hard Constraints
- No LLM calls in Next.js frontend
- JWT never stored in localStorage (httpOnly cookies only)
- All API calls handle loading and error states

## Response snapshot

Created `specs/002-nextjs-web-app/spec.md` with:

**Branch**: `002-nextjs-web-app` (new branch created, highest existing = 001)

**5 User Stories** (P1–P5):
- US1 (P1): Authentication & Onboarding — register/login/session persistence — 6 acceptance scenarios
- US2 (P2): Browse & Read Course Chapters — chapter list, markdown reader, freemium lock, mark complete — 7 scenarios
- US3 (P3): Quiz & Knowledge Check — one-at-a-time questions, score, retry, view answers — 6 scenarios
- US4 (P4): Learning Progress Dashboard — completion %, streak, score chart, avg — 4 scenarios
- US5 (P5): Premium AI Features — assessment + synthesis tabs, usage section, upgrade prompt — 6 scenarios

**8 Edge Cases**: offline, timeout, mid-session expiry, free user locked URL, empty quiz history, zero LLM usage, mobile quiz, rate limit exceeded

**28 Functional Requirements** (FR-001–FR-028) across: auth, chapter reading, quizzes, dashboard, premium, cross-cutting

**Key Entities**: User, Session, Chapter, Quiz, Progress, Assessment, Synthesis, LlmUsageRecord

**9 Success Criteria** (SC-001–SC-009): measurable, technology-agnostic

**Checklist**: `checklists/requirements.md` — all 16 items PASS

**Out of Scope**: payments, OAuth, WebSockets, admin dashboard, password reset, SSR beyond landing page, native mobile

## Outcome

- Impact: Phase 3 spec complete — 5 user stories, 28 FRs, 9 success criteria, full edge case coverage; ready for `/sp.plan`
- Tests: n/a (spec stage)
- Files: 2 files created (spec.md, checklists/requirements.md)
- Next prompts: `/sp.plan` — generate architecture and implementation plan for 002-nextjs-web-app
- Reflection: Tier gating verified at both UI and API levels; httpOnly cookie constraint is the key security invariant; 5 user stories ordered by dependency chain (auth → read → quiz → dashboard → premium)

## Evaluation notes (flywheel)

- Failure modes observed: Script create-new-feature.ps1 errored on the feature description positional arg but branch + spec stub were created correctly — fallback to manual spec write succeeded
- Graders run and results (PASS/FAIL): All 16 checklist items PASS
- Prompt variant (if applicable): /sp.specify with full inline feature description
- Next experiment: Run /sp.plan with the architecture details from user's project structure spec to generate data-model + contracts
