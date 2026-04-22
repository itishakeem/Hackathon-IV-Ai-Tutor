# Tasks: Luxury UI Redesign — Course Companion FTE Frontend

**Input**: `specs/003-luxury-ui-redesign/plan.md` + `specs/003-luxury-ui-redesign/spec.md`  
**Branch**: `003-luxury-ui-redesign`  
**Frontend root**: `frontend/` (all paths relative to `frontend/`)  
**Tech stack**: Next.js 16.2.4, Tailwind v4, shadcn v4.3.0 (base-ui, no asChild), framer-motion  

---

## Format: `- [ ] [TaskID] [P?] [StoryN?] Description — file path`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[US1–US5]**: Maps to spec.md user stories (P1=Landing, P2=Dashboard, P3=Profile, P4=About, P5=Contact)
- Setup / Foundational / Polish phases: NO story label

---

## Phase 0: Skill File (Design System Reference)

**Purpose**: Create the agent-reusable design context BEFORE any code is written. All subsequent sessions reference this file.

- [X] T001 Create `.claude/skills/luxury-ui/SKILL.md` — full design token palette (`#0A0A0F` bg, `#111118` card, `#1E1E2E` border, indigo/violet/cyan/gold colours), glassmorphism class combos (`backdrop-blur-xl bg-white/5 border border-white/10`), gradient text pattern (`bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`), glow shadow (`shadow-[0_0_30px_rgba(99,102,241,0.3)]`), gradient button class combo, framer-motion variant objects (`fadeInUp`, `staggerContainer`, `cardHover`), AnimatedCounter/ScrollReveal/MeshBackground code snippets

---

## Phase 1: Foundation (Design Tokens + Animation Layer)

**Purpose**: Install dependencies and create all shared infrastructure. Everything else depends on this phase.  
**⚠️ CRITICAL**: No shared components or pages can be built until this phase is complete.

- [X] T002 Install framer-motion and @tabler/icons-react — run `pnpm add framer-motion @tabler/icons-react` from `frontend/`
- [X] T003 Update `src/app/globals.css` — add `:root, .dark { --luxury-bg: #0A0A0F; --luxury-card: #111118; --luxury-border: #1E1E2E; --background: #0A0A0F; --foreground: #F8FAFC; }` block; add `@theme inline { --color-luxury-bg: var(--luxury-bg); --color-luxury-card: var(--luxury-card); --color-luxury-border: var(--luxury-border); --color-luxury-indigo: #4F46E5; --color-luxury-violet: #7C3AED; --color-luxury-cyan: #06B6D4; --color-luxury-gold: #F59E0B; }` block; add custom scrollbar (`scrollbar-width: thin; scrollbar-color: #4F46E5 #0A0A0F`), `::selection { background: rgba(79,70,229,0.3); }`, `html { scroll-behavior: smooth; }`
- [X] T004 Update `src/app/layout.tsx` — import `Inter` and `JetBrains_Mono` from `next/font/google`; add both to `<body>` via CSS variables; change `ThemeProvider` `defaultTheme` from `"system"` to `"dark"`; add `suppressHydrationWarning` on `<html>`
- [X] T005 Create `src/lib/animations.ts` — export `Variants` objects: `fadeIn` (opacity 0→1), `fadeInUp` (opacity 0→1 + y 20→0, 0.5s), `staggerContainer` (staggerChildren 0.1s), `staggerItem` (fadeInUp child), `pageTransition` (opacity + y for AnimatePresence), `cardHover` (y: -4 + shadow), `buttonPress` (scale 0.97 on tap); export `useReducedMotion()` hook that returns `window.matchMedia('(prefers-reduced-motion: reduce)').matches` (SSR-safe via `useState` + `useEffect`)

**Checkpoint**: `pnpm tsc --noEmit` must pass with zero errors

---

## Phase 2: Shared Luxury Components (Foundational)

**Purpose**: 7 reusable design-system components all pages depend on. All can be built in parallel.  
**⚠️ CRITICAL**: These must be complete before any layout or page work begins.

- [X] T006 [P] Create `src/components/ui/luxury/GradientText.tsx` — `'use client'`; props: `children`, `className?`, `from?: string` (default `indigo-400`), `to?: string` (default `violet-400`); renders `<span className={cn('bg-gradient-to-r from-{from} to-{to} bg-clip-text text-transparent', className)}>` — use inline style for dynamic colours; export default
- [X] T007 [P] Create `src/components/ui/luxury/GlassCard.tsx` — `'use client'`; props: `children`, `className?`, `hover?: boolean`, `padding?: string` (default `p-6`); renders `motion.div` with `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`; when `hover=true` applies `whileHover={{ y: -4, boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}`; uses `useReducedMotion` to skip animation when reduced motion preferred
- [X] T008 [P] Create `src/components/ui/luxury/GradientButton.tsx` — `'use client'`; props: all `React.ButtonHTMLAttributes<HTMLButtonElement>` + `variant?: 'primary' | 'ghost'`; `primary`: `bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]`; `ghost`: `border border-white/20 text-white hover:bg-white/5`; wraps in `motion.button` with `whileTap={{ scale: 0.97 }}`; respects `useReducedMotion`
- [X] T009 [P] Create `src/components/ui/luxury/AnimatedCounter.tsx` — `'use client'`; props: `end: number`, `suffix?: string`, `prefix?: string`, `duration?: number` (default 2); uses `useInView` from framer-motion + `useMotionValue` + `useSpring` + `useEffect` to animate from 0 to `end` when element enters viewport; `animate` on `motionValue` change with `useTransform` to display rounded integer; if `useReducedMotion()` is true, render `end` directly as static text; export default
- [X] T010 [P] Create `src/components/ui/luxury/ScrollReveal.tsx` — `'use client'`; props: `children`, `className?`, `delay?: number` (default 0); uses `useInView` + `motion.div` with `variants={fadeInUp}` + `initial="hidden"` + `whileInView="visible"` + `viewport={{ once: true }}`; if `useReducedMotion()` renders children in plain `div`; export default
- [X] T011 [P] Create `src/components/ui/luxury/MeshBackground.tsx` — `'use client'`; renders 3 absolutely-positioned `motion.div` blurred orbs using `animate={{ x: [0,30,-20,0], y: [0,-20,30,0] }}` with `transition={{ duration: 8+i*2, repeat: Infinity, ease: 'easeInOut' }}`; orb 1: indigo `w-96 h-96 bg-indigo-600/20 blur-3xl`; orb 2: violet `w-80 h-80 bg-violet-600/20 blur-3xl`; orb 3: cyan `w-64 h-64 bg-cyan-500/15 blur-3xl`; if `useReducedMotion()` render static positioned divs; accepts `className?`; export default
- [X] T012 [P] Create `src/components/ui/luxury/PageTransition.tsx` — `'use client'`; wraps children in `AnimatePresence mode="wait"` + `motion.div` with `variants={pageTransition}` + `initial="hidden"` + `animate="visible"` + `exit="hidden"`; accepts `children`, `className?`; export default

**Checkpoint**: `pnpm tsc --noEmit` must pass with zero errors

---

## Phase 3: Layout Redesign

**Purpose**: Redesign shared navigation and footer. Depends on Phase 1 (CSS tokens) + Phase 2 (GradientText, GlassCard).

- [X] T013 Redesign `src/components/layout/Navbar.tsx` — dark glassmorphism header: `sticky top-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10`; logo uses `GradientText` wrapping "Course Companion"; nav links: `/`, `/about`, `/contact`, `/dashboard` with hover underline animation via framer-motion `motion.span` underline `scaleX` 0→1; auth buttons use `<Link className={cn(buttonVariants({ size: 'sm' }))}>` (NOT asChild); mobile Sheet drawer preserved with hamburger icon; mark `'use client'`
- [X] T014 Redesign `src/components/layout/Footer.tsx` — dark `bg-black/80` with top gradient border `border-t border-gradient` (use `bg-gradient-to-r from-indigo-600 to-violet-600 h-px w-full`); 3-column grid: col 1 logo+tagline+copyright, col 2 nav links (Course, Pricing, About, Contact), col 3 social icons (Github, Twitter, Discord) using lucide-react; each social icon: `motion.a` with `whileHover={{ scale: 1.2, color: '#4F46E5' }}`

**Checkpoint**: `pnpm tsc --noEmit` must pass with zero errors

---

## Phase 4: Landing Page (Priority: P1) 🎯 MVP

**Goal**: Fully redesigned luxury public landing page — the primary conversion surface.

**Independent Test**: Visit `http://localhost:3000` without logging in. Verify: animated mesh hero renders, 3 headline lines stagger in, typewriter effect on subheadline, stats counters animate on scroll, 6 feature cards lift+glow on hover, Pro pricing card has gradient border + badge, annual/monthly toggle updates prices, footer has social links.

- [X] T015 [US1] Create Hero section component logic in `src/app/page.tsx` — add `'use client'`; import `MeshBackground`, `GradientText`, `GradientButton`; render `<MeshBackground>` as absolute fill behind hero `min-h-screen` section; 3 headline `motion.div` lines with `staggerContainer` + `staggerItem` variants; typewriter subheadline using `useState('')` + `useEffect` interval to append characters; primary CTA: `<GradientButton>Start Learning Free</GradientButton>` wrapped in `<Link href="/register">`; secondary CTA: `<Link href="/#curriculum" className="border border-white/20 ...">View Curriculum</Link>`; bouncing scroll arrow: `motion.div animate={{ y: [0,8,0] }} transition={{ repeat: Infinity, duration: 1.5 }}`
- [X] T016 [US1] Add Stats Bar section to `src/app/page.tsx` — `ScrollReveal`-wrapped section below hero; 4 `AnimatedCounter` components: `end={168}` suffix=" hrs/week", `end={99}` suffix="%" prefix="", `end={50000}` suffix="+" prefix="", `end={85}` suffix="%"`; vertical separator `div` between each stat; subtle `bg-gradient-to-b from-luxury-card/50` background
- [X] T017 [US1] Add Features section to `src/app/page.tsx` — "Why Course Companion?" `GradientText` heading; `staggerContainer` `motion.div` wrapping 6 `GlassCard` components with `hover` prop in `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`; each card: lucide icon (Clock, Zap, TrendingUp, Brain, Sparkles, Network), bold title, muted description; 6 features: "24/7 AI Tutor", "Instant Feedback", "Progress Tracking", "Interactive Quizzes", "AI Assessment", "Multi-Chapter Synthesis"
- [X] T018 [US1] Add Curriculum section to `src/app/page.tsx` — "What You'll Learn" heading; 5 module cards using `ScrollReveal`; each card: large gradient module number, title, 3-item topics list; active module (index 2) wrapped in `GradientBorder`; `overflow-x-auto` horizontal scroll on mobile; module data: Intro to AI Agents, Prompt Engineering, Building with Claude API, Multi-Agent Systems, Production Deployment
- [X] T019 [US1] Add Pricing section to `src/app/page.tsx` — `useState<'monthly'|'annual'>('monthly')` toggle; toggle UI: two `motion.button` pills with animated selection indicator; 3 tier cards: Free (`GlassCard`, $0), Premium (`GlassCard` elevated, monthly $29/annual $23), Pro (`GradientBorder`-wrapped `GlassCard`, monthly $49/annual $39, "Most Popular" badge, glow `shadow-[0_0_40px_rgba(99,102,241,0.3)]`); feature checklists with Check/X icons; CTA `Link` buttons per tier using `buttonVariants`
- [X] T020 [US1] Add CTA section and assemble final page in `src/app/page.tsx` — full-width CTA section: `bg-gradient-to-r from-indigo-900/50 to-violet-900/50` background; "Ready to become an AI Agent developer?" heading; `GradientButton` CTA; 2 floating orb `motion.div` with `animate={{ scale: [1,1.2,1], opacity: [0.3,0.6,0.3] }}` infinite; ensure Navbar imported in `layout.tsx` (not page); Footer at bottom of page

**Checkpoint**: `pnpm tsc --noEmit` must pass. Visual test at `http://localhost:3000` — all sections render, animations play.

---

## Phase 5: About Page (Priority: P4)

**Goal**: New public page at `/about` — mission, tech stack, stats, vision.

**Independent Test**: Visit `/about`. Verify: hero gradient shows, 3 mission cards animate on scroll, tech logos glow on hover, stat counters animate, glassmorphism vision card renders.

- [X] T021 [P] [US4] Create `src/app/about/page.tsx` — `'use client'`; `PageTransition` wrapper; Hero section: `MeshBackground` (lighter opacity), "Built for the AI Era" `GradientText` heading, mission statement paragraph; import and use `ScrollReveal`, `GlassCard`, `GradientText`, `AnimatedCounter`, `GradientBorder`
- [X] T022 [P] [US4] Add Mission Cards section to `src/app/about/page.tsx` — 3 `ScrollReveal`-wrapped `GlassCard` components (Learn/Build/Deploy) each with lucide icon (`BookOpen`/`Code2`/`Rocket`), title, description; `staggerContainer` on the grid wrapper
- [X] T023 [P] [US4] Add Tech Stack + Stats + Vision sections to `src/app/about/page.tsx` — Tech Stack: "Powered By" heading; 5 logo `motion.div` items (`whileHover={{ filter: 'drop-shadow(0 0 8px #4F46E5)', scale: 1.1 }}`) for Next.js, FastAPI, Claude AI, Cloudflare, Fly.io (text logos with icons); Stats: 4 `AnimatedCounter` with `ScrollReveal` (10K+ learners, 168 hrs/week, 99% uptime, 5 chapters); Vision: `GradientBorder`-wrapped `GlassCard` with founder vision statement text

**Checkpoint**: `pnpm tsc --noEmit` must pass. Visual test at `/about`.

---

## Phase 6: Contact Page (Priority: P5)

**Goal**: New public page at `/contact` — glassmorphism form with validation, animated success, info cards.

**Independent Test**: Visit `/contact`. Verify: glassmorphism card renders, empty submit shows inline errors, valid submit shows animated checkmark within 2s, 3 info cards glow on hover.

- [X] T024 [P] [US5] Create `src/app/contact/page.tsx` — `'use client'`; `PageTransition` wrapper; Hero: "Get in Touch" `GradientText` heading, subtext; `useState` for `{ name, email, subject, message }` fields, `errors`, `submitting`, `submitted`
- [X] T025 [P] [US5] Add Contact Form to `src/app/contact/page.tsx` — `GlassCard` containing `<form onSubmit={handleSubmit}>`; 4 fields each with dark input style `bg-white/5 border border-white/10 focus:border-indigo-500 rounded-lg px-4 py-3 text-white`; inline error `<p className="text-red-400 text-sm">` below each field; `handleSubmit`: validate (all required, email regex) → `setSubmitting(true)` → `await new Promise(r => setTimeout(r, 1200))` → `setSubmitted(true)`; success state: `motion.div` replacing form with animated SVG checkmark (`motion.path` with `pathLength` 0→1 spring), "Message sent!" text
- [X] T026 [P] [US5] Add Contact Info Cards to `src/app/contact/page.tsx` — 3 `GlassCard` components with `hover` prop below the form: Email (Mail icon, email address), Discord (MessageSquare icon, "Join Discord"), GitHub (Github icon, repo URL); displayed in `grid grid-cols-1 md:grid-cols-3 gap-4`

**Checkpoint**: `pnpm tsc --noEmit` must pass. Visual test at `/contact` — form validation and success state work.

---

## Phase 7: Dashboard Redesign (Priority: P2)

**Goal**: Redesigned dashboard with animated KPIs, AreaChart gradient, Continue Learning, activity feed, quiz perf, upsell.

**Independent Test**: Log in as free-tier user, visit `/dashboard`. Verify: time-based greeting shows, 4 KPI cards with animated numbers, AreaChart gradient fill renders, Continue Learning card shows next chapter, activity feed has entries, upsell glassmorphism card visible.

- [X] T027 [US2] Update `src/components/dashboard/ProgressChart.tsx` — replace `LineChart` with Recharts `AreaChart`; add `<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient></defs>`; `<Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: '#4F46E5', r: 4 }}/>`; keep `ResponsiveContainer`; fix Recharts `formatter` type (no explicit `number` annotation — use `formatter={(value) => ...}`)
- [X] T028 [US2] Update `src/components/dashboard/StreakCard.tsx` — apply `GlassCard` wrapper; `AnimatedCounter end={streakDays}` with flame icon `🔥`; add `motion.div animate={{ scale: [1,1.05,1] }} transition={{ repeat: Infinity, duration: 2 }}` on flame
- [X] T029 [US2] Update `src/components/dashboard/BadgeCard.tsx` — earned badges: full colour with `shadow-[0_0_15px_rgba(99,102,241,0.4)]`; locked badges: `grayscale opacity-40` with absolute `Lock` icon overlay; `GlassCard` wrapper
- [X] T030 [US2] Rewrite `src/app/(dashboard)/dashboard/page.tsx` — time-based greeting: `const hour = new Date().getHours()` → "Good morning/afternoon/evening"; user first name from `useAuth` (extract from email before @); today's date `toLocaleDateString`; static motivational quote; 4 KPI `GlassCard` row: each has icon + `AnimatedCounter` + label (`Progress %`, `Streak`, `Avg Score`, `Chapters Left`); `ScrollReveal` stagger on KPI row; `ProgressChart` (updated); "Continue Learning" `GlassCard`: next incomplete chapter title + progress bar + estimated time + `<Link href="/learn/{id}" className={cn(buttonVariants())}>Continue</Link>`; Recent Activity feed: map last 5 `progress.quiz_scores` entries with relative time (`Date.now() - timestamp`); Quiz Performance: per-chapter score cards colour-coded (`score>=80` green, `50-79` yellow, `<50` red) + Retry `Link`; non-pro upsell `GlassCard`: "Unlock AI Features", 3 preview bullets, `GradientButton` → `/premium`

**Checkpoint**: `pnpm tsc --noEmit` must pass. Visual test at `/dashboard` (logged in).

---

## Phase 8: Profile Page (Priority: P3)

**Goal**: New authenticated page at `/(dashboard)/profile` — avatar, tier badge, stats, progress bars, quiz timeline, achievements, danger zone.

**Independent Test**: Log in and visit `/profile`. Verify: avatar with gradient ring, tier badge correct colour, 4 stat cards animate, chapter progress bars animate fill, achievements show earned vs locked, danger zone present.

- [X] T031 [US3] Create `src/app/(dashboard)/profile/page.tsx` — `'use client'`; import `useAuth`, `useProgress`, `useChapters`; auth guard via `useEffect` redirect if not authenticated; `PageTransition` wrapper; loading skeleton while data fetches
- [X] T032 [US3] Add Profile Header to `src/app/(dashboard)/profile/page.tsx` — avatar `div` with initials (first 2 chars of email uppercased) + `GradientBorder` ring wrapper (`p-[3px]` gradient + inner white/10 circle); email display; tier badge: `className` conditional → free: `bg-gray-600`, premium: `bg-indigo-600`, pro: `bg-gradient-to-r from-yellow-400 to-amber-500 text-black`; "Edit Profile" `GradientButton` (variant ghost, shows toast "Coming soon" on click)
- [X] T033 [US3] Add Stats Row to `src/app/(dashboard)/profile/page.tsx` — 4 `GlassCard` with `AnimatedCounter` + `ScrollReveal` stagger: Chapters Completed (`progress.completed_chapters.length`), Current Streak (`progress.streak`), Avg Quiz Score (mean of `progress.quiz_scores` values), Days Active (count unique dates from quiz/chapter timestamps)
- [X] T034 [US3] Add Learning Progress section to `src/app/(dashboard)/profile/page.tsx` — "Learning Progress" heading; for each chapter from `useChapters`: title, completion percent, `motion.div` progress bar (`initial={{ width: '0%' }} animate={{ width: pct + '%' }}` triggered on mount), status badge: Complete (green) / In Progress (indigo) / Not Started (gray); use `ScrollReveal` stagger on list
- [X] T035 [US3] Add Quiz History section to `src/app/(dashboard)/profile/page.tsx` — "Quiz History" heading; vertical timeline using CSS `border-l border-indigo-600/40` + `ml-4`; each entry: circular dot on the line, score badge (colour-coded), `toLocaleDateString` date, chapter name from `chapters`; `ScrollReveal` stagger; empty state: "No quizzes taken yet" muted text
- [X] T036 [US3] Add Achievements + Danger Zone to `src/app/(dashboard)/profile/page.tsx` — Achievements grid (3 cols): define 6 static badges (First Chapter, Quiz Master, 7-Day Streak, 5 Chapters, Perfect Score, Course Complete); earned = `GlassCard` with icon in full colour + `shadow-[0_0_20px_rgba(99,102,241,0.3)]`; locked = `GlassCard grayscale opacity-50` + `Lock` icon overlay; Danger Zone: `GlassCard` with `border border-red-900/50`; "Reset Progress" button `variant="destructive"` (shows shadcn `AlertDialog` confirmation); "Delete Account" button (shows modal, UI only — toast "Contact support")

**Checkpoint**: `pnpm tsc --noEmit` must pass. Visual test at `/profile` (logged in).

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, responsiveness, and performance pass across all pages.

- [X] T037 Audit `prefers-reduced-motion` across all animated components — use Chrome DevTools `Rendering > Emulate CSS media feature: prefers-reduced-motion: reduce`; verify: `MeshBackground` orbs static, `AnimatedCounter` shows final value immediately, `ScrollReveal` shows children immediately, `GlassCard` hover lift disabled; fix any component where `useReducedMotion()` result is ignored
- [X] T038 [P] Mobile responsiveness audit at 375px — test each of 5 pages (Landing, About, Contact, Dashboard, Profile) at 375px viewport in DevTools; verify: hero code snippet hidden on mobile, pricing cards stack vertically (`flex-col`), feature grid 1-column (`grid-cols-1`), Navbar hamburger works, sidebar collapses; fix layout breaks
- [X] T039 [P] Dark mode consistency check — verify all pages use `--luxury-bg` / `--luxury-card` / `--luxury-border` tokens consistently; no hard-coded grays that break the dark palette; check Navbar, Footer, all GlassCards, inputs
- [X] T040 [P] Run `pnpm build` production build — fix any SSR/RSC boundary errors (all framer-motion components must have `'use client'`); fix any `useLayoutEffect` SSR warnings; fix any missing `key` props in mapped lists; build must pass with zero errors

---

## Dependencies & Execution Order

```
Phase 0 (T001) ─────────────────────────────────► SKILL.md ready
Phase 1 (T002–T005) ─────────────────────────────► Tokens + animations ready
Phase 2 (T006–T012, all [P]) ────────────────────► All shared components ready
Phase 3 (T013–T014) ─────────────────────────────► Layout ready
Phase 4 (T015–T020, [US1]) ──────────────────────► Landing page ready (MVP ✅)
Phase 5 (T021–T023, [P][US4]) ───────────────────► About page ready
Phase 6 (T024–T026, [P][US5]) ───────────────────► Contact page ready
Phase 7 (T027–T030, [US2]) ──────────────────────► Dashboard ready
Phase 8 (T031–T036, [US3]) ──────────────────────► Profile page ready
Phase 9 (T037–T040) ─────────────────────────────► Production ready
```

### Parallel Opportunities

- T006–T012: All 7 luxury components — **fully parallel** (different files)
- T021–T023: About sections — parallel then compose
- T024–T026: Contact sections — parallel then compose
- T027–T029: Dashboard component updates — parallel
- T038–T040: Polish tasks — fully parallel

---

## Implementation Strategy

### MVP (Landing Page Only)

1. Phase 0 → Phase 1 → Phase 2 (parallel) → Phase 3 → Phase 4
2. Run `pnpm build` → visual test landing page
3. **Ship** — luxury landing page is independently deployable

### Full Delivery

Phase 0 → 1 → 2 → 3 → 4 → [5+6 parallel] → 7 → 8 → 9

---

## Constraints

- All `framer-motion` components **must** have `'use client'` directive
- No backend changes — pure visual redesign
- shadcn v4.3.0 (base-ui): use `<Link className={cn(buttonVariants({...}))}>` NOT Button asChild
- Tailwind v4: new colours go in `@theme inline {}` in `globals.css` (no `tailwind.config.ts`)
- Contact form: `setTimeout` simulation only — no API call
- `pnpm tsc --noEmit` must pass after every phase checkpoint
- Recharts `formatter` type: no explicit `number` annotation on `value` param
