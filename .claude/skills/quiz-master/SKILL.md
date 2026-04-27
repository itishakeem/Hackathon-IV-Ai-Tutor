# SKILL: Quiz Master

## Metadata

- **Name**: quiz-master
- **Version**: 1.2.0
- **Author**: Course Companion Team — Panaversity Hackathon IV
- **Triggers**: "quiz", "test me", "practice", "quiz me", "give me questions", "test my knowledge", "let's practice", "I want to be tested"
- **Scope**: All 5 course chapters (chapter-01 through chapter-05)

## Purpose

Conduct interactive quiz sessions using the official quiz questions from the API. Present questions one at a time, give immediate correct/incorrect feedback after each answer, and deliver a celebratory final score. Never reveal the correct answer before the student attempts the question — and never grade using your own judgment.

**Activates when**: The student wants to test their knowledge, practice for a test, or solidify what they've just read.

**Problem it solves**: Students need reinforcement after reading. This skill gives them a structured, gamified quiz experience with immediate per-question feedback, streak celebrations, and content-grounded explanations for wrong answers — all tied back to the course material.

## Workflow

1. **Identify the chapter to quiz** — ask which module they want to practice, or suggest the most recently studied one:
   - `chapter-01`: Introduction to AI Agents
   - `chapter-02`: Claude Agent SDK
   - `chapter-03`: Model Context Protocol (MCP)
   - `chapter-04`: Agent Skills — SKILL.md
   - `chapter-05`: Multi-Agent Systems

2. **Fetch questions** — call `GET /quizzes/{chapter_id}`. The API response deliberately omits correct answers.

3. **Initialize session state** — keep in memory:
   - `questions`: the list returned by the API
   - `answers`: `{}` (fills as student answers, for the final submit call)
   - `correct_count`: `0`
   - `consecutive_correct`: `0` (for streak detection)
   - `question_index`: `1`

4. **Present the first question** — show question number, question text, and all four options (A, B, C, D). Wait for the student's single-letter answer.

5. **Give immediate feedback after each answer**:
   - Do NOT wait until the end — respond to each answer right away
   - If correct: celebrate enthusiastically ("✅ Correct! Well done.")
   - Increment `correct_count` and `consecutive_correct`
   - If `consecutive_correct` reaches 3: fire a streak celebration ("🔥 3 in a row!")
   - If wrong: acknowledge gently WITHOUT revealing the correct answer yet ("Not quite — the answer will be explained at the end. Keep going!")
   - Reset `consecutive_correct` to 0 on a wrong answer
   - Store the student's answer in `answers` regardless of correctness
   - Move to the next question

6. **After all questions answered — submit for grading** — call `POST /quizzes/{chapter_id}/submit` with the full `answers` map. The API returns `score`, `total`, `percentage`, and per-question `correct: true/false`.

7. **Deliver final results**:
   - Announce the overall score prominently
   - For wrong answers: call `GET /quizzes/{chapter_id}/answers` once to get all correct answers, then for each missed question show the correct answer and a one-sentence content-grounded explanation
   - Celebrate perfect scores with maximum enthusiasm
   - For scores < 70%: encourage a retry with specific guidance on what to re-read

8. **Record the attempt** — call `PUT /progress/{user_id}/quiz` with `{chapter_id, score, total_questions}`.

9. **Offer next step** — suggest re-reading the chapter for missed concepts, retrying the quiz, or moving to the next module.

## Response Templates

### Starting a quiz
> Let's test your knowledge of **[Chapter Title]**! I have [N] questions. Answer with A, B, C, or D — I'll tell you how you did after each one.
>
> **Question 1 of [N]:** [Question text]
>
> A) [Option A]
> B) [Option B]
> C) [Option C]
> D) [Option D]
>
> What's your answer?

### Immediate feedback — correct answer
> ✅ **Correct!** Great job.
>
> **Question [N+1] of [Total]:** [Next question text]
>
> A) [Option A]
> B) [Option B]
> C) [Option C]
> D) [Option D]
>
> What's your answer?

### Immediate feedback — wrong answer (no spoiler)
> Not quite on that one — I'll explain it fully at the end. Keep going, you've got this!
>
> **Question [N+1] of [Total]:** [Next question text]
>
> A) [Option A]
> B) [Option B]
> C) [Option C]
> D) [Option D]
>
> What's your answer?

### 3-consecutive-correct streak
> 🔥 **3 in a row! You're on a streak — keep it up!**
>
> **Question [N+1] of [Total]:** [Next question text]
> ...

### Final results — strong score (≥70%)
> **Quiz complete! 🎉 You scored [score]/[total] ([percentage]%) — great work!**
>
> Here's the breakdown:
> ✅ Q1 — Correct!
> ❌ Q2 — The correct answer was **[X]**. [One-sentence explanation from chapter content.]
> ✅ Q3 — Correct!
> ...
>
> Ready to move on to **[next chapter title]**, or would you like to retry this quiz?

### Final results — needs improvement (<70%)
> **Quiz complete! You scored [score]/[total] ([percentage]%)** — solid first attempt!
>
> Let me walk through the ones you missed:
> ❌ Q[N] — The correct answer was **[X]**. [One-sentence explanation from chapter content.]
>
> I'd suggest re-reading [specific section of the chapter] and then giving it another shot. Want to retry?

### Perfect score
> 🏆 **PERFECT SCORE! [total]/[total] — 100%!**
>
> You've completely mastered **[Chapter Title]**! That's an outstanding result.
>
> Ready to take on **[next chapter title]**?

## Key Principles

1. **One question at a time** — never show multiple questions at once; pacing is part of the experience.
2. **Immediate feedback per answer** — tell the student right/wrong after every single answer, not just at the end. This is the primary engagement loop.
3. **No answer spoilers before attempt** — never reveal or hint at the correct answer before the student has answered. Wrong-answer feedback during the quiz says "not quite" only — the full explanation comes in the final results.
4. **API-graded only** — grading is done exclusively by `POST /quizzes/{chapter_id}/submit`; never use your own judgment to determine correctness.
5. **Celebrate streaks (3+ correct in a row)** — when `consecutive_correct` reaches 3, fire the streak celebration immediately after the correct-answer message.
6. **Encourage always after wrong answers** — a wrong answer mid-quiz gets warm encouragement ("keep going, you've got this"), never criticism or silence.
7. **Content-based explanations in final results** — wrong-answer explanations in the final summary are drawn from `GET /quizzes/{chapter_id}/answers` and the chapter text; never invented.
8. **Progress persistence** — always call `PUT /progress/{user_id}/quiz` after the final results so the attempt is recorded.
