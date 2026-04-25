import axios from "axios";
import toast from "react-hot-toast";
import type {
  AuthToken,
  ChapterMeta,
  ChapterContent,
  ChapterNav,
  AccessCheck,
  QuizQuestionsResponse,
  QuizSubmit,
  QuizResult,
  QuizAnswersResponse,
  ProgressResponse,
  ProgressUpdate,
  ChapterCompleteResponse,
  AssessmentRequest,
  AssessmentResponse,
  SynthesisRequest,
  SynthesisResponse,
  UsageResponse,
} from "@/types";
import { useAuthStore } from "@/store/authStore";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT Bearer token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle status codes globally, never leak raw errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      toast.error("Something went wrong, please try again");
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 500 || status === 503) {
      toast.error("Service temporarily unavailable");
    }

    if (!status && typeof window !== "undefined") {
      // Network error — no response at all
      toast.error("Something went wrong, please try again");
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getErrorStatus(err: unknown): number | null {
  if (axios.isAxiosError(err)) return err.response?.status ?? null;
  return null;
}

export { getErrorStatus };

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  register: (email: string, password: string) =>
    apiClient
      .post<AuthToken>("/auth/register", { email, password })
      .then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient
      .post<AuthToken>("/auth/login", {
        username: email,
        password,
      })
      .then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient
      .post<{ message: string }>("/auth/forgot-password", { email })
      .then((r) => r.data),

  resetPassword: (email: string, code: string, new_password: string) =>
    apiClient
      .post<{ message: string }>("/auth/reset-password", { email, code, new_password })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Chapters API
// ---------------------------------------------------------------------------

// Backend sends chapter_id/module; frontend types use id/order — normalise here.
type BackendChapterMeta = {
  chapter_id: string;
  title: string;
  description?: string;
  module: number;
  locked?: boolean;
};
type BackendChapterContent = {
  chapter_id: string;
  title: string;
  content: string;
};
type BackendChapterNav = {
  chapter_id: string;
  title: string;
};

function normalizeChapterMeta(b: BackendChapterMeta): ChapterMeta {
  return {
    id: b.chapter_id,
    title: b.title,
    description: b.description ?? "",
    order: b.module,
    locked: b.locked ?? false,
  };
}

function normalizeChapterContent(b: BackendChapterContent): ChapterContent {
  return {
    id: b.chapter_id,
    title: b.title,
    content: b.content,
    order: 0, // not used in reader
  };
}

function normalizeChapterNav(b: BackendChapterNav): ChapterNav {
  return { id: b.chapter_id, title: b.title };
}

export const chaptersApi = {
  getAll: () =>
    apiClient
      .get<BackendChapterMeta[]>("/chapters")
      .then((r) => r.data.map(normalizeChapterMeta)),

  getOne: (chapterId: string) =>
    apiClient
      .get<BackendChapterContent>(`/chapters/${chapterId}`)
      .then((r) => normalizeChapterContent(r.data)),

  getNext: (chapterId: string) =>
    apiClient
      .get<BackendChapterNav>(`/chapters/${chapterId}/next`)
      .then((r) => normalizeChapterNav(r.data))
      .catch(() => null),

  getPrev: (chapterId: string) =>
    apiClient
      .get<BackendChapterNav>(`/chapters/${chapterId}/previous`)
      .then((r) => normalizeChapterNav(r.data))
      .catch(() => null),
};

// ---------------------------------------------------------------------------
// Access API
// ---------------------------------------------------------------------------

export const accessApi = {
  check: (chapterId: string) =>
    apiClient
      .get<AccessCheck>("/access/check", {
        params: { chapter_id: chapterId },
      })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Quizzes API
// ---------------------------------------------------------------------------

export const quizzesApi = {
  getQuestions: (chapterId: string) =>
    apiClient
      .get<QuizQuestionsResponse>(`/quizzes/${chapterId}`)
      .then((r) => r.data),

  submit: (chapterId: string, body: QuizSubmit) =>
    apiClient
      .post<QuizResult>(`/quizzes/${chapterId}/submit`, body)
      .then((r) => r.data),

  getAnswers: (chapterId: string) =>
    apiClient
      .get<QuizAnswersResponse>(`/quizzes/${chapterId}/answers`)
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Progress API
// ---------------------------------------------------------------------------

export const progressApi = {
  get: (userId: string) =>
    apiClient
      .get<ProgressResponse>(`/progress/${userId}`)
      .then((r) => r.data),

  markChapterComplete: (userId: string, chapterId: string) =>
    apiClient
      .put<ChapterCompleteResponse>(`/progress/${userId}/chapter`, {
        chapter_id: chapterId,
      } satisfies ProgressUpdate)
      .then((r) => r.data),

  recordQuizScore: (userId: string, chapterId: string, score: number, totalQuestions: number) =>
    apiClient
      .put(`/progress/${userId}/quiz`, { chapter_id: chapterId, score, total_questions: totalQuestions })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Premium API
// ---------------------------------------------------------------------------

export const premiumApi = {
  assess: (body: AssessmentRequest) =>
    apiClient
      .post<AssessmentResponse>("/premium/assess-answer", body)
      .then((r) => r.data),

  synthesize: (body: SynthesisRequest) =>
    apiClient
      .post<SynthesisResponse>("/premium/synthesize", body)
      .then((r) => r.data),

  getUsage: (userId: string) =>
    apiClient
      .get<UsageResponse>(`/premium/usage/${userId}`)
      .then((r) => r.data),
};
