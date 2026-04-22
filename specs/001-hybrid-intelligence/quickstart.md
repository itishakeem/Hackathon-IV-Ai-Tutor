# Quickstart: Phase 2 Hybrid Intelligence

**Branch**: `001-hybrid-intelligence` | **Date**: 2026-04-17

Prerequisites: Phase 1 fully running (`GET /health` returns 200). Python 3.11, uv.

---

## 1. Add Anthropic dependency

```bash
cd backend
uv add "anthropic>=0.40.0"
```

---

## 2. Set environment variables

Add to `backend/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_MODEL=claude-sonnet-4-20250514
MAX_TOKENS_ASSESSMENT=1000
MAX_TOKENS_SYNTHESIS=3000
```

---

## 3. Run the new migration

```bash
cd backend
uv run alembic upgrade head
# Creates: llm_usage table with idx_llm_usage_user_date index
```

---

## 4. Start the server

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
# Premium routes registered only if ANTHROPIC_API_KEY is set
# Confirm: INFO "Premium routes registered"
```

---

## 5. Register a Pro user for testing

```bash
# Register (Pro tier)
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"pro@test.com","password":"Test1234!","tier":"pro"}'
# Copy the access_token from response

export TOKEN="eyJ..."
export USER_ID="<sub from JWT>"
```

---

## 6. Test LLM-Graded Assessment

```bash
curl -X POST http://localhost:8080/premium/assess-answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-01",
    "question": "Explain the difference between an AI Agent and a Chatbot",
    "student_answer": "An AI agent can take autonomous actions in the world using tools and memory, while a chatbot simply responds to inputs without persistent state or real-world actions.",
    "user_id": "'$USER_ID'"
  }'

# Expected response shape:
# {
#   "score": 88,
#   "max_score": 100,
#   "feedback": "Strong answer...",
#   "strengths": ["Correctly identified action-taking", "Mentioned memory"],
#   "improvements": ["Could elaborate on planning aspect"],
#   "suggested_reading": "chapter-01 section: Agent vs Chatbot"
# }
```

---

## 7. Test Cross-Chapter Synthesis

```bash
curl -X POST http://localhost:8080/premium/synthesize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_ids": ["chapter-01", "chapter-02", "chapter-03"],
    "focus_topic": "How MCP connects agents to the real world",
    "user_id": "'$USER_ID'"
  }'

# Expected response shape:
# {
#   "synthesis": "Across these chapters...",
#   "key_connections": ["Agents need tools [chapter-01] → MCP provides those tools [chapter-03]"],
#   "knowledge_graph": [{"from": "AI Agent", "to": "MCP", "relationship": "uses"}],
#   "recommended_next": "chapter-04"
# }
```

---

## 8. Check usage dashboard

```bash
curl http://localhost:8080/premium/usage/$USER_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected:
# {
#   "user_id": "...",
#   "records": [
#     {"id":"...","feature":"assessment","tokens_used":800,"cost_usd":0.006900,"created_at":"..."},
#     {"id":"...","feature":"synthesis","tokens_used":1800,"cost_usd":0.018900,"created_at":"..."}
#   ],
#   "total_cost": 0.025800
# }
```

---

## 9. Verify 403 for non-Pro user

```bash
# Register a free user
curl -X POST http://localhost:8080/auth/register \
  -d '{"email":"free@test.com","password":"Test1234!","tier":"free"}' \
  -H "Content-Type: application/json"

export FREE_TOKEN="eyJ..."

curl -X POST http://localhost:8080/premium/assess-answer \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chapter_id":"chapter-01","question":"test","student_answer":"test answer here","user_id":"..."}'
# Expected: {"detail": "This feature requires Pro plan. Upgrade at /pricing"}
```

---

## 10. Run tests (LLM mocked — no API key needed for tests)

```bash
cd backend
uv run pytest tests/unit/test_cost_calculator.py tests/unit/test_prompt_builder.py -v
uv run pytest tests/integration/test_premium_endpoints.py -v
# All should pass with mocked Anthropic SDK
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Premium routes not appearing in `/docs` | Check `ANTHROPIC_API_KEY` is set in `.env` |
| `alembic upgrade head` fails | Ensure Neon DB is reachable; check `DATABASE_URL` |
| 500 on assessment | Check `ANTHROPIC_API_KEY` is valid and has quota |
| 404 on chapter | Confirm chapter content was uploaded to Supabase Storage in Phase 1 |
| Tests fail with `ImportError` | Run `uv add "anthropic>=0.40.0"` first |
