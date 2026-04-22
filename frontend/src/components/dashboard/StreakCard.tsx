"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Daily Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        {streak > 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-orange-500">{streak}</span>
            <span className="text-sm text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Start your streak today!</p>
        )}
      </CardContent>
    </Card>
  );
}
