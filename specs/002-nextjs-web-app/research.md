# Research: Course Companion FTE — Phase 3 (Next.js Web App)

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19
**Phase**: 0 — Outline & Research

---

## Decision 1: App Router vs Pages Router

**Decision**: Next.js 15 App Router
**Rationale**: App Router is the stable, recommended default from Next.js 13+. It enables per-page rendering strategies (SSG/SSR/CSR) colocated with page files, React Server Components for zero-bundle server fetches, and the `use client` boundary for interactive islands. Pages Router is in maintenance mode.
**Alternatives considered**: Pages Router — mature but lacks RSC, has less granular rendering control, and mixes client/server concerns via `getServerSideProps`/`getStaticProps` at the page level rather than component level.

---

## Decision 2: Zustand vs Redux vs React Context

**Decision**: Zustand for auth state
**Rationale**: Zustand is 3.4KB gzipped, zero-boilerplate, and requires no Provider wrapping. For a single-concern store (auth token + user tier), Zustand's `create` + `persist` middleware with `localStorage` is the minimal viable approach. Redux adds ~30KB and significant boilerplate for a store that holds one JWT string. React Context causes re-renders across the tree on any state change.
**Alternatives considered**: Redux Toolkit — appropriate for large apps with complex state slices; overkill here. React Context — sufficient for simple pass-through but no persistence middleware.

---

## Decision 3: Axios vs Native fetch

**Decision**: Axios
**Rationale**: Axios provides a single place to configure `baseURL`, request interceptors (attach JWT), and response interceptors (catch 401/403 globally). Native `fetch` requires manual interceptor wrappers and error normalisation. For 17+ API endpoints all requiring the same auth header, Axios centralises this cleanly in `lib/api.ts`. Axios also auto-parses JSON and throws on non-2xx by default.
**Alternatives considered**: Native `fetch` with a wrapper — feasible but requires reimplementing interceptor logic. `swr` / `react-query` — data-fetching libraries, not HTTP clients; could complement Axios but don't replace it.

---

## Decision 4: react-markdown vs MDX vs @tailwindcss/typography alone

**Decision**: react-markdown + remark-gfm + rehype-slug + Tailwind `prose` classes
**Rationale**: Chapter content is stored as plain markdown in Cloudflare R2 and fetched as a string. `react-markdown` renders it client-side with no build-time compilation required. `remark-gfm` adds GitHub Flavoured Markdown (tables, strikethrough, task lists, autolinks). `rehype-slug` adds `id` attributes to headings, enabling the sidebar outline to anchor-link directly to sections. Tailwind `prose` classes (via `@tailwindcss/typography`) provide beautiful default typographic styles with dark mode support via `prose-invert`.
**Alternatives considered**: MDX — requires content at build time (static import); incompatible with runtime-fetched R2 content. Marked.js — simpler but no React-native rendering; requires `dangerouslySetInnerHTML`.

---

## Decision 5: JWT in localStorage vs httpOnly Cookies

**Decision**: localStorage + Zustand store (hackathon simplification)
**Rationale**: httpOnly cookies require a Next.js Route Handler or middleware to set the `Set-Cookie` header server-side on login. This adds a proxy layer between the frontend and the FastAPI backend. For a hackathon with a tight timeline, storing the JWT in `localStorage` and reading it via a Zustand store (with `persist` middleware) is the simplest viable approach. Zustand's `persist` middleware serialises the store to `localStorage` automatically.
**Security tradeoff**: localStorage is accessible to JavaScript (XSS risk). This is an accepted tradeoff documented in the spec. For production, httpOnly cookies + CSRF protection would be the correct choice.
**Alternatives considered**: httpOnly cookies via Next.js middleware — correct for production; requires extra Route Handler complexity. sessionStorage — same XSS risk as localStorage but doesn't persist across tabs.

---

## Decision 6: next-themes for Dark Mode

**Decision**: next-themes
**Rationale**: `next-themes` handles the SSR/hydration dark-mode flash problem (the "FOUC" — flash of unstyled content) by inlining a blocking script in `<head>` that sets the `dark` class before React hydrates. It integrates directly with Tailwind's `darkMode: 'class'` strategy. Default to `system` preference; persist user toggle to `localStorage` automatically.
**Alternatives considered**: Manual `useEffect` + `localStorage` — causes flash on load because it runs after hydration. CSS `prefers-color-scheme` media query only — no toggle capability.

---

## Decision 7: react-hot-toast vs sonner vs shadcn/ui Toast

**Decision**: react-hot-toast
**Rationale**: react-hot-toast is 5KB, works outside React component tree (can be called from Axios interceptors and async functions), and has a minimal API. The `<Toaster>` component mounts once in the root layout. `toast.success()` / `toast.error()` can be called anywhere including API response handlers.
**Alternatives considered**: shadcn/ui Toast (Radix) — more complex, requires importing `useToast` hook in every component; can't call from outside components. Sonner — excellent modern alternative; react-hot-toast chosen for wider documentation availability.

---

## Decision 8: Recharts vs Chart.js vs Victory

**Decision**: Recharts
**Rationale**: Recharts is React-native (no imperative canvas API), composable, and tree-shakeable. The `LineChart` + `Line` + `XAxis` + `YAxis` + `Tooltip` components cover the quiz score timeline chart. It integrates naturally with Tailwind colour tokens via the `stroke` prop.
**Alternatives considered**: Chart.js (via react-chartjs-2) — imperative, canvas-based, requires `ref` management. Victory — larger bundle; designed for more complex visualisations.

---

## Decision 9: pnpm vs npm vs yarn

**Decision**: pnpm (per spec)
**Rationale**: pnpm is faster than npm/yarn on install due to content-addressable storage, uses symlinks to avoid disk duplication, and produces a deterministic lockfile. It's the specified package manager for this project.
**Alternatives considered**: npm — universal but slower; yarn — comparable speed but adds another tool.

---

## Decision 10: Shadcn/ui Component Strategy

**Decision**: Install shadcn/ui components individually as needed via `npx shadcn add <component>`
**Rationale**: shadcn/ui copies component source into `components/ui/` — no runtime library, full customisation. Components are added incrementally, keeping bundle size minimal. Needed components: Button, Input, Card, Skeleton, Sheet, Tabs, Badge, Progress, Dialog, Form.
**Alternatives considered**: Full install — not supported by shadcn; each component is opt-in by design.

---

## API Endpoint Inventory (Phase 1 + Phase 2 Backend)

| Method | Path | Auth | Tier | Purpose |
|--------|------|------|------|---------|
| POST | /auth/register | No | Any | Register new user |
| POST | /auth/login | No | Any | Login, get JWT |
| GET | /chapters | Yes | Any | List all chapters |
| GET | /chapters/{id} | Yes | Free(1-3), Premium(4-5) | Get chapter content |
| GET | /chapters/{id}/next | Yes | Any | Next chapter nav |
| GET | /chapters/{id}/previous | Yes | Any | Prev chapter nav |
| GET | /chapters/{id}/summary | Yes | Any | Chapter summary |
| GET | /access/check | Yes | Any | Check tier access |
| GET | /quizzes/{id} | Yes | Any | Get quiz questions |
| POST | /quizzes/{id}/submit | Yes | Any | Submit quiz answers |
| GET | /quizzes/{id}/answers | Yes | Any | Get answer key |
| GET | /progress/{user_id} | Yes | Any | Get user progress |
| PUT | /progress/{user_id}/chapter | Yes | Any | Mark chapter complete |
| PUT | /progress/{user_id}/quiz | Yes | Any | Record quiz score |
| GET | /search | Yes | Any | Search chapters |
| POST | /premium/assess-answer | Yes | Pro | LLM assessment |
| POST | /premium/synthesize | Yes | Pro | LLM synthesis |
| GET | /premium/usage/{user_id} | Yes | Pro | LLM usage stats |
| GET | /health | No | Any | Health check |
