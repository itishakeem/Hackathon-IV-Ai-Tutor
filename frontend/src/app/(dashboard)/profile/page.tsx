"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, AlertTriangle, Clock, Camera, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useChapters } from "@/hooks/useChapters";
import { authApi, progressApi } from "@/lib/api";
import PageTransition from "@/components/ui/PageTransition";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem, useReducedMotion } from "@/lib/animations";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  free: {
    label: "Free",
    className: "border-slate-500 text-slate-400 bg-slate-500/10",
  },
  premium: {
    label: "Premium",
    className: "border-indigo-500 text-indigo-400 bg-indigo-500/10",
  },
  pro: {
    label: "Pro",
    className: "border-amber-500 text-amber-400 bg-amber-500/10",
  },
  team: {
    label: "Team",
    className: "border-cyan-500 text-cyan-400 bg-cyan-500/10",
  },
};

interface Achievement {
  emoji: string;
  title: string;
  desc: string;
  unlockCondition: string;
  earned: (args: { completedCount: number; quizScores: number[]; streak: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    emoji: "🎯",
    title: "First Chapter",
    desc: "Completed your first chapter",
    unlockCondition: "Complete chapter 1",
    earned: ({ completedCount }) => completedCount >= 1,
  },
  {
    emoji: "📚",
    title: "Bookworm",
    desc: "Completed 3 chapters",
    unlockCondition: "Complete 3 chapters",
    earned: ({ completedCount }) => completedCount >= 3,
  },
  {
    emoji: "🏆",
    title: "Course Master",
    desc: "Completed all 5 chapters",
    unlockCondition: "Complete all chapters",
    earned: ({ completedCount }) => completedCount >= 5,
  },
  {
    emoji: "⚡",
    title: "Quick Learner",
    desc: "Scored high on your first quiz",
    unlockCondition: "Score 80%+ on any quiz",
    earned: ({ quizScores }) => quizScores.some((s) => s >= 80),
  },
  {
    emoji: "💯",
    title: "Perfect Score",
    desc: "Achieved 100% on a quiz",
    unlockCondition: "Score 100% on any quiz",
    earned: ({ quizScores }) => quizScores.some((s) => s === 100),
  },
  {
    emoji: "🔥",
    title: "Week Streak",
    desc: "Maintained a 7-day streak",
    unlockCondition: "Keep a 7-day learning streak",
    earned: ({ streak }) => streak >= 7,
  },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
  if (score >= 50) return "text-amber-400 border-amber-500/50 bg-amber-500/10";
  return "text-red-400 border-red-500/50 bg-red-500/10";
}

function getProgressStatus(pct: number): { label: string; className: string } {
  if (pct === 100) return { label: "Completed", className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" };
  if (pct > 0) return { label: "In Progress", className: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" };
  return { label: "Not Started", className: "text-white/30 border-white/10 bg-white/5" };
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm">
              <GlassCard className="border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Reset Progress?</h3>
                    <p className="text-white/40 text-xs">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-6">
                  All your completed chapters, quiz scores, and streak data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                  >
                    Yes, Reset
                  </button>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Achievement Tooltip
// ---------------------------------------------------------------------------
function AchievementCard({
  achievement,
  earned,
}: {
  achievement: Achievement;
  earned: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {earned ? (
        <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <GlassCard className="bg-[#0D0D14] text-center py-6 px-4 flex flex-col items-center gap-2">
            <span className="text-3xl">{achievement.emoji}</span>
            <p className="text-white font-semibold text-xs leading-tight">{achievement.title}</p>
          </GlassCard>
        </div>
      ) : (
        <GlassCard className="text-center py-6 px-4 flex flex-col items-center gap-2 grayscale opacity-40 relative overflow-hidden">
          <span className="text-3xl">{achievement.emoji}</span>
          <p className="text-white/70 font-semibold text-xs leading-tight">{achievement.title}</p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Lock className="w-5 h-5 text-white/50" />
          </div>
        </GlassCard>
      )}

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? {} : { opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-40 pointer-events-none"
          >
            <div className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <p className="text-white text-xs font-semibold mb-0.5">{achievement.title}</p>
              <p className="text-white/40 text-xs">
                {earned ? achievement.desc : `🔒 ${achievement.unlockCondition}`}
              </p>
            </div>
            <div className="w-2 h-2 bg-[#111118] border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth();
  const { data: progress, loading, refetch: refetchProgress } = useProgress();
  const { data: chapters } = useChapters();
  const reducedMotion = useReducedMotion();

  // progress reset
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolved values: profile (DB) > JWT > email prefix
  const displayName = profile?.name || user?.name || user?.email?.split("@")[0] || "Developer";
  const displayAvatar = avatarPreview || profile?.avatar || null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const tier = (profile?.tier ?? user?.tier ?? "free") as string;
  const tierBadge = TIER_BADGE[tier] ?? TIER_BADGE["free"]!;

  const completedCount = progress?.completed_chapters.length ?? 0;
  const streak = progress?.streak ?? 0;
  const quizScores = (progress?.quiz_scores ?? []).map((s) => Math.min(s.score, 100));
  const avgScore =
    quizScores.length > 0
      ? Math.min(Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length), 100)
      : 0;

  const uniqueDays = new Set(
    (progress?.quiz_scores ?? []).map((s) => new Date(s.attempted_at).toDateString())
  ).size;

  const memberSince = "April 2026";
  const achArgs = { completedCount, quizScores, streak };

  function startEditing() {
    setEditName(profile?.name || user?.name || "");
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditName("");
    setAvatarPreview(null);
    setAvatarFile(null);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authApi.updateMe(
        editName.trim() || null,
        avatarFile
      );
      setProfile(updated);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!user) return;
    setConfirmOpen(false);
    setResetting(true);
    try {
      await progressApi.reset(user.sub);
      toast.success("Progress reset successfully");
      refetchProgress();
    } catch {
      toast.error("Failed to reset progress");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <PageTransition includeMesh={false} className="p-6 space-y-8 min-h-screen bg-[#0A0A0F]">
      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* ================================================================
          PROFILE HEADER
      ================================================================ */}
      <GlassCard className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar with gradient ring + camera overlay in edit mode */}
        <div className="relative group shrink-0">
          <div className="p-[3px] bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <div className="w-20 h-20 rounded-full bg-[#0D0D14] overflow-hidden flex items-center justify-center">
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {initials}
                </span>
              )}
            </div>
          </div>
          {isEditing && (
            <label className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-5 h-5 text-white" />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          )}
        </div>

        {/* Info / edit form */}
        <div className="flex-1 text-center sm:text-left space-y-3 w-full">
          {isEditing ? (
            <>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                placeholder="Your name"
                className="w-full sm:max-w-xs rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-white text-lg font-bold focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
              />
              <p className="text-white/30 text-xs">Click the avatar to change photo (max 2MB)</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <p className="text-white/40 text-sm">{user?.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span className={cn("inline-block border px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider", tierBadge.className)}>
                  {tierBadge.label}
                </span>
                <span className="text-white/30 text-xs">Member since {memberSince}</span>
              </div>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </>
          )}
        </div>
      </GlassCard>

      {/* ================================================================
          STATS ROW
      ================================================================ */}
      <motion.div
        variants={staggerContainer}
        initial={reducedMotion ? "visible" : "hidden"}
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Chapters Completed", value: completedCount, suffix: "", icon: "📖" },
          { label: "Current Streak", value: streak, suffix: " days", icon: "🔥" },
          { label: "Avg Quiz Score", value: avgScore, suffix: "%", icon: "🎯" },
          { label: "Days Active", value: uniqueDays, suffix: "", icon: "📅" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <GlassCard className="text-center py-6 flex flex-col items-center gap-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className="text-3xl font-black text-white">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-white/40 text-xs">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ================================================================
          LEARNING PROGRESS
      ================================================================ */}
      <ScrollReveal>
        <GlassCard>
          <GradientText className="text-lg font-bold block mb-5">Your Progress</GradientText>

          {chapters && chapters.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial={reducedMotion ? "visible" : "hidden"}
              animate="visible"
              className="space-y-4"
            >
              {chapters.map((ch) => {
                const isCompleted = progress?.completed_chapters.includes(ch.id);
                const hasQuiz = progress?.quiz_scores.some((s) => s.chapter_id === ch.id);
                const pct = isCompleted ? 100 : hasQuiz ? 50 : 0;
                const status = getProgressStatus(pct);

                return (
                  <motion.div key={ch.id} variants={staggerItem}>
                    <div className="flex items-center justify-between mb-1.5 gap-3">
                      <p className="text-white/80 text-sm font-medium truncate flex-1">{ch.title}</p>
                      <span
                        className={cn(
                          "shrink-0 text-xs border px-2 py-0.5 rounded-full font-semibold",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                      <span className="text-white/40 text-xs shrink-0 w-8 text-right">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">Loading chapters…</p>
          )}
        </GlassCard>
      </ScrollReveal>

      {/* ================================================================
          QUIZ HISTORY TIMELINE
      ================================================================ */}
      <ScrollReveal delay={0.05}>
        <GlassCard>
          <GradientText className="text-lg font-bold block mb-5">Quiz History</GradientText>

          {progress && progress.quiz_scores.length > 0 ? (
            <div className="relative pl-6 border-l border-indigo-600/30 space-y-0 ml-2">
              <motion.div
                variants={staggerContainer}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
              >
                {[...progress.quiz_scores].reverse().map((score, i) => {
                  const chTitle =
                    chapters?.find((c) => c.id === score.chapter_id)?.title ??
                    score.chapter_id
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                  const date = new Date(score.attempted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <motion.div
                      key={i}
                      variants={staggerItem}
                      className="relative py-3 flex items-start gap-4"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[25px] top-4 w-3 h-3 rounded-full bg-indigo-600 border-2 border-[#0A0A0F]" />
                      <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-white/80 text-sm font-medium">{chTitle}</p>
                          <p className="text-white/30 text-xs mt-0.5">{date}</p>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-bold border px-2.5 py-0.5 rounded-full",
                            getScoreColor(Math.min(score.score, 100))
                          )}
                        >
                          {Math.min(score.score, 100).toFixed(1)}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Clock className="w-8 h-8 text-white/20" />
              <p className="text-white/30 text-sm">No quizzes taken yet.</p>
            </div>
          )}
        </GlassCard>
      </ScrollReveal>

      {/* ================================================================
          ACHIEVEMENTS
      ================================================================ */}
      <ScrollReveal delay={0.1}>
        <div>
          <GradientText className="text-lg font-bold block mb-5">Achievements</GradientText>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ACHIEVEMENTS.map((ach) => (
              <AchievementCard
                key={ach.title}
                achievement={ach}
                earned={ach.earned(achArgs)}
              />
            ))}
          </div>
          <p className="text-white/20 text-xs mt-4 text-center">
            {ACHIEVEMENTS.filter((a) => a.earned(achArgs)).length} / {ACHIEVEMENTS.length} earned
          </p>
        </div>
      </ScrollReveal>

      {/* ================================================================
          DANGER ZONE
      ================================================================ */}
      <ScrollReveal delay={0.15}>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-red-400 font-bold">Danger Zone</h3>
          </div>
          <p className="text-white/40 text-sm">
            These actions are permanent and cannot be undone. Proceed with caution.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={resetting}
              className="px-5 py-2.5 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? "Resetting…" : "Reset Progress"}
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Spacer */}
      <div className="h-8" />
    </PageTransition>
  );
}
