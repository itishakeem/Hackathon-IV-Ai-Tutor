"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  TrendingUp,
  Brain,
  Sparkles,
  Network,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  glowPulse,
  useReducedMotion,
} from "@/lib/animations";
import PageTransition from "@/components/ui/PageTransition";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Available",
    desc: "Your AI tutor never sleeps. Learn at 2am, on weekends, or during lunch.",
    pro: false,
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    desc: "Get immediate answers and explanations without waiting for a human.",
    pro: false,
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Visual dashboards show exactly where you are and what's next.",
    pro: false,
  },
  {
    icon: Brain,
    title: "Interactive Quizzes",
    desc: "Reinforce learning with AI-curated questions after every chapter.",
    pro: false,
  },
  {
    icon: Sparkles,
    title: "AI Assessment",
    desc: "Deep-dive open-ended evaluation powered by Claude AI.",
    pro: true,
  },
  {
    icon: Network,
    title: "Chapter Synthesis",
    desc: "Connect concepts across chapters with AI-generated knowledge maps.",
    pro: true,
  },
];

const MODULES = [
  {
    num: "01",
    title: "Intro to AI Agents",
    topics: ["Core architectures", "Agent loops", "Tool use basics"],
    difficulty: "Beginner",
    diffColor: "text-emerald-400 border-emerald-500/50",
  },
  {
    num: "02",
    title: "Claude Agent SDK",
    topics: ["SDK setup", "Agent types", "Memory patterns"],
    difficulty: "Beginner",
    diffColor: "text-emerald-400 border-emerald-500/50",
  },
  {
    num: "03",
    title: "Model Context Protocol",
    topics: ["MCP servers", "Resources & tools", "Prompts API"],
    difficulty: "Intermediate",
    diffColor: "text-amber-400 border-amber-500/50",
  },
  {
    num: "04",
    title: "Agent Skills Design",
    topics: ["Skill composition", "Error recovery", "Testing agents"],
    difficulty: "Intermediate",
    diffColor: "text-amber-400 border-amber-500/50",
  },
  {
    num: "05",
    title: "Multi-Agent Systems",
    topics: ["Orchestration", "Agent delegation", "Production deploy"],
    difficulty: "Advanced",
    diffColor: "text-rose-400 border-rose-500/50",
  },
];

const FREE_FEATURES = [
  { label: "Chapters 1–3", included: true },
  { label: "Basic quizzes", included: true },
  { label: "Progress tracking", included: true },
  { label: "AI Assessment", included: false },
  { label: "Chapter Synthesis", included: false },
];

const PREMIUM_FEATURES = [
  { label: "All 5 chapters", included: true },
  { label: "All quizzes", included: true },
  { label: "Progress tracking", included: true },
  { label: "AI Assessment", included: false },
  { label: "Chapter Synthesis", included: false },
];

const PRO_FEATURES = [
  { label: "Everything in Premium", included: true },
  { label: "Streak & badges", included: true },
  { label: "AI Assessment", included: true },
  { label: "Chapter Synthesis", included: true },
  { label: "AI usage dashboard", included: true },
];

const CODE_SNIPPETS = [
  `from agents import Agent, Runner

tutor = Agent(
  name="CourseTutor",
  instructions="""
    You are an expert AI tutor.
    Teach with patience and clarity.
  """
)

result = await Runner.run(
  tutor,
  "Explain MCP servers"
)`,
  `from agents import Agent
from mcp import MCPServer

server = MCPServer(
  name="CourseTools",
  tools=[search_chapters,
         get_quiz,
         track_progress]
)

agent = Agent(
  name="SmartTutor",
  mcp_servers=[server]
)`,
  `# SKILL: concept-explainer
# Trigger: "explain", "what is"

async def explain_concept(
  topic: str,
  level: str = "beginner"
) -> str:

  content = await fetch_chapter(
    topic=topic
  )

  return format_explanation(
    content, level
  )`,
  `from agents import (
  Agent,
  Runner,
  handoff
)

tutor = Agent(
  name="Tutor",
  handoffs=[quiz_agent,
            mentor_agent]
)

await Runner.run(
  tutor,
  "I need practice questions"
)`,
];

const TYPE_SPEED = 25;
const DELETE_SPEED = 8;
const PAUSE_COMPLETE = 2000;
const PAUSE_START = 300;

// ---------------------------------------------------------------------------
// One-shot typewriter hook (for sub-headline)
// ---------------------------------------------------------------------------
function useTypewriter(text: string, speed = 40): string {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

// ---------------------------------------------------------------------------
// Cycling typewriter hook (loops forever through CODE_SNIPPETS)
// ---------------------------------------------------------------------------
function useCodeTypewriter(active: boolean): string {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [displayedCode, setDisplayedCode] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = CODE_SNIPPETS[snippetIndex] ?? "";

    if (!active) {
      setDisplayedCode(CODE_SNIPPETS[0] ?? "");
      return;
    }

    if (!isDeleting && charIndex < current.length) {
      const t = setTimeout(() => {
        setDisplayedCode(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, TYPE_SPEED);
      return () => clearTimeout(t);
    }

    if (!isDeleting && charIndex === current.length) {
      const t = setTimeout(() => setIsDeleting(true), PAUSE_COMPLETE);
      return () => clearTimeout(t);
    }

    if (isDeleting && charIndex > 0) {
      const t = setTimeout(() => {
        setDisplayedCode(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, DELETE_SPEED);
      return () => clearTimeout(t);
    }

    if (isDeleting && charIndex === 0) {
      const t = setTimeout(() => {
        setIsDeleting(false);
        setSnippetIndex((i) => (i + 1) % CODE_SNIPPETS.length);
      }, PAUSE_START);
      return () => clearTimeout(t);
    }
  }, [charIndex, isDeleting, snippetIndex, active]);

  return displayedCode;
}

// ---------------------------------------------------------------------------
// Syntax-coloured code token renderer
// ---------------------------------------------------------------------------
type TokenType = "string" | "keyword" | "comment" | "funcname" | "classname";

function renderCode(code: string): React.ReactNode[] {
  const keywords = ["from", "import", "await", "async", "def", "class", "return"];
  const keywordRe = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  const stringRe = /("""[\s\S]*?"""|"[^"]*"|'[^']*')/g;
  const funcRe = /(?<=def\s+)([a-z_][a-zA-Z0-9_]*)/g;
  const classRe = /\b([A-Z][a-zA-Z0-9]+)\b/g;

  return code.split("\n").map((line, li) => {
    // Comment lines — whole line is muted italic
    if (/^\s*#/.test(line)) {
      return (
        <div key={li} className="leading-6">
          <span className="text-slate-500 italic">{line}</span>
        </div>
      );
    }

    const matches: Array<{ start: number; end: number; type: TokenType }> = [];
    let m: RegExpExecArray | null;

    stringRe.lastIndex = 0;
    while ((m = stringRe.exec(line)) !== null)
      matches.push({ start: m.index, end: m.index + m[0].length, type: "string" });

    keywordRe.lastIndex = 0;
    while ((m = keywordRe.exec(line)) !== null) {
      if (!matches.some((x) => m!.index >= x.start && m!.index < x.end))
        matches.push({ start: m.index, end: m.index + m[0].length, type: "keyword" });
    }

    funcRe.lastIndex = 0;
    while ((m = funcRe.exec(line)) !== null) {
      if (!matches.some((x) => m!.index >= x.start && m!.index < x.end))
        matches.push({ start: m.index, end: m.index + m[0].length, type: "funcname" });
    }

    classRe.lastIndex = 0;
    while ((m = classRe.exec(line)) !== null) {
      if (!matches.some((x) => m!.index >= x.start && m!.index < x.end))
        matches.push({ start: m.index, end: m.index + m[0].length, type: "classname" });
    }

    matches.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const match of matches) {
      if (match.start > last) parts.push(line.slice(last, match.start));
      const tok = line.slice(match.start, match.end);
      const cls =
        match.type === "string"    ? "text-emerald-400"             :
        match.type === "keyword"   ? "text-violet-400 font-semibold" :
        match.type === "comment"   ? "text-slate-500 italic"         :
        match.type === "funcname"  ? "text-cyan-400"                 :
                                     "text-indigo-400";
      parts.push(<span key={match.start} className={cls}>{tok}</span>);
      last = match.end;
    }
    if (last < line.length) parts.push(line.slice(last));

    return <div key={li} className="leading-6">{parts}</div>;
  });
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const reducedMotion = useReducedMotion();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const subHeadline = "Your 24/7 AI tutor — always available, infinitely patient";
  const typewriterText = useTypewriter(subHeadline, 35);
  const codeDisplay = useCodeTypewriter(!reducedMotion);

  const PRICES = {
    free: { monthly: "$0", annual: "$0" },
    premium: { monthly: "$9.99", annual: "$7.99" },
    pro: { monthly: "$19.99", annual: "$15.99" },
  };

  const headlineLines = [
    "Build AI Agents.",
    "Learn from an AI.",
    "Ship to Production.",
  ];

  return (
    <PageTransition includeMesh={false}>
      {/* ================================================================
          HERO
      ================================================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-24 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: Content */}
            <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                variants={fadeInUp}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                className="flex justify-center lg:justify-start"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-sm font-medium">
                  🚀 AI Agent Development Course
                </span>
              </motion.div>

              {/* Headline stagger */}
              <motion.h1
                variants={staggerContainer}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                className="flex flex-col gap-1"
              >
                {headlineLines.map((line, i) => (
                  <motion.span
                    key={i}
                    variants={staggerItem}
                    custom={i}
                    transition={{ delay: i * 0.1 }}
                    className="block"
                  >
                    <GradientText className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                      {line}
                    </GradientText>
                  </motion.span>
                ))}
              </motion.h1>

              {/* Typewriter subheadline */}
              <motion.p
                variants={fadeInUp}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                transition={{ delay: 0.4 }}
                className="text-lg text-white/60 max-w-lg mx-auto lg:mx-0 min-h-[1.75rem]"
              >
                {reducedMotion ? subHeadline : typewriterText}
                <span className="inline-block w-0.5 h-5 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <GradientButton href="/register" size="lg" variant="primary">
                  Start Learning Free
                </GradientButton>
                <GradientButton href="/learn" size="lg" variant="secondary">
                  View Curriculum
                </GradientButton>
              </motion.div>

              {/* Social proof */}
              <motion.p
                variants={fadeInUp}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                transition={{ delay: 0.75 }}
                className="text-sm text-white/40 text-center lg:text-left"
              >
                Join <span className="text-white/70 font-semibold">18,000+</span> developers learning AI
              </motion.p>
            </div>

            {/* Right: Code card */}
            <motion.div
              variants={fadeInUp}
              initial={reducedMotion ? "visible" : "hidden"}
              animate="visible"
              transition={{ delay: 0.3 }}
              className="hidden lg:block flex-1 w-full max-w-lg"
            >
              <motion.div
                animate={reducedMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Gradient border wrapper */}
                <div className="p-[1px] bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                  <div className="bg-[#0D0D14] rounded-2xl overflow-hidden">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111118]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded border border-indigo-500/40 text-indigo-300 bg-indigo-500/20">
                        Python
                      </span>
                    </div>
                    {/* Code body */}
                    <pre className="px-5 py-4 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre overflow-hidden min-h-[220px]">
                      <code>{renderCode(codeDisplay)}</code>
                      {!reducedMotion && (
                        <span className="inline-block w-[2px] h-[1.1em] bg-indigo-400 ml-[1px] align-middle animate-pulse" />
                      )}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={reducedMotion ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center mt-16 text-white/30"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          STATS BAR
      ================================================================ */}
      <section className="bg-[#111118] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { end: 168, suffix: " hrs/week", label: "Availability" },
              { end: 99, suffix: "%", label: "Consistency" },
              { end: 50000, suffix: "+", label: "Sessions" },
              { end: 85, suffix: "%", label: "Cost Savings" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center py-6 px-4 text-center",
                  i < 3 && "md:border-r border-white/10"
                )}
              >
                <span className="text-3xl md:text-4xl font-bold text-white">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </span>
                <span className="mt-1 text-sm text-white/50">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES
      ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <ScrollReveal className="text-center mb-14">
          <GradientText className="text-4xl md:text-5xl font-bold block mb-3">
            Why Course Companion?
          </GradientText>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Built specifically for developers who learn by doing.
          </p>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial={reducedMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => (
            <motion.div key={feat.title} variants={staggerItem}>
              <GlassCard hover className="h-full flex flex-col gap-4 relative">
                {feat.pro && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-400 bg-amber-500/10 font-semibold">
                    PRO
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <feat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feat.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ================================================================
          CURRICULUM
      ================================================================ */}
      <section className="bg-[#111118]/50 py-24" id="curriculum">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-14">
            <GradientText className="text-4xl md:text-5xl font-bold block mb-3">
              What You&apos;ll Learn
            </GradientText>
            <p className="text-white/50 text-lg">5 comprehensive modules, from zero to production.</p>
          </ScrollReveal>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:overflow-visible md:pb-0 snap-x snap-mandatory md:snap-none">
            {MODULES.map((mod, i) => (
              <ScrollReveal key={mod.num} delay={i * 0.08} className="shrink-0 w-[260px] md:w-auto snap-start">
                <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-indigo-500/40 hover:to-violet-500/20 transition-all duration-300 h-full">
                  <div className="bg-[#0D0D14] rounded-2xl p-5 h-full flex flex-col gap-3">
                    <span className="text-4xl font-black bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-none">
                      {mod.num}
                    </span>
                    <h3 className="text-white font-semibold text-sm leading-snug">{mod.title}</h3>
                    <ul className="flex-1 space-y-1.5">
                      {mod.topics.map((t) => (
                        <li key={t} className="text-xs text-white/50 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <span className={cn("text-xs border px-2 py-0.5 rounded-full font-semibold w-fit", mod.diffColor)}>
                      {mod.difficulty}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING
      ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 py-24" id="pricing">
        <ScrollReveal className="text-center mb-10">
          <GradientText className="text-4xl md:text-5xl font-bold block mb-3">
            Simple Pricing
          </GradientText>
          <p className="text-white/50 text-lg mb-6">Start free. Upgrade when you&apos;re ready.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(["monthly", "annual"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize",
                  billing === opt
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-white/50 hover:text-white"
                )}
              >
                {opt}
                {opt === "annual" && (
                  <span className="ml-1.5 text-xs text-emerald-400 font-semibold">−20%</span>
                )}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <ScrollReveal delay={0}>
            <GlassCard className="h-full flex flex-col gap-5">
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-white/40 text-sm">/forever</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-white/20 shrink-0" />
                    )}
                    <span className={f.included ? "text-white/80" : "text-white/30"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <GradientButton href="/register" variant="secondary" className="w-full justify-center">
                Get Started Free
              </GradientButton>
            </GlassCard>
          </ScrollReveal>

          {/* Premium */}
          <ScrollReveal delay={0.1}>
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-indigo-500/50 to-transparent h-full">
              <GlassCard className="h-full flex flex-col gap-5 bg-[#0D0D14]">
                <div>
                  <span className="text-xs px-2.5 py-1 rounded-full border border-indigo-500/50 text-indigo-400 bg-indigo-500/10 font-semibold mb-3 inline-block">
                    PREMIUM
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {PRICES.premium[billing]}
                    </span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 shrink-0" />
                      )}
                      <span className={f.included ? "text-white/80" : "text-white/30"}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <GradientButton href="/register" variant="primary" className="w-full justify-center">
                  Start Premium
                </GradientButton>
              </GlassCard>
            </div>
          </ScrollReveal>

          {/* Pro */}
          <ScrollReveal delay={0.2}>
            <motion.div
              variants={glowPulse}
              initial="hidden"
              animate="visible"
              className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 h-full"
            >
              <GlassCard className="h-full flex flex-col gap-5 bg-[#0D0D14] relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    ✦ Most Popular
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-xs px-2.5 py-1 rounded-full border border-amber-500/50 text-amber-400 bg-amber-500/10 font-semibold mb-3 inline-block">
                    PRO
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {PRICES.pro[billing]}
                    </span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {PRO_FEATURES.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-white/80">{f.label}</span>
                    </li>
                  ))}
                </ul>
                <GradientButton href="/register" variant="primary" className="w-full justify-center">
                  Start Pro
                </GradientButton>
              </GlassCard>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          CTA
      ================================================================ */}
      <section className="relative overflow-hidden py-28">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#0A0A0F] to-violet-900/40" />
        {/* Floating orbs */}
        <motion.div
          animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={reducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl"
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <ScrollReveal>
            <GradientText className="text-4xl md:text-5xl font-bold block mb-4">
              Ready to become an AI Agent developer?
            </GradientText>
            <p className="text-white/50 text-lg mb-8">
              Join thousands of developers building the future with AI agents.
            </p>
            <GradientButton href="/register" size="lg" variant="primary">
              Start For Free
            </GradientButton>
          </ScrollReveal>
        </div>
      </section>
    </PageTransition>
  );
}
