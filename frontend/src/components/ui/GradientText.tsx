"use client";

import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

export default function GradientText({
  children,
  className,
  from = "from-indigo-400",
  to = "to-violet-400",
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent font-bold",
        from,
        to,
        className
      )}
    >
      {children}
    </span>
  );
}
