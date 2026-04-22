"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { chaptersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { ChapterNav as ChapterNavType } from "@/types";

interface ChapterNavProps {
  chapterId: string;
}

export function ChapterNav({ chapterId }: ChapterNavProps) {
  const [prev, setPrev] = useState<ChapterNavType | null>(null);
  const [next, setNext] = useState<ChapterNavType | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      chaptersApi.getPrev(chapterId).catch(() => null),
      chaptersApi.getNext(chapterId).catch(() => null),
    ]).then(([prevData, nextData]) => {
      setPrev(prevData ?? null);
      setNext(nextData ?? null);
    });
  }, [chapterId]);

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
      <Button
        variant="outline"
        disabled={!prev}
        onClick={() => prev && router.push(`/learn/${prev.id}`)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        {prev ? prev.title : "Previous"}
      </Button>

      <Button
        variant="outline"
        onClick={() => router.push(`/quiz/${chapterId}`)}
        className="gap-1"
      >
        <HelpCircle className="h-4 w-4" />
        Take Quiz
      </Button>

      <Button
        variant="outline"
        disabled={!next}
        onClick={() => next && router.push(`/learn/${next.id}`)}
        className="gap-1"
      >
        {next ? next.title : "Next"}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
