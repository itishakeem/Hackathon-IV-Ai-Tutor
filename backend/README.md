# Course Companion FTE — Backend

AI-powered course tutor backend for Panaversity Hackathon IV. Zero LLM calls — content served from Supabase Storage, grading via rule-based comparison.

## Tech Stack

- **FastAPI** 0.110.0 + **uvicorn** 0.27.1
- **SQLAlchemy** 2.0 async + **asyncpg** + **Neon PostgreSQL**
- **Supabase Storage** — chapter markdown and quiz JSON
- **JWT HS256** via python-jose — freemium tier gate in token payload
- **Alembic** — database migrations

## Deployment Steps

### 1. Neon DB Setup

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (pooled, `postgresql+asyncpg://` scheme):
   ```
   postgresql+asyncpg://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
   ```
3. Migrations run automatically on container start via `alembic upgrade head`.

### 2. Supabase Storage Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Create a **public** bucket named `study-content`.
3. Upload chapter and quiz content:
   ```bash
   # Upload all chapter markdown files
   for f in content/chapters/*.md; do
     supabase storage cp "$f" ss:///study-content/chapters/
   done

   # Upload all quiz JSON files
   for f in quizzes/*.json; do
     supabase storage cp "$f" ss:///study-content/quizzes/
   done
   ```
4. Copy your **Service Role Key** from Project Settings → API.

### 3. Set Fly.io Secrets

Generate a JWT secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Set all 5 required environment variables:
```bash
fly secrets set \
  DATABASE_URL="postgresql+asyncpg://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require" \
  SUPABASE_URL="https://<project-id>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" \
  SUPABASE_BUCKET="study-content" \
  SECRET_KEY="<your-256-bit-secret>"
```

### 4. Deploy to Fly.io

```bash
# Install flyctl if not already installed
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login

# Launch app (first time only)
fly launch --no-deploy

# Deploy
fly deploy
```

### 5. Verify `/health`

```bash
curl https://course-companion-fte.fly.dev/health
# Expected: {"status": "ok"}
```

### 6. Load Test with `hey`

Install [hey](https://github.com/rakyll/hey):
```bash
go install github.com/rakyll/hey@latest
```

Get a token first:
```bash
TOKEN=$(curl -s -X POST https://course-companion-fte.fly.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","tier":"free"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

Run load tests:
```bash
# Chapter endpoint — target p95 ≤ 500ms
hey -n 500 -c 50 -H "Authorization: Bearer $TOKEN" \
  https://course-companion-fte.fly.dev/chapters/chapter-01

# Progress endpoint — target p95 ≤ 200ms
USER_ID=$(python -c "import jwt; print(jwt.decode('$TOKEN', options={'verify_signature': False})['sub'])")
hey -n 500 -c 50 -H "Authorization: Bearer $TOKEN" \
  https://course-companion-fte.fly.dev/progress/$USER_ID
```

## Local Development

```bash
# Install dependencies
uv sync

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
uv run alembic upgrade head

# Start server
uv run uvicorn app.main:app --reload --port 8080
```

## Docker Build

```bash
# Build image
docker build -t course-companion .

# Run locally
docker run -p 8080:8080 --env-file .env course-companion
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `SUPABASE_URL` | Supabase project URL (`https://<id>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `SUPABASE_BUCKET` | Storage bucket name (default: `study-content`) |
| `SECRET_KEY` | 256-bit hex secret for JWT HS256 signing |

## Running Tests

```bash
# All tests
uv run pytest tests/ -v

# Unit tests only
uv run pytest tests/unit/ -v

# Integration tests only
uv run pytest tests/integration/ -v

# With coverage
uv run pytest tests/ --cov=app --cov-report=term-missing
```
