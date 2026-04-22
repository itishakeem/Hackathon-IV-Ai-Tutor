"use client";

import { motion } from "framer-motion";
import { BookOpen, Code2, Rocket, Target } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { staggerContainer, staggerItem, useReducedMotion } from "@/lib/animations";
import { cn } from "@/lib/utils";

const MISSION_CARDS = [
  {
    emoji: "🎯",
    Icon: BookOpen,
    title: "Learn",
    desc: "Master AI Agent concepts step by step with structured lessons and interactive quizzes designed for developers.",
    color: "from-indigo-600 to-indigo-400",
    glow: "shadow-[0_0_20px_rgba(79,70,229,0.3)]",
  },
  {
    emoji: "🔨",
    Icon: Code2,
    title: "Build",
    desc: "Create production-ready agents with the Claude SDK, MCP servers, and real-world tooling patterns.",
    color: "from-violet-600 to-violet-400",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.3)]",
  },
  {
    emoji: "🚀",
    Icon: Rocket,
    title: "Deploy",
    desc: "Ship to Fly.io with cloud-native architecture, observability, and CI/CD — fully production grade.",
    color: "from-cyan-600 to-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
  },
];

const TECH_STACK = [
  { name: "Next.js 16", sub: "Frontend framework", color: "#F8FAFC" },
  { name: "FastAPI", sub: "Python backend", color: "#06B6D4" },
  { name: "Claude AI", sub: "Intelligence layer", color: "#A78BFA" },
  { name: "Cloudflare", sub: "Edge CDN", color: "#F59E0B" },
  { name: "Fly.io", sub: "Deployment", color: "#818CF8" },
  { name: "PostgreSQL", sub: "Database", color: "#34D399" },
];

const STATS = [
  { end: 18000, suffix: "+", label: "Developers Enrolled" },
  { end: 168, suffix: " hrs", label: "Weekly Availability" },
  { end: 99, suffix: "%", label: "Uptime SLA" },
  { end: 5, suffix: "", label: "Chapters" },
];

export default function AboutPage() {
  const reducedMotion = useReducedMotion();

  return (
    <PageTransition>
      {/* ================================================================
          HERO
      ================================================================ */}
      <section className="relative min-h-[60vh] flex items-center py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 w-full text-center">
          <ScrollReveal>
            <span className="inline-block px-4 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/5 text-violet-300 text-sm font-medium mb-6">
              Our Mission
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <GradientText>Built for the AI Era</GradientText>
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Course Companion FTE is the world&apos;s first AI-native learning platform designed
              specifically for developers who want to master building AI agents — with an AI tutor
              that&apos;s available around the clock, infinitely patient, and always up to date.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          MISSION CARDS
      ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <motion.div
          variants={staggerContainer}
          initial={reducedMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {MISSION_CARDS.map((card) => (
            <motion.div key={card.title} variants={staggerItem}>
              <GlassCard hover className="h-full flex flex-col gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                  card.color, card.glow
                )}>
                  <card.Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{card.emoji}</span>
                    <h3 className="text-white font-bold text-xl">{card.title}</h3>
                  </div>
                  <p className="text-white/50 leading-relaxed">{card.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ================================================================
          TECH STACK
      ================================================================ */}
      <section className="bg-[#111118]/50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <GradientText className="text-4xl font-bold block mb-3">Powered By</GradientText>
            <p className="text-white/50">Best-in-class tools, assembled for AI development.</p>
          </ScrollReveal>

          <motion.div
            variants={staggerContainer}
            initial={reducedMotion ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {TECH_STACK.map((tech) => (
              <motion.div key={tech.name} variants={staggerItem}>
                <motion.div
                  whileHover={reducedMotion ? {} : {
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <GlassCard className="text-center py-5 px-3 flex flex-col items-center gap-2 cursor-default">
                    <span
                      className="text-base font-bold"
                      style={{ color: tech.color }}
                    >
                      {tech.name}
                    </span>
                    <span className="text-xs text-white/40">{tech.sub}</span>
                  </GlassCard>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          STATS
      ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <ScrollReveal className="text-center mb-12">
          <GradientText className="text-4xl font-bold block mb-3">By the Numbers</GradientText>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <GlassCard className="text-center py-8">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </div>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ================================================================
          VISION STATEMENT
      ================================================================ */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <ScrollReveal>
          <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/50 to-violet-500/50">
            <GlassCard className="bg-[#0D0D14] text-center py-12 px-8">
              <Target className="w-10 h-10 text-indigo-400 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl italic text-white/80 leading-relaxed mb-6">
                &ldquo;The best time to learn AI agent development was yesterday.
                The second best time is right now — with a tutor that never gets
                tired of your questions.&rdquo;
              </blockquote>
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-white">Abdul Hakeem</span>
                <span className="text-white/40 text-sm">Founder, Course Companion FTE</span>
              </div>
            </GlassCard>
          </div>
        </ScrollReveal>
      </section>
    </PageTransition>
  );
}
