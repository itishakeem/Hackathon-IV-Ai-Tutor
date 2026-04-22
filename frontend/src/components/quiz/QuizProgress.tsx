import { motion } from "framer-motion";

interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-[#94A3B8]">
        <span>Question {current} of {total}</span>
        <span className="text-indigo-400 font-semibold">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
        />
      </div>
    </div>
  );
}
