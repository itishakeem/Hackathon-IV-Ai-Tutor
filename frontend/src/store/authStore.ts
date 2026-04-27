import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, JwtPayload, UserProfile } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profile: null,
      isAuthenticated: false,

      setAuth: (token: string, user: JwtPayload) =>
        set({ token, user, isAuthenticated: true }),

      clearAuth: () =>
        set({ token: null, user: null, profile: null, isAuthenticated: false }),

      setProfile: (profile: UserProfile) =>
        set({ profile }),

      updateProfile: (updates: Partial<UserProfile>) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
    }
  )
);
