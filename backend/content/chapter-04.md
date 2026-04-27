# Agent Skills (SKILL.md)

**Estimated reading time: 11 minutes**

---

## What You'll Learn

- What agent skills are and why they matter for maintainability
- The five sections of a well-structured SKILL.md file
- The three types of skill triggers: keyword, intent, and state
- How to compose multiple skills in a single system prompt
- How to design multi-turn skill workflows
- Practical examples: Concept Explainer, Quiz Master, Socratic Tutor

---

## 1. What Are Agent Skills?

An **Agent Skill** is a reusable, self-contained capability packaged with its own instructions, context, and trigger conditions. Skills are defined in a `SKILL.md` file — a Markdown document that tells the agent exactly **when to activate** and **how to behave**.

Think of skills as plug-in behaviour modules for your agent. Instead of a single monolithic system prompt that attempts to handle everything, you decompose agent behaviour into discrete, focused skills that can be composed, tested, and updated independently.

> 💡 **Key Concept:** A skill is not a tool. Tools are functions the agent calls to interact with the world. Skills are _behavioural instructions_ that tell the agent how to respond in specific situations.

### Why Use Skills?

| Without Skills | With Skills |
|---|---|
| One giant system prompt trying to do everything | Modular, composable instructions |
| Hard to test individual behaviours | Each skill can be validated independently |
| Changes to one behaviour risk breaking others | Skills are isolated — update one without affecting others |
| Cannot be shared across different agents | Skills are reusable packages |
| Unclear when each behaviour should activate | Explicit trigger conditions per skill |

---

## 2. Anatomy of a SKILL.md File

A well-structured `SKILL.md` has five sections. Each section serves a specific purpose in guiding the agent's behaviour.

### Section 1: Skill Name and Purpose

```markdown
# Skill: Concept Explainer

Explain technical concepts clearly at the appropriate depth for the learner.
This skill ensures students get accurate, level-appropriate explanations
without being overwhelmed by jargon or bored by oversimplification.
```

### Section 2: Trigger Conditions

When should this skill activate?

```markdown
## Trigger

Activate this skill when the user:
- Asks "what is X?" or "explain X"
- Expresses confusion about a concept: "I don't understand", "what does X mean?"
- Requests a simpler explanation: "can you explain that more simply?"
- Uses phrases indicating conceptual confusion rather than task requests
```

### Section 3: Behaviour Instructions

Step-by-step instructions for what the agent should do:

```markdown
## Behaviour

1. Identify the exact concept the user wants explained.
2. Infer the user's knowledge level from their vocabulary and prior messages:
   - Beginner: uses general terms, asks "what is" questions
   - Intermediate: uses some technical terms, asks "how does" questions
   - Advanced: uses specific technical terms, asks "why does" or "when should I" questions
3. Choose explanation depth:
   - Beginner: analogy first, then plain definition
   - Intermediate: definition first, then example
   - Advanced: technical detail with edge cases and trade-offs
4. End with a concrete, runnable code example where applicable.
5. Ask: "Does this make sense? Want me to go deeper on any part?"
```

### Section 4: Constraints

What the skill must NOT do:

```markdown
## Constraints

- Never use technical jargon without defining it first
- Explain only one concept per response — if multiple are requested, ask which to start with
- Do not assume knowledge from previous sessions (each conversation is independent)
- Do not give the answer to a quiz question even if the user is confused
```

### Section 5: Output Format

How the response should be structured:

```markdown
## Output Format

**Concept**: [Name of the concept]
**In one sentence**: [Plain-language definition that a non-technical person could understand]
**Example**: [Concrete, real-world example or analogy]
**How it works** (if needed): [Technical explanation for intermediate/advanced users]
**Code example** (if applicable):
\```python
# Working code demonstrating the concept
\```
```

---

## 3. Complete Example: The Concept Explainer Skill

```markdown
# Skill: Concept Explainer

Explain technical AI and programming concepts at the right depth for this learner.

## Trigger

Activate when the user:
- Asks "what is X?", "explain X", "how does X work?"
- Expresses confusion: "I don't get it", "what does that mean?"
- Asks for clarification after reading chapter content

## Behaviour

1. Identify the concept from the user's message.
2. Infer level from vocabulary: beginner → analogy first; intermediate → definition + example; advanced → technical depth.
3. Provide the explanation using the output format below.
4. Include a code example for all programming concepts.
5. Confirm understanding: "Does this make sense?"

## Constraints

- One concept per response
- No jargon without definition
- Never spoil quiz answers

## Output Format

**[Concept Name]**
In plain English: [one-sentence definition]
Think of it like: [analogy if helpful]
Example: [concrete usage]

\```python
# Code demonstration
\```

Want to go deeper? Just ask.
```

---

## 4. Trigger Types

Skills can be activated by three types of triggers. Understanding which to use is critical for reliable skill routing.

### Keyword Triggers

Activate when the user's message contains specific words or phrases:

```markdown
## Trigger
Activate when the user message contains any of:
- "quiz me", "test me", "practice questions"
- "am I ready?", "let's do a quiz"
```

**Best for:** Clear, unambiguous intents with distinctive vocabulary

### Intent Triggers

Activate based on inferred user intent, even without specific words:

```markdown
## Trigger
Activate when the user appears to want practice or self-assessment —
even if they don't use the words "quiz" or "test". Signs include:
- Expressing desire to verify understanding
- Asking "how well do I know this?"
- Saying "I think I understand, let me check"
```

**Best for:** Behaviours where the user's phrasing varies widely

### State Triggers

Activate based on the state of the conversation:

```markdown
## Trigger
Activate when the user signals they have finished reading a chapter.
Indicators:
- "done", "finished", "I've read it"
- "what should I focus on?"
- "give me the key points"
```

**Best for:** Sequential workflows where context matters (e.g., "after chapter completion, offer a quiz")

---

## 5. Multi-Turn Skill Workflows

Skills can define multi-turn workflows — sequences of agent actions that span multiple messages. This is one of the most powerful features of the skill pattern.

```markdown
## Workflow: Quiz Session

1. **Introduce** (Turn 1)
   Say: "I'll ask you 5 questions on [chapter topic]. Take your time — this is practice, not a test."
   
2. **Ask Question** (Turns 2–6, one per question)
   Present ONE question at a time. Wait for the user's response.
   Never present multiple questions at once.
   
3. **Grade and Explain** (after each answer)
   - If correct: "Correct! Here's why: [brief explanation]"
   - If wrong: "Not quite. The answer is [correct answer] because [explanation]"
   
4. **Summarise** (final turn)
   Report: "You scored [X]/5. Strong on: [topics]. Review: [weak topics]."
   If score < 60%: "I recommend re-reading the [section name] section."
```

This workflow ensures the agent never jumps ahead, always explains answers, and provides actionable feedback at the end.

---

## 6. Composing Skills in a System Prompt

Multiple skills are combined by substituting each skill's content into a master system prompt:

```markdown
# Course Companion Agent

You are an AI tutor for the AI Agent Development course.
You have four skills. Apply the most relevant skill for each user message.

---

{CONCEPT_EXPLAINER_SKILL}

---

{QUIZ_MASTER_SKILL}

---

{SOCRATIC_TUTOR_SKILL}

---

{PROGRESS_MOTIVATOR_SKILL}

---

## Default Behaviour
If no skill matches the user's message:
- Answer helpfully within the scope of the course
- If the question is outside course scope, say so and redirect to the relevant chapter
- Never refuse to engage; always try to help the user make progress
```

At runtime, each `{SKILL_NAME}` placeholder is replaced with the full content of the corresponding `SKILL.md` file.

```python
def build_system_prompt(skill_files: dict[str, str]) -> str:
    template = open("system-prompt-template.md").read()
    for name, content in skill_files.items():
        template = template.replace(f"{{{name}}}", content)
    return template
```

---

## 7. Testing Skills

Each skill should be independently testable. Write test cases for each trigger type:

```python
def test_concept_explainer_keyword_trigger():
    """'what is X' should activate concept explainer."""
    response = run_agent("What is the perceive-reason-act-observe loop?")
    assert "In plain English:" in response or "In one sentence:" in response

def test_quiz_master_keyword_trigger():
    """'quiz me' should start a quiz session."""
    response = run_agent("Quiz me on chapter 1")
    assert "question" in response.lower()
    assert "?" in response

def test_default_behaviour():
    """Out-of-scope question should be redirected politely."""
    response = run_agent("What is the weather in Tokyo today?")
    assert "course" in response.lower() or "chapter" in response.lower()
```

---

## Summary

**Key takeaways from Chapter 4:**

- A `SKILL.md` file defines a **discrete, reusable agent behaviour** with trigger conditions, step-by-step instructions, constraints, and output format
- Three trigger types: **keyword** (exact words), **intent** (inferred meaning), **state** (conversation state)
- Skills are composed in the system prompt by **substituting their Markdown content at placeholder positions**
- Skills can define **multi-turn workflows** that guide the agent through sequences spanning multiple messages
- Skills are independently **testable** — write test cases for each trigger type and expected output format

---

## What's Next

→ **Chapter 5: Multi-Agent Systems** — Learn how to coordinate multiple specialised agents, implement orchestration patterns, and deploy agent systems to production.
