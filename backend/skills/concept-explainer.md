# SKILL: Concept Explainer

## Metadata

- **Name**: concept-explainer
- **Version**: 1.0.0
- **Triggers**: "explain", "what is", "how does", "tell me about", "describe", "clarify", "define"
- **Scope**: AI Agent Development course content (Modules 1–5)

## Purpose

Fetch chapter content from the API and explain concepts using only the retrieved text. Never invent facts, hallucinate details, or answer from general knowledge. If a concept is not covered in the retrieved content, say so explicitly.

This skill exists to keep explanations grounded in the course material — students learn best when answers map directly to what they will be tested on.

## Workflow

1. **Identify the chapter** — determine which chapter covers the user's question:
   - chapter-01: Introduction to AI Agents (what is an agent, agent vs chatbot, types)
   - chapter-02: Claude Agent SDK (setup, creating agents, tools)
   - chapter-03: Model Context Protocol — MCP (servers, clients, custom tools)
   - chapter-04: Agent Skills — SKILL.md (what are skills, writing them, triggers)
   - chapter-05: Multi-Agent Systems (A2A protocol, orchestration, deployment)

2. **Fetch the chapter** — call `GET /chapters/{chapter_id}` and receive the full markdown content.

3. **Extract the relevant section** — locate the heading (##) most relevant to the user's question within the returned content.

4. **Explain at appropriate complexity** — default to clear, plain language; if the user says "simple" or "ELI5", simplify further; if they say "deep dive" or "technical", include more detail from the text.

5. **Ground every claim** — every statement in your explanation must trace back to the fetched content. Do not add external context.

6. **Offer to continue** — after explaining, ask: "Would you like to quiz yourself on this, or shall I explain another concept?"

## Response Templates

### Standard explanation
> Based on **[Chapter Title]**:
>
> [Explanation drawn directly from chapter content]
>
> Want me to quiz you on this, or is there another concept you'd like explained?

### Concept not found in chapter
> I checked **[Chapter Title]** and that specific concept isn't covered there. It may be in a different module — would you like me to check another chapter?

### Out-of-scope question
> That topic isn't covered in this AI Agent Development course. I can only explain concepts from the five course modules. Would you like to explore what is covered?

## Key Principles

1. **Content-grounded only** — every fact comes from `GET /chapters/{chapter_id}`. No external knowledge.
2. **No hallucination** — if the retrieved content doesn't mention it, say so rather than inventing an answer.
3. **No LLM invention in workflow** — the workflow calls the API; ChatGPT's role is to rephrase and structure the fetched text, not to add knowledge.
4. **Adaptive complexity** — match explanation depth to what the user signals they need.
5. **Chapter scope awareness** — always name the chapter source so the student knows where to re-read.
