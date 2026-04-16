# Module 4: Agent Skills (SKILL.md)

## What Are Agent Skills?

An Agent Skill is a reusable, self-contained capability packaged with its own instructions, context, and trigger conditions. Skills are defined in a `SKILL.md` file — a Markdown document that tells the agent exactly when to activate the skill and how to behave when it does.

Think of skills as **plug-in behaviour modules** for your agent. Instead of writing a single monolithic system prompt that tries to do everything, you decompose agent behaviour into discrete skills that can be composed, updated, and reused independently.

### Why Skills?

| Without Skills | With Skills |
|---|---|
| One giant system prompt | Modular, composable instructions |
| Hard to test individual behaviours | Each skill can be validated independently |
| Changes break unrelated behaviours | Skills are isolated |
| Cannot be shared across agents | Skills are reusable packages |

### Where SKILL.md Lives

```
my-agent/
├── skills/
│   ├── concept-explainer/
│   │   └── SKILL.md
│   ├── quiz-master/
│   │   └── SKILL.md
│   └── socratic-tutor/
│       └── SKILL.md
└── system-prompt.md
```

The agent's system prompt references the skills by including their content at runtime.

---

## Writing Effective SKILL.md Files

A well-structured `SKILL.md` has five sections:

### 1. Skill Name and Purpose

```markdown
# Skill: Concept Explainer

Explain technical concepts clearly at the appropriate level for the learner.
```

### 2. Trigger Conditions

Define precisely when this skill should activate:

```markdown
## Trigger

Activate this skill when the user:
- Asks "what is X?" or "explain X"
- Expresses confusion about a concept
- Asks for a simpler explanation
- Uses phrases like "I don't understand" or "can you clarify"
```

### 3. Behaviour Instructions

The core of the skill — what the agent should do:

```markdown
## Behaviour

1. Identify the concept the user wants explained.
2. Assess their level based on vocabulary and prior messages.
3. Choose the right explanation depth:
   - Beginner: analogy first, then definition
   - Intermediate: definition, then example
   - Advanced: technical detail with edge cases
4. Always end with a concrete example.
5. Ask "Does this make sense?" to confirm understanding.
```

### 4. Constraints

What the skill must NOT do:

```markdown
## Constraints

- Never use jargon without defining it first
- Do not explain more than one concept per response
- Do not assume knowledge from previous sessions
```

### 5. Output Format

How the response should be structured:

```markdown
## Output Format

**Concept**: [Name]
**In one sentence**: [Plain-language definition]
**Example**: [Concrete, real-world example]
**Deeper explanation** (if needed): [Technical detail]
```

### Complete SKILL.md Template

```markdown
# Skill: [Skill Name]

[One-paragraph description of what this skill does and why it exists.]

## Trigger

Activate when:
- [Condition 1]
- [Condition 2]

## Behaviour

[Step-by-step instructions for what the agent should do.]

## Constraints

- [What the agent must NOT do]

## Output Format

[How responses should be structured]

## Examples

**User**: [Example input]
**Agent**: [Example output]
```

---

## Skill Triggers and Workflows

### Trigger Types

**Keyword triggers** — activate on specific words or phrases:
```markdown
## Trigger
Activate when the user message contains: "quiz me", "test me", "practice"
```

**Intent triggers** — activate based on inferred user intent:
```markdown
## Trigger
Activate when the user appears to want practice problems or self-assessment,
even if they don't use the exact words "quiz" or "test".
```

**State triggers** — activate based on conversation state:
```markdown
## Trigger
Activate after the user has completed reading a chapter
(they indicate this by saying "done", "finished", "ready", or similar).
```

### Skill Workflows

Skills can define multi-turn workflows — sequences of agent actions that span multiple messages:

```markdown
## Workflow: Quiz Session

1. **Introduce**: Tell the user you will ask 5 questions on [chapter].
2. **Ask Q1**: Present the first question. Wait for response.
3. **Grade**: Evaluate the answer. Give feedback. Reveal correct answer if wrong.
4. **Repeat**: Continue for Q2–Q5.
5. **Summarise**: Give final score. Highlight weak areas. Suggest re-reading if score < 60%.
```

### Composing Skills in a System Prompt

```markdown
# Course Companion Agent

You are an AI tutor for the AI Agent Development course.

You have four skills. Apply the appropriate skill based on the user's message:

---

{CONCEPT_EXPLAINER_SKILL}

---

{QUIZ_MASTER_SKILL}

---

{SOCRATIC_TUTOR_SKILL}

---

{PROGRESS_MOTIVATOR_SKILL}

---

If no skill matches, respond helpfully and guide the user back to the course content.
```

At runtime, the `{SKILL_NAME}` placeholders are replaced with the content of each `SKILL.md` file.

---

## Summary

**3 key points from this module:**

1. A `SKILL.md` file defines a **discrete, reusable agent behaviour** with trigger conditions, step-by-step instructions, constraints, and output format — enabling modular agent design.
2. Skills are composed in the system prompt by **including their Markdown content** — the agent learns all skills at once and activates the appropriate one based on triggers.
3. Skills can define **multi-turn workflows** that guide the agent through sequences of actions spanning multiple messages — not just single responses.
