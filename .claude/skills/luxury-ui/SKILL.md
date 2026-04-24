---
name: luxury-ui
description: Luxury UI Design System — Course Companion FTE. Design tokens, component patterns, animation variants, error handling rules, and code snippets for the dark-first glassmorphism UI. Read before writing any component or page in this project.
---

# Luxury UI Design System — Course Companion FTE

**Purpose**: Agent-reusable design tokens, component patterns, animation variants, and code snippets for the luxury dark-first UI. Read this file before writing any component or page.

**Stack**: Next.js 16.2.4 · Tailwind v4 (no tailwind.config.ts) · shadcn v4.3.0 (base-ui, no asChild) · framer-motion 12.x · TypeScript strict

---

## 1. Design Tokens

```css
/* Colors */
--background: #0A0A0F;
--background-card: #111118;
--border: #1E1E2E;
--text-primary: #F8FAFC;
--text-muted: #94A3B8;
--indigo: #4F46E5;
--violet: #7C3AED;
--cyan: #06B6D4;
--gold: #F59E0B;
--success: #10B981;
--error: #EF4444;
```

Declared in `frontend/src/app/globals.css`:
```css
:root, .dark {
  --luxury-bg: #0A0A0F;
  --luxury-card: #111118;
  --luxury-border: #1E1E2E;
  --background: #0A0A0F;
  --foreground: #F8FAFC;
}
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

### Transition Tokens (from `lib/animations.ts`)
```typescript
export const TRANSITION_FAST = { duration: 0.15, ease: "easeOut" };
export const TRANSITION_BASE = { duration: 0.3,  ease: "easeOut" };
export const TRANSITION_SLOW = { duration: 0.5,  ease: "easeOut" };
export const SPRING = { type: "spring", stiffness: 300, damping: 20 };
```

**Always use hardcoded hex in Tailwind arbitrary syntax** — e.g. `bg-[#0A0A0F]` — for reliability in Tailwind v4.

---

## 2. Gradient Recipes

- **Gradient text**: `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`
- **Gradient button**: `bg-gradient-to-r from-indigo-600 to-violet-600`
- **Gradient border**: `p-[1px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl` (inner div `bg-[#111118] rounded-2xl`)
- **Mesh background**: absolutely-positioned radial blobs with `blur-3xl` and `/20` opacity
- **Glow shadow**: `shadow-[0_0_30px_rgba(99,102,241,0.3)]`
- **Stronger glow**: `shadow-[0_0_40px_rgba(99,102,241,0.5)]`

---

## 3. Component Patterns

### GlassCard
```tsx
// hover prop activates translateY(-4px) + shadow intensify via framer-motion
<GlassCard hover>content</GlassCard>

// raw pattern:
<div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6
  hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 will-change-transform">
```

### GradientText
```tsx
<GradientText>Heading</GradientText>
// = bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-bold
```

### GlowButton (Primary)
```tsx
<GradientButton variant="primary">Click</GradientButton>
// includes: whileHover scale(1.02) + whileTap scale(0.97) via framer-motion
// raw:
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
  className="bg-gradient-to-r from-indigo-600 to-violet-600
    hover:from-indigo-500 hover:to-violet-500
    shadow-[0_0_20px_rgba(99,102,241,0.4)]
    hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]
    px-6 py-3 rounded-xl font-semibold text-white transition-all"
/>
```

### GlassButton (Secondary)
```tsx
<GradientButton variant="secondary">Cancel</GradientButton>
// raw:
<button className="border border-white/20 bg-white/5 hover:bg-white/10
  hover:border-white/30 px-6 py-3 rounded-xl font-semibold text-white
  transition-all duration-300 backdrop-blur-sm" />
```

### GradientBorder (Pro card / avatar ring)
```tsx
<div className="p-[1px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl">
  <div className="bg-[#111118] rounded-2xl">{children}</div>
</div>
```

### Dark Input (with focus glow)
```tsx
<input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
  text-white placeholder-white/30 focus:outline-none
  focus:border-indigo-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
  transition-all duration-300" />
```

### Tier Badge
```tsx
// Free: border-slate-500 text-slate-400
// Premium: border-indigo-500 text-indigo-400
// Pro: border-amber-500 text-amber-400
<span className="border px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
  {tier}
</span>
```

---

## 4. Animation Patterns (full variants from `lib/animations.ts`)

### Page Transitions
```typescript
// Enter: fade + slide up 300ms ease-out
// Exit:  fade + slide down 200ms ease-in
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:   { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
};
// Usage: wrap every page in <PageTransition> which handles reducedMotion
```

### Modal Enter/Exit
```typescript
export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn"  } },
};
// shadcn Dialog uses base-ui data-open/data-closed: zoom-in-95 / zoom-out-95 automatically
```

### Card Hover
```typescript
export const cardHover = {
  whileHover: { y: -4, boxShadow: "0 0 40px rgba(99,102,241,0.25)" },
  transition:  SPRING,  // stiffness 300, damping 20
};
// Pass hover={true} to <GlassCard> to activate
```

### Button Press
```typescript
export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.97 },
  transition: { duration: 0.15, ease: "easeOut" },
};
// Built into GradientButton; apply manually to bare motion.button elements
```

### Stagger Lists
```typescript
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
};
// IMPORTANT: Use plain <div> as stagger container, NOT motion.div
// (framer-motion re-processes children of motion containers causing React key warnings)
// Each child uses explicit initial/animate instead:
// <motion.div key={item.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay: i*0.07}} />
```

### Glow Pulse (infinite, Pro cards)
```typescript
export const glowPulse: Variants = {
  hidden:  { boxShadow: "0 0 20px rgba(99,102,241,0.3)" },
  visible: { boxShadow: [...], transition: { duration: 2, repeat: Infinity } },
};
```

### Number Counter
```tsx
// AnimatedCounter: ease-out cubic, 1s, triggers on scroll into view
// Usage: <AnimatedCounter end={85} suffix="%" />
// Respects reducedMotion — renders end value immediately if true
```

### Skeleton Shimmer
```tsx
// Built into shadcn Skeleton: animate-pulse shimmer left→right 1.5s infinite
// Usage: <Skeleton className="h-8 w-full bg-white/5 rounded-xl" />
```

### Success Checkmark
```tsx
// Use lucide CheckCircle2 with emerald-400, wrap in motion.div scale 0→1
<motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:300,delay:0.2}}>
  <CheckCircle2 className="text-emerald-400 w-12 h-12" />
</motion.div>
```

### Toast Animations
```tsx
// react-hot-toast with luxury styling in layout.tsx Toaster:
// background: #111118, border: rgba(99,102,241,0.3), borderRadius: 12px
// position: "top-right" — slides in from right via built-in library animation
```

---

## 5. Route Transitions with AnimatePresence

Route transitions are handled at the **page** level via `<PageTransition>` wrapper — do NOT wrap `{children}` in the root layout with `AnimatePresence` as Next.js App Router manages route boundaries.

```tsx
// Every page uses:
import PageTransition from "@/components/ui/PageTransition";
export default function SomePage() {
  return (
    <PageTransition>
      {/* page content */}
    </PageTransition>
  );
}
```

For step-transitions within a page (multi-step forms like forgot-password), use:
```tsx
import { AnimatePresence, motion } from "framer-motion";
<AnimatePresence mode="wait">
  {step === "email" && <motion.div key="email" variants={cardVariants} ...> </motion.div>}
  {step === "code"  && <motion.div key="code"  variants={cardVariants} ...> </motion.div>}
</AnimatePresence>
```

---

## 6. MeshBackground Pattern

```tsx
// CSS-only version (preferred for performance):
<div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
  <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]" />
</div>
// Component: <MeshBackground /> — use reducedMotion to skip animate-pulse
```

---

## 7. ScrollReveal Pattern

```tsx
// Component: <ScrollReveal delay={0.1}>{children}</ScrollReveal>
// Uses whileInView + viewport={{ once: true }} — fires once as element enters view
// Falls back to plain <div> when reducedMotion is true
```

---

## 8. AnimatedCounter Pattern

```tsx
// Component: <AnimatedCounter end={85} suffix="%" />
// Ease-out cubic over 1s, triggered by useInView once
// Returns end value immediately when reducedMotion is true
```

---

## 9. Error Handling Patterns (no raw errors on UI)

```typescript
// In forms: use getErrorStatus() from lib/api.ts
import { getErrorStatus } from "@/lib/api";
try {
  await apiCall();
} catch (err) {
  const status = getErrorStatus(err);
  if (status === 401)  { /* handled by axios interceptor → redirect /login */ }
  if (status === 403)  { setUpgradeOpen(true); }              // show upgrade modal
  if (status === 404)  { setEmpty(true); }                    // show empty state
  if (status === 422)  { setError("Please check your input."); } // inline only
  if (status === 409)  { setError("Already exists."); }       // inline only
  // 500/503/network: axios interceptor fires toast automatically — just setLoading(false)
}

// In hooks: always use a generic message, never expose err.message
.catch(() => {
  setState({ data: null, loading: false, error: "Unable to load data" });
});
```

Axios interceptor in `lib/api.ts` handles:
- `401` → clearAuth() + redirect `/login` (silent)
- `500/503` → `toast.error("Service temporarily unavailable")`
- Network error → `toast.error("Something went wrong, please try again")`

---

## 10. Responsive Breakpoints

| Breakpoint | Tailwind | Width   |
|------------|----------|---------|
| Mobile     | default  | 375px+  |
| Tablet     | `md:`    | 768px+  |
| Desktop    | `lg:`    | 1024px+ |
| Wide       | `xl:`    | 1280px+ |

**Mobile-first rules**:
- Feature grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Pricing cards: `grid-cols-1 md:grid-cols-3`
- Hero code snippet: `hidden lg:block`
- Stat bar: `flex-col md:flex-row`

---

## 11. Dark Mode

- Default is **DARK** — `ThemeProvider defaultTheme="dark"` in `layout.tsx`
- Use `bg-[#0A0A0F]` not `bg-background` for guaranteed dark value
- Use `text-white` not `text-foreground` in luxury components
- Hardcode dark hex values; glassmorphism `backdrop-blur` degrades gracefully

---

## 12. DOs and DON'Ts

### DO
- `bg-[#0A0A0F]` dark background on every page
- Glass cards with `backdrop-blur-xl bg-white/5 border border-white/10`
- Gradient text for all major headings
- `will-change-transform` on animated cards for GPU compositing
- `useReducedMotion()` guard in **every** animated component
- `<Link className={cn(buttonVariants(...))}>` for link-as-button (NO asChild)
- Tailwind v4: tokens in `globals.css @theme inline {}` only
- `viewport={{ once: true }}` on all `whileInView` animations
- Plain `<div>` as mapped list container; animate each child individually

### DON'T
- White or light backgrounds (`bg-white`, `bg-gray-50`)
- `motion.div` as a `.map()` container — causes React key prop warnings
- Components that skip `useReducedMotion()` check
- Hard drop-shadows — use `shadow-[0_0_Xpx_rgba(...)]` glow only
- `asChild` on shadcn Button — base-ui v4.3.0 doesn't support it
- Explicit `number` type on Recharts `formatter` value parameter
- `tailwind.config.ts` — it doesn't exist; use `globals.css`
- Exposing `err.message`, API detail text, or stack traces to users

---

## 13. Performance Rules

- `will-change-transform` on animated cards
- `viewport={{ once: true }}` on all scroll-triggered animations
- `blur-3xl` max for MeshBackground
- Animation durations: 0.15–0.5s; nothing longer than 0.8s
- `if (reducedMotion) return <div>{children}</div>` — skip all framer variants

---

## 14. Critical Technical Constraints

| Constraint | Rule |
|-----------|------|
| shadcn v4.3.0 | `@base-ui/react` — no `asChild` prop anywhere |
| Tailwind v4 | No `tailwind.config.ts` — CSS tokens via `globals.css` only |
| framer-motion | Must be `'use client'` — no Server Components |
| SSR safety | `useReducedMotion` uses `useState(false)` + `useEffect` only |
| Recharts | `formatter={(value) => ...}` — no explicit `number` type on `value` |
| TypeScript | `pnpm tsc --noEmit` must pass zero errors after every change |
| Error UX | Never show `err.message`, API detail, or stack traces to users |
| List animations | Never `motion.div` as list container — use plain `div` + per-item animation |
