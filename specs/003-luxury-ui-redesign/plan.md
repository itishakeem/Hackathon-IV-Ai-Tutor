# Implementation Plan: Luxury UI Redesign — Course Companion FTE Frontend

**Branch**: `003-luxury-ui-redesign` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)  
**Input**: `specs/003-luxury-ui-redesign/spec.md`

---

## Summary

Redesign the existing Next.js 16 frontend (Phase 3) with a luxury dark-first aesthetic inspired by Linear, Vercel, and Stripe. The work is **purely visual** — no backend changes, no new API endpoints, no schema migrations. All existing functional code (auth, chapters, quizzes, dashboard, premium) is preserved; only styling, animations, and layout are replaced. Three new public pages (About, Contact) and one new authenticated page (Profile) are added.

The technical approach: install `framer-motion` for animations, update `globals.css` with a new CSS custom property palette, create a shared design-system layer (`lib/animations.ts` + 8 shared components), then rebuild each page top-to-bottom in dependency order.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `noUncheckedIndexedAccess`)  
**Framework**: Next.js 16.2.4 (App Router, `src/` layout)  
**Styling**: Tailwind CSS v4 (`@import "tailwindcss"` — no `tailwind.config.ts` in v4)  
**UI Components**: shadcn/ui v4.3.0 (base-ui primitives — no `asChild`, use `render` prop or `buttonVariants` + `<Link>`)  
**New Dependencies**: `framer-motion` (animations), `@tabler/icons-react` (optional supplement to lucide-react)  
**Fonts**: Geist (already in project via `next/font/google`), Inter (add via `next/font/google`), JetBrains Mono (add via `next/font/google`)  
**Storage**: N/A (no new data entities)  
**Testing**: `pnpm tsc --noEmit` (zero TypeScript errors), visual browser testing  
**Target Platform**: Web (320px → 1440px), dark-first  
**Performance Goals**: LCP < 3s, animations complete ≤ 800ms, `prefers-reduced-motion` respected  
**Constraints**: No backend changes; contact form is client-side only; Tailwind v4 CSS variable approach (no `tailwind.config.ts` manipulation)  
**Scale/Scope**: 8 pages redesigned/created; ~35 files modified or created

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Backend-LLM | ✅ PASS | Pure frontend redesign — no backend changes whatsoever |
| II. Hybrid Intelligence Selective | ✅ PASS | No new LLM routes added |
| III. Spec-Driven Development | ✅ PASS | spec.md complete, plan.md this document, tasks.md next |
| IV. Dual-Frontend Shared Backend | ✅ PASS | Modifying the Next.js frontend only; backend unchanged |
| V. Content in Cloudflare R2 | ✅ PASS | No content storage changes |
| VI. Freemium Access Control | ✅ PASS | Tier gating logic unchanged; UI improvements to lock states only |
| VII. Observability & Cost | ✅ PASS | No new API calls; contact form is client-side simulation |

**Constitution verdict**: ALL GATES PASS — implementation may proceed.

---

## Phase 0: Research Findings

### Decision 1: framer-motion vs CSS animations vs @keyframes
- **Decision**: framer-motion
- **Rationale**: Provides declarative `variants` API, `useInView` for scroll-triggered reveals, `AnimatePresence` for page transitions, and `useMotionValue` for animated counters — all impossible with pure CSS. The `prefers-reduced-motion` integration is a single `motion.div` setting. Bundle size (~50 KB gzipped) is justified by animation richness.
- **Alternatives considered**: CSS `@keyframes` (no scroll triggers, no JS-driven counters), GSAP (heavy, complex licensing), CSS `animation` with Intersection Observer (verbose, harder to maintain).

### Decision 2: Dark-first vs light-first
- **Decision**: Dark-first (`#0A0A0F` background)
- **Rationale**: Target audience (AI developers, engineers) strongly prefers dark interfaces. Linear, Vercel, and GitHub all default dark. The existing `globals.css` already has a `.dark` class; this plan inverts the default to dark and makes light the alternative.
- **Alternatives considered**: Light-first with dark toggle (weaker first impression for developer audience), system-preference (inconsistent across demo scenarios).

### Decision 3: Glassmorphism cards vs solid cards
- **Decision**: Glassmorphism (`backdrop-blur-xl bg-white/5 border border-white/10`)
- **Rationale**: Creates visual depth and premium feel on dark backgrounds. Works well with the existing shadcn Card component by overriding className. Degrades gracefully (browsers without `backdrop-filter` show a semi-transparent solid background).
- **Alternatives considered**: Solid dark cards (less premium), neumorphic (too subtle on dark, poor contrast).

### Decision 4: Tailwind v4 CSS variable approach
- **Decision**: All new colour tokens added to `globals.css` as CSS custom properties, not via `tailwind.config.ts`
- **Rationale**: This project uses Tailwind v4 which has no `tailwind.config.ts` — all theme extension happens in CSS via `@theme inline {}` block. Attempting to create a config file would break the existing shadcn setup.
- **Alternatives considered**: Inline Tailwind arbitrary values (verbose, not reusable), separate CSS file (redundant).

### Decision 5: SKILL.md location
- **Decision**: `.claude/skills/luxury-ui/SKILL.md`
- **Rationale**: Constitution requires SKILL.md files for L6 Runtime Skills. A luxury-ui skill provides design tokens, animation snippets, and component patterns as reusable context for all subsequent implementation sessions.
- **Alternatives considered**: Inline in plan.md (not machine-parseable as a skill), separate ADR (different purpose).

---

## Phase 1: Design & Architecture

### 1.1 Skill File

**File**: `.claude/skills/luxury-ui/SKILL.md`  
**Purpose**: Design token reference + copy-paste patterns for every component.  
**Complexity**: Low  
**Contents**:
- Full CSS custom property palette (background, card, border, text, glow, gradient stops)
- Reusable Tailwind class combos (glassmorphism card, gradient text, glow shadow, gradient button)
- framer-motion variant objects (fadeInUp, staggerContainer, cardHover)
- Code snippets for AnimatedCounter, ScrollReveal, MeshBackground

### 1.2 Data Model

This feature introduces **no new data entities** — it is a pure visual layer. The existing TypeScript interfaces in `src/types/index.ts` are unchanged.

One **new UI-only type** is needed:

```typescript
// Animation preference (read from matchMedia)
interface MotionPreference {
  reducedMotion: boolean;
}
```

This is not persisted — it is read at runtime from `window.matchMedia('(prefers-reduced-motion: reduce)')`.

### 1.3 API Contracts

No new API endpoints. The contact form (`/contact`) submits client-side only (no `fetch`/`axios` call). All existing API calls from `lib/api.ts` remain unchanged.

### 1.4 New File Map

#### Design System Layer

| File | Action | Complexity |
|------|--------|-----------|
| `.claude/skills/luxury-ui/SKILL.md` | Create | Low |
| `src/lib/animations.ts` | Create | Low |
| `src/components/ui/luxury/GradientText.tsx` | Create | Low |
| `src/components/ui/luxury/GlassCard.tsx` | Create | Low |
| `src/components/ui/luxury/GradientButton.tsx` | Create | Low |
| `src/components/ui/luxury/AnimatedCounter.tsx` | Create | Medium |
| `src/components/ui/luxury/ScrollReveal.tsx` | Create | Low |
| `src/components/ui/luxury/GradientBorder.tsx` | Create | Low |
| `src/components/ui/luxury/MeshBackground.tsx` | Create | Medium |
| `src/components/ui/luxury/PageTransition.tsx` | Create | Low |

#### Global Styles & Config

| File | Action | Complexity |
|------|--------|-----------|
| `src/app/globals.css` | Update | Low |
| `src/app/layout.tsx` | Update | Low |

#### Layout Components

| File | Action | Complexity |
|------|--------|-----------|
| `src/components/layout/Navbar.tsx` | Rewrite | Medium |
| `src/components/layout/Footer.tsx` | Rewrite | Low |
| `src/components/layout/Sidebar.tsx` | Update | Low |

#### Pages

| File | Action | Complexity |
|------|--------|-----------|
| `src/app/page.tsx` (Landing) | Rewrite | High |
| `src/app/about/page.tsx` | Create | Medium |
| `src/app/contact/page.tsx` | Create | Medium |
| `src/app/(dashboard)/dashboard/page.tsx` | Rewrite | High |
| `src/app/(dashboard)/profile/page.tsx` | Create | Medium |

#### Dashboard Components

| File | Action | Complexity |
|------|--------|-----------|
| `src/components/dashboard/ProgressChart.tsx` | Update | Medium |
| `src/components/dashboard/StreakCard.tsx` | Update | Low |
| `src/components/dashboard/BadgeCard.tsx` | Update | Low |

---

## Phase 2: Implementation Strategy

### Build Order (dependency-enforced)

```
Step 1: SKILL.md + globals.css + lib/animations.ts
        (design tokens and motion variants — everything depends on these)

Step 2: Shared luxury components (parallel)
        GradientText, GlassCard, GradientButton,
        AnimatedCounter, ScrollReveal, GradientBorder,
        MeshBackground, PageTransition

Step 3: Layout (Navbar + Footer + Sidebar update)
        (depends on GradientText, GlassCard)

Step 4: Landing page (app/page.tsx)
        (most complex — establishes all patterns)

Step 5: About page (app/about/page.tsx)          [parallel with Step 6]
        Contact page (app/contact/page.tsx)       [parallel with Step 5]

Step 6: Dashboard page (dashboard/page.tsx)
        Dashboard component updates (ProgressChart → AreaChart)

Step 7: Profile page (dashboard/profile/page.tsx)
```

### Tailwind v4 Token Extension

New colours are added to the `@theme inline {}` block in `globals.css`:

```css
@theme inline {
  --color-luxury-bg: var(--luxury-bg);
  --color-luxury-card: var(--luxury-card);
  --color-luxury-border: var(--luxury-border);
  --color-luxury-indigo: #4F46E5;
  --color-luxury-violet: #7C3AED;
  --color-luxury-cyan: #06B6D4;
  --color-luxury-gold: #F59E0B;
}
```

And in `:root` + `.dark`:

```css
:root, .dark {
  --luxury-bg: #0A0A0F;
  --luxury-card: #111118;
  --luxury-border: #1E1E2E;
  --background: #0A0A0F;
  --foreground: #F8FAFC;
}
```

This inverts the default to dark. The existing `ThemeProvider` with `defaultTheme="system"` is changed to `defaultTheme="dark"`.

### framer-motion Integration Pattern

All animated components use `'use client'` directive. Server components (like `app/about/page.tsx` sections that don't need interactivity) are split into server wrapper + client animation child.

```typescript
// lib/animations.ts pattern
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
```

`prefers-reduced-motion` is handled via a custom hook:

```typescript
// hooks/useReducedMotion.ts
export function useReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

All `motion.div` components pass `animate={reducedMotion ? "visible" : undefined}` to skip animations when requested.

### Contact Form Pattern

```typescript
// No API call — simulate submission with setTimeout
async function handleSubmit(e: FormEvent) {
  setSubmitting(true);
  await new Promise(resolve => setTimeout(resolve, 1200));
  setSubmitted(true);
  setSubmitting(false);
}
```

### Profile Page Data Sources

The Profile page reuses all existing hooks — no new API calls:
- `useAuth()` → user email, tier
- `useProgress()` → completed chapters, quiz scores, streak
- `useChapters()` → chapter titles for progress bars

Avatar initials generated client-side from `user.email`.

---

## ADR Suggestions

📋 **Architectural decision detected**: Switching default theme from system-preference to dark-first — this affects all existing users and the ThemeProvider default. Document decision and migration path? Run `/sp.adr dark-first-theme-default`

📋 **Architectural decision detected**: framer-motion selected over CSS animations for scroll-triggered reveals and animated counters. Bundle size trade-off (~50 KB). Document? Run `/sp.adr framer-motion-animation-library`

📋 **Architectural decision detected**: SKILL.md design system file introduced at `.claude/skills/luxury-ui/SKILL.md` — establishes a pattern for agent-reusable design contexts. Document? Run `/sp.adr luxury-skill-design-system`

---

## Complexity Tracking

| Area | Complexity | Justification |
|------|-----------|--------------|
| Design system layer (10 files) | Low | Pure component creation, no logic |
| globals.css token update | Low | CSS variable additions only |
| Landing page rebuild | High | 7 sections, framer-motion throughout, typewriter, mesh background |
| Dashboard page rebuild | High | KPI cards, AreaChart gradient, activity feed, upsell card |
| Profile page (new) | Medium | 5 sections, reuses existing hooks |
| About page (new) | Medium | 4 sections, scroll animations |
| Contact page (new) | Medium | Form with validation + success animation |
| Navbar/Footer rewrite | Medium | New dark design + gradient logo |

**Total new/modified files**: ~35  
**Estimated TypeScript surface**: ~2,000 lines new/modified  
**Backend impact**: Zero

---

## Quickstart for Implementation

```bash
# From frontend/
pnpm add framer-motion

# Optional (if tabler icons needed beyond lucide)
pnpm add @tabler/icons-react

# Verify TypeScript still clean before starting
pnpm tsc --noEmit

# Start dev server alongside implementation
pnpm dev
```

### Verification Checkpoints

After each build step, run:
```bash
pnpm tsc --noEmit   # Must stay at zero errors
```

After all pages complete:
```bash
pnpm build          # Production build must pass
```

Visual checks at: `http://localhost:3000` (landing), `/about`, `/contact`, `/dashboard`, `/profile`
