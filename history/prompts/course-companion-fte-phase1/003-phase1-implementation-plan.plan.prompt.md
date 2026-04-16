---
id: "003"
title: Phase 1 Implementation Plan
stage: plan
date: 2026-04-09
surface: agent
model: claude-sonnet-4-6
feature: course-companion-fte-phase1
branch: main
user: Abdul Hakeem
command: /sp.plan
labels: ["plan","phase1","fastapi","r2","postgresql","zero-backend-llm","chatgpt-app"]
links:
  spec: specs/main/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/main/plan.md
  - specs/main/research.md
  - specs/main/contracts/openapi.yaml
tests:
  - n/a
---

## Prompt

Generate a complete implementation plan for Course Companion FTE Phase 1.
Stack: FastAPI + Cloudflare R2 + Neon PostgreSQL + ChatGPT App.
Zero-Backend-LLM strictly enforced.
Covers: project structure, DB schema, API contracts, service logic, ChatGPT manifest,
content plan, testing plan, deployment plan.

## Response snapshot

Generated 3 artifacts:

1. `specs/main/research.md` — Technology decisions (FastAPI, Neon, R2, ILIKE search,
   JWT HS256, calendar streaks) with rationale and dependency versions.

2. `specs/main/plan.md` — Complete implementation plan covering:
   - Full project folder structure (backend/ + chatgpt-app/)
   - Constitution Check (5 gates: zero-LLM, verbatim content, rule-based grading,
     freemium enforced, secrets via env)
   - SQL table definitions for all 4 tables (users, progress, quiz_attempts, search_index)
   - All 7 router plans with request/response specs
   - Key service implementations (r2_service, quiz_service, progress_service, startup indexer)
   - ChatGPT App manifest plan + 4 SKILL.md outlines
   - Content structure for all 5 chapter files
   - Testing plan (unit: quiz grading + streak; integration: full API flow; load test)
   - Deployment plan (Dockerfile, fly.toml, Neon + R2 provisioning steps)

3. `specs/main/contracts/openapi.yaml` — Full OpenAPI 3.1 spec for all 19 endpoints
   across 7 routers (Health, Auth, Chapters, Search, Quizzes, Progress, Access).

## Outcome

- ✅ Impact: Complete implementation plan ready for /sp.tasks; all architectural
  decisions documented; OpenAPI contract ready for ChatGPT App manifest generation.
- 🧪 Tests: test plan outlined (unit + integration + load)
- 📁 Files: specs/main/plan.md, specs/main/research.md, specs/main/contracts/openapi.yaml
- 🔁 Next prompts: /sp.tasks to generate task list; /sp.implement to build the backend
- 🧠 Reflection: Plan is comprehensive and zero-LLM compliant throughout. Startup
  indexer is the most critical non-obvious piece — must run before search works.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): initial
- Next experiment (smallest change to try): run /sp.tasks to break plan into tasks.md
