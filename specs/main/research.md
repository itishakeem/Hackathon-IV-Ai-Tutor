# Research: Course Companion FTE — Phase 1

**Branch**: `main` | **Date**: 2026-04-09 | **Spec**: specs/main/spec.md

## Technology Decisions

### Decision 1: FastAPI over Flask / Django
- **Decision**: FastAPI (Python 3.11, async)
- **Rationale**: Native async support matches Neon asyncpg driver; automatic OpenAPI
  generation required for ChatGPT App manifest; Pydantic v2 validation built-in;
  fastest Python framework for I/O-bound workloads (R2 + DB reads)
- **Alternatives**: Flask (no native async, no OpenAPI), Django REST (heavy, overkill)

### Decision 2: Neon PostgreSQL over SQLite
- **Decision**: Neon serverless PostgreSQL via asyncpg
- **Rationale**: Hackathon spec mandates Neon; serverless branching enables free-tier
  usage; ILIKE full-text search available; persistent storage for progress/streaks;
  UUID primary keys native
- **Alternatives**: SQLite (no concurrent writes, no UUID type), Supabase (similar cost,
  less serverless-friendly for connection pooling)

### Decision 3: Cloudflare R2 over AWS S3
- **Decision**: Cloudflare R2 via boto3 (S3-compatible API)
- **Rationale**: Hackathon spec mandates R2; zero egress cost vs S3 ($0.09/GB);
  boto3 compatible — no new SDK needed; endpoint URL pattern:
  `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`
- **Alternatives**: S3 (egress costs), local filesystem (not production-viable)

### Decision 4: ILIKE search over PostgreSQL full-text search (tsvector)
- **Decision**: Pre-built `search_index` table, ILIKE queries
- **Rationale**: Simpler implementation; sufficient for hackathon scale (5 chapters);
  avoids tsvector/tsquery complexity; startup indexer runs once, not per-request;
  deterministic and zero-LLM compliant
- **Alternatives**: tsvector (more powerful but more complex migration), Elasticsearch
  (over-engineered for 5 documents)

### Decision 5: Calendar-day streaks over chapter-count streaks
- **Decision**: `streak_days` increments once per calendar day a chapter is completed;
  resets to 0 if gap > 1 day; tracked via `last_activity_date` DATE column
- **Rationale**: Aligns with user motivation model (daily habit); predictable reset
  behavior; simple deterministic logic; matches industry standard (Duolingo)
- **Alternatives**: Chapter-count (not time-aware, less motivating)

### Decision 6: JWT HS256 over OAuth2 / API keys
- **Decision**: JWT HS256 signed with SECRET_KEY; token payload includes sub, tier, exp
- **Rationale**: Self-contained (no DB lookup per request); tier embedded in token
  enables fast freemium checks without extra DB query; python-jose is lightweight;
  aligns with FastAPI OAuth2PasswordBearer pattern
- **Alternatives**: OAuth2 (too complex for hackathon), API keys (no expiry, harder
  to embed tier info)

### Decision 7: SQLAlchemy 2.0 async + Alembic over raw SQL
- **Decision**: SQLAlchemy 2.0 async ORM with Alembic migrations
- **Rationale**: Type-safe models; async session compatible with asyncpg; Alembic
  provides reproducible schema migrations; industry standard
- **Alternatives**: raw asyncpg (no ORM safety), Tortoise ORM (smaller community)

### Decision 8: boto3 startup indexer over per-request R2 reads for search
- **Decision**: On `startup` event, read all 5 chapter files from R2, upsert into
  `search_index` table; search queries hit DB only
- **Rationale**: R2 has ~50-100ms per read; 5 chapters × per-request = 250-500ms
  overhead on every search; startup indexer runs once, search queries stay <50ms;
  content changes rarely during hackathon
- **Alternatives**: Per-request R2 scan (too slow), caching layer (Redis — overkill)

## Dependency Versions

```
fastapi==0.110.0
uvicorn[standard]==0.27.1
sqlalchemy==2.0.28
alembic==1.13.1
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
boto3==1.34.0
python-multipart==0.0.9
httpx==0.27.0          # test client
pytest==8.1.0
pytest-asyncio==0.23.5
pydantic-settings==2.2.1
```
