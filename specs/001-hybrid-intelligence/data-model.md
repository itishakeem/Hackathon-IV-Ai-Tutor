# Data Model: Phase 2 Hybrid Intelligence

**Branch**: `001-hybrid-intelligence` | **Date**: 2026-04-17

---

## New Entity: LlmUsage

Tracks every LLM call made by the premium endpoints for cost visibility and rate limiting.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | Row identifier |
| `user_id` | UUID | FK → `users.id` ON DELETE CASCADE, NOT NULL | Owning user |
| `feature` | VARCHAR(20) | NOT NULL, CHECK IN ('assessment','synthesis') | Which premium feature triggered the call |
| `tokens_used` | INTEGER | NOT NULL | Total tokens consumed (input + output) |
| `cost_usd` | FLOAT | NOT NULL | Calculated cost in USD |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When the call was made |

**Index**: `idx_llm_usage_user_date` on `(user_id, created_at)` — supports rate-limit count query and usage dashboard ordering.

**Relationships**:
- `user_id` → `users.id` (existing Phase 1 table) — cascade delete removes usage records when user is deleted

---

## New Schemas (Pydantic — request/response)

### AssessmentRequest
```
chapter_id:     str            required, must be in CHAPTER_METADATA allowlist
question:       str            required
student_answer: str            required, min_length=10, max_length=2000 (truncated silently above 2000)
user_id:        UUID           required
```

### AssessmentResponse
```
score:              int         0–100
max_score:          int         always 100
feedback:           str         narrative feedback from LLM
strengths:          list[str]   what the student did well
improvements:       list[str]   what could be improved
suggested_reading:  str         reference to a specific chapter section
```

### SynthesisRequest
```
chapter_ids:   list[str]    required, min_items=2, max_items=5, each in CHAPTER_METADATA allowlist
focus_topic:   str          optional, default="General synthesis across selected chapters"
user_id:       UUID         required
```

### SynthesisResponse
```
synthesis:          str              narrative connecting the chapters
key_connections:    list[str]        each entry cites at least one [chapter-XX]
knowledge_graph:    list[GraphEdge]  list of {from, to, relationship} objects
recommended_next:   str              chapter_id of suggested next chapter
```

### GraphEdge
```
from:           str    source concept
to:             str    target concept
relationship:   str    relationship label (e.g., "uses", "extends", "requires")
```

### LlmUsageRecord (response)
```
id:           UUID
feature:      str       "assessment" | "synthesis"
tokens_used:  int
cost_usd:     float
created_at:   datetime
```

### UsageResponse
```
user_id:      UUID
records:      list[LlmUsageRecord]
total_cost:   float    sum of all cost_usd records returned
```

---

## Entity Relationships (Phase 1 + Phase 2)

```
users (Phase 1)
  ├── progress       (Phase 1) — one-to-many
  ├── quiz_attempts  (Phase 1) — one-to-many
  └── llm_usage      (Phase 2) — one-to-many  ← NEW
```

---

## Validation Rules

| Field | Rule | Error |
|---|---|---|
| `student_answer` | len >= 10 | HTTP 422 |
| `student_answer` | len > 2000 | Silently truncated to 2000 before LLM call |
| `chapter_ids` | 2 ≤ count ≤ 5 | HTTP 422 |
| `chapter_id` / each `chapter_ids` item | Must exist in `CHAPTER_METADATA` | HTTP 404 |
| JWT `tier` claim | Must equal `"pro"` | HTTP 403 |
| Daily LLM call count | Must be < 10 | HTTP 429 |

---

## No Existing Tables Modified

Phase 1 tables (`users`, `progress`, `quiz_attempts`, `search_index`) are unchanged.
The single new table `llm_usage` is appended via a new Alembic migration.
