"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import GradientText from "@/components/ui/GradientText";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/premium", label: "Premium", highlight: true },
];

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  free:    { label: "Free",    cls: "text-slate-400 border-slate-500/50 bg-slate-500/10" },
  premium: { label: "Premium", cls: "text-indigo-400 border-indigo-500/50 bg-indigo-500/10" },
  pro:     { label: "Pro",     cls: "text-amber-400 border-amber-500/50 bg-amber-500/10" },
  team:    { label: "Team",    cls: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10" },
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    setDropdownOpen(false);
    router.push("/login");
  }

  const tier = user?.tier ?? "free";
  const badge = TIER_BADGE[tier] ?? TIER_BADGE.free!;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0A0A0F]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-300">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <GradientText className="text-lg font-bold">Course Companion</GradientText>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive ? "text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {link.highlight && !isActive ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent font-semibold">
                      {link.label}
                    </span>
                  </span>
                ) : isActive ? (
                  <GradientText className="text-sm font-semibold">{link.label}</GradientText>
                ) : (
                  link.label
                )}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 md:hidden" />

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <div className="relative">
              <motion.button
                onClick={() => setDropdownOpen((o) => !o)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all duration-200"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                  {(user.email[0] ?? "U").toUpperCase()}
                </div>
                <span className="hidden sm:block max-w-[110px] truncate text-sm text-white/80">
                  {user.email.split("@")[0]}
                </span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-white/40 transition-transform duration-200",
                  dropdownOpen && "rotate-180"
                )} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#111118]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden"
                  >
                    <div className="px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
                      <p className="text-xs text-white/40 mb-1">Signed in as</p>
                      <p className="text-sm text-white font-medium truncate">{user.email}</p>
                      <span className={cn(
                        "inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider",
                        badge.cls
                      )}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                          <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
                        </div>
                        Dashboard
                      </Link>
                    </div>

                    <div className="border-t border-white/10 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <LogOut className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {dropdownOpen && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Sign in
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)] transition-all duration-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden ml-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/10 transition-all duration-200"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>

            <SheetContent side="left" className="w-72 bg-[#0A0A0F] border-r border-white/10 p-0">
              <div className="flex flex-col h-full">

                {/* Drawer header */}
                <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 text-white" />
                    </div>
                    <GradientText className="text-base font-bold">Course Companion</GradientText>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
                  {NAV_LINKS.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white border border-indigo-500/25"
                            : link.highlight
                            ? "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/8"
                            : "text-white/55 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {link.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {isActive
                          ? <GradientText className="text-sm font-semibold">{link.label}</GradientText>
                          : link.label
                        }
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile auth */}
                <div className="px-3 pb-6 pt-4 border-t border-white/10 space-y-2">
                  {isAuthenticated && user ? (
                    <>
                      <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 border border-white/8">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.35)]">
                          {(user.email[0] ?? "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{user.email.split("@")[0]}</p>
                          <span className={cn(
                            "inline-flex text-xs border px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider mt-0.5",
                            badge.cls
                          )}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/8 transition-all"
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        Profile
                      </Link>

                      <button
                        onClick={() => { setMobileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/15 transition-all"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <LogOut className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_16px_rgba(99,102,241,0.3)] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Get Started
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
