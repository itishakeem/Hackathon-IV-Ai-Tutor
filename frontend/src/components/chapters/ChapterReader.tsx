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
        <article className={[
          "prose prose-invert max-w-none",
          "prose-headings:text-white prose-headings:font-bold",
          "prose-h1:text-3xl prose-h1:mb-6",
          "prose-h1:bg-gradient-to-r prose-h1:from-indigo-400 prose-h1:to-violet-400",
          "prose-h1:bg-clip-text prose-h1:text-transparent",
          "prose-h2:text-2xl prose-h2:text-indigo-300 prose-h2:mt-8 prose-h2:mb-4",
          "prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2",
          "prose-h3:text-xl prose-h3:text-violet-300",
          "prose-p:text-slate-300 prose-p:leading-relaxed",
          "prose-strong:text-white prose-strong:font-semibold",
          "prose-code:text-cyan-300 prose-code:bg-white/10",
          "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-[#111118] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl",
          "prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-500/10",
          "prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:text-indigo-200",
          "prose-table:border-collapse",
          "prose-th:bg-white/10 prose-th:text-white prose-th:px-4 prose-th:py-2",
          "prose-td:border prose-td:border-white/10 prose-td:px-4 prose-td:py-2 prose-td:text-slate-300",
          "prose-li:text-slate-300",
          "prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300",
        ].join(" ")}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
          >
            {chapter.content}
          </ReactMarkdown>
        </article>

        {/* Complete button */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <button
            onClick={handleMarkComplete}
            className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}
