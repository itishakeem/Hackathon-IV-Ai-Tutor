# Data Model: Course Companion FTE — Phase 3 (Next.js Web App)

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19
**Note**: Frontend-only data model — these are TypeScript interfaces mapping to backend API responses. No new database entities are created in Phase 3.

---

## TypeScript Interfaces (`frontend/types/index.ts`)

### Authentication

```typescript
// POST /auth/register & POST /auth/login response
interface AuthToken {
  access_token: string;   // JWT string
  token_type: "bearer";
}

// Decoded JWT payload (client-side decode via jwt-decode or manual base64)
interface JwtPayload {
  sub: string;           // user UUID string
  email: string;
  tier: "free" | "premium" | "pro" | "team";
  exp: number;           // Unix timestamp
}

// Zustand auth store shape
interface AuthState {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: JwtPayload) => void;
  clearAuth: () => void;
}
```

### Chapters

```typescript
// GET /chapters response item
interface ChapterMeta {
  id: string;            // e.g. "chapter-01"
  title: string;
  description: string;
  order: number;
  is_completed?: boolean; // injected client-side from progress
}

// GET /chapters/{id} response
interface ChapterContent {
  id: string;
  title: string;
  content: string;       // raw markdown string
  order: number;
}

// GET /chapters/{id}/next | /chapters/{id}/previous response
interface ChapterNav {
  id: string;
  title: string;
}

// GET /access/check response
interface AccessCheck {
  chapter_id: string;
  has_access: boolean;
  required_tier: "free" | "premium" | "pro";
  user_tier: "free" | "premium" | "pro";
}
```

### Quizzes

```typescript
// Single question option
interface QuizOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

// Single question
interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

// GET /quizzes/{id} response
interface QuizQuestionsResponse {
  chapter_id: string;
  questions: QuizQuestion[];
}

// POST /quizzes/{id}/submit request body
interface QuizSubmit {
  answers: Record<string, "A" | "B" | "C" | "D">; // { question_id: answer }
}

// Per-question result
interface QuestionResult {
  question_id: string;
  question: string;
  selected: "A" | "B" | "C" | "D";
  correct: "A" | "B" | "C" | "D";
  is_correct: boolean;
}

// POST /quizzes/{id}/submit response
interface QuizResult {
  chapter_id: string;
  score: number;         // 0-100
  correct_count: number;
  total_questions: number;
  results: QuestionResult[];
}

// GET /quizzes/{id}/answers response
interface QuizAnswersResponse {
  chapter_id: string;
  answers: Record<string, "A" | "B" | "C" | "D">; // { question_id: correct_answer }
}
```

### Progress

```typescript
// Quiz score history entry
interface QuizScore {
  chapter_id: string;
  score: number;
  attempted_at: string;  // ISO datetime string
}

// GET /progress/{user_id} response
interface ProgressResponse {
  user_id: string;
  completed_chapters: string[];   // array of chapter IDs
  quiz_scores: QuizScore[];
  streak: number;                  // consecutive days
  total_chapters: number;          // always 5 for this phase
  completion_percentage: number;   // 0-100
}

// PUT /progress/{user_id}/chapter request body
interface ProgressUpdate {
  chapter_id: string;
}

// PUT /progress/{user_id}/chapter response
interface ChapterCompleteResponse {
  user_id: string;
  chapter_id: string;
  completed: true;
}
```

### Premium Features

```typescript
// POST /premium/assess-answer request body
interface AssessmentRequest {
  chapter_id: string;
  question: string;
  student_answer: string;   // min 10, max 2000 chars
  user_id: string;          // UUID string
}

// POST /premium/assess-answer response
interface AssessmentResponse {
  score: number;             // 0-100
  max_score: 100;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggested_reading: string;
}

// Knowledge graph edge
interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

// POST /premium/synthesize request body
interface SynthesisRequest {
  chapter_ids: string[];    // 2-5 items
  focus_topic?: string;     // optional
  user_id: string;          // UUID string
}

// POST /premium/synthesize response
interface SynthesisResponse {
  synthesis: string;
  key_connections: string[];
  knowledge_graph: GraphEdge[];
  recommended_next: string;
}

// Single usage record
interface LlmUsageRecord {
  id: string;
  feature: "assessment" | "synthesis";
  tokens_used: number;
  cost_usd: number;
  created_at: string;       // ISO datetime string
}

// GET /premium/usage/{user_id} response
interface UsageResponse {
  user_id: string;
  records: LlmUsageRecord[];
  total_cost: number;
}
```

### UI-only State Types

```typescript
// Generic API call state (used by every hook)
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Form submission state
interface FormState {
  submitting: boolean;
  error: string | null;
}
```

---

## State Transitions

### Auth Flow
```
Anonymous → [register/login] → Authenticated(tier)
Authenticated → [401 response] → Anonymous (token cleared)
Authenticated → [manual logout] → Anonymous (token cleared)
```

### Quiz Flow
```
NotStarted → [open quiz] → InProgress(questionIndex=0)
InProgress → [answer + next] → InProgress(questionIndex++)
InProgress(last) → [submit] → Submitted(QuizResult)
Submitted → [retry] → InProgress(questionIndex=0, answers cleared)
```

### Chapter Completion
```
Unlocked(incomplete) → [mark complete] → Unlocked(complete)
Locked(free tier) → [click] → ShowUpgradeModal
```

### Premium Feature Tiers
```
free/premium → /premium → ShowUpgradePrompt (forms hidden)
pro → /premium → ShowAIForms (assessment + synthesis tabs)
```
