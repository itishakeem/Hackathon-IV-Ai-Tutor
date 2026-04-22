"use client";

import { useState, useEffect } from "react";
import type { Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Motion Variants
// ---------------------------------------------------------------------------

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
// Motion Props (spread onto motion elements)
// ---------------------------------------------------------------------------

export const cardHover = {
  whileHover: { scale: 1.02, y: -4 },
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

export const buttonPress = {
  whileTap: { scale: 0.97 },
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
