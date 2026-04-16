"""Supabase Storage client — verbatim content delivery, zero transformation."""
import json

from supabase import Client, create_client

from app.core.config import settings

# Chapter IDs in order — used by startup indexer and navigation helpers.
CHAPTER_IDS = [
    "chapter-01",
    "chapter-02",
    "chapter-03",
    "chapter-04",
    "chapter-05",
]

CHAPTER_TITLES = {
    "chapter-01": "Introduction to AI Agents",
    "chapter-02": "Claude Agent SDK",
    "chapter-03": "Model Context Protocol (MCP)",
    "chapter-04": "Agent Skills (SKILL.md)",
    "chapter-05": "Multi-Agent Systems",
}


def _make_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# Module-level singleton — created once at import time.
_supabase: Client = _make_client()


def get_chapter(chapter_id: str) -> str:
    """Return verbatim UTF-8 text of a chapter markdown file from Supabase Storage.

    Raises KeyError if the chapter does not exist.
    """
    path = f"chapters/{chapter_id}.md"
    try:
        data: bytes = _supabase.storage.from_(settings.SUPABASE_BUCKET).download(path)
        return data.decode("utf-8")
    except Exception as exc:
        msg = str(exc)
        if "Not Found" in msg or "404" in msg or "Object not found" in msg:
            raise KeyError(f"Chapter not found in storage: {chapter_id}") from exc
        raise


def get_quiz(chapter_id: str) -> dict:
    """Return parsed quiz JSON (with answer keys) for a chapter from Supabase Storage.

    The returned dict contains the full quiz including correct_answer fields.
    Raises KeyError if the quiz does not exist.
    """
    quiz_num = chapter_id.split("-")[1]
    path = f"quizzes/quiz-{quiz_num}.json"
    try:
        data: bytes = _supabase.storage.from_(settings.SUPABASE_BUCKET).download(path)
        return json.loads(data.decode("utf-8"))
    except Exception as exc:
        msg = str(exc)
        if "Not Found" in msg or "404" in msg or "Object not found" in msg:
            raise KeyError(f"Quiz not found in storage: {chapter_id}") from exc
        raise
