"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { premiumApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentForm } from "@/components/premium/AssessmentForm";
import { SynthesisForm } from "@/components/premium/SynthesisForm";
import { Skeleton } from "@/components/ui/skeleton";
import GlassCard from "@/components/ui/GlassCard";
import GradientText from "@/components/ui/GradientText";
import { cn } from "@/lib/utils";
import { Lock, Sparkles, Network, Brain, CheckCircle, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { staggerContainer, staggerItem, useReducedMotion } from "@/lib/animations";
import type { UsageResponse } from "@/types";

const PRO_FEATURES = [
  { icon: Brain, text: "AI-Powered Assessment", desc: "Get scored feedback on your answers" },
  { icon: Network, text: "Cross-Chapter Synthesis", desc: "Connect concepts across all chapters" },
  { icon: BarChart3, text: "Usage Dashboard", desc: "Track your AI usage and costs" },
  { icon: Sparkles, text: "Personalized Insights", desc: "Strengths and improvement areas" },
  { icon: TrendingUp, text: "Progress Intelligence", desc: "AI-driven learning recommendations" },
  { icon: Zap, text: "Instant Feedback", desc: "Real-time assessment as you learn" },
];

type Tab = "assessment" | "synthesis" | "usage";

export default function PremiumPage() {
  const { user } = useAuth();
  const isPro = user?.tier === "pro";
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>("assessment");

  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (!isPro || !user) return;
    setUsageLoading(true);
    premiumApi
      .getUsage(user.sub)
      .then(setUsage)
      .catch(() => {})
      .finally(() => setUsageLoading(false));
  }, [isPro, user]);

  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto space-y-10 py-4">
        {/* Hero lock section */}
        <div className="text-center space-y-6">
          {reducedMotion ? (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 mx-auto">
              <Lock className="w-10 h-10 text-indigo-400" />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 mx-auto"
            >
              <Lock className="w-10 h-10 text-indigo-400" />
            </motion.div>
          )}

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h1 className="text-4xl font-black">
              <GradientText>Unlock Pro AI Features</GradientText>
            </h1>
            <p className="text-[#94A3B8] text-lg max-w-md mx-auto">
              Get AI-powered assessment, cross-chapter synthesis, and personalized insights
              to accelerate your learning.
            </p>
          </motion.div>
        </div>

        {/* Feature list */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {PRO_FEATURES.map((feat) => (
            <motion.div key={feat.text} variants={staggerItem}>
              <GlassCard className="flex items-start gap-4 p-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
                  <feat.icon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <p className="text-sm font-semibold text-[#F8FAFC]">{feat.text}</p>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{feat.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Pro upgrade card */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            <GlassCard className="text-center space-y-6 p-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
                  <Sparkles className="w-3 h-3" />
                  MOST POPULAR
                </div>
                <p className="text-5xl font-black text-[#F8FAFC]">
                  $19.99
                  <span className="text-base font-normal text-[#94A3B8]">/mo</span>
                </p>
                <p className="text-[#94A3B8] text-sm mt-1">Everything in Premium, plus AI superpowers</p>
              </div>

              <ul className="space-y-2 text-left max-w-xs mx-auto">
                {["All 5 chapters + quizzes", "AI Assessment & scoring", "Cross-chapter synthesis", "Usage & cost dashboard", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#F8FAFC]">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <motion.a
                href="/register"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] text-center"
              >
                Upgrade to Pro
              </motion.a>
            </GlassCard>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "assessment", label: "Assessment", icon: Brain },
    { id: "synthesis", label: "Synthesis", icon: Network },
    { id: "usage", label: "Usage", icon: BarChart3 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-black">
          <GradientText>Premium AI Features</GradientText>
        </h1>
        <p className="text-[#94A3B8] text-sm mt-1">
          AI-powered tools to accelerate your learning.
        </p>
      </div>

      {/* Glassmorphism tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "text-white"
                : "text-[#94A3B8] hover:text-white"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/30 to-violet-500/30 border border-indigo-500/40"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <tab.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "assessment" && (
            <GlassCard>
              <AssessmentForm userId={user!.sub} />
            </GlassCard>
          )}

          {activeTab === "synthesis" && (
            <GlassCard>
              <SynthesisForm userId={user!.sub} />
            </GlassCard>
          )}

          {activeTab === "usage" && (
            <GlassCard>
              {usageLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !usage || usage.records.length === 0 ? (
                <div className="py-12 text-center">
                  <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-[#94A3B8] text-sm">No usage records yet.</p>
                  <p className="text-white/30 text-xs mt-1">Try the Assessment or Synthesis features!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <GlassCard className="px-5 py-3 flex-1 text-center">
                      <p className="text-[#94A3B8] text-xs">Total Cost</p>
                      <p className="font-black text-2xl text-[#F8FAFC] mt-1">${usage.total_cost.toFixed(4)}</p>
                    </GlassCard>
                    <GlassCard className="px-5 py-3 flex-1 text-center">
                      <p className="text-[#94A3B8] text-xs">Total Requests</p>
                      <p className="font-black text-2xl text-[#F8FAFC] mt-1">{usage.records.length}</p>
                    </GlassCard>
                  </div>

                  <div className="overflow-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-left font-medium text-xs text-[#94A3B8]">Feature</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-[#94A3B8]">Tokens</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-[#94A3B8]">Cost</th>
                          <th className="px-4 py-3 text-left font-medium text-xs text-[#94A3B8]">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.records.map((r) => (
                          <tr key={r.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-2.5 capitalize text-[#F8FAFC]">{r.feature}</td>
                            <td className="px-4 py-2.5 text-[#94A3B8]">{r.tokens_used.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-[#94A3B8]">${r.cost_usd.toFixed(4)}</td>
                            <td className="px-4 py-2.5 text-[#94A3B8]">
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
