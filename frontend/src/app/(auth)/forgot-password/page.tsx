"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { authApi, getErrorStatus } from "@/lib/api";
import MeshBackground from "@/components/ui/MeshBackground";
import GradientText from "@/components/ui/GradientText";
import { BookOpen, Loader2, AlertCircle, ArrowRight, ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useReducedMotion } from "@/lib/animations";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0D0D14] px-4 py-3 text-sm text-[#F8FAFC] " +
  "placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 " +
  "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-300";

type Step = "email" | "code";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("Check the server console for your reset code");
      setStep("code");
    } catch {
      // interceptor handles 500/network; 4xx fall through silently (no user enumeration)
      setStep("code"); // always advance — same UX regardless
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      toast.success("Password reset! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 400) {
        setError("Invalid or expired code. Please request a new one.");
      } else {
        setError(null);
        // 500/network handled by interceptor toast
      }
    } finally {
      setLoading(false);
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: reducedMotion ? 0 : -12, transition: { duration: 0.2 } },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 bg-[#0A0A0F]">
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-white/5">
          <div className="bg-[#111118] rounded-2xl p-8 space-y-6">

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 mb-2">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black">
                <GradientText>Reset Password</GradientText>
              </h1>
              <p className="text-[#94A3B8] text-sm">
                {step === "email"
                  ? "Enter your email to receive a reset code"
                  : "Enter the code from the server console"}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {(["email", "code"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === s
                      ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                      : s === "code" && step === "code"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-white/10 text-white/30"
                  }`}>
                    {i + 1}
                  </div>
                  {i < 1 && <div className="flex-1 h-px bg-white/10" />}
                </div>
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email-step"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={reducedMotion ? {} : { scale: 1.01 }}
                    whileTap={reducedMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><span>Send Reset Code</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="code-step"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleResetSubmit}
                  className="space-y-4"
                >
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                    <span className="mt-0.5">💻</span>
                    <span>Check the server console (terminal where backend is running) for your 6-digit code.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className={inputCls + " tracking-[0.4em] text-center text-lg font-mono"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={reducedMotion ? {} : { scale: 1.01 }}
                    whileTap={reducedMotion ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                    ) : (
                      <><span>Reset Password</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setError(null); }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors py-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Use a different email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-sm text-[#94A3B8]">
              Remember your password?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
