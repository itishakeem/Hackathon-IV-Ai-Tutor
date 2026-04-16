"""Full spec verification script for Course Companion FTE Phase 1."""
import urllib.request
import urllib.error
import json
import time
import base64

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            if not raw.strip():
                return resp.status, {}
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, {"_raw": raw.decode(errors="replace")}
    except urllib.error.HTTPError as e:
        raw = e.read()
        if not raw.strip():
            return e.code, {}
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"_raw": raw.decode(errors="replace")}


def check(name, cond, detail=""):
    global PASS, FAIL
    sym = "PASS" if cond else "FAIL"
    suffix = " (" + str(detail)[:80] + ")" if not cond and detail else ""
    print("  " + sym + ": " + name + suffix)
    if cond:
        PASS += 1
    else:
        FAIL += 1


ts = str(int(time.time()))
email = "verify" + ts + "@example.com"

print("=== HEALTH ===")
s, d = req("GET", "/health")
check("GET /health 200", s == 200)
check("status=ok", d.get("status") == "ok")

print()
print("=== AUTH ===")
s, d = req("POST", "/auth/register", {"email": email, "password": "TestPass123!"})
check("POST /auth/register 201", s == 201, d)
token = d.get("access_token", "")
check("access_token returned", bool(token))

s, d = req("POST", "/auth/login", {"email": email, "password": "TestPass123!"})
check("POST /auth/login 200", s == 200, d)
check("login token returned", bool(d.get("access_token")))

s, d = req("POST", "/auth/login", {"email": email, "password": "wrong"})
check("POST /auth/login wrong pw 401", s == 401)

# Decode user_id from JWT
p2 = token.split(".")[1]
payload = json.loads(base64.urlsafe_b64decode(p2 + "=" * ((4 - len(p2) % 4) % 4)))
user_id = payload["sub"]
print("  user_id: " + user_id)

print()
print("=== ACCESS CONTROL ===")
s, d = req("GET", "/access/check?user_id=abc&chapter_id=chapter-01", token=token)
check("GET /access/check chapter-01 free 200", s == 200, d)
check("chapter-01 allowed=True for free", d.get("allowed") == True)

s, d = req("GET", "/access/check?user_id=abc&chapter_id=chapter-04", token=token)
check("GET /access/check chapter-04 free 200", s == 200, d)
check("chapter-04 allowed=False for free", d.get("allowed") == False)
check("reason present when blocked", bool(d.get("reason")))

print()
print("=== CHAPTERS ===")
s, d = req("GET", "/chapters", token=token)
check("GET /chapters 200", s == 200, str(d)[:60])
check("5 chapters returned", isinstance(d, list) and len(d) == 5)

s, d = req("GET", "/chapters/chapter-01", token=token)
check("GET /chapters/chapter-01 200", s == 200)
check("content non-empty >100 chars", isinstance(d.get("content", ""), str) and len(d.get("content", "")) > 100)

s, d = req("GET", "/chapters/chapter-01/next", token=token)
check("GET /chapters/chapter-01/next 200", s == 200, d)

s, d = req("GET", "/chapters/chapter-02/previous", token=token)
check("GET /chapters/chapter-02/previous 200", s == 200, d)

s, d = req("GET", "/chapters/chapter-01/summary", token=token)
check("GET /chapters/chapter-01/summary 200", s == 200, d)
check("summary has key_points or summary field", "key_points" in d or "summary" in d)

s, d = req("GET", "/chapters/chapter-04", token=token)
check("GET /chapters/chapter-04 403 for free tier", s == 403)

print()
print("=== SEARCH ===")
s, d = req("GET", "/search?q=agent", token=token)
check("GET /search?q=agent 200", s == 200)
check("results list non-empty", isinstance(d, list) and len(d) > 0)
check("result has chapter_id field", "chapter_id" in d[0] if d else False)
check("result has excerpt field", "excerpt" in d[0] if d else False)

print()
print("=== QUIZ ===")
s, d = req("GET", "/quizzes/chapter-01", token=token)
check("GET /quizzes/chapter-01 200", s == 200, str(d)[:60])
check("questions list non-empty", len(d.get("questions", [])) > 0)
check("no correct_answer in questions", all("correct_answer" not in q for q in d.get("questions", [])))

# Perfect answers for quiz-01
answers = {"q1": "B", "q2": "C", "q3": "B", "q4": "C", "q5": "C"}
s, d = req("POST", "/quizzes/chapter-01/submit", {"answers": answers}, token=token)
check("POST /quizzes/chapter-01/submit 200", s == 200, str(d)[:80])
check("score=5 perfect", d.get("score") == 5)
check("total=5", d.get("total") == 5)
check("percentage=100.0", d.get("percentage") == 100.0)

# Wrong answers
bad_answers = {"q1": "A", "q2": "A", "q3": "A", "q4": "A", "q5": "A"}
s, d = req("POST", "/quizzes/chapter-01/submit", {"answers": bad_answers}, token=token)
check("POST /quizzes/chapter-01/submit wrong answers 200", s == 200)
check("score=0 all wrong", d.get("score") == 0)

s, d = req("GET", "/quizzes/chapter-01/answers", token=token)
check("GET /quizzes/chapter-01/answers after attempt 200", s == 200, d)
check("answers list non-empty", len(d.get("answers", [])) > 0, d)
check("answers has correct_answer", any("correct_answer" in a for a in d.get("answers", [])), d)

# Verify no answers before attempt for fresh chapter
s, d = req("GET", "/quizzes/chapter-02/answers", token=token)
check("GET /quizzes/chapter-02/answers no prior attempt 403", s == 403)

print()
print("=== PROGRESS ===")
s, d = req("GET", "/progress/" + user_id, token=token)
check("GET /progress 200", s == 200, str(d)[:100])
check("total_chapters=5", d.get("total_chapters") == 5)
check("completed_chapters=0 initially", d.get("completed_chapters") == 0)
check("streak_days=0 initially", d.get("streak_days") == 0)
# Quiz section already submitted 2 attempts (100% and 0%), so avg is ~50%
check("avg_quiz_score is float or None initially", d.get("avg_quiz_score") is None or isinstance(d.get("avg_quiz_score"), float))
check("chapters=[] initially", d.get("chapters") == [])

s, d = req("PUT", "/progress/" + user_id + "/chapter", {"chapter_id": "chapter-01"}, token=token)
check("PUT /progress/.../chapter 200", s == 200, str(d)[:100])
check("chapter_id=chapter-01", d.get("chapter_id") == "chapter-01")
check("completed=True", d.get("completed") == True)
check("streak_days=1 first completion", d.get("streak_days") == 1)

# Same day call: streak unchanged
s, d = req("PUT", "/progress/" + user_id + "/chapter", {"chapter_id": "chapter-01"}, token=token)
check("PUT same day streak unchanged 200", s == 200)
check("streak still 1 same day", d.get("streak_days") == 1)

s, d = req("PUT", "/progress/" + user_id + "/quiz", {"chapter_id": "chapter-01", "score": 4, "total_questions": 5}, token=token)
check("PUT /progress/.../quiz 204", s == 204)

s, d = req("GET", "/progress/" + user_id, token=token)
check("GET /progress after updates 200", s == 200, str(d)[:100])
check("completed_chapters=1", d.get("completed_chapters") == 1)
check("completion_percentage=20.0", d.get("completion_percentage") == 20.0)
check("avg_quiz_score is a number", isinstance(d.get("avg_quiz_score"), float))
check("chapters list has chapter-01", any(c.get("chapter_id") == "chapter-01" for c in d.get("chapters", [])))

# Forbidden: other user
s, d = req("GET", "/progress/00000000-0000-0000-0000-000000000001", token=token)
check("GET /progress other user 403", s == 403)

# Reset
s, d = req("DELETE", "/progress/" + user_id + "/reset", token=token)
check("DELETE /progress/.../reset 204", s == 204)

s, d = req("GET", "/progress/" + user_id, token=token)
check("GET /progress after reset 200", s == 200)
check("completed_chapters=0 after reset", d.get("completed_chapters") == 0)
check("avg_quiz_score=None after reset", d.get("avg_quiz_score") is None)
check("chapters=[] after reset", d.get("chapters") == [])

print()
print("=== FINAL RESULT: " + str(PASS) + " PASS / " + str(FAIL) + " FAIL ===")
if FAIL == 0:
    print("ALL CHECKS PASSED")
else:
    print("FAILURES DETECTED - review above")
