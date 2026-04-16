---
id: "012"
title: Implement Phase 14 Deployment Config
stage: green
date: 2026-04-16
surface: agent
model: claude-sonnet-4-6
feature: course-companion-fte-phase1
branch: main
user: Abdul Hakeem
command: /sp.implement execute phase 14 from tasks.md
labels: ["deployment", "docker", "fly.io", "requirements", "readme"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/Dockerfile
  - backend/fly.toml
  - backend/requirements.txt
  - backend/README.md
  - backend/.dockerignore
tests:
  - fly.toml TOML syntax validated (python tomllib)
  - Dockerfile structure reviewed
---

## Prompt

execute phase 14 from tasks.md

## Response snapshot

Implemented all 4 tasks in Phase 14 (Deployment):

- **T068** `backend/Dockerfile` — `FROM python:3.11-slim`, installs uv, copies pyproject.toml + uv.lock, runs `uv sync --no-dev --frozen`, copies app code, CMD runs `alembic upgrade head && uvicorn ... --workers 2`
- **T069** `backend/fly.toml` — app `course-companion-fte`, region `iad`, port 8080, health check `GET /health` every 30s, VM 256MB shared CPU; validated with `python -c "import tomllib..."`
- **T070** `backend/requirements.txt` — pinned versions matching pyproject.toml: fastapi, uvicorn, sqlalchemy, alembic, asyncpg, python-jose, passlib, bcrypt, boto3, python-multipart, pydantic-settings, httpx, supabase, email-validator
- **T071** `backend/README.md` — 6 deployment sections: (1) Neon DB setup, (2) Supabase Storage setup + upload script, (3) `fly secrets set` for all 5 env vars, (4) `fly deploy`, (5) verify `/health`, (6) load test with `hey`
- Also created `backend/.dockerignore` to exclude .venv, .env, tests, __pycache__ from image

All T068-T071 marked [x] in specs/main/tasks.md.

## Outcome

- ✅ Impact: Production deployment artifacts complete — Docker image, Fly.io config, pinned deps, and full deployment guide
- 🧪 Tests: fly.toml TOML syntax validated via Python tomllib; Dockerfile structure reviewed
- 📁 Files: backend/Dockerfile, backend/fly.toml, backend/requirements.txt, backend/README.md, backend/.dockerignore
- 🔁 Next prompts: Phase 15 (Polish) — request logging middleware, LLM audit, custom exceptions, load tests
- 🧠 Reflection: Switched from R2 to Supabase Storage (done in earlier phases), so README documents Supabase upload flow instead of R2; README lists 5 env vars (not 6 as in original spec) matching actual config.py

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): fly.toml TOML parse — PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Run `docker build -t course-companion .` in CI to confirm image builds
