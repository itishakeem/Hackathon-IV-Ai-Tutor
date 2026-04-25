"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { ChapterMeta } from "@/types";
import { cn } from "@/lib/utils";

interface ChapterListProps {
  chapters: ChapterMeta[];
  userTier: string;
}

export function ChapterListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

export function ChapterList({ chapters, userTier }: ChapterListProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Use the locked flag from the backend (authoritative); fall back to tier check.
  const isLocked = (chapter: ChapterMeta) =>
    chapter.locked === true || (userTier === "free" && (chapter.order ?? 0) >= 4);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter, i) => {
          const locked = isLocked(chapter);
          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              className="h-full"
            >
              {locked ? (
                <button
                  className="w-full h-full text-left"
                  onClick={() => setUpgradeOpen(true)}
                >
                  <ChapterCard chapter={chapter} locked />
                </button>
              ) : (
                <Link href={`/learn/${chapter.id}`} className="block h-full">
                  <ChapterCard chapter={chapter} locked={false} />
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="bg-[#111118] border border-white/10 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-[#F8FAFC]">Premium Content</DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Chapters 4 and 5 require a Premium or Pro subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm text-[#94A3B8]">
              Upgrade to unlock all 5 chapters, advanced quizzes, and AI-powered feedback.
            </p>
            <Link
              href="/register"
              onClick={() => setUpgradeOpen(false)}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-all"
            >
              Upgrade Now
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChapterCard({
  chapter,
  locked,
}: {
  chapter: ChapterMeta;
  locked: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 h-full",
        "hover:bg-white/[0.08] hover:border-white/20 transition-colors duration-300",
        locked && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-300">{chapter.order}</span>
          </div>
          <p className="text-sm font-semibold text-[#F8FAFC] leading-snug">{chapter.title}</p>
        </div>
        {locked ? (
          <Lock className="h-4 w-4 shrink-0 text-[#94A3B8] mt-0.5" />
        ) : chapter.is_completed ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        ) : (
          <BookOpen className="h-4 w-4 shrink-0 text-white/20 mt-0.5" />
        )}
      </div>

      <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3">{chapter.description}</p>

      {chapter.is_completed && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      )}
      {locked && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Lock className="w-3 h-3" /> Premium
        </span>
      )}
    </motion.div>
  );
}
