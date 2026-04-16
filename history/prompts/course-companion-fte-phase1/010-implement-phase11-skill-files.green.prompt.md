---
id: 010
title: Implement Phase 11 Agent Skill SKILL.md Files
stage: green
date: 2026-04-12
surface: agent
model: claude-sonnet-4-6
feature: course-companion-fte-phase1
branch: main
user: Abdul Hakeem
command: sp.implement
labels: ["skills", "chatgpt-app", "concept-explainer", "quiz-master", "socratic-tutor", "progress-motivator"]
links:
  spec: specs/main/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/skills/concept-explainer.md
  - backend/skills/quiz-master.md
  - backend/skills/socratic-tutor.md
  - backend/skills/progress-motivator.md
  - specs/main/tasks.md
tests:
  - Section verification: all 4 files pass 5-section check (Metadata/Purpose/Workflow/Response Templates/Key Principles)
  - Trigger verification: all required trigger keywords present per task spec
  - No LLM instructions: no openai/anthropic/langchain references in workflow sections
  - API endpoint references: correct API calls in each skill workflow
---

## Prompt

now execute phase 11 from tasks.md and also verify it

## Response snapshot

Created all 4 SKILL.md files in `backend/skills/`:

**T056 — concept-explainer.md**: Triggers: explain/what is/how does. Workflow fetches `GET /chapters/{id}`, extracts relevant section, explains at adaptive complexity. No invented facts. Response templates for standard explanation, not-found, and out-of-scope.

**T057 — quiz-master.md**: Triggers: quiz/test me/practice. Workflow fetches questions via `GET /quizzes/{id}`, presents one-by-one, collects answers, submits via `POST /quizzes/{id}/submit`, delivers results with explanations, records via `PUT /progress/{user_id}/quiz`.

**T058 — socratic-tutor.md**: Triggers: help me think/I'm stuck. Workflow fetches chapter, guides via questions anchored in content, never reveals direct answers, redirects with chapter quotes.

**T059 — progress-motivator.md**: Triggers: my progress/streak/how am I doing. Workflow fetches `GET /progress/{user_id}`, celebrates milestones, suggests next step via `GET /chapters/{id}/next`, records completions via `PUT /progress/{user_id}/chapter`.

**Verification results**: 4/4 files — all 5 sections present, all trigger keywords correct, no LLM API instructions, correct API endpoint references.

## Outcome

- ✅ Impact: Phase 11 complete — 4 SKILL.md files ready for ChatGPT App integration
- 🧪 Tests: Section/trigger/no-LLM/API-endpoint checks — all PASS
- 📁 Files: 4 new files in backend/skills/, tasks.md updated (T056-T059 marked [x])
- 🔁 Next prompts: Phase 12 (ChatGPT App manifest + system prompt), Phase 13 (tests), Phase 14 (deployment)
- 🧠 Reflection: All 4 skills are cleanly separated by concern — no overlap in trigger phrases, each workflow calls only the API endpoints relevant to its function.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): section check 4/4 PASS, trigger check 4/4 PASS, no-LLM check 4/4 PASS, API ref check 4/4 PASS
- Prompt variant (if applicable): sp.implement
- Next experiment: Phase 12 — ChatGPT App manifest wiring all 4 skills
