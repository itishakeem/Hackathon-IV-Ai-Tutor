"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { premiumApi } from "@/lib/api";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import type { AssessmentResponse, FormState } from "@/types";

interface AssessmentFormProps {
  userId: string;
}

const CHAPTERS = [
  { id: "chapter-01", label: "Chapter 1: Introduction to AI Agents" },
  { id: "chapter-02", label: "Chapter 2: Building Your First Agent" },
  { id: "chapter-03", label: "Chapter 3: Tool Use & Function Calling" },
  { id: "chapter-04", label: "Chapter 4: Multi-Agent Systems" },
  { id: "chapter-05", label: "Chapter 5: Production & Evaluation" },
];

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0D0D14] px-4 py-3 text-sm text-[#F8FAFC] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all";

export function AssessmentForm({ userId }: AssessmentFormProps) {
  const [chapterId, setChapterId] = useState(CHAPTERS[0]!.id);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [formState, setFormState] = useState<FormState>({ submitting: false, error: null });
  const [result, setResult] = useState<AssessmentResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim().length < 10) {
      setFormState({ submitting: false, error: "Answer must be at least 10 characters." });
      return;
    }
    setFormState({ submitting: true, error: null });
    setResult(null);
    try {
      const data = await premiumApi.assess({ chapter_id: chapterId, question, student_answer: answer, user_id: userId });
      setResult(data);
    } catch (err: unknown) {
      let message = "Assessment failed. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          toast.error("Daily limit reached — resets at midnight UTC");
          message = "Rate limit reached.";
        } else if (err.response?.status === 503) {
          toast.error("AI service temporarily unavailable");
          message = "AI service unavailable.";
        }
      }
      setFormState({ submitting: false, error: message });
      return;
    }
    setFormState({ submitting: false, error: null });
  }

  const scoreColor = result
    ? result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-amber-400" : "text-red-400"
    : "";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className={inputCls}
          >
            {CHAPTERS.map((ch) => (
              <option key={ch.id} value={ch.id} className="bg-[#0D0D14]">
                {ch.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Question</label>
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What is the difference between a tool and an agent?"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Your Answer</label>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            minLength={10}
            placeholder="Write your answer here (min 10 characters)…"
            className={`${inputCls} resize-y`}
          />
          <p className="text-xs text-white/30 text-right">{answer.length} / 10 min</p>
        </div>

        {formState.error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {formState.error}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={formState.submitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          {formState.submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Assessing…</>
          ) : (
            <><span>Submit for Assessment</span><ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 to-violet-500/40">
              <GlassCard className="space-y-5">
                {/* Score header */}
                <div className="flex items-center gap-4">
                  <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Score / 100</p>
                    <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      result.score >= 60
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                      {result.score >= 60 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {result.score >= 60 ? "Passed" : "Needs Improvement"}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden ml-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        result.score >= 80 ? "bg-emerald-500" : result.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Feedback</p>
                  <p className="text-sm text-[#F8FAFC] leading-relaxed">{result.feedback}</p>
                </div>

                {result.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#F8FAFC]">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Areas to Improve</p>
                    <ul className="space-y-1.5">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#F8FAFC]">
                          <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.suggested_reading && (
                  <p className="text-xs text-[#94A3B8] border-t border-white/10 pt-4">
                    Suggested reading: {result.suggested_reading}
                  </p>
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
