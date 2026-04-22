# Quickstart: Course Companion FTE — Phase 3 (Next.js Web App)

**Branch**: `002-nextjs-web-app` | **Date**: 2026-04-19

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Backend running at `http://localhost:8000` (Phase 1 + Phase 2)
- A registered test user (free) and a Pro-tier user (manually set via DB or backend admin)

---

## Setup

```bash
# 1. Scaffold
pnpm create next-app frontend --typescript --tailwind --app --no-eslint --import-alias "@/*"
cd frontend

# 2. Install all dependencies
pnpm add axios zustand react-markdown remark-gfm rehype-slug @tailwindcss/typography recharts next-themes react-hot-toast lucide-react
pnpm add -D @types/react-hot-toast

# 3. Install shadcn/ui
npx shadcn@latest init
# Select: TypeScript, tailwind.config.ts, app/, CSS variables

# 4. Add shadcn components
npx shadcn@latest add button input card skeleton sheet tabs badge progress dialog

# 5. Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_APP_NAME=Course Companion FTE" >> .env.local

# 6. Run dev server
pnpm dev
```

---

## Integration Scenarios

### Scenario 1: New User Registration Flow
```
1. GET http://localhost:3000/
   → See landing page: hero + pricing table (SSG, no auth required)

2. Click "Get Started" → navigate to /register
   → Auth page loads (CSR, no SSR)

3. Submit: POST http://localhost:8000/auth/register
   { "email": "test@example.com", "password": "password123" }
   → 201 { "access_token": "eyJ..." }
   → JWT decoded, stored in Zustand + localStorage
   → Redirect to /dashboard

4. GET http://localhost:3000/dashboard
   → SSR: fetches GET /progress/{userId} server-side
   → Renders progress bar (0%), empty streak, empty chart
```

### Scenario 2: Chapter Read + Complete Flow
```
1. GET http://localhost:3000/learn
   → SSR: fetches GET /chapters (with auth JWT from cookie/header)
   → Shows 5 chapter cards; chapters 4-5 show lock icon for free user

2. Click chapter-01 → GET http://localhost:3000/learn/chapter-01
   → SSR: fetches GET /chapters/chapter-01
   → Renders markdown content with Tailwind prose
   → Sidebar shows ## heading outline

3. Click "Mark as Complete"
   → PUT http://localhost:8000/progress/{userId}/chapter { "chapter_id": "chapter-01" }
   → toast.success("Chapter marked complete!")
   → Chapter card shows completed badge

4. Click "Quiz" → GET http://localhost:3000/quiz/chapter-01
   → CSR: fetches GET /quizzes/chapter-01
   → Shows first question with 4 options
```

### Scenario 3: Quiz Submission Flow
```
1. Answer all questions on quiz page (CSR, all state in component)

2. Click "Submit"
   → POST /quizzes/chapter-01/submit { "answers": {"q1":"A","q2":"B",...} }
   → Shows score screen: "80/100 — 4 correct out of 5"

3. PUT /progress/{userId}/quiz { "chapter_id": "chapter-01", "score": 80 }
   → Score recorded

4. Click "View Answers"
   → GET /quizzes/chapter-01/answers
   → Shows all questions with correct answers highlighted
```

### Scenario 4: Pro User AI Assessment
```
1. Log in as pro tier user → /premium
   → Page loads (CSR): assessment + synthesis tabs visible
   → Usage section shows tokens/cost

2. Assessment Tab:
   → Select "chapter-01" from dropdown
   → Enter question: "What is the difference between an agent and a chatbot?"
   → Enter answer (10+ chars)
   → Click "Submit" → button disabled, spinner shown
   → POST /premium/assess-answer
   → Show: score=85, feedback, strengths[], improvements[]

3. Synthesis Tab:
   → Select 3 chapters (multi-select)
   → Optional focus topic
   → POST /premium/synthesize
   → Show: synthesis narrative, key connections, knowledge graph
```

### Scenario 5: Free User Gate Test
```
1. Log in as free tier user → /learn
   → Chapters 4, 5 show lock icon

2. Click chapter-05 card
   → Upgrade modal appears: "This chapter requires Premium plan"
   → Shows pricing cards (Premium $9.99, Pro $19.99)

3. Navigate directly to /premium
   → Page shows upgrade prompt inline (not redirected)
   → Pricing cards displayed, AI forms NOT visible

4. Manually navigate to /learn/chapter-05
   → Access check returns has_access: false
   → Upgrade modal shown; chapter content never rendered
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | Yes | http://localhost:8000 | FastAPI backend URL |
| NEXT_PUBLIC_APP_NAME | No | Course Companion FTE | App display name |

**For Vercel production deploy**:
- Set `NEXT_PUBLIC_API_URL=https://course-companion-fte.fly.dev` in Vercel dashboard
