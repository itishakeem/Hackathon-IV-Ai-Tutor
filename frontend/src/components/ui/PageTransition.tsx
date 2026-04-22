"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransition, useReducedMotion } from "@/lib/animations";
import MeshBackground from "@/components/ui/MeshBackground";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  includeMesh?: boolean;
}

export default function PageTransition({
  children,
  className,
  includeMesh = true,
}: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={cn("relative min-h-screen bg-[#0A0A0F] text-white", className)}>
        {includeMesh && <MeshBackground />}
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("relative min-h-screen bg-[#0A0A0F] text-white", className)}
    >
      {includeMesh && <MeshBackground />}
      {children}
    </motion.div>
  );
}
