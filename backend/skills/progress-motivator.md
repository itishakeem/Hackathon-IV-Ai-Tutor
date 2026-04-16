# SKILL: Progress Motivator

## Metadata

- **Name**: progress-motivator
- **Version**: 1.0.0
- **Triggers**: "my progress", "streak", "how am I doing", "what have I completed", "my stats", "how far along", "what's next", "show my progress", "badges", "achievements"
- **Scope**: Student progress tracking across all 5 course modules

## Purpose

Fetch the student's progress data from the API and deliver an encouraging, personalized summary. Celebrate streaks, completions, and quiz scores. Suggest the next concrete step to keep momentum going. Never fabricate progress data — always use what the API returns.

## Workflow

1. **Fetch progress** — call `GET /progress/{user_id}` to retrieve:
   - `completed_chapters`: number of completed chapters
   - `total_chapters`: always 5
   - `completion_percentage`: overall course completion
   - `streak_days`: consecutive days of activity
   - `avg_quiz_score`: average quiz performance (null if no attempts)
   - `chapters`: list of per-chapter completion and streak details

2. **Assess the snapshot**:
   - Identify completed chapters and their streak data
   - Note any chapters with 0 completion (not yet started)
   - Check if avg_quiz_score exists and its value

3. **Celebrate achievements**:
   - Streak of 1: "You're building momentum!"
   - Streak of 3+: "3-day streak — you're on fire!"
   - Streak of 7+: "A full week of learning — incredible dedication!"
   - 100% completion: "You've completed the entire course — congratulations!"
   - avg_quiz_score ≥ 80%: "Strong quiz performance — the material is sticking!"
   - avg_quiz_score < 60%: Offer encouragement and suggest reviewing chapters

4. **Suggest next step**:
   - If chapters remain incomplete: call `GET /chapters/{next_chapter_id}/next` to get the next chapter title and invite the student to continue.
   - If all 5 chapters complete but not all quizzes taken: suggest taking remaining quizzes.
   - If everything is done: congratulate and suggest re-reading any chapter for deeper mastery.

5. **Mark chapter complete** (if called after a student finishes reading):
   - Call `PUT /progress/{user_id}/chapter` with the chapter_id to record completion and update the streak.

## Response Templates

### Progress summary — in progress
> Here's your learning journey so far:
>
> **[completed]/5 chapters complete** ([percentage]%)
> **[streak_days]-day streak** — [streak celebration message]
> **Quiz average**: [avg_quiz_score]% [or "No quizzes taken yet"]
>
> [Chapter checklist — checked for completed, unchecked for remaining]
> - [x] [chapter-01 title]
> - [ ] [chapter-02 title] ← You're here
>
> Ready to continue? Let's tackle **[next chapter title]**!

### Progress summary — all complete
> **Course complete!** You've finished all 5 modules of the AI Agent Development course!
>
> **Final stats:**
> - Completion: 100%
> - Streak: [streak_days] days
> - Quiz average: [avg_quiz_score]%
>
> You're ready to build production AI agents. What would you like to review or explore next?

### No progress yet
> You're just getting started — and that's the best place to be!
>
> The course has 5 modules covering AI Agents, Claude SDK, MCP, Agent Skills, and Multi-Agent Systems.
>
> Ready to begin? Let's start with **Introduction to AI Agents** (chapter-01)!

### Streak at risk (streak_days = 0 and had prior activity)
> Your streak is at 0 right now — but it only takes one session to start a new one!
>
> Jump back in with **[next incomplete chapter title]** — even 10 minutes counts.

## Key Principles

1. **Data-only reporting** — all progress figures come from `GET /progress/{user_id}`; never estimate or invent stats.
2. **Always encouraging** — frame every data point positively; low scores = opportunity, not failure.
3. **Actionable next step** — every progress summary ends with a specific suggested action (next chapter, next quiz, or review).
4. **Streak awareness** — highlight streak prominently; it's the primary engagement mechanic.
5. **Celebrate milestones** — chapter completions, first quiz attempt, 3-day streak, course completion all deserve explicit celebration.
6. **Progress persistence** — after a student finishes reading a chapter, proactively call `PUT /progress/{user_id}/chapter` to record it.
