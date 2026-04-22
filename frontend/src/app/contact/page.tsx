"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, GitBranch, CheckCircle } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { fadeInUp, useReducedMotion } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const CONTACT_INFO = [
  {
    Icon: Mail,
    title: "Email",
    detail: "contact@coursecompanion.dev",
    sub: "We reply within 24 hours",
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/5",
  },
  {
    Icon: MessageSquare,
    title: "Discord",
    detail: "Join our community",
    sub: "Live discussions & help",
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
  {
    Icon: GitBranch,
    title: "GitHub",
    detail: "View source code",
    sub: "Open source & transparent",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
  },
];

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!form.subject.trim()) errors.subject = "Subject is required";
  if (!form.message.trim()) errors.message = "Message is required";
  return errors;
}

export default function ContactPage() {
  const reducedMotion = useReducedMotion();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    // SKILL.md constraint: setTimeout simulation only — no API call
    await new Promise<void>((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleReset() {
    setForm({ name: "", email: "", subject: "", message: "" });
    setErrors({});
    setSubmitted(false);
  }

  const inputClass = cn(
    "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3",
    "text-white placeholder-white/30 transition-colors duration-200",
    "focus:outline-none focus:border-indigo-500"
  );

  return (
    <PageTransition>
      {/* ================================================================
          HERO
      ================================================================ */}
      <section className="py-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-sm font-medium mb-6">
              We&apos;d love to hear from you
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <GradientText>Get in Touch</GradientText>
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Questions, feedback, or partnership ideas — we&apos;re always here.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          CONTACT FORM
      ================================================================ */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <ScrollReveal>
          <GlassCard className="p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  variants={fadeInUp}
                  initial={reducedMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="text-center py-8 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
                    <p className="text-white/50">We&apos;ll be in touch within 24 hours.</p>
                  </div>
                  <GradientButton variant="secondary" onClick={handleReset}>
                    Send another message
                  </GradientButton>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  variants={fadeInUp}
                  initial={reducedMotion ? "visible" : "hidden"}
                  animate="visible"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      className={cn(inputClass, errors.name && "border-red-500/60")}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className={cn(inputClass, errors.email && "border-red-500/60")}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Subject
                    </label>
                    <input
                      name="subject"
                      type="text"
                      placeholder="What's this about?"
                      value={form.subject}
                      onChange={handleChange}
                      className={cn(inputClass, errors.subject && "border-red-500/60")}
                    />
                    {errors.subject && (
                      <p className="text-red-400 text-xs mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us what's on your mind..."
                      value={form.message}
                      onChange={handleChange}
                      className={cn(
                        inputClass,
                        "resize-none",
                        errors.message && "border-red-500/60"
                      )}
                    />
                    {errors.message && (
                      <p className="text-red-400 text-xs mt-1">{errors.message}</p>
                    )}
                  </div>

                  <GradientButton
                    variant="primary"
                    loading={submitting}
                    className="w-full justify-center"
                  >
                    Send Message
                  </GradientButton>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </ScrollReveal>
      </section>

      {/* ================================================================
          CONTACT INFO CARDS
      ================================================================ */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTACT_INFO.map((info, i) => (
            <ScrollReveal key={info.title} delay={i * 0.1}>
              <GlassCard hover className={cn(
                "flex flex-col items-center text-center gap-3 py-8",
                "border", info.border
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  info.bg, "border", info.border
                )}>
                  <info.Icon className={cn("w-6 h-6", info.color)} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{info.title}</h3>
                  <p className={cn("text-sm font-medium", info.color)}>{info.detail}</p>
                  <p className="text-white/40 text-xs mt-0.5">{info.sub}</p>
                </div>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
