"use client";

import { motion } from "framer-motion";
import { useChapters } from "@/hooks/useChapters";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { ChapterList, ChapterListSkeleton } from "@/components/chapters/ChapterList";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { BookOpen, RefreshCw } from "lucide-react";
import type { ChapterMeta } from "@/types";

export default function LearnPage() {
  const { user } = useAuth();
  const { data: chapters, loading: chaptersLoading, error: chaptersError, refetch } = useChapters();
  const { data: progress, loading: progressLoading } = useProgress();

  const isLoading = chaptersLoading || progressLoading;

  const enrichedChapters: ChapterMeta[] = (chapters ?? []).map((ch) => ({
    ...ch,
    is_completed: progress?.completed_chapters.includes(ch.id) ?? false,
  }));

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-3xl font-black">
          <GradientText>Course Chapters</GradientText>
        </h1>
        <p className="text-[#94A3B8] text-sm mt-1">
          {progress
            ? `${progress.completed_chapters.length} of ${progress.total_chapters} chapters completed`
            : "5 chapters total"}
        </p>
      </motion.div>

      {isLoading && (
        <motion.div variants={staggerItem}>
          <ChapterListSkeleton />
        </motion.div>
      )}

      {chaptersError && (
        <motion.div variants={staggerItem}>
          <GlassCard className="flex flex-col items-center gap-4 py-16 text-center">
            <BookOpen className="w-10 h-10 text-white/20" />
            <p className="text-[#94A3B8]">Failed to load chapters.</p>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-sm text-[#94A3B8] hover:text-white hover:border-white/40 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </GlassCard>
        </motion.div>
      )}

      {!isLoading && !chaptersError && (
        <motion.div variants={staggerItem}>
          <ChapterList
            chapters={enrichedChapters}
            userTier={user?.tier ?? "free"}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
