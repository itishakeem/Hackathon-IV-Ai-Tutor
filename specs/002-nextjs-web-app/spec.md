# Feature Specification: Course Companion FTE — Phase 3 (Next.js Web App)

**Feature Branch**: `002-nextjs-web-app`
**Created**: 2026-04-18
**Status**: Clarified

## Overview

A full standalone Next.js web application that serves as the student-facing interface for the Course Companion FTE platform. Students can register, browse and read course chapters, take quizzes, track their learning progress, and (for Pro tier subscribers) use AI-powered assessment and synthesis features — all backed by the existing Phase 1 and Phase 2 FastAPI backend.

---

## Clarifications

### Session 2026-04-18

- Q: Which Next.js rendering strategy per page? → A: Landing page: SSG (static). Auth pages: client-side only. Chapter list: SSR (auth check server-side). Chapter reader: SSR (fetch content server-side). Quiz page: client-side only (interactive). Dashboard: SSR (fetch progress server-side). Premium page: client-side only (interactive forms).
- Q: How is JWT handled between Next.js and FastAPI? → A: On login: store JWT in Zustand store + localStorage. Axios interceptor reads from Zustand store. On page refresh: rehydrate from localStorage. On 401 response: clear store + redirect to /login. No httpOnly cookies — localStorage approach for hackathon simplicity.
- Q: What happens when free user visits /premium? → A: Show a locked page UI with upgrade prompt inline (no redirect). Display pricing cards on same page. CTA links to /register or upgrade flow.
- Q: How to handle markdown rendering in chapter reader? → A: Use react-markdown with remark-gfm plugin. Apply Tailwind prose classes for typography. Extract ## headings for sidebar outline using rehype plugin.
- Q: Dark mode implementation? → A: Use next-themes. Default to system preference. Toggle button in Navbar.
- Q: Mobile navigation? → A: Desktop: fixed left sidebar. Mobile: hamburger menu → slide-out drawer using shadcn Sheet component.
- Q: Loading states? → A: shadcn Skeleton for all data fetches. Loading spinner on form submissions. Disable buttons during API calls.
- Q: Error handling strategy? → A: react-hot-toast for success/error notifications. Inline errors on forms. Empty state components when no data.
- Q: Chart library? → A: Recharts for quiz score line chart. Simple line chart, no complex visualisations.
- Q: TypeScript strict mode? → A: Yes — strict: true in tsconfig.json.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authentication & Onboarding (Priority: P1)

A new visitor lands on the marketing page, reads the course overview and pricing, decides to sign up, and is redirected to their dashboard after registering. A returning user logs in and is taken directly to the dashboard.

**Why this priority**: No other journey is possible without an authenticated session. This unblocks all remaining user stories.

**Independent Test**: Open the landing page, click "Get Started", complete registration, land on the dashboard — the app is usable end-to-end for this flow alone.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they click "Get Started", **Then** they are taken to the registration form.
2. **Given** a visitor on the registration form, **When** they submit a valid email and password, **Then** they are redirected to `/dashboard` and their JWT is persisted in localStorage.
3. **Given** a visitor submitting a duplicate email, **When** the registration fails, **Then** an inline error message is shown without a page reload.
4. **Given** a registered user on the login page, **When** they submit correct credentials, **Then** they land on `/dashboard`.
5. **Given** a logged-in user, **When** they close and reopen the browser, **Then** they remain logged in (JWT rehydrated from localStorage into Zustand store on app load).
6. **Given** a user with an expired or cleared session, **When** they navigate to any protected page, **Then** they are redirected to `/login`.

---

### User Story 2 — Browse & Read Course Chapters (Priority: P2)

A logged-in student visits the chapter list, sees all five modules with their completion status, opens a chapter to read the content, and marks it as complete. Free-tier users see a lock on chapters 4–5 and an upgrade prompt when they attempt to open them.

**Why this priority**: Core learning experience — the primary reason a student uses the platform.

**Independent Test**: Log in as a free user, visit `/learn`, open chapter-01, read it, click "Mark as Complete", navigate to chapter-02 via the Next button.

**Acceptance Scenarios**:

1. **Given** a logged-in user on `/learn`, **When** the page loads, **Then** all 5 chapter cards are visible with title, description, and completion badge.
2. **Given** a free-tier user, **When** they view the chapter list, **Then** chapters 4 and 5 display a lock icon.
3. **Given** a free-tier user, **When** they click a locked chapter, **Then** an upgrade modal appears instead of the chapter content.
4. **Given** a user on a chapter page, **When** the content loads, **Then** markdown renders with headings, code blocks, and images correctly (via react-markdown + remark-gfm + Tailwind prose classes).
5. **Given** a user on a chapter page, **When** they click "Mark as Complete", **Then** the chapter shows as completed in the chapter list immediately.
6. **Given** a user on chapter-02, **When** they click "Previous", **Then** they navigate to chapter-01; clicking "Next" navigates to chapter-03.
7. **Given** a user on a chapter page, **When** the content is loading, **Then** a skeleton placeholder is visible.
8. **Given** a user on a chapter page with multiple `##` headings, **When** the sidebar renders, **Then** all `##` headings appear as clickable outline links.

---

### User Story 3 — Quiz & Knowledge Check (Priority: P3)

After finishing a chapter, a student takes the associated quiz. Questions are shown one at a time with A/B/C/D choices. After submitting all answers, the student sees their score, which answers were correct/incorrect, and can retry or view the answer key.

**Why this priority**: Reinforces learning and motivates progress; depends on chapter being readable (US2).

**Independent Test**: Navigate to `/quiz/chapter-01`, answer all questions, submit, see score and feedback, retry.

**Acceptance Scenarios**:

1. **Given** a user on a chapter page, **When** they click the "Quiz" button, **Then** they are taken to the quiz for that chapter.
2. **Given** a user on the quiz page, **When** a question is displayed, **Then** exactly four labelled option buttons are shown.
3. **Given** a user who selects an answer and clicks Next, **When** the last question is answered, **Then** submitting reveals the score screen.
4. **Given** a submitted quiz, **When** the score screen shows, **Then** each question shows correct/incorrect feedback with the right answer highlighted.
5. **Given** a user on the score screen, **When** they click "Retry", **Then** the quiz resets to question 1 with no previous answers.
6. **Given** a user on the score screen, **When** they click "View Answers", **Then** all questions and correct answers are displayed.

---

### User Story 4 — Learning Progress Dashboard (Priority: P4)

A student visits their dashboard and sees an overview of their progress: overall completion percentage, current streak, quiz score history in a chart, and average score.

**Why this priority**: Motivates continued learning via progress visibility; depends on chapters and quizzes being functional (US2, US3).

**Independent Test**: Complete one chapter and one quiz, visit `/dashboard`, verify the progress bar reflects completion and the quiz score appears in the chart.

**Acceptance Scenarios**:

1. **Given** a student on `/dashboard`, **When** the page loads, **Then** a progress bar shows the percentage of chapters completed out of 5.
2. **Given** a student who has completed chapters on consecutive days, **When** they view the dashboard, **Then** a streak counter with a flame icon shows the correct streak count.
3. **Given** a student who has taken quizzes, **When** they view the dashboard, **Then** a Recharts line chart displays their quiz scores over time.
4. **Given** a student on the dashboard, **When** the data is loading, **Then** shadcn Skeleton placeholders are shown for all data-dependent sections.

---

### User Story 5 — Premium AI Features (Priority: P5)

A Pro-tier student accesses the premium page to use LLM-graded assessment (submits a free-text answer, gets a score and detailed feedback) and cross-chapter synthesis (selects 2–5 chapters, gets a narrative synthesis and knowledge graph). Non-Pro users see an inline upgrade prompt with pricing cards.

**Why this priority**: Highest-value differentiator but depends on all core journeys being working (US1–US4). Pro users only.

**Independent Test**: Log in as a Pro user, navigate to `/premium`, select the Assessment tab, submit an answer for a chapter, verify score and feedback render. Then switch to Synthesis tab, select 3 chapters, submit, verify synthesis and knowledge graph render.

**Acceptance Scenarios**:

1. **Given** a non-Pro user navigating to `/premium`, **When** the page loads, **Then** pricing cards and an upgrade prompt are shown inline (no redirect); AI feature forms are not accessible.
2. **Given** a Pro user on the Assessment tab, **When** they select a chapter, enter a question and answer, and submit, **Then** score (0–100), feedback, strengths, and improvements are displayed.
3. **Given** a Pro user on the Synthesis tab, **When** they select fewer than 2 chapters and submit, **Then** an inline validation error prevents submission.
4. **Given** a Pro user on the Synthesis tab, **When** they select 3 chapters and submit, **Then** synthesis narrative, key connections, and a knowledge graph are displayed.
5. **Given** a Pro user on the Premium page, **When** the usage section loads, **Then** tokens used and total cost for the current month are displayed.
6. **Given** a Pro user who submits an AI request, **When** the backend is processing, **Then** a loading spinner is shown and the submit button is disabled until the response returns.

---

### Edge Cases

- **Offline / API unreachable**: All pages that fetch data show an error state with a retry option rather than a blank page.
- **Network timeout on AI request**: Premium form shows a timeout error after 30 seconds and re-enables the submit button.
- **Expired JWT mid-session**: Any API call returning 401 clears the Zustand store and localStorage, then redirects to `/login`; unsaved form data is lost.
- **No JWT in localStorage on app load**: Zustand store initialises as unauthenticated; protected routes redirect to `/login`.
- **Free user direct URL to locked chapter**: Direct navigation to `/learn/chapter-05` shows upgrade modal; chapter content is never rendered.
- **Empty quiz history**: Dashboard chart and average score section show a "No quiz attempts yet" empty state rather than an empty/broken chart (react-hot-toast not triggered; empty state component shown).
- **Pro user with zero LLM usage**: Usage section shows $0.00 and 0 tokens with no errors.
- **Mobile viewport on quiz**: Option buttons remain tappable and readable at 320px width.
- **Pro user exceeds daily rate limit**: Assessment and synthesis forms show a "Daily limit reached — resets at midnight UTC" message (via react-hot-toast + inline error); form submission is blocked.
- **Dark mode on first visit**: Colour scheme defaults to system preference via next-themes; no flash of wrong theme on load.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**
- **FR-001**: The system MUST allow new users to register with email and password and receive an authenticated session.
- **FR-002**: The system MUST allow existing users to log in with email and password.
- **FR-003**: The system MUST persist the JWT in localStorage and rehydrate it into the Zustand auth store on every page load to maintain session across browser restarts.
- **FR-004**: The system MUST redirect unauthenticated users who access protected routes to the login page.
- **FR-005**: The system MUST display inline validation errors for registration failures (duplicate email, weak password) without a full page reload.
- **FR-006**: The system MUST clear the JWT from localStorage and Zustand store on 401 responses, then redirect to `/login`.

**Page Rendering Strategy**
- **FR-007**: The landing page MUST be statically generated (SSG) at build time — no per-request server work.
- **FR-008**: The chapter list page MUST use server-side rendering (SSR) to perform the authentication check before sending HTML to the browser.
- **FR-009**: The chapter reader page MUST use server-side rendering (SSR) to fetch and embed chapter content before sending HTML to the browser.
- **FR-010**: The dashboard page MUST use server-side rendering (SSR) to fetch progress data server-side.
- **FR-011**: Auth pages, quiz pages, and the premium page MUST be client-side only (no SSR); authentication state is read from the Zustand store.

**Chapter Browsing & Reading**
- **FR-012**: The system MUST display all 5 course chapters in a browsable list with title, description, and completion status.
- **FR-013**: The system MUST render chapter markdown content using react-markdown with the remark-gfm plugin, styled with Tailwind prose classes.
- **FR-014**: The system MUST extract `##` headings from chapter markdown and display them as a clickable outline in the chapter sidebar using a rehype plugin.
- **FR-015**: The system MUST restrict chapters 4–5 for free-tier users, showing a lock icon on the list and an upgrade modal when the chapter is accessed.
- **FR-016**: The system MUST allow users to mark a chapter as complete and immediately reflect this in the chapter list.
- **FR-017**: The system MUST provide previous/next navigation between adjacent chapters.

**Quizzes**
- **FR-018**: The system MUST present quiz questions one at a time with four labelled answer options.
- **FR-019**: The system MUST display a score, per-question feedback, and the correct answers after quiz submission.
- **FR-020**: The system MUST allow users to retry a quiz, resetting all selections.

**Dashboard**
- **FR-021**: The system MUST display an overall course completion percentage based on completed chapters.
- **FR-022**: The system MUST display the user's current learning streak (consecutive days with activity).
- **FR-023**: The system MUST display a Recharts line chart of the user's quiz scores over time.
- **FR-024**: The system MUST display the user's average quiz score.

**Premium Features**
- **FR-025**: The system MUST show non-Pro users an inline upgrade prompt with pricing cards on the premium page (no redirect).
- **FR-026**: The system MUST allow Pro users to submit a free-text answer for a selected chapter and display the AI-generated score, feedback, strengths, and improvements.
- **FR-027**: The system MUST allow Pro users to select 2–5 chapters and receive an AI-generated synthesis narrative, key connections, and knowledge graph.
- **FR-028**: The system MUST display the Pro user's LLM usage (tokens used, total cost) for the current month.
- **FR-029**: The system MUST show a loading spinner and disable the submit button during AI requests to prevent duplicate submissions.

**Cross-Cutting UX**
- **FR-030**: The system MUST display shadcn Skeleton components for all data-dependent sections while fetching.
- **FR-031**: The system MUST use react-hot-toast for success and error notifications (e.g., mark complete, quiz submitted, login error).
- **FR-032**: The system MUST handle 403 responses from the backend by showing an upgrade prompt inline.
- **FR-033**: The system MUST be responsive across viewport widths from 320px to 1440px.
- **FR-034**: The system MUST support light and dark mode via next-themes, defaulting to the user's system preference, with a toggle button in the Navbar.
- **FR-035**: On desktop (≥768px), the system MUST display a fixed left sidebar for navigation. On mobile (<768px), the system MUST display a hamburger menu that opens a slide-out drawer (shadcn Sheet component).

---

### Key Entities

- **User**: Authenticated identity with email, display name, and subscription tier (free / premium / pro). Tier is decoded from the JWT payload client-side; no separate profile endpoint needed.
- **AuthToken**: JWT string stored in localStorage and held in Zustand auth store. Axios interceptor attaches it as `Authorization: Bearer <token>` to every API request. Cleared on 401.
- **Chapter**: A course unit with title, description, ordered position, markdown content, and per-user completion status. Chapters 4–5 are gated to free-tier users.
- **Quiz**: A set of multiple-choice questions associated with a chapter, with per-user attempt history and scores.
- **Progress**: Aggregate of a user's completed chapters, quiz scores, and daily activity streak — fetched server-side on dashboard load.
- **Assessment**: A single AI-graded evaluation of a student's free-text answer, associated with a chapter and question, returning score and detailed feedback. Pro tier only.
- **Synthesis**: An AI-generated cross-chapter analysis for a given set of chapters and focus topic, returning narrative, connections, and a knowledge graph. Pro tier only.
- **LLM Usage Record**: A logged entry per AI call recording tokens consumed and cost, scoped to a user and feature type. Displayed in the premium usage section.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration and reach the chapter list in under 60 seconds.
- **SC-002**: A user can open a chapter and see fully rendered content in under 3 seconds on a standard broadband connection (aided by SSR pre-fetching content server-side).
- **SC-003**: A user can complete a full quiz (all questions → submit → see score) in one uninterrupted client-side flow with no page reloads or navigation errors.
- **SC-004**: Dashboard progress data reflects changes (chapter marked complete, quiz submitted) within 5 seconds of the action.
- **SC-005**: A Pro user can submit an AI assessment request and receive feedback without leaving the premium page.
- **SC-006**: All pages render correctly and are usable on a 320px-wide mobile viewport without horizontal scrolling.
- **SC-007**: Free-tier users cannot access locked chapters or the premium AI features — verified by direct URL navigation and API-level 403 checks.
- **SC-008**: JWT is stored only in localStorage and the in-memory Zustand store; it is never written to a cookie or exposed via a non-JavaScript-accessible mechanism.
- **SC-009**: Skeleton loading states appear for all network-dependent UI sections within 100ms of a page render.
- **SC-010**: The application renders in both light and dark modes without a visible flash of incorrect theme on initial page load.

---

## Assumptions

- The backend API is available at the configured `NEXT_PUBLIC_API_URL` and all required Phase 1 + Phase 2 endpoints are functional.
- Subscription tier (`free` / `premium` / `pro`) is included in the JWT payload returned by the backend on login; the frontend decodes the token client-side to read tier without a separate profile fetch.
- Chapter content is plain markdown fetched via the backend; the frontend handles rendering with react-markdown + remark-gfm.
- The chapter list is limited to exactly 5 chapters for this phase; pagination is not required.
- Email/password is the only supported authentication method in this phase; OAuth/SSO is out of scope.
- Dark mode toggle state is managed by next-themes and defaults to system preference; it is not a server-persisted user preference.
- Pricing page and upgrade flow link to an external payment processor; payment integration is out of scope for this phase.
- TypeScript strict mode (`strict: true`) is enabled in `tsconfig.json`; all components and hooks must pass strict type checking with no `any` escapes except where explicitly justified.

---

## Out of Scope

- Payment processing or subscription management UI
- OAuth / social login (Google, GitHub, etc.)
- Real-time collaboration or live updates (WebSockets)
- Admin or instructor dashboards
- User profile editing or avatar upload
- Email notifications or password reset flows
- SSR for auth/quiz/premium pages (client-side only per clarification)
- Native mobile application
- Complex data visualisations beyond a simple Recharts line chart
