# Frontend API Contract: Course Companion FTE — Phase 3

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19
**Backend Base URL**: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

All requests include `Authorization: Bearer <jwt>` header via Axios interceptor except where noted (No Auth).

---

## Authentication

### POST /auth/register
**Called by**: `RegisterForm` component
**Request**:
```json
{ "email": "user@example.com", "password": "secret123" }
```
**Response 201**:
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```
**Errors**: 422 (validation), 409 (duplicate email)
**Frontend action**: Decode JWT → store in Zustand + localStorage → redirect `/dashboard`

---

### POST /auth/login
**Called by**: `LoginForm` component
**Request**:
```json
{ "username": "user@example.com", "password": "secret123" }
```
**Response 200**:
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```
**Errors**: 401 (wrong credentials), 422 (validation)
**Frontend action**: Same as register

---

## Chapters

### GET /chapters
**Called by**: `ChapterList` component (SSR page), `useChapters` hook
**No query params**
**Response 200**:
```json
[
  { "id": "chapter-01", "title": "...", "description": "...", "order": 1 }
]
```
**Frontend action**: Merge with `progress.completed_chapters` to add `is_completed` flag

---

### GET /chapters/{chapterId}
**Called by**: Chapter reader page (SSR)
**Response 200**:
```json
{ "id": "chapter-01", "title": "...", "content": "# Markdown...", "order": 1 }
```
**Errors**: 404 (not found), 403 (tier gate)
**Frontend action**: Render markdown via react-markdown. On 403 → show upgrade modal

---

### GET /chapters/{chapterId}/next
### GET /chapters/{chapterId}/previous
**Called by**: `ChapterNav` component
**Response 200**: `{ "id": "chapter-02", "title": "..." }` or `null` (at boundaries)
**Frontend action**: Enable/disable Prev/Next buttons accordingly

---

### GET /access/check?chapter_id={chapterId}
**Called by**: Chapter reader page (SSR), `ChapterList` for lock icons
**Response 200**: `{ "has_access": true, "required_tier": "free", "user_tier": "free" }`
**Frontend action**: If `has_access: false` → show lock icon / upgrade modal

---

## Quizzes

### GET /quizzes/{chapterId}
**Called by**: Quiz page (CSR mount)
**Response 200**:
```json
{
  "chapter_id": "chapter-01",
  "questions": [
    { "id": "q1", "question": "What is...", "options": [{"key":"A","text":"..."},...] }
  ]
}
```

---

### POST /quizzes/{chapterId}/submit
**Called by**: Quiz page on final submission
**Request**:
```json
{ "answers": { "q1": "A", "q2": "C" } }
```
**Response 200**:
```json
{
  "score": 80,
  "correct_count": 4,
  "total_questions": 5,
  "results": [{ "question_id": "q1", "is_correct": true, "correct": "A", "selected": "A" }]
}
```
**Frontend action**: Show score screen. Call `PUT /progress/{userId}/quiz` to record score.

---

### GET /quizzes/{chapterId}/answers
**Called by**: Quiz page "View Answers" button
**Response 200**: `{ "answers": { "q1": "A", "q2": "C" } }`

---

## Progress

### GET /progress/{userId}
**Called by**: Dashboard page (SSR), `useProgress` hook
**Response 200**:
```json
{
  "user_id": "uuid",
  "completed_chapters": ["chapter-01"],
  "quiz_scores": [{ "chapter_id": "chapter-01", "score": 80, "attempted_at": "2026-04-18T..." }],
  "streak": 3,
  "total_chapters": 5,
  "completion_percentage": 20.0
}
```

---

### PUT /progress/{userId}/chapter
**Called by**: Chapter reader "Mark as Complete" button
**Request**: `{ "chapter_id": "chapter-01" }`
**Response 200**: `{ "user_id": "uuid", "chapter_id": "chapter-01", "completed": true }`
**Frontend action**: toast.success + optimistic update on chapter list

---

### PUT /progress/{userId}/quiz
**Called by**: Quiz page after submission
**Request**: `{ "chapter_id": "chapter-01", "score": 80 }`
**Response 204**: No content
**Frontend action**: Trigger dashboard data refresh on next visit

---

## Premium Features

### POST /premium/assess-answer
**Called by**: `AssessmentForm` component
**Auth required**: Pro tier (backend returns 403 otherwise)
**Request**:
```json
{
  "chapter_id": "chapter-01",
  "question": "Explain the difference...",
  "student_answer": "An agent can take actions...",
  "user_id": "uuid"
}
```
**Response 200**:
```json
{
  "score": 85,
  "max_score": 100,
  "feedback": "Good understanding...",
  "strengths": ["Correctly identified..."],
  "improvements": ["Mention memory..."],
  "suggested_reading": "chapter-01 section: Agent vs Chatbot"
}
```
**Errors**: 403 (not Pro), 404 (invalid chapter), 422 (validation), 429 (rate limit), 503 (LLM unavailable)
**Frontend action**: Disable submit during loading. On 403 → show upgrade prompt. On 429 → toast rate limit message.

---

### POST /premium/synthesize
**Called by**: `SynthesisForm` component
**Auth required**: Pro tier
**Request**:
```json
{
  "chapter_ids": ["chapter-01", "chapter-02", "chapter-03"],
  "focus_topic": "How MCP connects agents",
  "user_id": "uuid"
}
```
**Response 200**:
```json
{
  "synthesis": "Across these chapters...",
  "key_connections": ["Agents need tools → MCP provides them"],
  "knowledge_graph": [{"from": "AI Agent", "to": "MCP", "relationship": "uses"}],
  "recommended_next": "chapter-04"
}
```
**Errors**: Same as assess-answer

---

### GET /premium/usage/{userId}
**Called by**: Premium page usage section (CSR mount)
**Auth required**: Pro tier (ownership check)
**Response 200**:
```json
{
  "user_id": "uuid",
  "records": [{ "id": "uuid", "feature": "assessment", "tokens_used": 800, "cost_usd": 0.014, "created_at": "..." }],
  "total_cost": 0.014
}
```

---

## Error Handling Contract

| HTTP Status | Frontend Action |
|-------------|----------------|
| 401 | Clear Zustand store + localStorage, redirect to `/login` (Axios response interceptor) |
| 403 | Show upgrade prompt/modal inline — NOT a redirect |
| 404 | Show "Not found" error state in component |
| 422 | Parse `detail` array, show field-level inline errors |
| 429 | Show rate limit toast: "Daily limit reached — resets at midnight UTC" |
| 503 | Show "AI service temporarily unavailable" toast + re-enable form |
| Network error | Show "Cannot connect to server" error state with retry button |
