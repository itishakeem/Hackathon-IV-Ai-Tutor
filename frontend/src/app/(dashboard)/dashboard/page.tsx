"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Flame,
  Target,
  BookOpen,
  CheckCircle,
  BookMarked,
  Award,
} from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import { useChapters } from "@/hooks/useChapters";
import { useAuth } from "@/hooks/useAuth";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import PageTransition from "@/components/ui/PageTransition";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem, cardHover, useReducedMotion } from "@/lib/animations";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MOTIVATIONAL_QUOTES = [
  "Every expert was once a beginner.",
  "The best investment is in yourself.",
  "Progress over perfection, always.",
  "Build things that matter.",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: progress, loading, error, refetch } = useProgress();
  const { data: chapters } = useChapters();
  const reducedMotion = useReducedMotion();

  const greeting = getGreeting();
  const dateString = getDateString();
  const quote = MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length];

  const averageScore =
    progress && progress.quiz_scores.length > 0
      ? Math.round(
          progress.quiz_scores.reduce((s, q) => s + q.score, 0) /
            progress.quiz_scores.length
        )
      : 0;

  const chaptersLeft = (progress?.total_chapters ?? 5) - (progress?.completed_chapters.length ?? 0);

  const completedChapters = (progress?.completed_chapters ?? []).map((id) => {
    const ch = chapters?.find((c) => c.id === id);
    return ch?.title ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });

  const nextChapter = chapters?.find((c) => !progress?.completed_chapters.includes(c.id));

  const recentActivity = [
    ...(progress?.completed_chapters.slice(-3) ?? []).map((id) => ({
      type: "chapter" as const,
      label: `Completed: ${id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      time: "Recently",
      Icon: CheckCircle,
      color: "text-emerald-400",
    })),
    ...(progress?.quiz_scores.slice(-3) ?? []).map((s) => ({
      type: "quiz" as const,
      label: `Quiz: ${s.chapter_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — ${s.score}%`,
      time: new Date(s.attempted_at).toLocaleDateString(),
      Icon: Award,
      color: s.score >= 80 ? "text-emerald-400" : s.score >= 50 ? "text-amber-400" : "text-red-400",
    })),
  ].slice(0, 5);

  const KPI_CARDS = [
    {
      label: "Overall Progress",
      value: progress?.completion_percentage ?? 0,
      suffix: "%",
      Icon: TrendingUp,
      color: "from-indigo-600 to-indigo-400",
      glow: "shadow-[0_0_20px_rgba(79,70,229,0.3)]",
      trend: (progress?.completion_percentage ?? 0) > 0 ? "up" : null,
    },
    {
      label: "Current Streak",
      value: progress?.streak ?? 0,
      suffix: " days",
      Icon: Flame,
      color: "from-orange-600 to-orange-400",
      glow: "shadow-[0_0_20px_rgba(234,88,12,0.3)]",
      trend: (progress?.streak ?? 0) > 0 ? "up" : null,
    },
    {
      label: "Avg Quiz Score",
      value: averageScore,
      suffix: "%",
      Icon: Target,
      color: "from-cyan-600 to-cyan-400",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
      trend: averageScore >= 70 ? "up" : averageScore > 0 ? "down" : null,
    },
    {
      label: "Chapters Left",
      value: chaptersLeft,
      suffix: "",
      Icon: BookOpen,
      color: "from-violet-600 to-violet-400",
      glow: "shadow-[0_0_20px_rgba(124,58,237,0.3)]",
      trend: null,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-white/40">Failed to load your dashboard data.</p>
        <GradientButton variant="secondary" onClick={refetch}>Try Again</GradientButton>
      </div>
    );
  }

  return (
    <PageTransition includeMesh={false} className="p-6 space-y-8 min-h-screen bg-[#0A0A0F]">

      {/* Welcome Header */}
      <section className="space-y-1">
        <motion.div
          variants={staggerContainer}
          initial={reducedMotion ? "visible" : "hidden"}
          animate="visible"
        >
          <motion.h1 variants={staggerItem} className="text-3xl font-bold text-white">
            {greeting}, <GradientText>{user?.email?.split("@")[0] ?? "Developer"}</GradientText> 👋
          </motion.h1>
          <motion.p variants={staggerItem} className="text-white/40 text-sm mt-1">
            {dateString} · {quote}
          </motion.p>
        </motion.div>

        <div className="flex gap-3 pt-3">
          <GradientButton href="/learn" size="sm" variant="primary">
            Continue Learning
          </GradientButton>
          {nextChapter && (
            <GradientButton href={`/quiz/${nextChapter.id}`} size="sm" variant="secondary">
              Take Quiz
            </GradientButton>
          )}
        </div>
      </section>

      {/* KPI Cards */}
      <motion.div
        variants={staggerContainer}
        initial={reducedMotion ? "visible" : "hidden"}
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {KPI_CARDS.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={staggerItem}
            whileHover={reducedMotion ? {} : cardHover.whileHover}
            transition={cardHover.transition}
          >
            <GlassCard className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                  kpi.color, kpi.glow
                )}>
                  <kpi.Icon className="w-4 h-4 text-white" />
                </div>
                {kpi.trend && (
                  <span className={cn(
                    "text-xs font-semibold",
                    kpi.trend === "up" ? "text-emerald-400" : "text-red-400"
                  )}>
                    {kpi.trend === "up" ? "↑" : "↓"}
                  </span>
                )}
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  <AnimatedCounter end={kpi.value} suffix={kpi.suffix} />
                </div>
                <p className="text-white/40 text-xs mt-0.5">{kpi.label}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + Continue Learning side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ProgressChart spans 2 cols */}
        <div className="lg:col-span-2">
          <ProgressChart scores={progress?.quiz_scores ?? []} />
        </div>

        {/* Continue Learning Card */}
        <ScrollReveal>
          <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 h-full">
            <GlassCard className="bg-[#0D0D14] h-full flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-400" />
                <GradientText className="text-sm font-semibold">Continue Learning</GradientText>
              </div>

              {nextChapter ? (
                <>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1 text-sm">{nextChapter.title}</p>
                    <p className="text-white/40 text-xs line-clamp-2">{nextChapter.description}</p>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Progress</span>
                      <span>{progress?.completion_percentage ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress?.completion_percentage ?? 0}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      />
                    </div>
                  </div>
                  <p className="text-white/30 text-xs">~15 min to complete</p>
                  <GradientButton href={`/learn/${nextChapter.id}`} size="sm" variant="primary">
                    Continue
                  </GradientButton>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/30 text-sm text-center">
                    🎉 All chapters complete!
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </ScrollReveal>
      </div>

      {/* Activity Feed + Completed Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <ScrollReveal>
          <GlassCard>
            <GradientText className="text-base font-semibold block mb-5">Recent Activity</GradientText>
            {recentActivity.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                className="relative space-y-0"
              >
                {/* Vertical timeline line */}
                <div className="absolute left-[17px] top-3 bottom-3 w-px bg-white/10" />
                {recentActivity.map((act, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-3 py-2.5 relative"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#111118] border border-white/10 flex items-center justify-center shrink-0 z-10">
                      <act.Icon className={cn("w-4 h-4", act.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-white/70 text-sm leading-snug truncate">{act.label}</p>
                      <p className="text-white/30 text-xs mt-0.5">{act.time}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">No activity yet — start learning!</p>
            )}
          </GlassCard>
        </ScrollReveal>

        {/* Completed Chapters */}
        <ScrollReveal delay={0.1}>
          <GlassCard>
            <GradientText className="text-base font-semibold block mb-5">Completed Chapters</GradientText>
            {completedChapters.length > 0 ? (
              <motion.ul
                variants={staggerContainer}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                className="space-y-2"
              >
                {completedChapters.map((title) => (
                  <motion.li
                    key={title}
                    variants={staggerItem}
                    className="flex items-center gap-2.5 text-sm py-2 border-b border-white/5 last:border-0"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white/70">{title}</span>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <BookOpen className="w-8 h-8 text-white/20" />
                <p className="text-white/30 text-sm">No chapters completed yet.</p>
                <Link href="/learn" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
                  Start Chapter 1 →
                </Link>
              </div>
            )}
          </GlassCard>
        </ScrollReveal>
      </div>

    </PageTransition>
  );
}
