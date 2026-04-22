# Implementation Plan: Course Companion FTE — Phase 3 (Next.js Web App)

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19
**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

---

## Summary

Build a standalone Next.js 15 (App Router) web application that consumes the existing Phase 1 + Phase 2 FastAPI backend. Students can register, read course chapters with markdown rendering, take quizzes, track progress on a dashboard, and (Pro tier) submit AI-powered assessments and cross-chapter synthesis via the backend premium endpoints. JWT is stored in localStorage + Zustand. Rendering is per-page: SSG for landing, SSR for chapter list/reader/dashboard, CSR for auth/quiz/premium.

---

## Technical Context

**Language/Version**: TypeScript 5.x (`strict: true`), Node.js 20+
**Framework**: Next.js 15 (App Router, React 18)
**Styling**: Tailwind CSS 3.x + `@tailwindcss/typography` (prose classes)
**UI Components**: shadcn/ui (Radix-based, copied into `components/ui/`)
**State Management**: Zustand 5.x with `persist` middleware → localStorage
**HTTP Client**: Axios 1.x with JWT interceptor
**Markdown**: react-markdown 9.x + remark-gfm + rehype-slug
**Charts**: Recharts 2.x
**Dark Mode**: next-themes 0.3.x
**Notifications**: react-hot-toast 2.x
**Icons**: lucide-react
**Package Manager**: pnpm 9+
**Storage**: No new database (frontend only; all data from FastAPI backend)
**Testing**: Manual + integration via browser; no automated test suite for frontend in this phase
**Target Platform**: Web browser (320px–1440px), deployed to Vercel
**Performance Goals**: Chapter content rendered in <3s on broadband; skeleton states visible within 100ms
**Constraints**: JWT in localStorage (not httpOnly cookie — documented tradeoff); No LLM calls in frontend
**Scale/Scope**: 5 chapters, 5 pages, ~30 components, 1 API client

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Backend-LLM | ✅ PASS | Frontend makes NO LLM calls; all AI via backend premium endpoints |
| II. Hybrid is Selective and Premium | ✅ PASS | Assessment + Synthesis shown only to Pro tier; upgrade prompt for others |
| III. SDD — Spec is Source Code | ✅ PASS | spec.md → plan.md → tasks.md → implementation |
| IV. Dual-Frontend Shared Backend | ✅ PASS | Next.js frontend shares the Phase 1+2 FastAPI backend; no backend duplication |
| V. Content in Cloudflare R2 | ✅ PASS | Frontend renders markdown from backend response; no content hardcoded |
| VI. Freemium Access Control | ✅ PASS | Lock icons on chapters 4-5, upgrade modal on locked content, tier gate on /premium |
| VII. Observability & Cost Transparency | ✅ PASS | LLM usage section on premium page displays tokens + cost from backend |

**Gate result**: PASS — no violations. Proceed to Phase 0 research (complete) and Phase 1 design.

---

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| localStorage JWT (not httpOnly) | Hackathon simplicity — no Next.js Route Handler proxy needed | httpOnly requires an extra proxy layer (Route Handler) between frontend and FastAPI; adds complexity without value for a hackathon |
| SSR for chapter list/reader/dashboard | SEO + correct auth check server-side before HTML render | Pure CSR would flash unauthenticated state briefly on protected pages |
| per-page rendering strategy (SSG/SSR/CSR mix) | Optimal performance + correctness per page type | Uniform CSR would break search indexing on landing page; uniform SSR would add unnecessary server round-trips on quiz/premium |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-nextjs-web-app/
├── plan.md              ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── frontend-api-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             ← created by /sp.tasks
```

### Source Code Layout

```text
frontend/
├── app/
│   ├── layout.tsx                  # Root layout: ThemeProvider, Toaster, AuthRehydrator
│   ├── page.tsx                    # Landing page (SSG)
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login (CSR)
│   │   └── register/page.tsx       # Register (CSR)
│   └── (dashboard)/
│       ├── layout.tsx              # Protected layout: Navbar + Sidebar
│       ├── dashboard/page.tsx      # Dashboard (SSR)
│       ├── learn/
│       │   ├── page.tsx            # Chapter list (SSR)
│       │   └── [chapterId]/page.tsx # Chapter reader (SSR)
│       ├── quiz/
│       │   └── [chapterId]/page.tsx # Quiz (CSR)
│       └── premium/page.tsx        # Premium (CSR)
├── components/
│   ├── ui/                         # shadcn/ui components (auto-generated)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── chapters/
│   │   ├── ChapterList.tsx
│   │   ├── ChapterReader.tsx
│   │   └── ChapterNav.tsx
│   ├── quiz/
│   │   ├── QuizCard.tsx
│   │   ├── QuizResult.tsx
│   │   └── QuizProgress.tsx
│   ├── dashboard/
│   │   ├── ProgressChart.tsx
│   │   ├── StreakCard.tsx
│   │   └── BadgeCard.tsx
│   ├── premium/
│   │   ├── AssessmentForm.tsx
│   │   └── SynthesisForm.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts                      # Axios instance + JWT interceptor + error interceptor
│   ├── auth.ts                     # decodeJwt(), isTokenExpired()
│   └── utils.ts                    # cn() (class merging), formatCost(), formatDate()
├── hooks/
│   ├── useAuth.ts                  # Read Zustand auth state
│   ├── useProgress.ts              # GET /progress/{userId}
│   └── useChapters.ts              # GET /chapters (client-side refresh after mark-complete)
├── store/
│   └── authStore.ts                # Zustand store: token, user, setAuth, clearAuth (persist → localStorage)
├── types/
│   └── index.ts                    # All TypeScript interfaces (see data-model.md)
├── .env.local                      # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_NAME
├── next.config.ts
├── tailwind.config.ts              # darkMode: 'class', typography plugin
├── tsconfig.json                   # strict: true
└── package.json
```

---

## Area 1: Project Initialization

**Complexity**: Low
**Files to create**: All scaffold files via `pnpm create next-app`

### Key Decisions

1. **Scaffold command**:
   ```bash
   pnpm create next-app frontend --typescript --tailwind --app --no-eslint --import-alias "@/*"
   ```

2. **Dependency install** (single command):
   ```bash
   pnpm add axios zustand react-markdown remark-gfm rehype-slug @tailwindcss/typography recharts next-themes react-hot-toast lucide-react
   ```

3. **shadcn/ui init**:
   ```bash
   npx shadcn@latest init  # Choose: TypeScript, tailwind.config.ts, CSS variables
   npx shadcn@latest add button input card skeleton sheet tabs badge progress dialog
   ```

4. **tsconfig.json**: `"strict": true` already set by scaffold; verify and keep.

5. **tailwind.config.ts** additions:
   ```ts
   darkMode: 'class',
   plugins: [require('@tailwindcss/typography')],
   theme: {
     extend: {
       colors: { primary: { DEFAULT: '#6366f1', ... } }
     }
   }
   ```

6. **next.config.ts**: No API proxy needed — Axios calls backend directly via `NEXT_PUBLIC_API_URL`.

### Build Order
1. Scaffold → 2. Install deps → 3. shadcn init → 4. Configure tailwind → 5. Set .env.local

---

## Area 2: TypeScript Types (`types/index.ts`)

**Complexity**: Low
**Files**: `frontend/types/index.ts`

All interfaces are defined before any component work. Full type list in [data-model.md](data-model.md). Key types:
- `AuthToken`, `JwtPayload`, `AuthState`
- `ChapterMeta`, `ChapterContent`, `ChapterNav`, `AccessCheck`
- `QuizQuestion`, `QuizSubmit`, `QuizResult`, `QuestionResult`
- `ProgressResponse`, `ProgressUpdate`
- `AssessmentRequest`, `AssessmentResponse`
- `SynthesisRequest`, `SynthesisResponse`, `GraphEdge`
- `LlmUsageRecord`, `UsageResponse`
- `ApiState<T>`, `FormState`

**Build order**: First file written — all components depend on this.

---

## Area 3: API Client (`lib/api.ts`)

**Complexity**: Low
**Files**: `frontend/lib/api.ts`, `frontend/lib/auth.ts`, `frontend/lib/utils.ts`

### `lib/api.ts` — Axios instance
```typescript
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### `lib/auth.ts`
- `decodeJwt(token: string): JwtPayload` — manual base64 decode (no extra package needed)
- `isTokenExpired(payload: JwtPayload): boolean` — compare `payload.exp` vs `Date.now() / 1000`

### `lib/utils.ts`
- `cn(...classes)` — Tailwind class merging via `clsx` + `tailwind-merge`
- `formatCost(usd: number): string` — "$0.0140"
- `formatDate(iso: string): string` — human-readable date

**Build order**: After types, before store and components.

---

## Area 4: Auth Store (`store/authStore.ts`)

**Complexity**: Low
**Files**: `frontend/store/authStore.ts`

```typescript
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }  // persists to localStorage key 'auth-storage'
  )
);
```

On app load: Zustand `persist` middleware rehydrates from `localStorage` automatically before first render.
On 401: `clearAuth()` called from Axios interceptor.

**Build order**: After `lib/api.ts` (circular dependency avoided — store doesn't import api; api reads store via `getState()`).

---

## Area 5: Root Layout & Auth Rehydration

**Complexity**: Low
**Files**: `frontend/app/layout.tsx`

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />   {/* react-hot-toast */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` prevents React warnings when next-themes modifies `html` class server-side vs client-side.

**Build order**: Before any page.

---

## Area 6: Layout Components

**Complexity**: Medium
**Files**: `components/layout/Navbar.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Footer.tsx`, `app/(dashboard)/layout.tsx`

### Navbar
- Logo + app name (left)
- Dark mode toggle (ThemeToggle button using `next-themes` `useTheme`)
- User avatar/email + logout button (right) — reads from `useAuthStore`
- Mobile: hamburger button that opens Sidebar as shadcn `Sheet`

### Sidebar
- Navigation links: Dashboard, Learn, Premium
- Active link highlighted with indigo
- Desktop: `fixed left-0 top-0 h-full w-64` — always visible
- Mobile: rendered inside `Sheet` component (slide-out drawer)

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
```tsx
// Redirect if not authenticated (server-side check via cookies or client-side guard)
// Render: Navbar + Sidebar + {children}
```

**Responsive pattern**:
```
Desktop (≥768px): flex with fixed sidebar (w-64) + main content (ml-64)
Mobile (<768px):  full-width content + Sheet-based nav
```

---

## Area 7: Landing Page

**Complexity**: Low
**Files**: `app/page.tsx`
**Rendering**: SSG (no `export const dynamic = 'force-dynamic'`)

### Sections
1. **Hero**: "Learn AI Agent Development 24/7" headline, sub-copy, "Get Started" → `/register` + "View Course" → `/learn`
2. **Course Overview**: 5 module cards (hardcoded — chapter metadata, not API-fetched for SSG)
3. **Pricing Table**: 3 cards — Free ($0), Premium ($9.99/mo), Pro ($19.99/mo) with feature lists
4. **Footer**: links

**Note**: No API calls on landing page — fully static. Module titles come from static data to avoid async calls during build.

---

## Area 8: Auth Pages

**Complexity**: Low
**Files**: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`
**Rendering**: CSR (`'use client'`)

### LoginForm
- shadcn `Input` for email + password
- Submit → `POST /auth/login` → `setAuth(token, decodeJwt(token))` → `router.push('/dashboard')`
- Error: inline below form (`state.error && <p className="text-red-500">`)
- Loading: button disabled + spinner icon

### RegisterForm
- Same pattern + confirm password field (client-side validation only)
- 409 error → "Email already in use"
- 422 error → parse `detail` array for field errors

### Redirect guard
- If already authenticated (`useAuthStore.isAuthenticated`), redirect to `/dashboard` via `useRouter`

---

## Area 9: Chapter Pages

**Complexity**: Medium
**Files**: `app/(dashboard)/learn/page.tsx`, `app/(dashboard)/learn/[chapterId]/page.tsx`, `components/chapters/ChapterList.tsx`, `components/chapters/ChapterReader.tsx`, `components/chapters/ChapterNav.tsx`

### Chapter List (`/learn`) — SSR
```typescript
// Server Component
export default async function LearnPage() {
  // Read token from header (passed via custom header or cookie in SSR context)
  const chapters = await fetchChapters(); // GET /chapters
  const progress = await fetchProgress(userId); // GET /progress/{userId}
  // Merge: chapters.map(c => ({ ...c, is_completed: progress.completed_chapters.includes(c.id) }))
  return <ChapterList chapters={enrichedChapters} userTier={tier} />;
}
```

**ChapterList component**:
- Grid layout (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Each card: title, description, completion badge (shadcn `Badge`)
- Lock icon (`lucide-react Lock`) on chapters 4-5 for free tier
- Click locked → `Dialog` (upgrade modal) with pricing CTA

### Chapter Reader (`/learn/[chapterId]`) — SSR
```typescript
export default async function ChapterPage({ params }) {
  const chapter = await fetchChapter(params.chapterId); // GET /chapters/{id}
  // On 403 → show upgrade modal server-side
  return <ChapterReader chapter={chapter} />;
}
```

**ChapterReader component** (`'use client'`):
- `react-markdown` with `remarkPlugins={[remarkGfm]}`, `rehypePlugins={[rehypeSlug]}`
- Tailwind: `className="prose prose-indigo dark:prose-invert max-w-none"`
- Left sidebar: extract `## Heading` via regex or rehype pass → sticky `<nav>` with anchor links
- "Mark as Complete" button → `PUT /progress/{userId}/chapter` → `toast.success`
- "Quiz" button → `router.push('/quiz/{chapterId}')`
- Bottom: `<ChapterNav>` (Prev/Next buttons from `GET /chapters/{id}/next` and `/previous`)

---

## Area 10: Quiz Page

**Complexity**: Medium
**Files**: `app/(dashboard)/quiz/[chapterId]/page.tsx`, `components/quiz/QuizCard.tsx`, `components/quiz/QuizResult.tsx`, `components/quiz/QuizProgress.tsx`
**Rendering**: CSR (`'use client'`)

### State machine (React `useState`)
```
phase: 'loading' | 'question' | 'submitted'
currentIndex: number (0 to questions.length-1)
answers: Record<questionId, 'A'|'B'|'C'|'D'>
result: QuizResult | null
```

### QuizCard
- Question text + 4 option buttons (shadcn `Button` variant="outline")
- Selected option highlighted with indigo border
- "Next" button advances `currentIndex`; last question shows "Submit"
- shadcn `Progress` bar at top: `(currentIndex / total) * 100`

### QuizResult
- Score display: large number `85/100`
- Per-question rows: ✓ green / ✗ red + correct answer shown
- "Retry" → reset state; "View Answers" → `GET /quizzes/{id}/answers` → overlay

---

## Area 11: Dashboard Page

**Complexity**: Medium
**Files**: `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/ProgressChart.tsx`, `components/dashboard/StreakCard.tsx`
**Rendering**: SSR

```typescript
// Server Component
export default async function DashboardPage() {
  const progress = await fetchProgress(userId); // GET /progress/{userId}
  return <DashboardView progress={progress} />;
}
```

**DashboardView** (`'use client'` for Recharts):
- **Progress bar**: shadcn `Progress` value={progress.completion_percentage}
- **Streak card**: 🔥 + `{progress.streak} day streak`
- **ProgressChart** (`Recharts LineChart`):
  ```tsx
  <LineChart data={chartData}>
    <XAxis dataKey="date" />
    <YAxis domain={[0, 100]} />
    <Line type="monotone" dataKey="score" stroke="#6366f1" />
    <Tooltip />
  </LineChart>
  ```
  `chartData` = `progress.quiz_scores.map(s => ({ date: formatDate(s.attempted_at), score: s.score }))`
- **Average score**: `(sum of scores / count) || 0`
- **Skeleton states**: `<Skeleton className="h-4 w-full" />` while SSR loading

---

## Area 12: Premium Page

**Complexity**: High
**Files**: `app/(dashboard)/premium/page.tsx`, `components/premium/AssessmentForm.tsx`, `components/premium/SynthesisForm.tsx`
**Rendering**: CSR (`'use client'`)

### Gate check
```tsx
const { user } = useAuthStore();
if (user?.tier !== 'pro') return <UpgradePrompt />;
```

### UpgradePrompt
- "Upgrade to Pro" heading
- 3 pricing cards with feature lists (same as landing page pricing table)
- CTA: "Upgrade Now" (links to payment page placeholder)

### AssessmentForm (Tab 1)
- Chapter select (`<select>` with 5 chapter options)
- Question `<Input>`
- Student answer `<Textarea>` (min 10 chars)
- Submit → `POST /premium/assess-answer` → show `AssessmentResult` panel
- Loading: spinner + disabled button
- 429 → `toast.error("Daily limit reached")`

### SynthesisForm (Tab 2)
- Multi-select chapter checkboxes (2–5 constraint, client-side validation)
- Optional focus topic `<Input>`
- Submit → `POST /premium/synthesize` → show `SynthesisResult` panel
- Knowledge graph rendered as a styled list of edges (no graph visualisation library needed)

### Usage Section (below tabs)
- `GET /premium/usage/{userId}` on mount
- Table: feature | tokens | cost | date
- Total cost row at bottom
- Skeleton while loading

---

## Area 13: Responsive Design

**Complexity**: Low (Tailwind utility-first)

| Breakpoint | Width | Behaviour |
|-----------|-------|-----------|
| Mobile | 320px–767px | Full-width pages, no sidebar, hamburger nav |
| Tablet | 768px–1279px | Sidebar appears (collapsible optional) |
| Desktop | 1280px+ | Fixed sidebar (w-64), wider content area |

**Key Tailwind patterns**:
- Sidebar: `hidden md:flex` on sidebar wrapper; `flex md:hidden` on hamburger
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Quiz options: `flex flex-col gap-2` (always stacked, never horizontal)
- Typography: `prose sm:prose-lg` (slightly larger on tablet+)

---

## Area 14: Deployment (Vercel)

**Complexity**: Low
**Files**: No code changes needed

### Steps
1. Push `frontend/` to GitHub (separate directory in same repo or new repo)
2. Connect to Vercel: "New Project" → import repo → root directory = `frontend/`
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = `https://course-companion-fte.fly.dev`
   - `NEXT_PUBLIC_APP_NAME` = `Course Companion FTE`
4. Deploy: Vercel auto-detects Next.js, runs `pnpm build`
5. Verify: visit Vercel URL, test registration and chapter read

**CORS**: Backend already has `allow_origins=["*"]` in Phase 1 middleware — no change needed.

---

## ADR Suggestions

1. 📋 **App Router vs Pages Router** — Document the choice to use Next.js 15 App Router and the per-page SSG/SSR/CSR strategy. Run `/sp.adr app-router-rendering-strategy`

2. 📋 **Zustand + localStorage JWT** — Document the conscious tradeoff: localStorage over httpOnly cookies for hackathon speed, and what would need to change for production hardening. Run `/sp.adr jwt-localstorage-tradeoff`

3. 📋 **Axios interceptor pattern** — Document the centralised auth header + 401/403 handling pattern in `lib/api.ts`. Run `/sp.adr axios-interceptor-auth-pattern`

---

## Build Order (Implementation Sequence)

| Step | Area | Files | Complexity |
|------|------|-------|-----------|
| 1 | Project Init | All scaffold files | Low |
| 2 | Types | `types/index.ts` | Low |
| 3 | API client | `lib/api.ts`, `lib/auth.ts`, `lib/utils.ts` | Low |
| 4 | Auth store | `store/authStore.ts` | Low |
| 5 | Root layout | `app/layout.tsx` | Low |
| 6 | Layout components | `Navbar`, `Sidebar`, `(dashboard)/layout.tsx` | Medium |
| 7 | Landing page | `app/page.tsx` | Low |
| 8 | Auth pages | `LoginForm`, `RegisterForm`, auth pages | Low |
| 9 | Chapter pages | `ChapterList`, `ChapterReader`, `ChapterNav` | Medium |
| 10 | Quiz page | `QuizCard`, `QuizResult`, `QuizProgress` | Medium |
| 11 | Dashboard | `ProgressChart`, `StreakCard`, dashboard page | Medium |
| 12 | Premium page | `AssessmentForm`, `SynthesisForm`, premium page | High |
| 13 | Deploy | Vercel config | Low |

**Total estimated components**: ~30
**Estimated pages**: 8 (landing, login, register, learn, chapter-reader, quiz, dashboard, premium)
