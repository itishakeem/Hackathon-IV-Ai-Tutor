---
id: "001"
title: Write Project Constitution
stage: constitution
date: 2026-04-09
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: /sp.constitution
labels: ["constitution","hackathon","course-companion-fte","zero-backend-llm","agent-factory"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - history/prompts/constitution/001-write-project-constitution.constitution.prompt.md
tests:
  - n/a
---

## Prompt

read this hackathon file and write constitution.

(User attached: Course Companion FTE | Agent Factory Hackathon IV Document PDF — 24 pages)

## Response snapshot

Read the 24-page Hackathon IV PDF describing the Course Companion FTE project (a Digital
Full-Time Equivalent educational tutor). Extracted key architectural principles, technology
stack requirements, phase structure, judging criteria, and delivery requirements.

Wrote the project constitution to `.specify/memory/constitution.md` (v1.0.0) with 7 core
principles:
1. Zero-Backend-LLM by Default (Phase 1 disqualification if violated)
2. Hybrid Intelligence is Selective and Premium (Phase 2 rules)
3. Spec-Driven Development — Spec is Source Code
4. Dual-Frontend, Shared Deterministic Backend
5. Content Stored in Cloudflare R2
6. Freemium Access Control is Mandatory from Day One
7. Observability and Cost Transparency

Also documented the full technology stack (FastAPI + OpenAI Apps SDK + Next.js +
Cloudflare R2), development workflow with 7 steps and required SKILL.md files, and
governance section with amendment procedure.

## Outcome

- ✅ Impact: Project constitution established for Hackathon IV Course Companion FTE;
  all 7 principles derived directly from hackathon PDF requirements; disqualification
  criteria encoded as NON-NEGOTIABLE constraints.
- 🧪 Tests: n/a (constitution artifact, not executable code)
- 📁 Files: .specify/memory/constitution.md (created v1.0.0)
- 🔁 Next prompts: /sp.specify to create feature spec for Phase 1 backend; /sp.plan
  to architect the deterministic FastAPI backend
- 🧠 Reflection: Constitution successfully encodes all hackathon constraints including
  the strict Zero-Backend-LLM rule that causes immediate disqualification if violated.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): initial
- Next experiment (smallest change to try): run /sp.specify with course topic choice
  (Option A: AI Agent Development recommended given project tooling)
