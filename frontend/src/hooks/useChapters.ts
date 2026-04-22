"use client";

import { useEffect, useState, useCallback } from "react";
import { chaptersApi } from "@/lib/api";
import type { ApiState, ChapterMeta } from "@/types";

export function useChapters(): ApiState<ChapterMeta[]> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<ChapterMeta[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(() => {
    setState({ data: null, loading: true, error: null });
    chaptersApi
      .getAll()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load chapters";
        setState({ data: null, loading: false, error: message });
      });
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
