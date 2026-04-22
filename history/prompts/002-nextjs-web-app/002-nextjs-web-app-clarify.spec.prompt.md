---
id: "002"
title: Next.js Web App Phase 3 Clarify
stage: spec
date: 2026-04-18
surface: agent
model: claude-sonnet-4-6
feature: 002-nextjs-web-app
branch: 002-nextjs-web-app
user: Abdul Hakeem
command: /sp.clarify
labels: ["spec", "clarify", "nextjs", "frontend", "jwt", "ssr", "dark-mode", "typescript"]
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

Review the Phase 3 Next.js specification and clarify these decisions:

## Pre-answered Clarifications

Q: Which Next.js rendering strategy per page?
A: Landing page: SSG. Auth pages: client-side only. Chapter list: SSR. Chapter reader: SSR. Quiz page: client-side only. Dashboard: SSR. Premium page: client-side only.

Q: How is JWT handled between Next.js and FastAPI?
A: Store JWT in Zustand store + localStorage. Axios interceptor reads from Zustand. Rehydrate from localStorage on refresh. On 401: clear store + redirect to /login. No httpOnly cookies — localStorage for hackathon simplicity.

Q: What happens when free user visits /premium?
A: Show locked page UI with upgrade prompt inline (no redirect). Display pricing cards on same page. CTA links to /register or upgrade flow.

Q: How to handle markdown rendering in chapter reader?
A: Use react-markdown with remark-gfm. Tailwind prose classes. Extract ## headings for sidebar outline via rehype plugin.

Q: Dark mode implementation?
A: next-themes. Default to system preference. Toggle button in Navbar.

Q: Mobile navigation?
A: Desktop: fixed left sidebar. Mobile: hamburger → slide-out drawer using shadcn Sheet.

Q: Loading states?
A: shadcn Skeleton for data fetches. Loading spinner on form submissions. Disable buttons during API calls.

Q: Error handling strategy?
A: react-hot-toast for notifications. Inline errors on forms. Empty state components when no data.

Q: Chart library?
A: Recharts for quiz score line chart. Simple, no complex visualisations.

Q: TypeScript strict mode?
A: Yes — strict: true in tsconfig.json.

## Response snapshot

Applied all 10 pre-answered clarifications to `specs/002-nextjs-web-app/spec.md`:

**Key corrections made**:
- FR-003: Updated from httpOnly cookie to localStorage + Zustand rehydration
- FR-006: Added new: clear JWT on 401 → redirect /login
- SC-008: Updated from "httpOnly cookies only" to "localStorage and Zustand store; never in a cookie"
- US1 scenario 5: Updated "secure cookie" → "JWT rehydrated from localStorage into Zustand store"
- Edge case updated: Expired JWT now correctly describes localStorage/Zustand clear pattern
- Added edge case: No JWT in localStorage on app load → unauthenticated redirect

**New functional requirements added** (FR-007 to FR-035):
- FR-007–011: Per-page rendering strategy (SSG/SSR/CSR)
- FR-013–014: react-markdown + remark-gfm + Tailwind prose + rehype sidebar outline
- FR-023: Recharts line chart (explicit)
- FR-030: shadcn Skeleton
- FR-031: react-hot-toast
- FR-034: next-themes dark mode (system default + Navbar toggle)
- FR-035: Desktop fixed sidebar + mobile hamburger → shadcn Sheet drawer

**New SC-010**: No visible theme flash on initial page load.

**Clarifications section** added at top of spec with all 10 Q&A entries under Session 2026-04-18.

**Checklist**: All 16 items PASS.

## Outcome

- Impact: Spec fully clarified — 35 FRs, 10 SCs, 10 edge cases; contradictions between original spec and hackathon JWT approach resolved; ready for /sp.plan
- Tests: n/a (spec stage)
- Files: 2 files updated (spec.md, checklists/requirements.md)
- Next prompts: `/sp.plan` — generate architecture, data model, API contracts, and implementation plan for 002-nextjs-web-app
- Reflection: Critical fix: original spec specified httpOnly cookies but user explicitly chose localStorage for hackathon simplicity — had to update FR-003, SC-008, US1 scenario 5, and edge cases to remove contradictions

## Evaluation notes (flywheel)

- Failure modes observed: Spec had internal contradiction (httpOnly cookies vs localStorage) — caught and resolved during clarification integration
- Graders run and results (PASS/FAIL): 16/16 checklist items PASS
- Prompt variant (if applicable): /sp.clarify with 10 pre-answered questions inline
- Next experiment: /sp.plan — architect the SSG/SSR/CSR hybrid Next.js 15 App Router structure with Zustand + localStorage auth pattern
