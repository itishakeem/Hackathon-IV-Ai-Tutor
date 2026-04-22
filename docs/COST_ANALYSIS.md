# Course Companion FTE — Cost Analysis
## Agent Factory Hackathon IV | API Cost Breakdown & Projections

---

## Section 1: Pricing Model

Model: **claude-sonnet-4-20250514** (as configured in `backend/app/core/config.py` and `cost_tracker.py`)

| Token Type   | Price              | Source                       |
|--------------|--------------------|------------------------------|
| Input tokens | $3.00 / 1M tokens  | `SONNET_INPUT_COST` constant |
| Output tokens| $15.00 / 1M tokens | `SONNET_OUTPUT_COST` constant|

These values are hardcoded in `backend/app/premium/services/cost_tracker.py`:
```python
SONNET_INPUT_COST = 3.00 / 1_000_000   # $3.00 per million input tokens
SONNET_OUTPUT_COST = 15.00 / 1_000_000  # $15.00 per million output tokens
```

---

## Section 2: Per-Feature Token Estimates

### Feature 1: LLM-Graded Assessment (`POST /premium/assessment`)

The assessment prompt sends: system instructions + assessment rubric template + full chapter content + student's answer.

| Component             | Est. Tokens | Notes                                      |
|-----------------------|-------------|--------------------------------------------|
| System + rubric prompt| ~500        | assessment_prompt.md template              |
| Chapter content       | ~2,000      | Average markdown chapter (~1,500 words)    |
| Student answer        | ~200        | Min 10 chars, typical ~150 words           |
| **Total input**       | **~2,700**  |                                            |
| LLM output            | ~800        | `MAX_TOKENS_ASSESSMENT = 1000` cap         |
| **Total output**      | **~800**    |                                            |

**Cost per assessment call**:
```
Input:  2,700 × $3.00/1M  = $0.0081
Output:   800 × $15.00/1M = $0.012
Total:                       $0.0201  (~$0.02 per call)
```

### Feature 2: Cross-Chapter Synthesis (`POST /premium/synthesis`)

The synthesis prompt sends: system instructions + synthesis template + 2–5 chapters of content + optional focus topic.

| Component             | Est. Tokens | Notes                                        |
|-----------------------|-------------|----------------------------------------------|
| System + template     | ~600        | synthesis_prompt.md template                 |
| Chapter content (×3)  | ~6,000      | 3 chapters avg (~2,000 each)                 |
| Focus topic (optional)| ~50         | Short phrase                                 |
| **Total input**       | **~6,650**  |                                              |
| LLM output            | ~2,500      | `MAX_TOKENS_SYNTHESIS = 3000` cap            |
| **Total output**      | **~2,500**  |                                              |

**Cost per synthesis call**:
```
Input:  6,650 × $3.00/1M  = $0.01995
Output: 2,500 × $15.00/1M = $0.0375
Total:                       $0.0575  (~$0.06 per call)
```

---

## Section 3: Rate Limiting

All users are capped at **10 LLM calls per day** (UTC reset), enforced in the `llm_usage` table.

- Mix of assessment + synthesis calls counts toward the same 10/day limit
- Worst-case daily spend per user (all synthesis): 10 × $0.0575 = **$0.575/user/day**
- Average case (mixed 7 assessment + 3 synthesis): (7 × $0.02) + (3 × $0.06) = **$0.32/user/day**

---

## Section 4: Monthly Projections

Assumptions:
- Pro users make 3 LLM calls/day on average (30% of daily limit)
- Mix: 70% assessment, 30% synthesis
- Average blended call cost: (0.7 × $0.02) + (0.3 × $0.06) = **$0.032/call**
- Cost per active pro user per day: 3 × $0.032 = **$0.096/day**
- Cost per active pro user per month: $0.096 × 30 = **$2.88/month**

| Pro Users | Calls/Month | Input Tokens | Output Tokens | Monthly LLM Cost |
|-----------|-------------|--------------|---------------|------------------|
| 10        | 900         | ~5.9M        | ~1.4M         | **$28.80**       |
| 50        | 4,500       | ~29.5M       | ~7.0M         | **$144.00**      |
| 100       | 9,000       | ~59M         | ~14M          | **$288.00**      |
| 500       | 45,000      | ~295M        | ~70M          | **$1,440.00**    |

---

## Section 5: Infrastructure Costs

| Service             | Tier / Plan             | Monthly Cost     | Notes                              |
|---------------------|-------------------------|------------------|------------------------------------|
| Fly.io              | Free hobby plan         | $0               | 1 shared-cpu-1x machine, 256MB RAM |
| Vercel              | Hobby plan              | $0               | 100GB bandwidth included           |
| Neon PostgreSQL     | Free tier               | $0               | 0.5 GB storage, 190hr compute/mo   |
| Supabase Storage    | Free tier               | $0               | 1 GB storage (5 chapters ~10 MB)   |
| Cloudflare R2       | Free tier               | $0               | 10 GB storage, 10M requests/month  |
| **Infrastructure**  |                         | **$0**           | Fully on free tiers                |

---

## Section 6: Revenue vs. Cost Model

| Tier    | Price        | LLM access | Break-even point                            |
|---------|--------------|------------|---------------------------------------------|
| Free    | $0           | No         | No LLM cost                                 |
| Premium | $9.99/month  | No         | Pure margin (content access only)           |
| Pro     | $19.99/month | Yes        | Break-even at ~$2.88 LLM cost → **$17.11 margin** |

**Pro tier margin at different engagement levels**:

| Engagement  | LLM calls/day | Monthly LLM cost | Margin/user |
|-------------|---------------|------------------|-------------|
| Low (1/day) | 1             | $0.96            | **$19.03**  |
| Avg (3/day) | 3             | $2.88            | **$17.11**  |
| High (7/day)| 7             | $6.72            | **$13.27**  |
| Max (10/day)| 10            | $9.60            | **$10.39**  |

At all engagement levels, the Pro tier ($19.99) covers LLM costs with healthy margin.

---

## Section 7: Cost Controls

| Control                  | Implementation                                         |
|--------------------------|--------------------------------------------------------|
| Daily rate limit         | 10 calls/user/day via `check_rate_limit()` (DB-backed) |
| Token caps               | `MAX_TOKENS_ASSESSMENT=1000`, `MAX_TOKENS_SYNTHESIS=3000` |
| Tier gating              | `/premium/*` requires `tier in (premium, pro)` JWT claim |
| Usage logging            | Every call logged to `llm_usage` table with `cost_usd` |
| Usage endpoint           | `GET /premium/usage` — users can see their own spend   |
| LLM optional             | Backend starts without `ANTHROPIC_API_KEY` (returns 503) |

---

## Section 8: Hackathon Cost Estimate

For development and demo purposes during the hackathon:

| Activity                    | Calls | Est. Cost |
|-----------------------------|-------|-----------|
| Development testing          | ~50   | ~$2.00    |
| Demo assessments (5 chapters)| ~25   | ~$0.50    |
| Demo syntheses               | ~10   | ~$0.60    |
| Judge/evaluator testing      | ~20   | ~$0.64    |
| **Total hackathon estimate** |       | **~$3.74** |

Well within typical hackathon API credit budgets ($10–$25).
