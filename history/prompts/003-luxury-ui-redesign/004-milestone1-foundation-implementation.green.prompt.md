---
id: 004
title: Milestone 1 Foundation Implementation
stage: green
date: 2026-04-20
surface: agent
model: claude-sonnet-4-6
feature: 003-luxury-ui-redesign
branch: 003-luxury-ui-redesign
user: Abdul Hakeem
command: /sp.implement Skill file approved. Begin implementation. Milestone 1 — Foundation (T002–T005).
labels: ["green","frontend","framer-motion","tailwind-v4","animations","dark-theme","foundation"]
links:
  spec: specs/003-luxury-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/package.json
  - frontend/pnpm-lock.yaml
  - frontend/src/app/globals.css
  - frontend/src/app/layout.tsx
  - frontend/src/lib/animations.ts
tests:
  - "pnpm tsc --noEmit: PASS (zero errors)"
---

## Prompt

Skill file approved. Begin implementation.

MANDATORY: Read .claude/skills/luxury-ui/SKILL.md before writing every single component.

Follow specs/003-luxury-ui-redesign/tasks.md exact order.

## Milestone 1 — Foundation (no components yet)

T002: Install framer-motion + @tabler/icons-react
T003: Update globals.css with luxury CSS variables + scrollbar + smooth scroll + selection color
T004: Update layout.tsx — Inter + JetBrains Mono fonts, dark default theme
T005: Create src/lib/animations.ts with all motion variants + useReducedMotion hook

## Response snapshot

Read SKILL.md before all work. Executed T002–T005:

**T002** ✅ — `pnpm add framer-motion @tabler/icons-react` from `frontend/`. Installed: framer-motion 12.38.0, @tabler/icons-react 3.41.1. No tailwind.config.ts created.

**T003** ✅ — Updated `src/app/globals.css`:
- Added luxury CSS variables to `--luxury-bg`, `--luxury-card`, `--luxury-border` in `:root`
- Added to `@theme inline {}` block: `--color-luxury-{bg,card,border,indigo,violet,cyan,gold,success,error,text,muted}`
- Overrode `.dark` block: `--background: #0A0A0F`, `--foreground: #F8FAFC`, `--card: #111118`, etc.
- Added custom scrollbar (6px, indigo thumb, `#0A0A0F` track)
- Added `::selection { background: rgba(99,102,241,0.3); color: #F8FAFC; }`
- Added `html { scroll-behavior: smooth; }`

**T004** ✅ — Updated `src/app/layout.tsx`:
- Added `Inter` + `JetBrains_Mono` imports from `next/font/google` alongside existing Geist
- CSS variables: `--font-inter`, `--font-jetbrains-mono` on `<html>`
- Changed `ThemeProvider defaultTheme` from `"system"` to `"dark"`, `enableSystem={false}`
- Body className: `bg-[#0A0A0F] text-white antialiased`
- Toaster styled with luxury dark theme (`#111118` bg, `#1E1E2E` border)

**T005** ✅ — Created `src/lib/animations.ts` (`"use client"` directive):
- Exports: `fadeIn`, `fadeInUp`, `pageTransition`, `staggerContainer`, `staggerItem`, `glowPulse` (all `Variants`)
- Exports: `cardHover`, `buttonPress` (motion prop objects with `type: "spring" as const` for TS strict)
- Exports: `useReducedMotion()` SSR-safe hook (useState(false) + useEffect + matchMedia listener)

**Validation**: `pnpm tsc --noEmit` — zero errors ✅. No tailwind.config.ts created ✅.

## Outcome

- ✅ Impact: Milestone 1 complete — all foundation files in place; framer-motion ready; dark theme enforced; luxury CSS tokens available globally
- 🧪 Tests: pnpm tsc --noEmit PASS (zero errors)
- 📁 Files: package.json, globals.css, layout.tsx, src/lib/animations.ts
- 🔁 Next prompts: Proceed to Milestone 2 — create 7 shared luxury components (T006–T012, all parallel)
- 🧠 Reflection: `"use client"` on animations.ts is correct since it exports a React hook; `cardHover.transition.type` needed `as const` cast for TypeScript strict mode; ThemeProvider `enableSystem={false}` ensures dark is always enforced regardless of OS preference

## Evaluation notes (flywheel)

- Failure modes observed: None — clean install, zero TS errors
- Graders run and results (PASS/FAIL): pnpm tsc --noEmit PASS
- Prompt variant (if applicable): sp.implement Milestone 1
- Next experiment: Proceed to T006–T012 shared luxury components (all parallel)
