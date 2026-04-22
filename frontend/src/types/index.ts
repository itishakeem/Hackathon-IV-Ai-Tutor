// =============================================================================
// Course Companion FTE — TypeScript Interfaces
// All types map to backend API schemas (Phase 1 + Phase 2 backend)
// =============================================================================

// --- Authentication -----------------------------------------------------------

export interface AuthToken {
  access_token: string;
  token_type: "bearer";
}

export interface JwtPayload {
  sub: string; // user UUID string
  email: string;
  tier: "free" | "premium" | "pro" | "team";
  exp: number; // Unix timestamp
}

export interface AuthState {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: JwtPayload) => void;
  clearAuth: () => void;
}

// --- Chapters -----------------------------------------------------------------

export interface ChapterMeta {
  id: string; // e.g. "chapter-01"
  title: string;
  description: string;
  order: number;
  is_completed?: boolean; // injected client-side from progress
}

export interface ChapterContent {
  id: string;
  title: string;
  content: string; // raw markdown string
  order: number;
}

export interface ChapterNav {
  id: string;
  title: string;
}

export interface AccessCheck {
  allowed: boolean;
  reason?: string;
  tier?: string;
}

// --- Quizzes ------------------------------------------------------------------

export interface QuizOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizQuestionsResponse {
  chapter_id: string;
  questions: QuizQuestion[];
}

export interface QuizSubmit {
  answers: Record<string, "A" | "B" | "C" | "D">;
}

export interface QuestionResult {
  question_id: string;
  question: string;
  selected: "A" | "B" | "C" | "D";
  correct: "A" | "B" | "C" | "D";
  is_correct: boolean;
}

export interface QuizResult {
  chapter_id: string;
  score: number; // 0-100
  correct_count: number;
  total_questions: number;
  results: QuestionResult[];
}

export interface QuizAnswersResponse {
  chapter_id: string;
  answers: Record<string, "A" | "B" | "C" | "D">;
}

// --- Progress -----------------------------------------------------------------

export interface QuizScore {
  chapter_id: string;
  score: number;
  attempted_at: string; // ISO datetime string
}

export interface ProgressResponse {
  user_id: string;
  completed_chapters: string[];
  quiz_scores: QuizScore[];
  streak: number;
  total_chapters: number;
  completion_percentage: number;
  avg_quiz_score: number | null;
}

export interface ProgressUpdate {
  chapter_id: string;
}

export interface ChapterCompleteResponse {
  user_id: string;
  chapter_id: string;
  completed: true;
}

// --- Premium Features ---------------------------------------------------------

export interface AssessmentRequest {
  chapter_id: string;
  question: string;
  student_answer: string; // min 10, max 2000 chars
  user_id: string;
}

export interface AssessmentResponse {
  score: number; // 0-100
  max_score: 100;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggested_reading: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface SynthesisRequest {
  chapter_ids: string[]; // 2-5 items
  focus_topic?: string;
  user_id: string;
}

export interface SynthesisResponse {
  synthesis: string;
  key_connections: string[];
  knowledge_graph: GraphEdge[];
  recommended_next: string;
}

export interface LlmUsageRecord {
  id: string;
  feature: "assessment" | "synthesis";
  tokens_used: number;
  cost_usd: number;
  created_at: string; // ISO datetime string
}

export interface UsageResponse {
  user_id: string;
  records: LlmUsageRecord[];
  total_cost: number;
}

// --- UI-only State Types ------------------------------------------------------

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface FormState {
  submitting: boolean;
  error: string | null;
}
