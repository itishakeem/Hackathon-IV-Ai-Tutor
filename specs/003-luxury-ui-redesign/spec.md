# Feature Specification: Luxury UI Redesign — Course Companion FTE Frontend

**Feature Branch**: `003-luxury-ui-redesign`  
**Created**: 2026-04-19  
**Status**: Draft  
**Input**: Redesign the entire Next.js frontend with a luxury, premium aesthetic (Linear.app meets Vercel.com meets Stripe.com). Dark-first design with framer-motion animations, glassmorphism cards, gradient text, glow effects, and 5 redesigned pages (Landing, About, Contact, Profile, Dashboard).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Luxury Landing Page (Priority: P1)

A visitor arrives at the home page and is immediately impressed by the premium dark aesthetic: an animated mesh gradient hero, staggered headline animation, typewriter subheadline, animated stats counters, glassmorphism feature cards, and a polished pricing section — all without logging in.

**Why this priority**: The landing page is the first impression for all users. A premium aesthetic directly increases conversion from visitor to registered learner. All other redesigned pages build on the same design system established here.

**Independent Test**: Visit `http://localhost:3000` without logging in. Verify: hero is full-viewport with animated blobs, headline lines animate in with stagger, stats counters animate on scroll, 6 feature cards lift+glow on hover, pricing section has Pro card with gradient border, footer has social links.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page, **When** the page loads, **Then** a full-viewport hero section displays with animated indigo/violet/cyan mesh gradient background and a floating code snippet on the right side.
2. **Given** the hero is visible, **When** the page first renders, **Then** three headline lines ("Build AI Agents.", "Learn from an AI.", "Ship to Production.") fade in sequentially with stagger delay.
3. **Given** the hero is visible, **When** the page loads, **Then** the subheadline renders with a typewriter animation effect.
4. **Given** the stats bar section scrolls into view, **When** the user scrolls down, **Then** four number counters animate from 0 to their final values (168, 99%, 50,000+, 85%).
5. **Given** the features section is visible, **When** the user hovers a feature card, **Then** the card lifts upward and a glow shadow appears.
6. **Given** the pricing section is visible, **When** the user views the Pro tier card, **Then** it displays an animated gradient border and a "Most Popular" badge.
7. **Given** the pricing section has an annual/monthly toggle, **When** the user clicks the toggle, **Then** prices update accordingly.
8. **Given** a visitor clicks "Start Learning Free", **When** the CTA is clicked, **Then** they are navigated to `/register`.

---

### User Story 2 — Redesigned Dashboard Page (Priority: P2)

An authenticated learner visits `/dashboard` and sees a premium dark dashboard with a personalised welcome greeting, 4 animated KPI cards, a Recharts AreaChart with gradient fill, a "Continue Learning" card, a recent activity feed, quiz performance cards, and an upsell card for non-pro users.

**Why this priority**: The dashboard is the primary destination after login — the most-used authenticated page. It directly impacts daily engagement and learner retention.

**Independent Test**: Log in as a free-tier user and navigate to `/dashboard`. Verify: "Good morning, [name]" header with current date, 4 KPI stat cards with animated numbers, area chart renders with indigo gradient fill, continue learning card shows next chapter, recent activity feed shows at least one entry, premium upsell card is visible.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the dashboard, **When** the page loads, **Then** a welcome header shows "Good morning/afternoon/evening, [first name]" based on time of day, with today's date and a static motivational quote.
2. **Given** the dashboard loads, **When** data is fetched, **Then** 4 KPI cards animate their numbers from 0 to the actual values (Progress %, Streak days, Avg Score %, Chapters Left).
3. **Given** quiz score history exists, **When** the chart section renders, **Then** a Recharts AreaChart displays with an indigo-to-violet gradient fill under the line.
4. **Given** the user has incomplete chapters, **When** the Continue Learning card renders, **Then** it shows the next recommended chapter title, a progress bar, estimated time, and a "Continue" button.
5. **Given** the user is on the free tier, **When** the dashboard loads, **Then** a glassmorphism "Unlock AI Features" upsell card appears at the bottom with a feature list and upgrade CTA.
6. **Given** the user has taken quizzes, **When** quiz performance section renders, **Then** score cards are colour-coded green (≥80%), yellow (50–79%), red (<50%), with a Retry button on low scores.

---

### User Story 3 — Profile Page (Priority: P3)

An authenticated user navigates to `/profile` and sees their personal information, tier badge, animated stat row, chapter progress bars, quiz attempt timeline, achievement badge grid, and a danger zone for account actions.

**Why this priority**: The profile page increases user investment in the platform by surfacing achievements and progress. It also provides account management capabilities.

**Independent Test**: Log in and navigate to `/profile`. Verify: avatar with gradient ring, tier badge correct colour, 4 stat cards animate in, chapter progress bars have animated fill, achievement badges show earned vs locked states, danger zone section is present.

**Acceptance Scenarios**:

1. **Given** an authenticated user views their profile, **When** the page loads, **Then** their avatar has a gradient ring, their email is shown, and their tier badge appears with correct colour (grey = free, indigo = premium, gold gradient = pro).
2. **Given** the profile page loads, **When** progress data is fetched, **Then** 4 stat cards (Chapters Completed, Current Streak, Avg Quiz Score, Days Active) animate their numbers in.
3. **Given** chapter data is available, **When** the learning progress section renders, **Then** each chapter shows an animated progress bar fill with a status badge (Complete/In Progress/Not Started).
4. **Given** the user has quiz history, **When** the quiz history section renders, **Then** a vertical timeline of attempts is shown with score badge, date, and chapter name per entry.
5. **Given** the achievements section renders, **When** a badge is earned, **Then** it appears in full colour with a glow; unearned badges appear greyscale with a lock icon.

---

### User Story 4 — About Page (Priority: P4)

A visitor navigates to `/about` and sees the mission, tech stack logos with hover glow, animated stat counters, and a glassmorphism vision card.

**Why this priority**: Builds trust with prospective users by conveying the product's mission and technical credibility.

**Independent Test**: Visit `/about`. Verify: hero gradient background, 3 mission cards animate on scroll, tech stack logos glow on hover, animated stat counters appear on scroll, glassmorphism vision card renders.

**Acceptance Scenarios**:

1. **Given** a visitor opens the About page, **When** they scroll through the page, **Then** mission cards, tech stack logos, and stats animate into view as they scroll.
2. **Given** the tech stack section renders, **When** the user hovers a technology logo, **Then** the logo displays a glow effect.
3. **Given** the stats section scrolls into view, **When** the counters start, **Then** numbers animate from 0 to their final values.

---

### User Story 5 — Contact Page (Priority: P5)

A visitor navigates to `/contact` and sees a glassmorphism contact form card with dark inputs, a gradient submit button, inline validation, an animated success checkmark on submission, and three contact info cards with hover glow.

**Why this priority**: Enables user support and lead capture. Lower priority as it does not block core learning functionality.

**Independent Test**: Visit `/contact`. Verify: glassmorphism card renders, all four fields display, submitting empty form shows inline validation errors, submitting valid form shows animated checkmark success state, three contact info cards glow on hover.

**Acceptance Scenarios**:

1. **Given** a visitor opens the Contact page, **When** they submit an empty form, **Then** inline validation errors appear on each required field without a page refresh.
2. **Given** all fields are filled correctly, **When** the user submits the form, **Then** the submit button shows a loading state and then an animated checkmark success state replaces the form.
3. **Given** the contact info cards render, **When** the user hovers a card, **Then** an indigo glow effect appears on the card.

---

### Edge Cases

- What happens when framer-motion animations are disabled by user's OS "reduce motion" preference? → All animations should respect `prefers-reduced-motion` media query and render static content immediately.
- How does the dark theme render on Safari with backdrop-blur? → Glassmorphism `backdrop-blur` degrades gracefully (solid card background fallback) on browsers that don't support it.
- What happens if progress data fails to load on dashboard? → Animated KPI cards and chart show skeleton/error state; page remains usable.
- How does the annual/monthly pricing toggle behave? → Pricing values are static (no backend call); toggle is purely UI state.
- What happens on mobile (375px) with the hero floating code snippet? → Code snippet is hidden on mobile; hero remains full-viewport with headline and CTAs only.
- What happens with the contact form submission? → Form posts are handled client-side only (no backend endpoint required in Phase 3); success state is shown after simulated delay.

---

## Requirements *(mandatory)*

### Functional Requirements

**Design System**
- **FR-001**: The frontend MUST use a dark-first colour palette: background `#0A0A0F`, card `#111118`, border `#1E1E2E`, text `#F8FAFC`, muted `#94A3B8`.
- **FR-002**: The frontend MUST install and use `framer-motion` for all animations (page transitions, stagger reveals, hover micro-interactions, number counters).
- **FR-003**: Heading typography MUST use Geist font; body MUST use Inter; code MUST use JetBrains Mono.
- **FR-004**: Glassmorphism cards MUST use `backdrop-blur-xl bg-white/5 border border-white/10` pattern.
- **FR-005**: Gradient text MUST use `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent` pattern.
- **FR-006**: Glow effects MUST use `shadow-[0_0_30px_rgba(99,102,241,0.3)]` or equivalent.
- **FR-007**: All animations MUST respect `prefers-reduced-motion` and render statically when motion is reduced.
- **FR-008**: All pages MUST be mobile responsive (320px minimum width).

**Landing Page (/)**
- **FR-009**: Landing page MUST have a full-viewport hero with animated mesh gradient background (indigo/violet/cyan blobs using CSS or canvas).
- **FR-010**: Hero MUST display a floating code snippet on the right (desktop only; hidden on mobile).
- **FR-011**: Hero headline MUST animate three lines with stagger delay using framer-motion.
- **FR-012**: Hero subheadline MUST use a typewriter animation effect.
- **FR-013**: Stats bar MUST animate number counters when the section scrolls into view.
- **FR-014**: Features section MUST show 6 glassmorphism cards with stagger scroll-reveal and hover lift+glow.
- **FR-015**: Pricing section MUST include annual/monthly toggle; Pro card MUST have animated gradient border and "Most Popular" badge.
- **FR-016**: Footer MUST include navigation links (Course, Pricing, About, Contact) and social icon links.

**About Page (/about)**
- **FR-017**: About page MUST be created at `/about` with hero, mission cards, tech stack logos, animated stats, and vision card.
- **FR-018**: Tech stack logos MUST glow on hover.

**Contact Page (/contact)**
- **FR-019**: Contact page MUST be created at `/contact` with a glassmorphism form card supporting Name, Email, Subject, and Message fields.
- **FR-020**: Contact form MUST display inline validation errors and an animated success state after submission.

**Profile Page (/profile)**
- **FR-021**: Profile page MUST be created at `/(dashboard)/profile` (authenticated route) with avatar+gradient ring, tier badge, 4 stat cards, progress bars, quiz timeline, achievement badges, and danger zone.
- **FR-022**: Tier badge MUST colour-code: grey (free), indigo (premium), gold gradient (pro).
- **FR-023**: Achievement badges MUST show earned (full colour + glow) and locked (greyscale + lock icon) states.

**Dashboard Page (/dashboard)**
- **FR-024**: Dashboard welcome header MUST display time-of-day greeting, user's name, current date, and a static motivational quote.
- **FR-025**: Dashboard MUST display 4 KPI cards with framer-motion animated number counters on mount.
- **FR-026**: Dashboard chart MUST use Recharts `AreaChart` with an indigo-to-violet gradient fill (replacing the existing `LineChart`).
- **FR-027**: Dashboard MUST include a "Continue Learning" card showing the next incomplete chapter.
- **FR-028**: Dashboard MUST include a recent activity feed with relative timestamps.
- **FR-029**: Non-pro users MUST see a glassmorphism upsell card on the dashboard.

### Key Entities

- **Design Token**: CSS custom property values defined in `globals.css` for the luxury colour palette (background, card, border, text, glow colours).
- **Animation Variant**: Reusable framer-motion `Variants` object (e.g., `fadeInUp`, `staggerContainer`) stored in `lib/animations.ts`.
- **Page Section**: Top-level visual block on a page (hero, stats, features, pricing) — each independently animated on scroll.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The redesigned landing page must load and be interactive in under 3 seconds on a standard broadband connection (no regression from current build time).
- **SC-002**: All 5 redesigned pages (Landing, About, Contact, Profile, Dashboard) must render without layout shift or visual errors at 375px, 768px, and 1280px viewport widths.
- **SC-003**: All framer-motion animations must complete within 800ms and not block user interaction with page content.
- **SC-004**: The design system must be consistent across all 5 pages — same colour tokens, typography scale, card patterns, and spacing system applied uniformly.
- **SC-005**: `pnpm build` must pass with zero TypeScript errors and zero Next.js build errors after the redesign.
- **SC-006**: Users with OS "reduce motion" enabled must receive fully functional, static-rendered pages with no broken UI.
- **SC-007**: The annual/monthly pricing toggle on the landing page must update all three pricing tier values without a page reload.
- **SC-008**: The Contact form must show success state within 2 seconds of a valid submission (client-side simulated).

---

## Assumptions

- The existing backend API (Phase 1 + Phase 2) and all authenticated features (chapters, quizzes, premium AI) remain unchanged — this is a pure frontend visual redesign.
- The contact form submission is client-side only (no backend email endpoint); a simulated success state is acceptable for the hackathon scope.
- The `About` and `Contact` pages are new public pages (no authentication required).
- The `Profile` page is a new authenticated page under `/(dashboard)/` using existing `useAuth`, `useProgress`, and `useChapters` hooks.
- Testimonials on the landing page use static/hardcoded content (no backend data source).
- The annual pricing is a 20% discount applied client-side from the monthly price (no backend billing integration).
- `framer-motion` is compatible with Next.js 16 App Router (client components only; no `"use server"` conflict).
- JetBrains Mono is loaded via `next/font/google` or a local font file.

---

## Out of Scope

- Backend changes of any kind (no new API endpoints, no database schema changes).
- Actual email sending from the contact form.
- Real billing/payment integration for the pricing toggle.
- User account deletion (danger zone button is UI-only, calls existing API if available or shows confirmation modal).
- Animations on quiz/chapter reader pages (those remain functionally styled but are not part of this redesign spec).
- Light mode (this redesign is dark-first; light mode toggle is retained but not the focus of this spec).
