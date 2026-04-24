"use client";

import { useState, useEffect } from "react";
import type { Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Transition Tokens
// ---------------------------------------------------------------------------

export const TRANSITION_FAST = { duration: 0.15, ease: "easeOut" } as const;
export const TRANSITION_BASE = { duration: 0.3, ease: "easeOut" } as const;
export const TRANSITION_SLOW = { duration: 0.5, ease: "easeOut" } as const;
export const SPRING = { type: "spring" as const, stiffness: 300, damping: 20 };

// ---------------------------------------------------------------------------
// Page & Section Variants
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION_BASE },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// List / Stagger Variants
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
};

// ---------------------------------------------------------------------------
// Modal Variants
// ---------------------------------------------------------------------------

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// Card Hover Motion Props (spread onto motion elements)
// ---------------------------------------------------------------------------

export const cardHover = {
  whileHover: { y: -4, boxShadow: "0 0 40px rgba(99,102,241,0.25)" },
  transition: SPRING,
};

// ---------------------------------------------------------------------------
// Button Motion Props
// ---------------------------------------------------------------------------

export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15, ease: "easeOut" },
};

export const buttonPress = {
  whileTap: { scale: 0.97 },
  transition: { duration: 0.1, type: "spring" as const, stiffness: 400, damping: 25 },
};

// ---------------------------------------------------------------------------
// Glow Pulse (infinite loop for premium/pro cards)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SSR-safe prefers-reduced-motion hook
// ---------------------------------------------------------------------------

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
