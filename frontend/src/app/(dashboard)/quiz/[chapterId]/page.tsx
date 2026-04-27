"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { quizzesApi, progressApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizCard } from "@/components/quiz/QuizCard";
import { QuizResult } from "@/components/quiz/QuizResult";
import { Skeleton } from "@/components/ui/skeleton";
import GradientText from "@/components/ui/GradientText";
import GlassCard from "@/components/ui/GlassCard";
import { AlertCircle } from "lucide-react";
import type { QuizQuestion, QuizResult as QuizResultType } from "@/types";

type Phase = "loading" | "question" | "submitted";

export default function QuizPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadQuiz() {
    if (!chapterId) return;
    setPhase("loading");
    setCurrentIndex(0);
    setAnswers({});
    setSelected(null);
    setResult(null);

    quizzesApi
      .getQuestions(chapterId)
      .then((data) => {
        setQuestions(data.questions);
        setPhase("question");
      })
      .catch(() => setError("Failed to load quiz questions."));
  }

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  async function handleNext() {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !selected) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selected as "A" | "B" | "C" | "D",
    };
    setAnswers(newAnswers);

    const isLast = currentIndex === questions.length - 1;

    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    } else {
      try {
        const quizResult = await quizzesApi.submit(chapterId, { answers: newAnswers }, questions);
        setResult(quizResult);
        setPhase("submitted");
        toast.success("Quiz submitted!");

        if (user) {
          await progressApi.recordQuizScore(user.sub, chapterId, quizResult.correct_count, quizResult.total_questions).catch(() => {});
        }
      } catch {
        toast.error("Failed to submit quiz.");
      }
    }
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto pt-8">
        <GlassCard className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-[#94A3B8]">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-2">
        <Skeleton className="h-4 w-full bg-white/5 rounded-xl" />
        <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
        <Skeleton className="h-10 w-full bg-white/5 rounded-xl" />
        <Skeleton className="h-10 w-full bg-white/5 rounded-xl" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-3xl font-black">
          <GradientText>Quiz</GradientText>
        </h1>
        <p className="text-sm text-[#94A3B8] capitalize mt-1">
          {chapterId?.replace(/-/g, " ")}
        </p>
      </div>

      {phase === "question" && currentQuestion && (
        <>
          <QuizProgress current={currentIndex + 1} total={questions.length} />
          <QuizCard
            question={currentQuestion}
            selected={selected}
            onSelect={setSelected}
            onNext={handleNext}
            isLast={currentIndex === questions.length - 1}
          />
        </>
      )}

      {phase === "submitted" && result && (
        <QuizResult
          result={result}
          onRetry={loadQuiz}
          chapterId={chapterId}
        />
      )}
    </motion.div>
  );
}
