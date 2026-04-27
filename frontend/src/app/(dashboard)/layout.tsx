"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, profile, setProfile } = useAuth();
  const router = useRouter();

  // Fetch fresh profile from DB on first authenticated load.
  // This ensures name/avatar are up-to-date even if the JWT was issued
  // before the name column existed (all pre-migration accounts).
  useEffect(() => {
    if (isAuthenticated && !profile) {
      authApi.getMe().then(setProfile).catch(() => {});
    }
  }, [isAuthenticated, profile, setProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0">
        <Sidebar />
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
