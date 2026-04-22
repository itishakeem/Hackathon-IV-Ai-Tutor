"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/hooks/useAuth";
import MeshBackground from "@/components/ui/MeshBackground";
import GradientText from "@/components/ui/GradientText";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 bg-[#0A0A0F]">
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-white/5">
          <div className="bg-[#111118] rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black">
                <GradientText>Create your account</GradientText>
              </h1>
              <p className="text-[#94A3B8] text-sm">Start learning AI Agent Development today</p>
            </div>

            <RegisterForm />

            <p className="text-center text-sm text-[#94A3B8]">
              Already have an account?{" "}
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
