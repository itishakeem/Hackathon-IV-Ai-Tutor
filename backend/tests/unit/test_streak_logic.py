"""Unit tests for streak calculation logic. Deterministic only — NO LLM."""
import uuid
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.progress_service import complete_chapter

# NO LLM imports

CHAPTER_ID = "chapter-01"


def _make_progress_row(streak_days: int, last_activity_date):
    """Build a mock Progress row with given streak/date."""
    row = MagicMock()
    row.completed = True
    row.streak_days = streak_days
    row.last_activity_date = last_activity_date
    return row


async def _run_complete_chapter(db, user_id, chapter_id, today, existing_row=None):
    """Run complete_chapter with a mocked DB and fixed 'today' date."""

    async def mock_execute(stmt):
        result = MagicMock()
        result.scalar_one_or_none.return_value = existing_row
        return result

    db.execute = mock_execute
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock(side_effect=lambda row: None)

    with patch("app.services.progress_service.datetime") as mock_dt:
        mock_dt.now.return_value.date.return_value = today
        mock_dt.now.return_value = MagicMock(
            date=MagicMock(return_value=today)
        )
        # Also patch the date comparison
        import app.services.progress_service as ps
        original_now = ps.datetime

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await complete_chapter(db, user_id, chapter_id)

    return result, existing_row


# ── Streak logic tests ──────────────────────────────────────────────────────

class TestStreakLogic:
    """Tests for the calendar-day streak calculation in complete_chapter."""

    @pytest.mark.asyncio
    async def test_first_completion_sets_streak_to_one(self):
        """First time completing a chapter → streak_days == 1."""
        db = MagicMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        today = date(2026, 4, 12)

        added_row = None

        # No existing row in DB
        async def mock_execute(stmt):
            r = MagicMock()
            r.scalar_one_or_none.return_value = None
            return r

        def capture_add(row):
            nonlocal added_row
            added_row = row

        db.execute = mock_execute
        db.add = capture_add
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        import app.services.progress_service as ps

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await ps.complete_chapter(db, user_id, CHAPTER_ID)

        # The new Progress row is created with streak_days=1
        assert added_row is not None
        assert added_row.streak_days == 1
        assert added_row.completed is True

    @pytest.mark.asyncio
    async def test_same_day_completion_streak_unchanged(self):
        """Completing same chapter on same calendar day → streak unchanged."""
        db = MagicMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        today = date(2026, 4, 12)

        existing = MagicMock()
        existing.completed = True
        existing.streak_days = 3
        existing.last_activity_date = today  # same day

        async def mock_execute(stmt):
            r = MagicMock()
            r.scalar_one_or_none.return_value = existing
            return r

        db.execute = mock_execute
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        import app.services.progress_service as ps

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await ps.complete_chapter(db, user_id, CHAPTER_ID)

        assert result.streak_days == 3  # unchanged

    @pytest.mark.asyncio
    async def test_next_day_completion_increments_streak(self):
        """Completing on the next consecutive calendar day → streak += 1."""
        db = MagicMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        yesterday = date(2026, 4, 11)
        today = date(2026, 4, 12)

        existing = MagicMock()
        existing.completed = True
        existing.streak_days = 5
        existing.last_activity_date = yesterday

        async def mock_execute(stmt):
            r = MagicMock()
            r.scalar_one_or_none.return_value = existing
            return r

        db.execute = mock_execute
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        import app.services.progress_service as ps

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await ps.complete_chapter(db, user_id, CHAPTER_ID)

        assert result.streak_days == 6  # incremented

    @pytest.mark.asyncio
    async def test_two_day_gap_resets_streak_to_one(self):
        """Gap of 2 days → streak resets to 1."""
        db = MagicMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        two_days_ago = date(2026, 4, 10)
        today = date(2026, 4, 12)

        existing = MagicMock()
        existing.completed = True
        existing.streak_days = 7
        existing.last_activity_date = two_days_ago

        async def mock_execute(stmt):
            r = MagicMock()
            r.scalar_one_or_none.return_value = existing
            return r

        db.execute = mock_execute
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        import app.services.progress_service as ps

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await ps.complete_chapter(db, user_id, CHAPTER_ID)

        assert result.streak_days == 1  # reset

    @pytest.mark.asyncio
    async def test_ten_day_gap_resets_streak_to_one(self):
        """Gap of 10 days → streak resets to 1."""
        db = MagicMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        ten_days_ago = date(2026, 4, 2)
        today = date(2026, 4, 12)

        existing = MagicMock()
        existing.completed = True
        existing.streak_days = 30
        existing.last_activity_date = ten_days_ago

        async def mock_execute(stmt):
            r = MagicMock()
            r.scalar_one_or_none.return_value = existing
            return r

        db.execute = mock_execute
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        import app.services.progress_service as ps

        class FakeDatetime:
            @staticmethod
            def now(tz=None):
                class _dt:
                    def date(self_):
                        return today
                return _dt()

        with patch.object(ps, "datetime", FakeDatetime):
            result = await ps.complete_chapter(db, user_id, CHAPTER_ID)

        assert result.streak_days == 1  # reset


def test_progress_service_has_no_llm_imports():
    """Verify progress_service.py imports no LLM libraries."""
    import app.services.progress_service as ps_module
    with open(ps_module.__file__, "r", encoding="utf-8") as f:
        source = f.read()

    forbidden = ["openai", "anthropic", "langchain", "llama", "cohere", "huggingface"]
    for lib in forbidden:
        assert lib not in source.lower(), (
            f"progress_service.py imports forbidden LLM library: {lib}"
        )
