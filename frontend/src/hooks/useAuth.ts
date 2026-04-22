"use client";

import { useAuthStore } from "@/store/authStore";

/**
 * Client-side hook for reading and managing auth state.
 * Re-hydrates automatically from localStorage via Zustand persist.
 */
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return { token, user, isAuthenticated, setAuth, clearAuth };
}
