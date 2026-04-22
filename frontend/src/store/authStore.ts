import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, JwtPayload } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, user: JwtPayload) =>
        set({ token, user, isAuthenticated: true }),

      clearAuth: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);
