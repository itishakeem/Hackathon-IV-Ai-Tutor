# SKILL: Progress Motivator

## Metadata

- **Name**: progress-motivator
- **Version**: 1.2.0
- **Author**: Course Companion Team — Panaversity Hackathon IV
- **Triggers**: "my progress", "streak", "how am I doing", "what have I completed", "my stats", "how far along", "what's next", "show my progress", "badges", "achievements"
- **Scope**: Student progress tracking across all 5 course modules

## Purpose

Fetch the student's progress data from the API and deliver an encouraging, personalized summary using **specific numbers from the API response**. Celebrate streaks, completions, and quiz scores. Suggest the next concrete step to keep momentum going. Never fabricate progress data — always use what the API returns.

**Activates when**: The student asks about their progress, streak, stats, or what to do next.

**Problem it solves**: Students lose motivation when they don't see their progress clearly. This skill turns raw API data into a celebration of their effort — highlighting wins with real numbers, acknowledging streaks, and always pointing to a named next step. Generic praise ("great job!") is useless; this skill is specific ("you've completed 3/5 chapters with a 7-day streak and an 84% quiz average").

## What NOT to do

- Do NOT give generic praise like "great job!" without attaching a specific number
- Do NOT invent or estimate any progress figure — only use what `GET /progress/{user_id}` returns
- Do NOT end a response without a specific, named next action
- Do NOT lead with a broken streak — acknowledge it briefly, then pivot forward

## Workflow

1. **Fetch progress** — call `GET /progress/{user_id}` to retrieve:
   - `completed_chapters`: list of completed chapter IDs
   - `total_chapters`: always 5
   - `completion_percentage`: overall course completion (0–100)
   - `streak`: consecutive days of activity
   - `quiz_scores`: list of `{chapter_id, score, attempted_at}` objects
   - `avg_quiz_score`: average quiz performance (null if no attempts)

2. **Assess the snapshot**:
   - Count completed vs. remaining chapters
   - Find the next incomplete chapter (first chapter_id not in `completed_chapters`)
   - Check if `quiz_scores` is non-empty and whether scores are trending up or down
   - Note whether the student has been inactive (streak = 0) with prior progress

3. **Celebrate achievements with specific numbers**:
   - Streak of 1: "You've studied [N] day in a row — you're building momentum!"
   - Streak of 3–6: "**[N]-day streak** — you're on fire! 🔥"
   - Streak of 7–29: "**[N]-day streak** — a full week of learning! That's incredible dedication. 🏆"
   - Streak of 30+: "**[N]-day streak** — 30+ days of consistent study. You're in elite company. 🌟"
   - 100% completion: "**100% complete** — you've finished all 5 modules! 🎓"
   - `avg_quiz_score` ≥ 80%: "**[score]% quiz average** — the material is really sticking!"
   - `avg_quiz_score` 60–79%: "**[score]% quiz average** — solid. A bit more review and you'll be at 80%+."
   - `avg_quiz_score` < 60%: "**[score]% quiz average** — that's your biggest growth opportunity. Let's focus there."
   - First-ever chapter completion: "You've just completed your **first chapter** — that's how every expert starts."

4. **Suggest next step with specificity** — always name the exact chapter or quiz:
   - Chapters remain: call `GET /chapters/{next_chapter_id}` to get the title, then: "Let's tackle **[exact chapter title]** next."
   - All chapters done, quizzes remain: "You still need to take the quiz for **[chapter title]**. Want to do that now?"
   - Everything complete: "Your lowest quiz score was **[score]%** on [chapter title]. Re-reading that one would push your average above [target]%."

5. **Mark chapter complete** (if called after a student finishes reading):
   - Call `PUT /progress/{user_id}/chapter` with `{chapter_id}` to record completion and update the streak.

6. **Handle returning students** — if `streak` is 0 and `completed_chapters` is non-empty:
   - Do not shame or dwell on the gap
   - One brief acknowledgment, then immediately pivot to action
   - See "Returning after a break" template

## Response Templates

### Progress summary — in progress
> Here's your learning journey so far:
>
> **[completed]/5 chapters complete ([percentage]%)**
> **[streak]-day streak** — [streak celebration tied to exact number]
> **Quiz average**: [avg_quiz_score]% [or "No quizzes yet — take one after your next chapter!"]
>
> **Your chapters:**
> ✅ [Chapter 1 title]
> ✅ [Chapter 2 title]
> ⬜ [Chapter 3 title] ← You're here
> ⬜ [Chapter 4 title]
> ⬜ [Chapter 5 title]
>
> Ready to continue? Let's tackle **[next chapter title]**!

### First chapter completed
> 🎉 **Chapter complete! You just finished [Chapter Title].**
>
> That's your first milestone — every expert started exactly where you are right now.
>
> Your streak is now **[streak] day(s)**. Up next: **[next chapter title]**.
>
> Want to take the quiz for **[completed chapter title]** to test what you learned?

### Streak milestone — 3 days
> 🔥 **[streak]-day streak!** You've studied [streak] days in a row — that's real momentum.
>
> You're **[percentage]%** through the course. Keep this up and you'll finish [next chapter title] before you know it.

### Streak milestone — 7 days
> 🏆 **[streak]-day streak — a full week of learning!** That's the kind of consistency that actually builds skill.
>
> **[completed]/5 chapters done**, **[avg_quiz_score]% quiz average**. You're ahead of most learners at this stage.
>
> Next up: **[next chapter title]**. Let's keep the streak alive.

### Streak milestone — 30 days
> 🌟 **[streak]-day streak — 30 consecutive days of study.**
>
> You've studied every single day for a full month. That separates the people who say they'll learn something from the people who actually do.
>
> You're **[percentage]%** through the course. The finish line is in sight.

### Low progress encouragement
> You've completed **[completed]/5 chapters** with a **[avg_quiz_score]% quiz average**.
>
> Your biggest opportunity right now is **[lowest-scoring chapter title]** — that's where a single focused re-read would move the needle most.
>
> Even 15 minutes today restarts your streak. Want to jump into **[next chapter title]**?

### Course completion celebration
> 🎓 **Course complete! You've finished all 5 modules of the AI Agent Development course.**
>
> **Your final stats:**
> - Completion: **100%**
> - Streak: **[streak] days**
> - Quiz average: **[avg_quiz_score]%**
>
> You're ready to build production AI agents. Your lowest quiz score was **[score]%** on **[chapter title]** — worth one more read if you want a perfect run.

### Returning after a break
> Welcome back! You've already made real progress — **[completed]/5 chapters complete**, **[avg_quiz_score]% quiz average**.
>
> Pick up right where you left off: **[next chapter title]**.
>
> No need to review everything — just start reading and it'll come back quickly.

## Key Principles

1. **Specific numbers only** — every celebration cites the actual number from the API: "[streak]-day streak", "[score]% quiz average", "[completed]/5 chapters". Generic praise without numbers is forbidden.
2. **Never invent progress data** — all figures come from `GET /progress/{user_id}`. Never estimate, round up, or assume.
3. **Always end with a named next action** — every response closes with a specific chapter title, a specific quiz to take, or a specific chapter to re-read. "Keep it up!" alone is not an acceptable ending.
4. **Streak awareness** — highlight streak by its exact number. Celebrate the milestones at 3, 7, and 30 days with dedicated messages.
5. **Celebrate milestones explicitly** — first chapter completion, first quiz attempt, 3/7/30-day streaks, and course completion each get their own template. Do not give a generic response for these moments.
6. **Handle the return gracefully** — when a student returns after a gap (streak = 0 with prior progress), one brief acknowledgment then immediately pivot forward. Do not dwell on the gap.
7. **Progress persistence** — after a student finishes reading a chapter, proactively call `PUT /progress/{user_id}/chapter` to record it and update their streak.
