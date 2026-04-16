---
id: "004"
title: Generate Phase 1 Task List
stage: tasks
date: 2026-04-09
surface: agent
model: claude-sonnet-4-6
feature: course-companion-fte-phase1
branch: main
user: Abdul Hakeem
command: /sp.tasks
labels: ["tasks","phase1","milestones","zero-backend-llm","fastapi"]
links:
  spec: specs/main/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/main/tasks.md
tests:
  - n/a
---

## Prompt

Break the implementation plan into atomic tasks for Course Companion FTE Phase 1.
9 milestones: Project Foundation, Database, R2, Content Files, API Routers (7),
Agent Skills, ChatGPT App, Testing, Deployment.

## Response snapshot

Generated `specs/main/tasks.md` with 76 tasks across 15 phases (milestones mapped to
phased dependency order). Key structure:

- Phase 1 (Setup): T001–T005 — uv init, pyproject.toml, folder structure, env files
- Phase 2 (Foundational): T006–T016 — config, DB, security, 4 models, Alembic migrations
- Phase 3 (R2 + Startup): T017–T019 — r2_client, startup indexer, main.py lifespan
- Phase 4 (Content): T020–T031 — 5 chapters + 5 quizzes + R2 upload script (all [P])
- Phase 5a–5f (Routers): T032–T055 — Auth, Access, Health+Chapters, Search, Quizzes, Progress
- Phase 6 (Skills): T056–T059 — 4 SKILL.md files (all [P])
- Phase 7 (ChatGPT App): T060–T062 — openapi.yaml, manifest.yaml, system-prompt.md
- Phase 8 (Tests): T063–T067 — conftest, quiz grading unit, streak unit, integration
- Phase 9 (Deploy): T068–T071 — Dockerfile, fly.toml, requirements.txt, README
- Phase 15 (Polish): T072–T076 — logging, LLM audit grep, exceptions, load tests

Every router task includes Zero-LLM acceptance criterion. T073 is explicit LLM grep
audit gate. Critical path and parallel opportunities documented.

## Outcome

- ✅ Impact: 76 atomic tasks ready for /sp.implement; dependency graph documented;
  MVP critical path identified; parallel opportunities marked with [P].
- 🧪 Tests: Test tasks T063–T067 included with unit+integration+load test plan
- 📁 Files: specs/main/tasks.md
- 🔁 Next prompts: /sp.implement to start executing tasks
- 🧠 Reflection: Milestone 5 (routers) correctly split into 6 sub-phases (5a–5f) to
  enforce auth → access → content dependency order.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): initial
- Next experiment (smallest change to try): run /sp.implement starting from T001
