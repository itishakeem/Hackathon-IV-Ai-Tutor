"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { QuizQuestion } from "@/types";

interface QuizCardProps {
  question: QuizQuestion;
  selected: string | null;
  onSelect: (key: string) => void;
  onNext: () => void;
  isLast: boolean;
}

export function QuizCard({ question, selected, onSelect, onNext, isLast }: QuizCardProps) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <p className="text-base font-medium leading-relaxed text-[#F8FAFC]">{question.question}</p>

      <div className="grid grid-cols-1 gap-2">
        {question.options.map((option) => (
          <motion.button
            key={option.key}
            onClick={() => onSelect(option.key)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
              selected === option.key
                ? "border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.2)] text-[#F8FAFC]"
                : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC]"
            )}
          >
            <span className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all",
              selected === option.key
                ? "border-indigo-400 bg-indigo-500 text-white"
                : "border-white/20 text-[#94A3B8]"
            )}>
              {option.key}
            </span>
            <span className="pt-0.5">{option.text}</span>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={onNext}
        disabled={!selected}
        whileHover={selected ? { scale: 1.01 } : {}}
        whileTap={selected ? { scale: 0.98 } : {}}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      >
        {isLast ? "Submit Quiz" : "Next Question"}
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
