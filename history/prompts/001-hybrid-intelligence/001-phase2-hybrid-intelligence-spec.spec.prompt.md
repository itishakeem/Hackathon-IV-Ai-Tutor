---
id: "001"
title: Phase 2 Hybrid Intelligence Feature Spec
stage: spec
date: 2026-04-17
surface: agent
model: claude-sonnet-4-6
feature: 001-hybrid-intelligence
branch: 001-hybrid-intelligence
user: Abdul Hakeem
command: /sp.specify
labels: ["spec", "phase2", "hybrid", "llm", "premium", "assessment", "synthesis"]
links:
  spec: specs/001-hybrid-intelligence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-hybrid-intelligence/spec.md
  - specs/001-hybrid-intelligence/checklists/requirements.md
tests: []
---

## Prompt

# Feature Specification: Course Companion FTE — Phase 2 (Hybrid Intelligence)

Phase 1 is complete and deployed. Now adding 2 premium hybrid features. These are the ONLY places where LLM calls are allowed in the entire project.

Feature B: POST /premium/assess-answer — LLM evaluates free-text student answers, returns score (0-100), feedback, strengths, improvements, suggested_reading. Pro tier only. Grounded in chapter content from R2.

Feature C: POST /premium/synthesize — LLM connects concepts across 2-5 chapters, returns synthesis, key_connections (with chapter citations), knowledge_graph, recommended_next. Pro tier only.

Shared: JWT tier=pro gate (403 for others), llm_usage table tracking every call (user_id, feature, tokens_used, cost_usd), GET /premium/usage/{user_id} dashboard, all code in app/premium/, # HYBRID — LLM CALL comments.

New env vars: ANTHROPIC_API_KEY, LLM_MODEL=claude-sonnet-4-20250514, MAX_TOKENS_ASSESSMENT=1000, MAX_TOKENS_SYNTHESIS=3000.

## Response snapshot

Created feature branch `001-hybrid-intelligence` and wrote complete spec at `specs/001-hybrid-intelligence/spec.md`.

**Spec contents:**
- 3 user stories (P1: Assessment, P2: Synthesis, P3: Usage Dashboard)
- 5 acceptance scenarios each for P1 and P2, 3 for P3
- 5 edge cases (Anthropic timeout→503, malformed LLM JSON→502, long answer truncation, empty focus_topic default, JWT expiry)
- 16 functional requirements (FR-001–FR-016)
- 6 key entities defined
- 8 success criteria (SC-001–SC-008) — all measurable, technology-agnostic

**Checklist:** All 14 items PASS — no [NEEDS CLARIFICATION] markers, scope bounded, ready for `/sp.plan`.

## Outcome

- Spec written: `specs/001-hybrid-intelligence/spec.md`
- Checklist: `specs/001-hybrid-intelligence/checklists/requirements.md` — all PASS
- Branch: `001-hybrid-intelligence` (checked out)
- Next step: `/sp.plan` to generate architecture and data-model decisions
