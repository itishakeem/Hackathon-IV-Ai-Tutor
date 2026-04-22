---
id: "002"
title: Phase 2 Hybrid Intelligence Implementation Plan
stage: plan
date: 2026-04-17
surface: agent
model: claude-sonnet-4-6
feature: 001-hybrid-intelligence
branch: 001-hybrid-intelligence
user: Abdul Hakeem
command: /sp.plan
labels: ["plan", "phase2", "hybrid", "anthropic", "premium", "assessment", "synthesis", "llm"]
links:
  spec: specs/001-hybrid-intelligence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-hybrid-intelligence/plan.md
  - specs/001-hybrid-intelligence/research.md
  - specs/001-hybrid-intelligence/data-model.md
  - specs/001-hybrid-intelligence/quickstart.md
  - specs/001-hybrid-intelligence/contracts/openapi-premium.yaml
tests: []
---

## Prompt

Generate implementation plan for Phase 2 Hybrid Intelligence features.

Context: Phase 1 complete. Adding 2 premium LLM features on top of existing codebase. Do NOT modify Phase 1 files.

Plan must cover: folder structure (app/premium/), ADRs, LLM integration (Anthropic SDK + tool_use), DB migration (llm_usage table), security (Pro gate + rate limiting), testing (mocked LLM), deployment (Fly.io secrets).

Hard constraints: Phase 1 files not modified, LLM calls only in premium/, every call logged, Pro tier gated, tests mock LLM.

## Response snapshot

Generated 5 planning artifacts:

**research.md** — 9 decisions:
- Claude Sonnet via Anthropic SDK (constitution-mandated)
- tool_use for structured output (eliminates JSON parse failures)
- Prompt files in `app/premium/prompts/` (not hardcoded strings)
- `app/premium/` isolation boundary (constitution Principle II)
- Cost formula: $3/M input + $15/M output tokens
- Rate limit: 10/user/day via llm_usage count query (no Redis)
- Chapter content as `<chapter_content>` XML block in system prompt
- Alembic migration appended to Phase 1 chain
- Mock strategy: patch `anthropic.Anthropic.messages.create` in conftest

**plan.md** — Full architecture:
- Constitution Check: 7/7 PASS
- AD-1: Conditional router registration (guarded by ANTHROPIC_API_KEY)
- AD-2: `require_pro` dependency
- AD-3: LLM call pattern with tool_use
- AD-4: Structured tool schemas for both features
- AD-5: DB rate limiting
- AD-6: Error handling matrix (7 scenarios)
- 13 integration test cases specified

**data-model.md** — LlmUsage entity + all Pydantic schemas
**quickstart.md** — 10-step local dev guide
**contracts/openapi-premium.yaml** — 3 endpoints, full request/response schemas

## Outcome

- All 5 artifacts written to `specs/001-hybrid-intelligence/`
- Constitution Check: ALL PASS
- Next step: `/sp.tasks` to generate task breakdown

ADR suggestions:
- `hybrid-premium-isolation` — why app/premium/ boundary
- `anthropic-tool-use-structured-output` — why tool_use over JSON mode
- `db-rate-limiting` — why DB count over Redis
