"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import GradientText from "@/components/ui/GradientText";
import type { QuizScore } from "@/types";

interface ProgressChartProps {
  scores: QuizScore[];
}

export function ProgressChart({ scores }: ProgressChartProps) {
  if (scores.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <p className="text-white/30 text-sm">No quiz attempts yet</p>
        <p className="text-white/20 text-xs">Complete a quiz to see your score history</p>
      </GlassCard>
    );
  }

  const chartData = scores.slice(-10).map((s) => ({
    date: new Date(s.attempted_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: Math.min(s.score, 100),
    chapter: s.chapter_id.replace("chapter-0", "Ch ").replace("chapter-", "Ch "),
  }));

  return (
    <GlassCard>
      <div className="mb-4">
        <GradientText className="text-base font-semibold">Quiz Score History</GradientText>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: 12,
              color: "#F8FAFC",
            }}
            formatter={(value, _name, props) => [
              `${value}%`,
              props.payload?.chapter ?? "Score",
            ]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#4F46E5"
            strokeWidth={2}
            fill="url(#areaGrad)"
            dot={{ fill: "#4F46E5", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#7C3AED", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
