"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover, useReducedMotion } from "@/lib/animations";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({ children, className, hover = false }: GlassCardProps) {
  const reducedMotion = useReducedMotion();

  const baseClass = cn(
    "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6",
    "hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300",
    className
  );

  if (hover && !reducedMotion) {
    return (
      <motion.div
        className={baseClass}
        whileHover={cardHover.whileHover}
        transition={cardHover.transition}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClass}>{children}</div>;
}
