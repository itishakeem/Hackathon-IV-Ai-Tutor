"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi, getErrorStatus } from "@/lib/api";
import { decodeJwt } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import type { FormState } from "@/types";

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0D0D14] px-4 py-3 text-sm text-[#F8FAFC] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-300";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formState, setFormState] = useState<FormState>({ submitting: false, error: null });
  const { setAuth } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setFormState({ submitting: false, error: "Passwords do not match." });
      return;
    }
    setFormState({ submitting: true, error: null });
    try {
      const { access_token } = await authApi.register(email, password);
      const user = decodeJwt(access_token);
      setAuth(access_token, user);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 409) {
        setFormState({ submitting: false, error: "Email already in use." });
      } else if (status === 422) {
        setFormState({ submitting: false, error: "Please enter a valid email and password." });
      } else {
        setFormState({ submitting: false, error: null });
        // 500/503/network errors handled by axios interceptor toast
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="reg-confirm" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={inputCls}
        />
      </div>
      {formState.error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {formState.error}
        </div>
      )}
      <motion.button
        type="submit"
        disabled={formState.submitting}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
      >
        {formState.submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
        ) : (
          <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
        )}
      </motion.button>
    </form>
  );
}
