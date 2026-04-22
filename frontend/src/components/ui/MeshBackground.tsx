"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/animations";

interface MeshBackgroundProps {
  className?: string;
}

const orbs = [
  {
    size: "w-96 h-96",
    color: "bg-indigo-600/20",
    position: "top-1/4 left-1/4",
    duration: 8,
    animate: { x: [0, 30, -20, 0], y: [0, -20, 30, 0] },
  },
  {
    size: "w-80 h-80",
    color: "bg-violet-600/20",
    position: "top-1/3 right-1/4",
    duration: 10,
    animate: { x: [0, -30, 20, 0], y: [0, 20, -30, 0] },
  },
  {
    size: "w-72 h-72",
    color: "bg-cyan-500/10",
    position: "bottom-1/4 left-1/3",
    duration: 12,
    animate: { x: [0, 20, -10, 0], y: [0, -10, 20, 0] },
  },
];

export default function MeshBackground({ className }: MeshBackgroundProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("absolute inset-0 overflow-hidden -z-10", className)}>
      {orbs.map((orb, i) =>
        reducedMotion ? (
          <div
            key={i}
            className={cn(
              "absolute rounded-full blur-3xl",
              orb.size,
              orb.color,
              orb.position
            )}
          />
        ) : (
          <motion.div
            key={i}
            className={cn(
              "absolute rounded-full blur-3xl",
              orb.size,
              orb.color,
              orb.position
            )}
            animate={orb.animate}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )
      )}
    </div>
  );
}
