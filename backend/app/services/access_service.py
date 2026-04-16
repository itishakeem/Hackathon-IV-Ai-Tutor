"""Freemium access gate — pure functions, no DB, no LLM."""

# NO LLM imports

# Chapters accessible to free-tier users.
FREEMIUM_GATES: dict[str, list[str]] = {
    "free": ["chapter-01", "chapter-02", "chapter-03"],
}

# Premium and pro users have access to all chapters.
_ALL_CHAPTERS = [
    "chapter-01",
    "chapter-02",
    "chapter-03",
    "chapter-04",
    "chapter-05",
]


def check_access(user_tier: str, chapter_id: str) -> bool:
    """Return True if the user's tier allows access to the given chapter."""
    if user_tier in ("premium", "pro"):
        return chapter_id in _ALL_CHAPTERS
    # free tier
    return chapter_id in FREEMIUM_GATES.get("free", [])


def get_access_reason(user_tier: str, chapter_id: str) -> str | None:
    """Return a human-readable reason why access is denied, or None if allowed."""
    if check_access(user_tier, chapter_id):
        return None
    if user_tier == "free":
        return "This chapter requires a Premium subscription. Upgrade to unlock all 5 modules."
    return "Access denied."
