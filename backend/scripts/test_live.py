"""Full end-to-end live test against running server."""
import sys, httpx, json, uuid, base64

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:8080"
email = f"demo_{uuid.uuid4().hex[:8]}@example.com"
pw = "Demo1234!"
PASS = 0
FAIL = 0


def h(label, r, expect=None):
    global PASS, FAIL
    ok = r.status_code < 400 if expect is None else r.status_code == expect
    tag = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
        try:
            body_str = json.dumps(r.json())[:120]
        except Exception:
            body_str = r.text[:120]
        print(f"  [{r.status_code}] {tag}  {label}  -> {body_str}")
        return r.json() if r.headers.get("content-type","").startswith("application/json") else {}
    print(f"  [{r.status_code}] {tag}  {label}")
    if r.status_code == 204 or not r.content:
        return {}
    try:
        return r.json()
    except Exception:
        return {}


# ── 1. HEALTH ────────────────────────────────────────────────
print("=" * 55)
print("1. HEALTH")
print("=" * 55)
r = httpx.get(f"{BASE}/health", timeout=10)
body = h("GET /health", r, 200)
print(f"       {body}")

# ── 2. AUTH ──────────────────────────────────────────────────
print()
print("=" * 55)
print("2. AUTH")
print("=" * 55)
r = httpx.post(f"{BASE}/auth/register", json={"email": email, "password": pw}, timeout=10)
body = h("POST /auth/register (201)", r, 201)
token = body.get("access_token", "")
H = {"Authorization": f"Bearer {token}"}
payload = json.loads(base64.b64decode(token.split(".")[1] + "=="))
user_id = payload["sub"]
tier = payload.get("tier", "free")
print(f"       user_id={user_id}  tier={tier}")

r = httpx.post(f"{BASE}/auth/register", json={"email": email, "password": pw}, timeout=10)
h("POST /auth/register duplicate (409)", r, 409)

r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": pw}, timeout=10)
h("POST /auth/login (200)", r, 200)

r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": "wrongpass"}, timeout=10)
h("POST /auth/login wrong password (401)", r, 401)

# ── 3. ACCESS ────────────────────────────────────────────────
print()
print("=" * 55)
print("3. ACCESS / FREEMIUM GATE")
print("=" * 55)
r = httpx.get(f"{BASE}/access/check?chapter_id=chapter-01", headers=H, timeout=10)
body = h("GET /access/check chapter-01 free -> allowed", r, 200)
print(f"       allowed={body.get('allowed')}  tier={body.get('tier')}")

r = httpx.get(f"{BASE}/access/check?chapter_id=chapter-04", headers=H, timeout=10)
body = h("GET /access/check chapter-04 free -> blocked (allowed=false)", r, 200)
print(f"       allowed={body.get('allowed')}  reason={body.get('reason')}")

# ── 4. CHAPTERS ──────────────────────────────────────────────
print()
print("=" * 55)
print("4. CHAPTERS")
print("=" * 55)
r = httpx.get(f"{BASE}/chapters", headers=H, timeout=10)
body = h("GET /chapters (list all 5)", r, 200)
locked = [c["chapter_id"] for c in body if c.get("locked")]
print(f"       {len(body)} chapters  locked={locked}")

r = httpx.get(f"{BASE}/chapters/chapter-01", headers=H, timeout=15)
body = h("GET /chapters/chapter-01 (content)", r, 200)
print(f"       content={len(body.get('content',''))} chars  title={body.get('title')}")

r = httpx.get(f"{BASE}/chapters/chapter-04", headers=H, timeout=10)
h("GET /chapters/chapter-04 free tier -> 403", r, 403)

r = httpx.get(f"{BASE}/chapters/chapter-01/next", headers=H, timeout=10)
body = h("GET /chapters/chapter-01/next", r, 200)
print(f"       next -> {body.get('chapter_id')}")

r = httpx.get(f"{BASE}/chapters/chapter-02/previous", headers=H, timeout=10)
body = h("GET /chapters/chapter-02/previous", r, 200)
print(f"       prev -> {body.get('chapter_id')}")

r = httpx.get(f"{BASE}/chapters/chapter-01/summary", headers=H, timeout=15)
body = h("GET /chapters/chapter-01/summary", r, 200)
pts = body.get("key_points", [])
print(f"       {len(pts)} key_points: {pts[:1]}")

# ── 5. SEARCH ────────────────────────────────────────────────
print()
print("=" * 55)
print("5. SEARCH")
print("=" * 55)
r = httpx.get(f"{BASE}/search?q=agent", headers=H, timeout=10)
body = h("GET /search?q=agent", r, 200)
first = body[0]["chapter_id"] if body else "none"
print(f"       {len(body)} results  first={first}")

r = httpx.get(f"{BASE}/search?q=x", headers=H, timeout=10)
h("GET /search?q=x (1 char) -> 422", r, 422)

# ── 6. QUIZZES ───────────────────────────────────────────────
print()
print("=" * 55)
print("6. QUIZZES")
print("=" * 55)
r = httpx.get(f"{BASE}/quizzes/chapter-01", headers=H, timeout=15)
body = h("GET /quizzes/chapter-01 (questions, no answers)", r, 200)
qs = body.get("questions", [])
exposed = any("correct_answer" in q for q in qs)
print(f"       {len(qs)} questions  correct_answer_exposed={exposed}")

r = httpx.get(f"{BASE}/quizzes/chapter-01/answers", headers=H, timeout=10)
h("GET /quizzes/chapter-01/answers before attempt -> 403", r, 403)

r = httpx.post(
    f"{BASE}/quizzes/chapter-01/submit",
    headers=H,
    json={"answers": {"q1": "B", "q2": "C", "q3": "B", "q4": "C", "q5": "C"}},
    timeout=15,
)
body = h("POST /quizzes/chapter-01/submit (all correct)", r, 200)
print(f"       score={body.get('score')}/{body.get('total')}  pct={body.get('percentage')}%")

r = httpx.post(
    f"{BASE}/quizzes/chapter-01/submit",
    headers=H,
    json={"answers": {"q1": "A", "q2": "A", "q3": "A", "q4": "A", "q5": "A"}},
    timeout=15,
)
body = h("POST /quizzes/chapter-01/submit (all wrong)", r, 200)
print(f"       score={body.get('score')}/{body.get('total')}  pct={body.get('percentage')}%")

r = httpx.get(f"{BASE}/quizzes/chapter-01/answers", headers=H, timeout=15)
body = h("GET /quizzes/chapter-01/answers after attempt", r, 200)
print(f"       {len(body.get('answers',[]))} answers returned")

# ── 7. PROGRESS ──────────────────────────────────────────────
print()
print("=" * 55)
print("7. PROGRESS")
print("=" * 55)
r = httpx.put(
    f"{BASE}/progress/{user_id}/chapter",
    headers=H,
    json={"chapter_id": "chapter-01"},
    timeout=10,
)
body = h("PUT /progress/.../chapter (ch-01 complete)", r, 200)
print(f"       streak_days={body.get('streak_days')}")

r = httpx.put(
    f"{BASE}/progress/{user_id}/chapter",
    headers=H,
    json={"chapter_id": "chapter-02"},
    timeout=10,
)
body = h("PUT /progress/.../chapter (ch-02 same day)", r, 200)
print(f"       streak_days={body.get('streak_days')} (same day, unchanged)")

r = httpx.put(
    f"{BASE}/progress/{user_id}/quiz",
    headers=H,
    json={"chapter_id": "chapter-01", "score": 5, "total_questions": 5},
    timeout=10,
)
h("PUT /progress/.../quiz (record score) -> 204", r, 204)

r = httpx.get(f"{BASE}/progress/{user_id}", headers=H, timeout=10)
body = h("GET /progress/{user_id}", r, 200)
print(
    f"       completed={body.get('completed_chapters')}  "
    f"pct={body.get('completion_percentage')}%  "
    f"streak={body.get('streak_days')}  "
    f"avg_score={body.get('avg_quiz_score')}"
)

other_id = str(uuid.uuid4())
r = httpx.get(f"{BASE}/progress/{other_id}", headers=H, timeout=10)
h("GET /progress/other-user -> 403", r, 403)

r = httpx.delete(f"{BASE}/progress/{user_id}/reset", headers=H, timeout=10)
h("DELETE /progress/.../reset -> 204", r, 204)

r = httpx.get(f"{BASE}/progress/{user_id}", headers=H, timeout=10)
body = h("GET /progress after reset (completed=0)", r, 200)
print(f"       completed={body.get('completed_chapters')}  streak={body.get('streak_days')}")

# ── 8. DOCS ──────────────────────────────────────────────────
print()
print("=" * 55)
print("8. OPENAPI DOCS")
print("=" * 55)
r = httpx.get(f"{BASE}/docs", timeout=10)
h("GET /docs (Swagger UI)", r, 200)

r = httpx.get(f"{BASE}/openapi.json", timeout=10)
body = h("GET /openapi.json", r, 200)
print(f"       {len(body.get('paths',{}))} paths  title={body.get('info',{}).get('title')}")

# ── SUMMARY ──────────────────────────────────────────────────
print()
print("=" * 55)
total = PASS + FAIL
print(f"RESULT: {PASS}/{total} PASSED  |  {FAIL} FAILED")
print("=" * 55)
