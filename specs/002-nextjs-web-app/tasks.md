# Tasks: Course Companion FTE — Phase 3 (Next.js Web App)

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19
**Input**: `specs/002-nextjs-web-app/plan.md`, `spec.md`, `data-model.md`, `contracts/frontend-api-contract.md`, `research.md`, `quickstart.md`
**Prerequisites**: Phase 1 + Phase 2 backend deployed and running at `http://localhost:8000`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Authentication & Onboarding (P1)
- **[US2]**: Browse & Read Course Chapters (P2)
- **[US3]**: Quiz & Knowledge Check (P3)
- **[US4]**: Learning Progress Dashboard (P4)
- **[US5]**: Premium AI Features (P5)

## Hard Constraints

- **NO LLM calls** in any `frontend/` file — all AI via backend API only
- **JWT in Zustand store** (persisted to localStorage via `persist` middleware) — never raw `localStorage.setItem`
- All API calls MUST have loading + error states
- TypeScript `strict: true` — no `any` types
- All pages mobile responsive (320px minimum)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the Next.js project, install all dependencies, configure tooling. Blocks all milestones.

- [X] T001 Initialize Next.js 15 project in `frontend/` directory: run `pnpm create next-app frontend --typescript --tailwind --app --no-eslint --import-alias "@/*"` from repo root; verify `frontend/app/page.tsx` and `frontend/app/layout.tsx` exist
- [X] T002 Install all runtime dependencies: run `pnpm add axios zustand react-markdown remark-gfm rehype-slug @tailwindcss/typography recharts next-themes react-hot-toast lucide-react` from `frontend/`; verify all appear in `frontend/package.json`
- [X] T003 [P] Configure TypeScript strict mode: verify `frontend/tsconfig.json` has `"strict": true`; add `"forceConsistentCasingInFileNames": true` and `"noUncheckedIndexedAccess": true` if missing
- [X] T004 [P] Configure `frontend/next.config.ts`: add `env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL }` and ensure TypeScript is `ignoreBuildErrors: false`
- [X] T005 [P] Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000` and `NEXT_PUBLIC_APP_NAME=Course Companion FTE`; create `frontend/.env.example` with same keys but placeholder values
- [X] T006 Initialize shadcn/ui: run `npx shadcn@latest init` (TypeScript, tailwind.config.ts, CSS variables); then run `npx shadcn@latest add button input card skeleton sheet tabs badge progress dialog`; verify `frontend/components/ui/` contains all added components
- [X] T007 [P] Configure Tailwind for dark mode and typography: update `frontend/tailwind.config.ts` to add `darkMode: 'class'` and `plugins: [require('@tailwindcss/typography')]`; add indigo primary color extension
- [X] T008 [P] Configure `frontend/app/globals.css`: keep Tailwind base/components/utilities directives; add CSS variables for primary indigo colour in both `:root` and `.dark` selectors

**Checkpoint**: `pnpm dev` starts successfully at `http://localhost:3000`; no TypeScript errors on `pnpm build`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: TypeScript types, API client, Zustand store, hooks. MUST be complete before any UI work.

**⚠️ CRITICAL**: No component work can begin until this phase is complete.

- [X] T009 Create `frontend/types/index.ts` with ALL TypeScript interfaces: `AuthToken`, `JwtPayload`, `AuthState`; `ChapterMeta`, `ChapterContent`, `ChapterNav`, `AccessCheck`; `QuizOption`, `QuizQuestion`, `QuizQuestionsResponse`, `QuizSubmit`, `QuestionResult`, `QuizResult`, `QuizAnswersResponse`; `QuizScore`, `ProgressResponse`, `ProgressUpdate`, `ChapterCompleteResponse`; `AssessmentRequest`, `AssessmentResponse`; `GraphEdge`, `SynthesisRequest`, `SynthesisResponse`; `LlmUsageRecord`, `UsageResponse`; `ApiState<T>`, `FormState` — see `data-model.md` for exact field definitions
- [X] T010 Create `frontend/lib/auth.ts`: export `decodeJwt(token: string): JwtPayload` (manual base64 decode of JWT payload — no extra package) and `isTokenExpired(payload: JwtPayload): boolean` (compare `payload.exp * 1000 > Date.now()`)
- [X] T011 Create `frontend/lib/utils.ts`: export `cn(...inputs: ClassValue[])` (using `clsx` + `tailwind-merge`); add `clsx` and `tailwind-merge` to dependencies via `pnpm add clsx tailwind-merge`
- [X] T012 Create `frontend/store/authStore.ts`: Zustand store using `create<AuthState>()(persist(..., { name: 'auth-storage' }))` with `token: null`, `user: null`, `isAuthenticated: false`, `setAuth(token, user)`, `clearAuth()`; store persists to localStorage key `'auth-storage'` automatically
- [X] T013 Create `frontend/lib/api.ts`: Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL`; request interceptor attaches `Authorization: Bearer <token>` from `useAuthStore.getState().token`; response interceptor calls `clearAuth()` + `window.location.href = '/login'` on 401; export typed API functions: `authApi.register()`, `authApi.login()`, `chaptersApi.getAll()`, `chaptersApi.getOne(id)`, `chaptersApi.getNext(id)`, `chaptersApi.getPrev(id)`, `accessApi.check(chapterId)`, `quizzesApi.getQuestions(id)`, `quizzesApi.submit(id, body)`, `quizzesApi.getAnswers(id)`, `progressApi.get(userId)`, `progressApi.markChapterComplete(userId, chapterId)`, `progressApi.recordQuizScore(userId, chapterId, score)`, `premiumApi.assess(body)`, `premiumApi.synthesize(body)`, `premiumApi.getUsage(userId)`
- [X] T014 [P] Create `frontend/hooks/useAuth.ts`: client-side hook reading from Zustand store; exports `{ user, token, isAuthenticated, setAuth, clearAuth }`; redirects to `/login` on mount if not authenticated (for use in client components)
- [X] T015 [P] Create `frontend/hooks/useProgress.ts`: hook that calls `progressApi.get(user.sub)` on mount; returns `ApiState<ProgressResponse>`; re-fetches when `user` changes
- [X] T016 [P] Create `frontend/hooks/useChapters.ts`: hook that calls `chaptersApi.getAll()` on mount; returns `ApiState<ChapterMeta[]>`; exports `refetch()` function for post-mark-complete refresh

**Checkpoint**: `pnpm tsc --noEmit` passes with zero errors on all files in `frontend/lib/`, `frontend/store/`, `frontend/hooks/`, `frontend/types/`.

---

## Phase 3: User Story 1 — Authentication & Onboarding (Priority: P1) 🎯 MVP

**Goal**: Landing page (SSG) + login + register pages. Users can sign up, log in, and be redirected to the dashboard. Session persists across browser restarts via Zustand persist.

**Independent Test**: Open `http://localhost:3000`, click "Get Started", fill registration form, land on `/dashboard`. Close browser, reopen, navigate to `http://localhost:3000/dashboard` — still logged in.

### Implementation

- [X] T017 Create `frontend/app/layout.tsx` (root layout): wrap children in `ThemeProvider` from `next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`); add `<Toaster />` from `react-hot-toast`; add `suppressHydrationWarning` to `<html>` tag; import `globals.css`
- [X] T018 [P] [US1] Create `frontend/components/layout/Navbar.tsx` (`'use client'`): display app logo + name left; `ThemeToggle` button using `useTheme` from `next-themes` (sun/moon icon swap); user email + logout button right (reads `useAuth`); on logout call `clearAuth()` + `router.push('/login')`; on mobile show hamburger button that opens `Sidebar` in `Sheet` component
- [X] T019 [P] [US1] Create `frontend/components/layout/Sidebar.tsx` (`'use client'`): navigation links — Dashboard, Learn, Premium; active link styled with indigo; accepts `onClose?: () => void` prop (called after navigation on mobile); used both as fixed desktop sidebar and inside Sheet for mobile
- [X] T020 [P] [US1] Create `frontend/components/layout/Footer.tsx`: static footer with app name, copyright year
- [X] T021 [US1] Create `frontend/app/(dashboard)/layout.tsx` (`'use client'`): auth guard — if `!isAuthenticated` redirect to `/login` via `useRouter`; render `<Navbar />` + desktop `<Sidebar />` + `<main>{children}</main>` with `flex` layout; mobile: `md:hidden` hamburger in Navbar opens Sidebar in shadcn `Sheet`
- [X] T022 [P] [US1] Create `frontend/components/auth/LoginForm.tsx` (`'use client'`): controlled form with email `Input` + password `Input`; `FormState` for `submitting` + `error`; on submit call `authApi.login()` → `setAuth(token, decodeJwt(token))` → `router.push('/dashboard')`; on error show inline `<p className="text-red-500">{error}</p>`; button disabled + spinner while `submitting`
- [X] T023 [P] [US1] Create `frontend/components/auth/RegisterForm.tsx` (`'use client'`): email + password + confirm password inputs; client-side validate passwords match before submit; call `authApi.register()` → `setAuth` → redirect; map 409 → "Email already in use"; map 422 detail array to field-level errors
- [X] T024 [P] [US1] Create `frontend/app/(auth)/login/page.tsx`: centered card layout; render `<LoginForm />`; if `isAuthenticated` redirect to `/dashboard` on mount
- [X] T025 [P] [US1] Create `frontend/app/(auth)/register/page.tsx`: centered card layout; render `<RegisterForm />`; if `isAuthenticated` redirect to `/dashboard` on mount
- [X] T026 [US1] Create `frontend/app/page.tsx` (landing page, SSG): Hero section — "Learn AI Agent Development 24/7" + "Get Started" → `/register` + "View Course" → `/learn` buttons; Course Overview — 5 static module cards (hardcoded titles/descriptions, no API call needed for SSG); Pricing Table — Free ($0/mo), Premium ($9.99/mo), Pro ($19.99/mo) cards with feature lists; fully responsive (`flex-col md:flex-row`, etc.); no `'use client'` directive (pure RSC/SSG)
- [ ] T027 [US1] Verify auth flow end to end: start backend at `localhost:8000`, run `pnpm dev`; (a) register new user via `/register` → lands on `/dashboard`; (b) log out → redirected to `/login`; (c) log in → back on `/dashboard`; (d) wrong password → inline error shown; (e) duplicate email → "Email already in use"; (f) close browser, reopen `/dashboard` → still authenticated

**Checkpoint**: Full auth cycle works. Session persists. Landing page renders statically with pricing table and module cards.

---

## Phase 4: User Story 2 — Browse & Read Course Chapters (Priority: P2)

**Goal**: Chapter list with completion status + chapter reader with markdown rendering, outline sidebar, Prev/Next, and Mark Complete. Free users see lock on chapters 4–5.

**Independent Test**: Log in as free user, navigate to `/learn`, open chapter-01, read markdown content, click Mark as Complete, see badge update, click Next to chapter-02.

### Implementation

- [X] T028 [US2] Create `frontend/components/chapters/ChapterList.tsx` (`'use client'`): accepts `chapters: ChapterMeta[]` + `userTier: string` props; renders responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`); each card: shadcn `Card` with title, description, completion `Badge`; chapters 4–5 + free tier → `Lock` icon (lucide) + click opens `UpgradeDialog` (shadcn `Dialog`); completed chapters → green `CheckCircle` badge; loading skeleton via `Skeleton` while data fetches
- [X] T029 [US2] Create `frontend/app/(dashboard)/learn/page.tsx` (`'use client'`): uses `useChapters()` + `useProgress()` + `useAuth()` hooks; merges chapters with `progress.completed_chapters` to add `is_completed` flag; renders `<ChapterList />`; shows `Skeleton` grid while loading; shows error state with retry button on API failure
- [X] T030 [US2] Create `frontend/components/chapters/ChapterReader.tsx` (`'use client'`): accepts `chapter: ChapterContent` + `userId: string`; renders `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>`; `className="prose prose-indigo dark:prose-invert max-w-none"`; extracts `## ` headings from `chapter.content` via regex to build sidebar outline array; sticky left sidebar with anchor links to headings; `@tailwindcss/typography` styles code blocks, tables, links; Mark as Complete button calls `progressApi.markChapterComplete(userId, chapterId)` → `toast.success` → `refetch()`
- [X] T031 [P] [US2] Create `frontend/components/chapters/ChapterNav.tsx` (`'use client'`): accepts `chapterId: string`; on mount fetches `chaptersApi.getNext(chapterId)` and `chaptersApi.getPrev(chapterId)`; renders Prev/Next `Button`s (disabled if null); "Take Quiz" `Button` → `router.push('/quiz/${chapterId}')`; "Mark as Complete" delegated to parent `ChapterReader`
- [X] T032 [US2] Create `frontend/app/(dashboard)/learn/[chapterId]/page.tsx` (`'use client'`): on mount fetches `chaptersApi.getOne(chapterId)` + `accessApi.check(chapterId)`; if `!has_access` → show `UpgradeDialog` inline (no chapter content rendered); renders `<ChapterReader />` + `<ChapterNav />`; skeleton while loading; 404 → "Chapter not found" state
- [ ] T033 [US2] Test chapter flow: (a) `/learn` shows 5 cards; (b) chapter-01 opens and renders markdown headings/code/lists; (c) sidebar outline links to correct sections; (d) Prev/Next navigate correctly; (e) free user clicking chapter-05 sees upgrade dialog; (f) Mark Complete updates badge without page reload

**Checkpoint**: Full chapter read+complete flow works. Freemium gate blocks chapters 4–5 for free users.

---

## Phase 5: User Story 3 — Quiz & Knowledge Check (Priority: P3)

**Goal**: Quiz page with one-question-at-a-time flow, submit all answers, show score + per-question feedback, retry, view answer key.

**Independent Test**: Navigate to `/quiz/chapter-01`, answer all questions, submit, see score, retry, view answers.

### Implementation

- [X] T034 [P] [US3] Create `frontend/components/quiz/QuizProgress.tsx`: accepts `current: number` + `total: number`; renders "Question {current} of {total}" text + shadcn `Progress` bar (`value={(current / total) * 100}`)
- [X] T035 [P] [US3] Create `frontend/components/quiz/QuizCard.tsx` (`'use client'`): accepts `question: QuizQuestion` + `selected: string | null` + `onSelect: (key: string) => void`; renders question text; 4 option `Button`s (variant="outline"); selected button gets indigo border + bg highlight; "Next" / "Submit" button (label changes on last question); pure display component — no API calls
- [X] T036 [P] [US3] Create `frontend/components/quiz/QuizResult.tsx` (`'use client'`): accepts `result: QuizResult` + `onRetry: () => void` + `chapterId: string`; displays large score `{score}/100`; per-question rows with ✓ green / ✗ red icon + correct answer shown; "Retry" button calls `onRetry`; "View Answers" button fetches `quizzesApi.getAnswers(chapterId)` → renders answer key overlay
- [X] T037 [US3] Create `frontend/app/(dashboard)/quiz/[chapterId]/page.tsx` (`'use client'`): state — `phase: 'loading' | 'question' | 'submitted'`, `currentIndex: number`, `answers: Record<string, 'A'|'B'|'C'|'D'>`, `result: QuizResult | null`; on mount fetch `quizzesApi.getQuestions(chapterId)`; render `<QuizProgress>` + `<QuizCard>`; on last question submit → `quizzesApi.submit(chapterId, { answers })` + `progressApi.recordQuizScore(userId, chapterId, score)` → transition to submitted phase; render `<QuizResult>` on submitted; "Retry" resets state to question phase; full loading skeleton while fetching
- [ ] T038 [US3] Test quiz flow: (a) questions load with 4 options each; (b) selecting option highlights it; (c) Next advances question counter; (d) submitting last question shows score screen; (e) all correct → 100; (f) retry resets to Q1 with no selections; (g) "View Answers" shows correct answers; (h) score recorded in progress (visible on dashboard)

**Checkpoint**: Complete quiz flow works. Scores are recorded. Retry and view-answers work.

---

## Phase 6: User Story 4 — Learning Progress Dashboard (Priority: P4)

**Goal**: Dashboard with progress bar, streak counter, Recharts quiz score line chart, average score, completed chapters list.

**Independent Test**: Complete 1 chapter + take 1 quiz, visit `/dashboard`, see completion % = 20%, streak = 1+, quiz score in chart.

### Implementation

- [X] T039 [P] [US4] Create `frontend/components/dashboard/StreakCard.tsx` (`'use client'`): accepts `streak: number`; renders 🔥 Flame icon (lucide) + "{streak} day streak"; shows "Start your streak today!" if streak = 0
- [X] T040 [P] [US4] Create `frontend/components/dashboard/BadgeCard.tsx` (`'use client'`): accepts `completedChapters: string[]` + `quizScores: QuizScore[]`; renders completion badges (one per completed chapter) + "Perfect Score" badge if any quiz score = 100; shows empty state if no badges yet
- [X] T041 [US4] Create `frontend/components/dashboard/ProgressChart.tsx` (`'use client'`): accepts `scores: QuizScore[]`; renders Recharts `ResponsiveContainer` + `LineChart`; `XAxis` with formatted date, `YAxis` domain `[0, 100]`, `Line` with indigo stroke, `Tooltip`; if `scores.length === 0` render "No quiz attempts yet" empty state instead of chart
- [X] T042 [US4] Create `frontend/app/(dashboard)/dashboard/page.tsx` (`'use client'`): uses `useProgress()` + `useChapters()` + `useAuth()`; while loading show `Skeleton` for each section; renders: shadcn `Progress` bar (`value={progress.completion_percentage}`), `<StreakCard>`, `<ProgressChart>`, `<BadgeCard>`, completed chapters list (chapter titles), average score calculation `(sum / count).toFixed(0)`; error state with retry
- [ ] T043 [US4] Test dashboard: (a) fresh user shows 0%, no streak, empty chart with empty state; (b) after completing chapter-01, progress shows 20%; (c) after submitting quiz, score appears in chart; (d) all skeleton states shown while loading; (e) average score calculated correctly

**Checkpoint**: Dashboard shows accurate progress data. Recharts renders on all viewport sizes.

---

## Phase 7: User Story 5 — Premium AI Features (Priority: P5)

**Goal**: Premium page with tier gate. Pro users access LLM Assessment + Synthesis tabs + usage section. Non-pro users see upgrade prompt with pricing cards.

**Independent Test**: (a) Log in as free user → `/premium` shows upgrade prompt + pricing; (b) Log in as Pro user → tabs visible, submit assessment, see score + feedback.

### Implementation

- [X] T044 [US5] Create `frontend/components/premium/AssessmentForm.tsx` (`'use client'`): `FormState` for `submitting` + `error`; chapter `<select>` dropdown (5 options); question `Input`; answer `Textarea` with min 10 chars client-side validation; on submit call `premiumApi.assess({ chapter_id, question, student_answer, user_id })` → show `AssessmentResult` panel below form; result panel: score badge, feedback paragraph, strengths list, improvements list, suggested_reading; button disabled + spinner during submission; on 429 → `toast.error("Daily limit reached — resets at midnight UTC")`; on 503 → `toast.error("AI service temporarily unavailable")`
- [X] T045 [US5] Create `frontend/components/premium/SynthesisForm.tsx` (`'use client'`): chapter multi-select (checkbox list, 2–5 constraint enforced client-side — show inline error if < 2 selected on submit); optional focus topic `Input`; on submit call `premiumApi.synthesize({ chapter_ids, focus_topic, user_id })` → show `SynthesisResult` panel; result: synthesis narrative, key connections list, knowledge graph edges as styled list (`{edge.from} → {edge.to} ({edge.relationship})`), recommended next chapter; same loading/error pattern as AssessmentForm
- [X] T046 [US5] Create `frontend/app/(dashboard)/premium/page.tsx` (`'use client'`): read `user?.tier` from `useAuth()`; if tier != 'pro' render `UpgradePrompt` component (same pricing cards as landing page — Free/Premium/Pro — with "Upgrade Now" CTA); if tier == 'pro' render shadcn `Tabs` with three tabs: "Assessment" (renders `<AssessmentForm>`), "Synthesis" (renders `<SynthesisForm>`), "Usage" (fetches `premiumApi.getUsage(userId)` → renders table of records + total cost + token count); usage section shows `Skeleton` while loading; `$0.00 / 0 tokens` empty state if no records
- [ ] T047 [US5] Test premium page: (a) free user at `/premium` sees upgrade prompt, NO forms; (b) pro user sees all 3 tabs; (c) assessment form validates min 10 chars answer; (d) synthesis form validates 2+ chapters; (e) loading spinner shown during AI requests; (f) 429 shows rate limit toast; (g) usage section shows correct totals

**Checkpoint**: Pro tier gate works. AI forms submit to backend and display results. Upgrade prompt shown correctly for non-pro.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Loading skeletons, empty states, toast notifications, responsive QA, dark mode QA, full journey test.

- [X] T048 [P] Add loading skeletons to all data-fetch pages: verify `Skeleton` components render in `learn/page.tsx`, `learn/[chapterId]/page.tsx`, `quiz/[chapterId]/page.tsx`, `dashboard/page.tsx`, `premium/page.tsx`; each skeleton should match the approximate shape of the content it replaces
- [X] T049 [P] Add empty state components: verify "No quiz attempts yet" on `ProgressChart`, "No badges yet" on `BadgeCard`, "No usage records" on premium usage tab — all render without errors when data arrays are empty
- [X] T050 [P] Verify toast notifications: `toast.success("Chapter marked complete!")` on mark-complete; `toast.success("Quiz submitted!")` on quiz submit; `toast.error(message)` on API failures (401, 403, 422, 429, 503, network error); `toast.success("Logged in!")` on login; `toast.success("Account created!")` on register
- [ ] T051 Test full user journey end to end: with backend running, (1) visit landing page → (2) register → (3) `/dashboard` (empty state) → (4) `/learn` → (5) open chapter-01 → (6) mark complete → (7) take quiz → (8) submit → (9) return to dashboard → verify 20% + score in chart; report any broken steps
- [ ] T052 Test mobile responsiveness at 375px: use browser DevTools device emulation; verify all pages: no horizontal scroll, buttons tappable, text readable, sidebar replaces with hamburger Sheet, quiz options stack vertically, forms fill full width
- [ ] T053 Test dark mode: toggle dark mode via Navbar button; verify all pages render correctly in dark mode — no white flashes, prose text readable with `prose-invert`, charts visible, shadcn components use CSS variables correctly; verify system preference default on first visit (no FOUC)

**Checkpoint**: All 5 user stories fully functional, polished, and verified on mobile + dark mode.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1 Auth)**: Depends on Phase 2 — MVP milestone
- **Phase 4 (US2 Chapters)**: Depends on Phase 3 (needs auth + layout)
- **Phase 5 (US3 Quiz)**: Depends on Phase 4 (needs chapter reader for Quiz button)
- **Phase 6 (US4 Dashboard)**: Depends on Phase 5 (needs quiz scores in progress)
- **Phase 7 (US5 Premium)**: Depends on Phase 3 (needs auth + tier); can run in parallel with US2–US4
- **Phase 8 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 Auth (P1)**: Foundational complete — MVP
- **US2 Chapters (P2)**: US1 complete (auth + layout required)
- **US3 Quiz (P3)**: US2 complete (quiz triggered from chapter reader)
- **US4 Dashboard (P4)**: US3 complete (needs quiz score data)
- **US5 Premium (P5)**: US1 complete (needs auth + tier); can run alongside US2–US4

### Within Each Phase

- Setup tasks (T001–T008): T001 → T002 → T003–T008 in parallel
- Foundational (T009–T016): T009 → T010–T011 → T012 → T013 → T014–T016
- US1: T017 → T018–T020 in parallel → T021 → T022–T025 in parallel → T026 → T027
- US2: T028 → T029 → T030 → T031 → T032 → T033
- US3: T034–T036 in parallel → T037 → T038
- US4: T039–T040 in parallel → T041 → T042 → T043
- US5: T044 → T045 → T046 → T047
- Polish: T048–T050 in parallel → T051 → T052 → T053

### Parallel Opportunities

```bash
# Phase 1: after T001+T002
T003, T004, T005, T007, T008  # all configure different files

# Phase 2: T009 first, then:
T010, T011  # different lib files
T014, T015, T016  # different hook files

# Phase 3: after T021 (dashboard layout):
T022, T023  # LoginForm + RegisterForm
T024, T025  # login page + register page

# Phase 5: after foundational
T034, T035, T036  # QuizProgress, QuizCard, QuizResult all different files

# Phase 8 polish:
T048, T049, T050  # different concerns, no dependencies
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001–T008)
2. Complete Phase 2: Foundational (T009–T016)
3. Complete Phase 3: US1 Auth (T017–T027)
4. **STOP and VALIDATE**: Auth flow works end-to-end
5. Deploy landing page to Vercel (static deploy)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 Auth → Landing + Register + Login + Dashboard shell (MVP!)
3. + US2 Chapters → Learning content accessible
4. + US3 Quiz → Knowledge check functional
5. + US4 Dashboard → Progress visible
6. + US5 Premium → AI features for Pro users
7. + Polish → Production-ready

### Total Task Count

- Phase 1 Setup: 8 tasks (T001–T008)
- Phase 2 Foundational: 8 tasks (T009–T016)
- Phase 3 US1: 11 tasks (T017–T027)
- Phase 4 US2: 6 tasks (T028–T033)
- Phase 5 US3: 5 tasks (T034–T038)
- Phase 6 US4: 5 tasks (T039–T043)
- Phase 7 US5: 4 tasks (T044–T047)
- Phase 8 Polish: 6 tasks (T048–T053)
- **Total: 53 tasks**
