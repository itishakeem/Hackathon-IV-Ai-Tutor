---
id: 002
title: Luxury UI Redesign Plan
stage: plan
date: 2026-04-19
surface: agent
model: claude-sonnet-4-6
feature: 003-luxury-ui-redesign
branch: 003-luxury-ui-redesign
user: Abdul Hakeem
command: /sp.plan Generate UI redesign plan for luxury frontend.
labels: ["plan","frontend","ui-redesign","framer-motion","dark-theme","luxury","glassmorphism","tailwind-v4"]
links:
  spec: specs/003-luxury-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-luxury-ui-redesign/plan.md
tests:
  - "Constitution check: 7/7 PASS"
---

## Prompt

Generate UI redesign plan for luxury frontend.

## Plan Must Cover

### 1. Skill File First
Create .claude/skills/luxury-ui/SKILL.md BEFORE any code.
This skill file contains all design tokens, component patterns,
animation variants, and code snippets Claude will reuse
across every component.

### 2. Dependency Installation
- framer-motion
- @tabler/icons-react
- Update tailwind.config with custom colors + animations

### 3. Global Styles Update
- Update globals.css with:
  - CSS variables for all colors
  - Custom scrollbar styling
  - Selection color
  - Smooth scroll
  - Font imports

### 4. Shared Animation Variants File
Create lib/animations.ts with all reusable motion variants:
- fadeIn, fadeInUp, staggerContainer, staggerItem
- pageTransition, cardHover, buttonPress
- counterAnimation, glowPulse

### 5. Shared Components
Create these reusable luxury components:
- GradientText.tsx
- GlassCard.tsx
- GradientButton.tsx
- AnimatedCounter.tsx
- ScrollReveal.tsx
- GradientBorder.tsx
- MeshBackground.tsx
- PageTransition.tsx

### 6. Page Rebuild Order
1. globals.css + tailwind config
2. Shared components
3. Layout (Navbar + Footer)
4. Landing page (most complex)
5. About page
6. Contact page
7. Dashboard page
8. Profile page

### 7. ADRs
- Why framer-motion over CSS animations
- Why dark-first over light-first
- Why glassmorphism cards over solid cards

## Output
Files to create/update per area with complexity rating

## Response snapshot

Created complete implementation plan at `specs/003-luxury-ui-redesign/plan.md`.

**Constitution Check**: 7/7 PASS — pure frontend redesign, no backend changes, no new LLM routes, no content storage changes, tier gating logic unchanged.

**Phase 0 Research (5 decisions)**:
- framer-motion chosen over CSS @keyframes/GSAP: declarative variants API, useInView for scroll triggers, AnimatePresence, prefers-reduced-motion built-in; ~50KB bundle justified by animation richness
- Dark-first (#0A0A0F): target audience (AI developers) prefers dark; Linear/Vercel/GitHub all default dark; inverts ThemeProvider default from "system" to "dark"
- Glassmorphism cards: `backdrop-blur-xl bg-white/5 border border-white/10`; degrades gracefully without backdrop-filter support
- Tailwind v4 tokens via `@theme inline {}` in globals.css (no tailwind.config.ts in v4)
- SKILL.md at `.claude/skills/luxury-ui/SKILL.md` as L6 Runtime Skill for agent-reusable design context

**Phase 1 Design**:
- No new data entities; one UI-only type `MotionPreference` (read from matchMedia, not persisted)
- No new API endpoints; contact form is client-side simulation with setTimeout
- File map: ~35 files (10 luxury components, global styles, layout rewrites, 5 page rewrites/creates)

**Build Order (dependency-enforced)**:
1. SKILL.md + globals.css + lib/animations.ts
2. 8 shared luxury components (parallel)
3. Navbar + Footer + Sidebar (depend on GradientText, GlassCard)
4. Landing page (most complex — establishes all patterns)
5. About + Contact pages (parallel)
6. Dashboard page + dashboard component updates (LineChart → AreaChart)
7. Profile page

**Tailwind v4 Token Extension**: New colours added to `@theme inline {}` block + `:root, .dark` variables for luxury palette.

**3 ADR Suggestions** documented in plan for: dark-first-theme-default, framer-motion-animation-library, luxury-skill-design-system.

## Outcome

- ✅ Impact: Complete implementation plan ready for task generation — covers ~35 files, 8 pages, design system layer with full build order
- 🧪 Tests: Constitution check 7/7 PASS; pnpm tsc --noEmit verification checkpoint defined after each build step
- 📁 Files: specs/003-luxury-ui-redesign/plan.md
- 🔁 Next prompts: `/sp.tasks` to generate atomic tasks for implementation, then `/sp.implement`
- 🧠 Reflection: Tailwind v4 token approach (no tailwind.config.ts) is the key constraint that drives all colour token decisions; framer-motion must be 'use client' — server component pages need server wrapper + client animation child split

## Evaluation notes (flywheel)

- Failure modes observed: None — plan generated cleanly; create-new-feature.ps1 was not needed (branch already existed from spec phase)
- Graders run and results (PASS/FAIL): Constitution check 7/7 PASS
- Prompt variant (if applicable): sp.plan with detailed area breakdown
- Next experiment: Run /sp.tasks immediately (spec is comprehensive; task generation should be straightforward)
