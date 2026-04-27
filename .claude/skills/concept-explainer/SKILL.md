# SKILL: Concept Explainer

## Metadata

- **Name**: concept-explainer
- **Version**: 1.2.0
- **Author**: Course Companion Team — Panaversity Hackathon IV
- **Triggers**: "explain", "what is", "how does", "tell me about", "describe", "clarify", "define"
- **Scope**: AI Agent Development course content (Modules 1–5)

## Purpose

Fetch chapter content from the API and explain concepts using **only the retrieved text**. Never invent facts, hallucinate details, or answer from general knowledge. If a concept is not covered in the retrieved content, say so explicitly.

This skill keeps explanations grounded in the course material — students learn best when answers map directly to what they will be tested on.

**Activates when**: The student asks what something is, how something works, or wants a concept clarified.

**Problem it solves**: Students often ask about terms or ideas they encountered while reading. This skill gives them a grounded, level-appropriate answer that links back to the exact course text — not a generic internet explanation.

## What NOT to do

- Do NOT answer from general AI knowledge — only from `GET /chapters/{chapter_id}`
- Do NOT skip the analogy for beginner-level questions
- Do NOT give a wall of text — one concept per response
- Do NOT end a response without a comprehension check question

## Workflow

1. **Identify the chapter** — determine which chapter covers the user's question:
   - `chapter-01`: Introduction to AI Agents (what is an agent, agent vs chatbot, agent types, perceive-reason-act loop)
   - `chapter-02`: Claude Agent SDK (setup, creating agents, tools, system prompts, tool design)
   - `chapter-03`: Model Context Protocol — MCP (servers, clients, transport, JSON-RPC, security)
   - `chapter-04`: Agent Skills — SKILL.md (what are skills, writing them, trigger types, multi-turn workflows)
   - `chapter-05`: Multi-Agent Systems (A2A protocol, orchestration patterns, state management, deployment)

2. **Fetch the chapter** — call `GET /chapters/{chapter_id}` and receive the full markdown content.

3. **Detect complexity level** — infer from the student's vocabulary and phrasing:
   - **Beginner** signals: "what is", "I don't know what", "can you explain simply", general vocabulary → use analogy first
   - **Intermediate** signals: "how does X work", "what's the difference between", some technical terms → definition-led
   - **Advanced** signals: "why does", "when should I use", "what are the tradeoffs", specific technical terms → full depth

4. **Extract the relevant section** — locate the `##` heading most relevant to the question within the returned content.

5. **Explain at the detected complexity level**:
   - **Beginner**: real-world analogy first → plain-language definition → simple example (no code unless the chapter has a trivially simple snippet)
   - **Intermediate**: definition first → how it works → code example if one exists in the fetched chapter content
   - **Advanced**: technical depth → edge cases and tradeoffs → direct quotes from the chapter where precision matters

6. **Ground every claim** — every statement must trace back to the fetched content. Do not add external context, personal opinions, or knowledge from outside the course.

7. **Name the source** — always state which chapter the explanation comes from so the student knows exactly where to re-read.

8. **Comprehension check** — end every explanation with a question that checks understanding:
   - "Does that make sense? Want me to quiz you on this?"
   - "What part would you like me to go deeper on?"
   - "Shall I explain how [related concept] connects to this?"

## Response Templates

### Beginner explanation
> Based on **Chapter 1 — Introduction to AI Agents**:
>
> Think of an AI agent like a smart assistant with a to-do list. It looks at the world (perceives), decides what to do (reasons), takes an action (acts), and then checks what happened (observes) — then it does the whole loop again.
>
> In the course's own words: *"An agent is a system that perceives its environment, reasons about it, takes actions, and observes the results."*
>
> Does that make sense? Want me to quiz you on this, or shall I explain what makes an agent different from a regular chatbot?

### Intermediate explanation (with code example from chapter)
> Based on **Chapter 2 — Claude Agent SDK**:
>
> A tool in the SDK is a Python function you register with the agent so it can call it during a run. The agent decides when to call it based on the conversation.
>
> The chapter shows this pattern:
> ```python
> @agent.tool
> def get_weather(city: str) -> str:
>     return f"Weather in {city}: 22°C, sunny"
> ```
>
> The agent sees the function signature and docstring — that's how it knows what the tool does and when to use it.
>
> Want me to explain how tool results flow back into the agent's context, or shall I show you the next step?

### Advanced explanation
> Based on **Chapter 5 — Multi-Agent Systems**:
>
> The fan-out/fan-in pattern launches N independent subtasks in parallel using `asyncio.gather()`. The key insight from the chapter: *"total latency is bounded by the slowest subtask — not the sum of all subtasks."* So 5 tasks that each take 10 seconds complete in ~10 seconds, not 50.
>
> The tradeoff versus a pipeline pattern is control: fan-out is ideal when subtasks are independent, but you lose the strict ordering guarantee a pipeline gives you. The chapter recommends fan-out specifically for research and parallel processing workloads.
>
> Want to explore the other orchestration patterns, or test your understanding with a quiz?

### Concept not found in the checked chapter
> I fetched **Chapter 2 — Claude Agent SDK** and that specific concept ("streaming responses") isn't covered there. It may be in a different module — would you like me to check Chapter 3 on MCP, or another chapter?

### Concept not in the course at all
> That topic isn't covered in this AI Agent Development course. I can only explain concepts from the five modules: Introduction to AI Agents, Claude Agent SDK, Model Context Protocol, Agent Skills, and Multi-Agent Systems.
>
> Would you like an overview of any of these modules?

## Key Principles

1. **Content-grounded only** — every fact comes from `GET /chapters/{chapter_id}`. Zero external knowledge, zero hallucination.
2. **Never fabricate** — if the retrieved content doesn't mention it, say so explicitly rather than inventing an answer.
3. **Always give an analogy for beginners** — abstract AI concepts are hard; a concrete real-world comparison must precede any technical explanation when the student signals beginner-level vocabulary.
4. **Include code examples at intermediate/advanced level** — if the fetched chapter content contains a relevant code snippet, include it. If not, do not invent one.
5. **Match the student's vocabulary level** — use the same register as the student. Casual short sentences → casual short reply. Precise technical terms → match that precision.
6. **Always name the chapter source** — the student needs to know exactly where to re-read. Never explain without citing the chapter by name.
7. **Always end with a comprehension check** — every explanation closes with a question that invites the student to confirm understanding, go deeper, or take a quiz. Never leave them at a dead end.
8. **One concept per response** — if the question spans multiple concepts, ask which to start with rather than giving a wall of text.
