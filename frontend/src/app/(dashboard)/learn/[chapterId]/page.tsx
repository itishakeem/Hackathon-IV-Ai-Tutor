"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { chaptersApi, accessApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { ChapterReader } from "@/components/chapters/ChapterReader";
import { ChapterNav } from "@/components/chapters/ChapterNav";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ChapterContent } from "@/types";

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { user } = useAuth();
  const { refetch: refetchChapters } = useChapters();

  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      chaptersApi.getOne(chapterId),
      accessApi.check(chapterId),
    ])
      .then(([chapterData, access]) => {
        setChapter(chapterData);
        setHasAccess(access.allowed);
        if (!access.allowed) {
          setUpgradeOpen(true);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load chapter");
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          {error.includes("404") ? "Chapter not found." : "Failed to load chapter."}
        </p>
      </div>
    );
  }

  return (
    <>
      {chapter && hasAccess && (
        <>
          <ChapterReader
            chapter={chapter}
            userId={user?.sub ?? ""}
            onComplete={refetchChapters}
          />
          <ChapterNav chapterId={chapterId} />
        </>
      )}

      {/* Upgrade dialog for locked content */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Content</DialogTitle>
            <DialogDescription>
              {chapter?.title ?? "This chapter"} requires a Premium or Pro subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm text-muted-foreground">
              Upgrade to unlock all 5 chapters, advanced quizzes, and AI-powered feedback.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}
            >
              Upgrade Now
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
