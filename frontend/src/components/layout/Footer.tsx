"use client";

import Link from "next/link";
import { BookOpen, GitBranch, X as XIcon, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import GradientText from "@/components/ui/GradientText";
import { useReducedMotion } from "@/lib/animations";

const LINKS = [
  { href: "/learn", label: "Course" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const SOCIALS = [
  { href: "https://github.com", label: "GitHub", Icon: GitBranch },
  { href: "https://twitter.com", label: "Twitter", Icon: XIcon },
  { href: "https://discord.com", label: "Discord", Icon: MessageSquare },
];

export function Footer() {
  const reducedMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0A0A0F] mt-auto">
      {/* Gradient top border */}
      <div className="h-[1px] w-full bg-gradient-to-r from-indigo-600/0 via-indigo-500 to-violet-500/0" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <GradientText className="text-base font-bold">Course Companion</GradientText>
            </Link>
            <p className="text-sm text-white/40 max-w-[220px]">
              Learn AI Agent Development 24/7 with your personal AI tutor.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/50 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ href, label, Icon }) =>
              reducedMotion ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-white/5 transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ) : (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg text-white/40 hover:bg-white/5 transition-colors duration-200"
                  whileHover={{ scale: 1.15, color: "#4F46E5" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              )
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; {year} Course Companion FTE. All rights reserved.</span>
          <span>Built with Claude Code</span>
        </div>
      </div>
    </footer>
  );
}
