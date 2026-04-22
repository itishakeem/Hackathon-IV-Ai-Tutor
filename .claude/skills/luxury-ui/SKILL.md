# Luxury UI Design System — Course Companion FTE

**Purpose**: Agent-reusable design tokens, component patterns, animation variants, and code snippets for the luxury dark-first UI redesign. Read this file before writing any component or page in the `003-luxury-ui-redesign` feature.

**Stack**: Next.js 16.2.4 · Tailwind v4 (no tailwind.config.ts) · shadcn v4.3.0 (base-ui, no asChild) · framer-motion · TypeScript strict

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

These are declared in `frontend/src/app/globals.css` as:
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

**Always use hardcoded hex values in Tailwind arbitrary syntax** — e.g., `bg-[#0A0A0F]` — for reliability in Tailwind v4.

---

## 2. Gradient Recipes

- **Gradient text**: `bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent`
- **Gradient button**: `bg-gradient-to-r from-indigo-600 to-violet-600`
- **Gradient border**: `p-[1px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl` (inner div has `bg-[#111118] rounded-2xl`)
- **Mesh background**: multiple absolutely-positioned radial blobs with `blur-3xl` and `/20` opacity
- **Glow shadow**: `shadow-[0_0_30px_rgba(99,102,241,0.3)]`
- **Stronger glow**: `shadow-[0_0_40px_rgba(99,102,241,0.5)]`

---

## 3. Component Patterns (with full code snippets)

### GlassCard
```tsx
<div className="
  backdrop-blur-xl bg-white/5 
  border border-white/10 rounded-2xl p-6
  hover:bg-white/[0.08] hover:border-white/20
  transition-all duration-300
">
  {children}
</div>
```

### GradientText
```tsx
<span className="
  bg-gradient-to-r from-indigo-400 to-violet-400
  bg-clip-text text-transparent font-bold
">
  {children}
</span>
```

### GlowButton (Primary)
```tsx
<button className="
  bg-gradient-to-r from-indigo-600 to-violet-600
  hover:from-indigo-500 hover:to-violet-500
  shadow-[0_0_20px_rgba(99,102,241,0.4)]
  hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]
  px-6 py-3 rounded-xl font-semibold text-white
  transition-all duration-300 cursor-pointer
">
  {children}
</button>
```

### GlassButton (Secondary)
```tsx
<button className="
  border border-white/20 bg-white/5
  hover:bg-white/10 hover:border-white/30
  px-6 py-3 rounded-xl font-semibold text-white
  transition-all duration-300 backdrop-blur-sm
">
  {children}
</button>
```

### GradientBorder (wrapper for Pro cards / avatar rings)
```tsx
<div className="p-[1px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl">
  <div className="bg-[#111118] rounded-2xl">
    {children}
  </div>
</div>
```

### Tier Badge
```tsx
// Free: border-slate-500 text-slate-400
// Premium: border-indigo-500 text-indigo-400
// Pro: border-amber-500 text-amber-400 (gold)
<span className="
  border px-3 py-1 rounded-full text-xs font-semibold
  uppercase tracking-wider
">
  {tier}
</span>
```

### Dark Input
```tsx
<input className="
  w-full bg-white/5 border border-white/10
  focus:border-indigo-500 focus:outline-none
  rounded-lg px-4 py-3 text-white placeholder-white/30
  transition-colors duration-200
" />
```

### Link-as-Button (shadcn v4.3.0 base-ui — NO asChild)
```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

<Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
  Get Started
</Link>
```

---

## 4. Framer Motion Variants (full code)

File: `frontend/src/lib/animations.ts`

```typescript
import { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const cardHover = {
  whileHover: { scale: 1.02, y: -4 },
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

export const buttonPress = {
  whileTap: { scale: 0.97 },
};

export const glowPulse: Variants = {
  hidden: { boxShadow: "0 0 20px rgba(99,102,241,0.3)" },
  visible: {
    boxShadow: [
      "0 0 20px rgba(99,102,241,0.3)",
      "0 0 40px rgba(99,102,241,0.6)",
      "0 0 20px rgba(99,102,241,0.3)",
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

// SSR-safe reduced motion hook
// Usage: const reducedMotion = useReducedMotion();
import { useState, useEffect } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
```

**Usage pattern** (always check reducedMotion in animated components):
```tsx
const reducedMotion = useReducedMotion();

// Skip animation entirely when reducedMotion is true
<motion.div
  variants={fadeInUp}
  initial={reducedMotion ? "visible" : "hidden"}
  animate="visible"
>
```

---

## 5. MeshBackground Pattern

```tsx
// src/components/ui/luxury/MeshBackground.tsx
'use client';

export default function MeshBackground({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  
  const orbs = [
    { size: "w-96 h-96", color: "bg-indigo-600/20", top: "top-1/4", left: "left-1/4", dur: 8 },
    { size: "w-80 h-80", color: "bg-violet-600/20", top: "top-1/3", left: "right-1/4", dur: 10 },
    { size: "w-72 h-72", color: "bg-cyan-500/10", top: "bottom-1/4", left: "left-1/3", dur: 12 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden -z-10 ${className ?? ""}`}>
      {orbs.map((orb, i) => (
        reducedMotion ? (
          <div
            key={i}
            className={`absolute ${orb.size} ${orb.color} ${orb.top} ${orb.left} rounded-full blur-3xl`}
          />
        ) : (
          <motion.div
            key={i}
            className={`absolute ${orb.size} ${orb.color} rounded-full blur-3xl`}
            style={{ top: /* position via style not className for motion */ undefined }}
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        )
      ))}
    </div>
  );
}
```

**Simpler CSS-only version** (also acceptable, no JS):
```tsx
<div className="absolute inset-0 overflow-hidden -z-10">
  <div className="absolute top-1/4 left-1/4 w-96 h-96 
    bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute top-1/3 right-1/4 w-80 h-80 
    bg-violet-500/20 rounded-full blur-3xl animate-pulse 
    [animation-delay:1000ms]" />
  <div className="absolute bottom-1/4 left-1/3 w-72 h-72 
    bg-cyan-500/10 rounded-full blur-3xl animate-pulse 
    [animation-delay:2000ms]" />
</div>
```

---

## 6. Page Layout Shell

```tsx
'use client';
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import MeshBackground from "@/components/ui/luxury/MeshBackground";

export default function SomePage() {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative min-h-screen bg-[#0A0A0F] text-white"
    >
      <MeshBackground />
      {/* page content */}
    </motion.div>
  );
}
```

---

## 7. AnimatedCounter Pattern

```tsx
// src/components/ui/luxury/AnimatedCounter.tsx
'use client';
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/animations";

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number; // seconds
}

export default function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(reducedMotion ? end : 0);

  useEffect(() => {
    if (!inView || reducedMotion) return;
    let start = 0;
    const steps = 60;
    const increment = end / steps;
    const interval = (duration * 1000) / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [inView, end, duration, reducedMotion]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
```

---

## 8. ScrollReveal Pattern

```tsx
// src/components/ui/luxury/ScrollReveal.tsx
'use client';
import { motion } from "framer-motion";
import { fadeInUp, useReducedMotion } from "@/lib/animations";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({ children, className, delay = 0 }: Props) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 9. Responsive Breakpoints

| Breakpoint | Tailwind | Width |
|------------|----------|-------|
| Mobile | (default) | 375px+ |
| Tablet | `md:` | 768px+ |
| Desktop | `lg:` / `xl:` | 1024px+ / 1280px+ |
| Wide | `2xl:` | 1536px+ |

**Mobile-first rules**:
- Feature grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Pricing cards: `grid-cols-1 md:grid-cols-3`
- Hero code snippet: `hidden lg:block`
- Stat bar: `flex-col md:flex-row`

---

## 10. Dark Mode

- **Default is DARK** — `ThemeProvider defaultTheme="dark"` is set in `layout.tsx`
- Use `bg-[#0A0A0F]` not `bg-background` for guaranteed dark value
- Use `text-white` not `text-foreground` in luxury components
- Hardcode dark hex values for consistency across all luxury pages
- Glassmorphism `backdrop-blur` degrades gracefully — `bg-white/5` provides solid fallback

---

## 11. DOs and DON'Ts

### DO
- `bg-[#0A0A0F]` dark background on every page
- Glass cards with `backdrop-blur-xl bg-white/5 border border-white/10`
- Gradient text (`from-indigo-400 to-violet-400 bg-clip-text text-transparent`) for all headings
- `framer-motion` on every section reveal
- Glow effects on interactive elements (`shadow-[0_0_30px_rgba(99,102,241,0.3)]`)
- `staggerContainer` + `staggerItem` on lists/grids
- `transition-all duration-300` for smooth hover states
- `'use client'` on every component that uses framer-motion
- `useReducedMotion()` check in every animated component
- `<Link className={cn(buttonVariants(...))}>` for link-as-button (NO asChild)
- Tailwind v4: add tokens to `globals.css` `@theme inline {}` (no `tailwind.config.ts`)

### DON'T
- White or light backgrounds (`bg-white`, `bg-gray-50`)
- Flat solid color cards without backdrop-blur
- Components that skip `useReducedMotion()` check
- Hard shadows — use `shadow-[0_0_Xpx_rgba(...)]` glow instead
- Abrupt transitions (always add `transition-all duration-300`)
- `asChild` prop on shadcn Button — base-ui v4.3.0 doesn't support it
- Explicit `number` type annotation on Recharts `formatter` value param
- Editing `tailwind.config.ts` — it doesn't exist; use `globals.css`

---

## 12. Performance Rules

- Wrap animations: `if (reducedMotion) return <div>{children}</div>`
- Add `will-change-transform` class to animated cards for GPU compositing
- Use `viewport={{ once: true }}` on all `whileInView` animations
- Keep `blur-3xl` as max for MeshBackground (heavier blurs hurt paint)
- `next/image` with `priority` on above-the-fold images
- Animation durations: 0.3–0.5s for reveals, ≤ 0.8s total per SC-003

---

## 13. Critical Technical Constraints

| Constraint | Rule |
|-----------|------|
| shadcn v4.3.0 | `@base-ui/react` — no `asChild` prop anywhere |
| Tailwind v4 | No `tailwind.config.ts` — CSS tokens only via `globals.css` |
| framer-motion | Must be `'use client'` — cannot run in Server Components |
| SSR safety | `useReducedMotion` must use `useState(false)` + `useEffect` (no `window` on server) |
| Recharts | `formatter={(value) => ...}` — no explicit `number` type on `value` |
| Contact form | `setTimeout` simulation only — no API call |
| pnpm tsc | Must pass `pnpm tsc --noEmit` with zero errors after every phase |
