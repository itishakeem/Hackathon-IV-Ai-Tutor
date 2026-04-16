"""Search router — ILIKE keyword search against DB index. NO LLM imports."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.search_service import keyword_search

# NO LLM imports

router = APIRouter()


class SearchResult(BaseModel):
    chapter_id: str
    chapter_title: str
    excerpt: str


@router.get("", response_model=list[SearchResult])
async def search(
    q: Annotated[str, Query(min_length=2, description="Search query (min 2 characters)")],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
):
    """Keyword search across all indexed chapter content. Requires authentication."""
    results = await keyword_search(db, q)
    return results
