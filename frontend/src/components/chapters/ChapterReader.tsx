"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import toast from "react-hot-toast";
import { progressApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { ChapterContent } from "@/types";

interface ChapterReaderProps {
  chapter: ChapterContent;
  userId: string;
  onComplete?: () => void;
}

function extractHeadings(markdown: string): { id: string; text: string }[] {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[1]!.trim();
    // Replicate rehype-slug's id generation: lowercase, replace spaces with dashes
    const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    headings.push({ id, text });
  }
  return headings;
}

export function ChapterReader({ chapter, userId, onComplete }: ChapterReaderProps) {
  const headings = useMemo(() => extractHeadings(chapter.content), [chapter.content]);

  async function handleMarkComplete() {
    try {
      await progressApi.markChapterComplete(userId, chapter.id);
      toast.success("Chapter marked complete!");
      onComplete?.();
    } catch {
      toast.error("Failed to mark chapter complete.");
    }
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar outline */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-48 flex-shrink-0">
          <div className="sticky top-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              On this page
            </p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="block truncate text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Markdown content */}
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold mb-6">{chapter.title}</h1>
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
          >
            {chapter.content}
          </ReactMarkdown>
        </article>

        {/* Complete button */}
        <div className="mt-10 pt-6 border-t">
          <Button onClick={handleMarkComplete}>
            Mark as Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
