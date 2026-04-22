"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, BookOpen } from "lucide-react";
import { quizzesApi } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GradientText from "@/components/ui/GradientText";
import type { QuizResult as QuizResultType, QuizAnswersResponse } from "@/types";

interface QuizResultProps {
  result: QuizResultType;
  onRetry: () => void;
  chapterId: string;
}

export function QuizResult({ result, onRetry, chapterId }: QuizResultProps) {
  const [answers, setAnswers] = useState<QuizAnswersResponse | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  async function handleViewAnswers() {
    if (answers) return;
    setLoadingAnswers(true);
    try {
      const data = await quizzesApi.getAnswers(chapterId);
      setAnswers(data);
    } finally {
      setLoadingAnswers(false);
    }
  }

  const percentage = result.score;
  const passed = percentage >= 60;
  const scoreColor = percentage >= 80 ? "text-emerald-400" : percentage >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="space-y-6"
    >
      {/* Score display */}
      <GlassCard className="text-center space-y-3">
        <div className={`text-7xl font-black ${scoreColor}`}>
          <GradientText
            from={passed ? "from-emerald-400" : "from-red-400"}
            to={passed ? "to-cyan-400" : "to-red-600"}
          >
            {percentage}
          </GradientText>
        </div>
        <p className="text-[#94A3B8]">
          {result.correct_count} / {result.total_questions} correct
        </p>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${
          passed
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {passed ? "Passed" : "Try Again"}
        </div>

        {/* Score progress bar */}
        <div className="h-2 rounded-full bg-white/10 overflow-hidden max-w-xs mx-auto">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className={`h-full rounded-full ${
              percentage >= 80 ? "bg-gradient-to-r from-emerald-500 to-cyan-500" :
              percentage >= 60 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
              "bg-gradient-to-r from-red-500 to-red-400"
            }`}
          />
        </div>
      </GlassCard>

      {/* Per-question results */}
      <div className="space-y-2">
        {result.results.map((r, i) => (
          <div
            key={r.question_id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              r.is_correct
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            {r.is_correct ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#F8FAFC] truncate">
                Q{i + 1}: {r.question}
              </p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Your answer: <span className="font-medium text-[#F8FAFC]">{r.selected}</span>
                {!r.is_correct && (
                  <> · Correct: <span className="font-medium text-emerald-400">{r.correct}</span></>
                )}
              </p>
              {answers && (
                <p className="text-xs text-indigo-400 mt-0.5">
                  Answer: {answers.answers[r.question_id]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-[#94A3B8] hover:text-white hover:border-white/40 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </motion.button>
        <motion.button
          onClick={handleViewAnswers}
          disabled={loadingAnswers || !!answers}
          whileHover={!answers ? { scale: 1.01 } : {}}
          whileTap={!answers ? { scale: 0.98 } : {}}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/30 text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-default transition-all"
        >
          <BookOpen className="h-4 w-4" />
          {answers ? "Answers shown above" : loadingAnswers ? "Loading…" : "View Answers"}
        </motion.button>
      </div>
    </motion.div>
  );
}
