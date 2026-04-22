"""FastAPI application entry point."""
import json
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.startup import build_search_index
from app.routers import access, auth, chapters, health, progress, quizzes, search

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before serving requests."""
    logger.info("Starting up Course Companion API…")
    async with AsyncSessionLocal() as db:
        await build_search_index(db)
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Course Companion FTE",
    description="AI Agent Development course tutor — Zero-Backend-LLM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log method, path, status_code, and duration_ms as JSON on every request."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        json.dumps(
            {
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            }
        )
    )
    return response


# Routers
app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(chapters.router, prefix="/chapters", tags=["chapters"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(access.router, prefix="/access", tags=["access"])

# Phase 2: Hybrid Intelligence — premium routes
# Routes are always registered so tests can verify them with mocked LLM calls.
# Runtime LLM calls require ANTHROPIC_API_KEY — the service raises 503 if absent.
from app.premium.routers import assessment, synthesis, usage  # noqa: E402

app.include_router(assessment.router, prefix="/premium", tags=["premium"])
app.include_router(synthesis.router, prefix="/premium", tags=["premium"])
app.include_router(usage.router, prefix="/premium", tags=["premium"])
if settings.ANTHROPIC_API_KEY:
    logger.info("Premium routes registered (LLM active)")
