# Research: Phase 2 Hybrid Intelligence

**Branch**: `001-hybrid-intelligence` | **Date**: 2026-04-17

---

## Decision 1: Claude Sonnet vs GPT-4 for LLM calls

**Decision**: Use `claude-sonnet-4-20250514` via Anthropic SDK

**Rationale**:
- Constitution (Principle II + Tech Stack) explicitly mandates Claude Sonnet for Phase 2 hybrid features
- Anthropic SDK (`anthropic` Python package) is simpler than OpenAI SDK for structured output via tool_use
- Claude Sonnet handles 200K context window — sufficient for all 5 chapters (~20K tokens) in one synthesis call
- Pricing: ~$3/M input + $15/M output tokens; assessment (~1500 tokens) ≈ $0.014/call, synthesis (~3000 tokens) ≈ $0.027/call

**Alternatives considered**:
- GPT-4o: Higher cost, no constitution mandate, OpenAI SDK adds a second dependency
- Claude Haiku: Cheaper but lower reasoning quality for assessment grading
- Local model (Ollama): Too complex for hackathon, no Fly.io support

---

## Decision 2: Structured output via tool_use vs prompt-parsed JSON

**Decision**: Use Anthropic `tool_use` / `tools` parameter to force structured JSON output

**Rationale**:
- Eliminates JSON parsing failures (the 502 edge case in spec) — Anthropic guarantees tool_use returns valid JSON matching the schema
- Cleaner code than `response.content[0].text` + `json.loads()` + error handling
- Assessment and synthesis schemas are well-defined; tool_use maps directly to Pydantic models
- Tested pattern: define a single "respond" tool with the full output schema, LLM is forced to call it

**Alternatives considered**:
- Plain text + regex parsing: brittle, fails on edge cases
- JSON mode (system prompt instruction): less reliable than tool_use
- Prompt-parsed markdown: unmaintainable

---

## Decision 3: Prompt files (`.md`) vs hardcoded strings

**Decision**: Store prompts as `backend/app/premium/prompts/*.md` files, loaded at startup

**Rationale**:
- Prompts are edited by content/curriculum teams who are not Python developers
- File-based prompts can be updated without redeploying the application (volume mount in Docker)
- Easier to version, review, and diff in PRs than triple-quoted strings buried in service files
- Loaded once at module import time — zero runtime I/O cost after startup

**Alternatives considered**:
- Hardcoded f-strings: Fast to write, impossible to maintain, fails constitution review
- Database storage: Overkill for 2 prompts; adds DB query per LLM call
- Environment variable: Too long, no multiline formatting

---

## Decision 4: `app/premium/` isolation boundary

**Decision**: All Phase 2 code lives exclusively in `backend/app/premium/`; Phase 1 modules never import from it

**Rationale**:
- Constitution Principle II: "Isolated: implemented on separate API routes, not mixed with Phase 1 logic"
- Prevents accidental LLM calls being triggered by Phase 1 routes during refactoring
- Zero-LLM audit (`grep -r "openai\|anthropic" backend/app/` excluding `app/premium/`) still passes
- Phase 1 test suite continues to run with `ANTHROPIC_API_KEY` unset — no import-time errors
- Clean uninstall path: removing `app/premium/` restores full Phase 1 behavior

**Implementation**: `app/main.py` registers premium routers via a conditional import guarded by `settings.ANTHROPIC_API_KEY` existence — if key absent, premium routes simply aren't registered

---

## Decision 5: Cost calculation formula

**Decision**: Calculate `cost_usd` server-side from `usage.input_tokens` + `usage.output_tokens` in Anthropic response

**Formula**:
```python
# claude-sonnet-4-20250514 pricing (April 2026)
INPUT_COST_PER_TOKEN  = 3.00 / 1_000_000   # $3.00 per 1M input tokens
OUTPUT_COST_PER_TOKEN = 15.00 / 1_000_000  # $15.00 per 1M output tokens

cost_usd = (usage.input_tokens * INPUT_COST_PER_TOKEN) +
           (usage.output_tokens * OUTPUT_COST_PER_TOKEN)
```

**Rationale**:
- Anthropic response object always includes `usage.input_tokens` and `usage.output_tokens`
- Server-side calculation is auditable and reproducible; client cannot manipulate it
- Formula stored as constants in `cost_tracker.py` — easy to update when pricing changes

---

## Decision 6: Rate limiting strategy

**Decision**: Enforce max 10 LLM calls per user per day via `llm_usage` table query — no Redis required

**Rationale**:
- `llm_usage` table already exists for cost tracking; count query is O(1) with index on `(user_id, created_at)`
- No additional infrastructure (Redis) needed for hackathon scale
- Daily window = UTC calendar day (midnight to midnight)
- Return HTTP 429 with `{"detail": "Daily limit of 10 LLM calls reached. Resets at midnight UTC."}`

**Alternatives considered**:
- Redis rate limiter: Correct production approach, overkill for hackathon
- Token bucket in memory: Resets on restart, not suitable for multi-worker deployment
- No rate limit: Spec FR requires it; without it a single Pro user could generate unbounded cost

---

## Decision 7: Chapter content grounding strategy

**Decision**: Fetch chapter content from Supabase Storage and inject as `<chapter_content>` XML block in system prompt

**Rationale**:
- Chapter content is the authoritative source; LLM grounded in it cannot hallucinate chapter-specific facts
- XML block with explicit tag name makes it easy to instruct the model to cite `[chapter-XX]` in output
- Content fetch uses existing `r2_client.get_chapter()` — no new infrastructure
- Max content per chapter ~3–4KB; 5 chapters ~20KB — well within 200K context limit

**Implementation**:
```
System: You are a course assessment engine. Evaluate ONLY based on the chapter content below.
<chapter_content id="{chapter_id}">
{chapter_markdown}
</chapter_content>
```

---

## Decision 8: Alembic migration for `llm_usage` table

**Decision**: Add a new Alembic revision on the `001-hybrid-intelligence` branch; never alter Phase 1 migration

**Rationale**:
- Alembic revision chain is append-only; Phase 1 migration `bf15f8c77804` is unmodified
- New revision adds `llm_usage` table with composite index on `(user_id, created_at)` for rate-limit queries
- Migration is idempotent — safe to re-run in Dockerfile CMD

**Schema**:
```sql
CREATE TABLE llm_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature     VARCHAR(20) NOT NULL CHECK (feature IN ('assessment', 'synthesis')),
    tokens_used INTEGER NOT NULL,
    cost_usd    FLOAT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_llm_usage_user_date ON llm_usage(user_id, created_at);
```

---

## Decision 9: Mock strategy for tests

**Decision**: Patch `anthropic.Anthropic.messages.create` at the module level in `conftest.py`; never call real API in tests

**Rationale**:
- Tests must be runnable without `ANTHROPIC_API_KEY` set (CI environments, Phase 1 reruns)
- Mock returns a pre-built `MagicMock` that mimics the Anthropic `Message` object shape:
  - `response.content[0].type = "tool_use"`
  - `response.content[0].input = {...}` (pre-defined JSON matching schema)
  - `response.usage.input_tokens = 500`, `response.usage.output_tokens = 300`
- Separate fixture for assessment and synthesis mocks

---

## Dependency additions

```toml
# Add to backend/pyproject.toml [dependencies]
anthropic>=0.40.0
```

No other new dependencies required.
