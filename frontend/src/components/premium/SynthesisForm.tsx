"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { premiumApi } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import { CheckCircle, ArrowRight, Loader2, AlertCircle, Network } from "lucide-react";
import type { SynthesisResponse, FormState } from "@/types";

interface SynthesisFormProps {
  userId: string;
}

const CHAPTERS = [
  { id: "chapter-01", label: "Ch 1: Introduction to AI Agents" },
  { id: "chapter-02", label: "Ch 2: Building Your First Agent" },
  { id: "chapter-03", label: "Ch 3: Tool Use & Function Calling" },
  { id: "chapter-04", label: "Ch 4: Multi-Agent Systems" },
  { id: "chapter-05", label: "Ch 5: Production & Evaluation" },
];

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0D0D14] px-4 py-3 text-sm text-[#F8FAFC] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all";

export function SynthesisForm({ userId }: SynthesisFormProps) {
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [focusTopic, setFocusTopic] = useState("");
  const [formState, setFormState] = useState<FormState>({ submitting: false, error: null });
  const [result, setResult] = useState<SynthesisResponse | null>(null);

  function toggleChapter(id: string) {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChapters.length < 2) {
      setFormState({ submitting: false, error: "Select at least 2 chapters." });
      return;
    }
    if (selectedChapters.length > 5) {
      setFormState({ submitting: false, error: "Select at most 5 chapters." });
      return;
    }
    setFormState({ submitting: true, error: null });
    setResult(null);
    try {
      const data = await premiumApi.synthesize({
        chapter_ids: selectedChapters,
        focus_topic: focusTopic.trim() || undefined,
        user_id: userId,
      });
      setResult(data);
    } catch (err: unknown) {
      let message = "Synthesis failed. Please try again.";
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              Select Chapters
            </label>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              selectedChapters.length >= 2
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : "text-[#94A3B8] bg-white/5 border-white/10"
            }`}>
              {selectedChapters.length} / 5 selected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {CHAPTERS.map((ch) => {
              const checked = selectedChapters.includes(ch.id);
              return (
                <motion.label
                  key={ch.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                    checked
                      ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked ? "border-indigo-400 bg-indigo-500" : "border-white/30"
                  }`}>
                    {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChapter(ch.id)}
                    className="sr-only"
                  />
                  <span className={`text-sm font-medium ${checked ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
                    {ch.label}
                  </span>
                </motion.label>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
            Focus Topic <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            value={focusTopic}
            onChange={(e) => setFocusTopic(e.target.value)}
            placeholder="e.g. memory management in agents"
            className={inputCls}
          />
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
            <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing…</>
          ) : (
            <><span>Generate Synthesis</span><ArrowRight className="w-4 h-4" /></>
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
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-400" />
                  <p className="text-sm font-bold text-[#F8FAFC]">Synthesis Result</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Synthesis</p>
                  <p className="text-sm text-[#F8FAFC] leading-relaxed">{result.synthesis}</p>
                </div>

                {result.key_connections.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Key Connections</p>
                    <ul className="space-y-1.5">
                      {result.key_connections.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#F8FAFC]">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.knowledge_graph.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Knowledge Graph</p>
                    <div className="space-y-1.5">
                      {result.knowledge_graph.map((edge, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <span className="text-indigo-300">{edge.from}</span>
                          <ArrowRight className="w-3 h-3 text-white/30 shrink-0" />
                          <span className="text-violet-300">{edge.to}</span>
                          <span className="text-[#94A3B8] ml-auto">({edge.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommended_next && (
                  <p className="text-xs text-[#94A3B8] border-t border-white/10 pt-4">
                    Recommended next: {result.recommended_next}
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
