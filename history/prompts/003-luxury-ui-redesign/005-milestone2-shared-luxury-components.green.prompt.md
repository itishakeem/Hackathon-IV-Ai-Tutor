---
id: 005
title: Milestone 2 Shared Luxury Components
stage: green
date: 2026-04-20
surface: agent
model: claude-sonnet-4-6
feature: 003-luxury-ui-redesign
branch: 003-luxury-ui-redesign
user: Abdul Hakeem
command: /sp.implement Skill file approved. Begin implementation. Milestone 2 — Shared Luxury Components (T006–T012).
labels: ["green","frontend","framer-motion","components","glassmorphism","animations"]
links:
  spec: specs/003-luxury-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/src/components/ui/GradientText.tsx
  - frontend/src/components/ui/GlassCard.tsx
  - frontend/src/components/ui/GradientButton.tsx
  - frontend/src/components/ui/AnimatedCounter.tsx
  - frontend/src/components/ui/ScrollReveal.tsx
  - frontend/src/components/ui/MeshBackground.tsx
  - frontend/src/components/ui/PageTransition.tsx
tests:
  - "pnpm tsc --noEmit: PASS (zero errors)"
---

## Prompt

Skill file approved. Begin implementation.

MANDATORY: Read .claude/skills/luxury-ui/SKILL.md before writing every single component.

Follow specs/003-luxury-ui-redesign/tasks.md exact order.

## Milestone 2 — Shared Luxury Components (T006–T012, all parallel)

T006: Create frontend/src/components/ui/GradientText.tsx
T007: Create frontend/src/components/ui/GlassCard.tsx
T008: Create frontend/src/components/ui/GradientButton.tsx
T009: Create frontend/src/components/ui/AnimatedCounter.tsx
T010: Create frontend/src/components/ui/ScrollReveal.tsx
T011: Create frontend/src/components/ui/MeshBackground.tsx
T012: Create frontend/src/components/ui/PageTransition.tsx

No asChild anywhere. Add 'use client' to all components.

## Response snapshot

Read SKILL.md before all work. Executed T006–T012:

**T006** ✅ — `src/components/ui/GradientText.tsx`:
- Props: `children`, `className?`, `from?` (default `from-indigo-400`), `to?` (default `to-violet-400`)
- Renders `<span>` with `bg-gradient-to-r bg-clip-text text-transparent font-bold`
- Uses `cn()` to compose gradient classes dynamically

**T007** ✅ — `src/components/ui/GlassCard.tsx`:
- Props: `children`, `className?`, `hover?: boolean`
- When `hover=true` and `!reducedMotion`: wraps in `motion.div` with `cardHover.whileHover` + `cardHover.transition`
- Falls back to plain `<div>` with same classes when `hover=false` or `reducedMotion=true`
- Glass styles: `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`

**T008** ✅ — `src/components/ui/GradientButton.tsx`:
- Props: `children`, `onClick?`, `href?`, `loading?`, `disabled?`, `className?`, `size?`, `variant?: 'primary' | 'secondary'`
- Primary: gradient bg + glow shadow; Secondary: glass border
- Loading state: spinner + text; Href: renders `<Link>` (no asChild)
- With `reducedMotion=false`: wraps in `motion.button` with `whileTap={{ scale: 0.97 }}`

**T009** ✅ — `src/components/ui/AnimatedCounter.tsx`:
- Props: `end`, `suffix?`, `prefix?`, `duration?` (default 2s)
- Uses `useInView(ref, { once: true })` + `setInterval` counter from 0→end
- `reducedMotion=true`: renders `end` directly without animation
- SSR safe: `useState(reducedMotion ? end : 0)` — `reducedMotion` starts false server-side

**T010** ✅ — `src/components/ui/ScrollReveal.tsx`:
- Props: `children`, `className?`, `delay?`, `direction?: 'up' | 'left' | 'right'`
- Direction variants map: `up` (y 20→0), `left` (x -20→0), `right` (x 20→0)
- `reducedMotion=true`: plain `<div>`, no animation
- `whileInView="visible"` + `viewport={{ once: true }}`

**T011** ✅ — `src/components/ui/MeshBackground.tsx`:
- 3 orbs: indigo `w-96 h-96`, violet `w-80 h-80`, cyan `w-72 h-72`
- Each orb: `motion.div` with `animate={{ x: [...], y: [...] }}` + `transition={{ repeat: Infinity }}`
- `reducedMotion=true`: static positioned `<div>` orbs (CSS blur only)
- Position via Tailwind classes on the motion.div itself

**T012** ✅ — `src/components/ui/PageTransition.tsx`:
- Props: `children`, `className?`, `includeMesh?: boolean` (default `true`)
- `motion.div` with `pageTransition` variants (initial/animate/exit)
- Includes `<MeshBackground />` by default
- `reducedMotion=true`: plain `<div>` wrapper with MeshBackground (static orbs)

**Validation**: `pnpm tsc --noEmit` — zero errors ✅. No asChild used anywhere ✅.

## Outcome

- ✅ Impact: Milestone 2 complete — all 7 shared luxury components created; design system foundation ready for Layout and Pages
- 🧪 Tests: pnpm tsc --noEmit PASS (zero errors)
- 📁 Files: GradientText.tsx, GlassCard.tsx, GradientButton.tsx, AnimatedCounter.tsx, ScrollReveal.tsx, MeshBackground.tsx, PageTransition.tsx
- 🔁 Next prompts: Proceed to Milestone 3 — redesign Navbar.tsx and Footer.tsx (T013–T014)
- 🧠 Reflection: All components placed in `frontend/src/components/ui/` (not `luxury/` subdirectory per user instruction). `cardHover` spread as `.whileHover` + `.transition` separately rather than object spread to satisfy TypeScript strict. `MeshBackground` positions orbs via Tailwind classes directly on `motion.div` — no CSS-in-JS needed.

## Evaluation notes (flywheel)

- Failure modes observed: None — zero TS errors, no asChild used
- Graders run and results (PASS/FAIL): pnpm tsc --noEmit PASS
- Prompt variant (if applicable): sp.implement Milestone 2
- Next experiment: Proceed to T013–T014 Navbar + Footer redesign
