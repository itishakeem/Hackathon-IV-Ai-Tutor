"use client";

import { CheckCircle2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuizScore } from "@/types";

interface BadgeCardProps {
  completedChapters: string[];
  quizScores: QuizScore[];
}

export function BadgeCard({ completedChapters, quizScores }: BadgeCardProps) {
  const hasPerfectScore = quizScores.some((s) => s.score === 100);
  const totalBadges = completedChapters.length + (hasPerfectScore ? 1 : 0);

  if (totalBadges === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No badges yet — complete a chapter to earn one!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {completedChapters.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              <CheckCircle2 className="h-3 w-3" />
              {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          ))}
          {hasPerfectScore && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            >
              <Trophy className="h-3 w-3" />
              Perfect Score
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
