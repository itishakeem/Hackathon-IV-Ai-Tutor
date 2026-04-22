---
id: "003"
title: Phase 2 Hybrid Intelligence Task Breakdown
stage: tasks
date: 2026-04-17
surface: agent
model: claude-sonnet-4-6
feature: 001-hybrid-intelligence
branch: 001-hybrid-intelligence
user: Abdul Hakeem
command: /sp.tasks
labels: ["tasks", "phase2", "hybrid", "anthropic", "premium", "assessment", "synthesis", "llm", "milestones"]
links:
  spec: specs/001-hybrid-intelligence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-hybrid-intelligence/tasks.md
tests: []
---

## Prompt

Break Phase 2 plan into atomic tasks.

## Task Order

### Milestone 1: Foundation
- M1-T1: Create app/premium/ folder structure
- M1-T2: Add ANTHROPIC_API_KEY to config.py
- M1-T3: Create llm_usage model
- M1-T4: Write Alembic migration for llm_usage table
- M1-T5: Create cost_tracker.py service

### Milestone 2: Assessment Feature
- M2-T1: Write assessment_prompt.md
- M2-T2: Create assessment schemas (request + response)
- M2-T3: Build assessment_service.py with Claude Sonnet call
- M2-T4: Build assessment.py router with pro gate
- M2-T5: Register router in main.py under /premium prefix
- M2-T6: Write unit + integration tests (mocked LLM)

### Milestone 3: Synthesis Feature
- M3-T1: Write synthesis_prompt.md
- M3-T2: Create synthesis schemas (request + response)
- M3-T3: Build synthesis_service.py with Claude Sonnet call
- M3-T4: Build synthesis.py router with pro gate
- M3-T5: Write unit + integration tests (mocked LLM)

### Milestone 4: Usage Dashboard
- M4-T1: Build usage.py router (GET /premium/usage/{user_id})
- M4-T2: Write usage tests

### Milestone 5: Deployment
- M5-T1: Add ANTHROPIC_API_KEY secret to Fly.io
- M5-T2: Run fly deploy
- M5-T3: Verify all premium endpoints live
- M5-T4: Run full test suite (Phase 1 + Phase 2)

## Task Format
For each task:
- Task ID
- Files to create or modify
- Acceptance criteria
- Depends on

## Strict Rules
- Mark every LLM call with # HYBRID — LLM CALL comment
- Phase 1 files = read only (except main.py to register new router)
- All tests mock Anthropic API

## Response snapshot

Generated `specs/001-hybrid-intelligence/tasks.md` with 40 atomic tasks across 6 phases:

**Phase 1 (Setup, T001–T008)**: Install anthropic SDK, update config.py + .env.example, create premium/ skeleton (5 parallel init files)

**Phase 2 (Foundation, T009–T012)**: LlmUsage SQLAlchemy model, models/__init__.py export, Alembic migration, cost_tracker.py (calculate_cost + log_usage + check_rate_limit)

**Phase 3 (US1 Assessment P1, T013–T021)**: 3 test files written first (RED), then assessment_prompt.md, AssessmentRequest/Response schemas, assessment_service.py with `# HYBRID — LLM CALL`, assessment router, main.py registration, verify GREEN

**Phase 4 (US2 Synthesis P2, T022–T029)**: 2 test additions (RED), synthesis_prompt.md, SynthesisRequest/Response/GraphEdge schemas, synthesis_service.py with `# HYBRID — LLM CALL`, synthesis router, main.py registration, verify GREEN

**Phase 5 (US3 Dashboard P3, T030–T034)**: 1 test addition (RED), LlmUsageRecord/UsageResponse schemas, usage router with ownership check, main.py registration, verify GREEN

**Phase 6 (Polish/Deploy, T035–T040)**: Full suite (20 tests), regression (Phase 1 + 2), Fly.io secrets, fly deploy, 2 post-deploy checks

## Outcome

- Impact: 40 atomic tasks across 6 phases covering all 3 user stories; organized for independent story delivery; MVP = Phase 1+2+3 (Assessment only)
- Tests: 20 total test cases specified (13 integration + 7 unit); all mock Anthropic SDK; TDD order enforced (RED before GREEN)
- Files: specs/001-hybrid-intelligence/tasks.md (created)
- Next prompts: `/sp.implement execute phase 1 from tasks.md` to begin M1 Foundation
- Reflection: Tasks follow strict SDD rule — tests written before implementation; LLM call comment enforced per task description; Phase 1 file restrictions called out explicitly per task

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): tasks.md format validation PASS; all 40 tasks have checkbox + ID + file path
- Prompt variant (if applicable): user-provided milestone structure mapped to SDD phase/story format
- Next experiment: implement Phase 1+2+3 as MVP increment, validate Assessment endpoint before proceeding to Synthesis
