---
id: 003
title: Luxury UI Redesign Tasks
stage: tasks
date: 2026-04-19
surface: agent
model: claude-sonnet-4-6
feature: 003-luxury-ui-redesign
branch: 003-luxury-ui-redesign
user: Abdul Hakeem
command: /sp.tasks Break luxury UI redesign into atomic tasks.
labels: ["tasks","frontend","ui-redesign","framer-motion","dark-theme","luxury","glassmorphism","tailwind-v4"]
links:
  spec: specs/003-luxury-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-luxury-ui-redesign/tasks.md
tests:
  - "pnpm tsc --noEmit checkpoint after each phase"
  - "pnpm build in Phase 9 polish"
---

## Prompt

Break luxury UI redesign into atomic tasks.

## Task Order

### Milestone 0: Skill File
- T001: Create .claude/skills/luxury-ui/SKILL.md with full design system

### Milestone 1: Foundation
- T002: Install framer-motion + @tabler/icons-react
- T003: Update tailwind.config.ts with custom colors + keyframes
- T004: Update globals.css with CSS vars + scrollbar + fonts
- T005: Create lib/animations.ts with all motion variants

### Milestone 2: Shared Luxury Components
- T006: GradientText.tsx
- T007: GlassCard.tsx
- T008: GradientButton.tsx
- T009: AnimatedCounter.tsx
- T010: ScrollReveal.tsx
- T011: MeshBackground.tsx
- T012: PageTransition.tsx

### Milestone 3: Layout
- T013: Redesign Navbar — glass effect + blur + logo + mobile
- T014: Redesign Footer — dark + gradient border top

### Milestone 4: Landing Page
- T015: Hero section — mesh bg + animated headline + CTA
- T016: Stats bar — animated counters
- T017: Features section — glass cards + stagger
- T018: Curriculum section — module cards
- T019: Pricing section — tiered cards + pro glow
- T020: CTA section + Footer assembly
- T021: Full landing page assembly + mobile test

### Milestone 5: About Page
- T022: Hero + mission cards
- T023: Tech stack + stats + team section
- T024: Full about page assembly

### Milestone 6: Contact Page
- T025: Contact form card — dark inputs + validation
- T026: Contact info cards
- T027: Full contact page assembly

### Milestone 7: Dashboard Redesign
- T028: KPI cards row — animated numbers
- T029: AreaChart with gradient fill
- T030: Continue learning card
- T031: Recent activity feed
- T032: Quiz performance cards
- T033: Full dashboard assembly

### Milestone 8: Profile Page
- T034: Profile header — avatar + tier badge
- T035: Stats row + learning progress bars
- T036: Quiz history timeline
- T037: Achievements badge grid
- T038: Full profile page assembly

### Milestone 9: Polish
- T039: Add prefers-reduced-motion to all animations
- T040: Mobile test all pages at 375px
- T041: Dark mode consistency check
- T042: Performance check — remove animation jank

## Task Format
- Task ID
- Files to create/update
- Key visual outcome
- Acceptance criteria

## Response snapshot

Created `specs/003-luxury-ui-redesign/tasks.md` with **40 tasks** across **10 phases** (Phase 0–9):

**Phase 0 (T001 — Skill File)**: SKILL.md with full design tokens, glassmorphism patterns, gradient text/button patterns, framer-motion variant snippets.

**Phase 1 (T002–T005 — Foundation)**: framer-motion + @tabler/icons-react install; globals.css luxury CSS variables (`#0A0A0F` bg, `#111118` card) + `@theme inline {}` Tailwind v4 tokens + scrollbar + selection colour; layout.tsx Inter + JetBrains Mono fonts + ThemeProvider dark default; lib/animations.ts all Variants + useReducedMotion hook.

**Phase 2 (T006–T012 — Shared Components, all [P])**: GradientText, GlassCard (with hover lift+glow), GradientButton (primary+ghost variants), AnimatedCounter (useMotionValue+useSpring+useInView), ScrollReveal (useInView+fadeInUp), MeshBackground (3 animated blurred orbs), PageTransition (AnimatePresence wrapper).

**Phase 3 (T013–T014 — Layout)**: Navbar rewrite (glassmorphism + GradientText logo + /about + /contact links + buttonVariants Link pattern); Footer rewrite (gradient top border + 3-col dark + social icons with whileHover).

**Phase 4 (T015–T020 — Landing P1, [US1])**: Hero (MeshBackground + stagger 3-line headline + typewriter + GradientButton CTAs + bouncing arrow), Stats Bar (4 AnimatedCounters), Features (6 GlassCard hover grid), Curriculum (5 module cards + GradientBorder active), Pricing (monthly/annual toggle + 3 tiers + Pro GradientBorder glow), CTA + page assembly.

**Phase 5 (T021–T023 — About P4, [P][US4])**: Hero + mission cards (Learn/Build/Deploy); tech stack logos whileHover glow; 4 AnimatedCounters; GradientBorder vision card.

**Phase 6 (T024–T026 — Contact P5, [P][US5])**: Contact page scaffold; GlassCard form (inline validation + setTimeout simulation + animated SVG checkmark success); 3 info cards with glow.

**Phase 7 (T027–T030 — Dashboard P2, [US2])**: ProgressChart LineChart→AreaChart with linearGradient fill; StreakCard AnimatedCounter + flame pulse; BadgeCard earned/locked states; full dashboard page (greeting + 4 KPI cards + Continue Learning + activity feed + quiz perf + upsell).

**Phase 8 (T031–T036 — Profile P3, [US3])**: Profile page scaffold; header (avatar initials + GradientBorder ring + tier badge colours); 4 stat AnimatedCounters; animated progress bars (motion.div width 0→pct%); quiz timeline (vertical border-l timeline); achievements (earned glow vs locked grayscale) + danger zone (AlertDialog).

**Phase 9 (T037–T040 — Polish)**: prefers-reduced-motion audit; 375px mobile breakpoint test; dark mode token consistency; pnpm build production pass.

## Outcome

- ✅ Impact: 40 atomic tasks covering all 5 user stories (Landing P1, Dashboard P2, Profile P3, About P4, Contact P5) — ready for /sp.implement
- 🧪 Tests: pnpm tsc --noEmit checkpoint after each phase; pnpm build in Phase 9; visual browser tests defined for all 5 pages
- 📁 Files: specs/003-luxury-ui-redesign/tasks.md
- 🔁 Next prompts: `/sp.implement read specs/003-luxury-ui-redesign/tasks.md and execute phase 0 and phase 1`
- 🧠 Reflection: User's milestone T003 mentioned tailwind.config.ts — corrected to globals.css @theme inline (Tailwind v4 has no tailwind.config.ts); all 7 Phase 2 components are [P] since they touch different files; AnimatedCounter uses framer-motion useMotionValue+useSpring (not CSS counters) for smooth number animation

## Evaluation notes (flywheel)

- Failure modes observed: User prompt referenced tailwind.config.ts update (Milestone 1, T003) — corrected in tasks.md to globals.css @theme inline per Tailwind v4 constraint documented in plan.md research
- Graders run and results (PASS/FAIL): N/A (task generation)
- Prompt variant (if applicable): sp.tasks with explicit milestone breakdown
- Next experiment: Execute /sp.implement phase 0 immediately; most critical risk is framer-motion SSR boundary — verify 'use client' on all animation components
