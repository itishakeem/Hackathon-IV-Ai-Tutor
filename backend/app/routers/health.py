"""Health check router. No auth, no DB. NO LLM imports."""
from fastapi import APIRouter

# NO LLM imports

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
