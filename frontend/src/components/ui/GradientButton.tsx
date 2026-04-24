"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonPress, useReducedMotion } from "@/lib/animations";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const primaryClass =
  "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 " +
  "shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] text-white";

const secondaryClass =
  "border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 " +
  "backdrop-blur-sm text-white";

export default function GradientButton({
  children,
  onClick,
  href,
  loading = false,
  disabled = false,
  className,
  size = "md",
  variant = "primary",
}: GradientButtonProps) {
  const reducedMotion = useReducedMotion();
  const variantClass = variant === "primary" ? primaryClass : secondaryClass;

  const baseClass = cn(
    "rounded-xl font-semibold transition-all duration-300 cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "inline-flex items-center justify-center gap-2",
    sizeClasses[size],
    variantClass,
    className
  );

  const content = loading ? (
    <>
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {children}
    </>
  ) : (
    children
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  if (reducedMotion) {
    return (
      <button className={baseClass} onClick={onClick} disabled={disabled || loading}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      className={baseClass}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {content}
    </motion.button>
  );
}
