"use client";

import { useEffect, useState, useCallback } from "react";
import { progressApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { ApiState, ProgressResponse } from "@/types";

export function useProgress(): ApiState<ProgressResponse> & { refetch: () => void } {
  const { user } = useAuth();
  const [state, setState] = useState<ApiState<ProgressResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(() => {
    if (!user) return;
    setState({ data: null, loading: true, error: null });
    progressApi
      .get(user.sub)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch(() => {
        setState({ data: null, loading: false, error: "Unable to load progress" });
      });
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
