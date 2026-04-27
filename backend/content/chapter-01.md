# Introduction to AI Agents

**Estimated reading time: 12 minutes**

---

## What You'll Learn

- What defines an AI agent and how it differs from a simple AI model
- The perceive-reason-act-observe loop that drives every agent
- The fundamental difference between a chatbot and an AI agent
- The three core agent types: reactive, deliberative, and hybrid
- How agents decide, act, and maintain context across multiple steps
- Real-world applications and current limitations

---

## 1. What is an AI Agent?

An AI agent is a software system that **perceives its environment, makes decisions, and takes actions to achieve defined goals** — all without requiring a human to direct every individual step.

Unlike a simple function that maps one input to one output, an agent operates in a continuous loop. It receives information, thinks about what to do next, takes an action, observes the result, and then repeats.

> 💡 **Key Concept:** An AI agent is defined by its _autonomy_ — the ability to make multi-step decisions and change external state without per-step human instruction.

### The Perceive-Reason-Act-Observe Loop

Every AI agent, regardless of framework or model, runs on this fundamental cycle:

1. **Perceive** — receive input from the environment (text, data, tool results, sensor readings)
2. **Reason** — analyse the input in context of the agent's goal and decide what to do next
3. **Act** — execute an action: call a tool, write a response, request more information, or modify state
4. **Observe** — receive the result of the action and update internal understanding

This loop may run once for a simple task or hundreds of times for a complex multi-step workflow. The number of iterations is not fixed — the agent decides when it has achieved its goal.

```python
# Conceptual agent loop
while not goal_achieved:
    perception = perceive(environment)
    decision = reason(perception, goal, memory)
    action_result = act(decision)
    memory = observe(action_result, memory)
```

### Key Properties of an Agent

| Property | Description |
|---|---|
| **Goal-directed** | Operates toward an objective, not just responding to prompts |
| **Tool-using** | Can call external functions: APIs, databases, code execution |
| **Context-aware** | Maintains memory of prior steps within a session |
| **Autonomous** | Makes multi-step decisions without per-step human input |

---

## 2. Agent vs Traditional Chatbot

Many people use "chatbot" and "AI agent" interchangeably. The distinction is fundamental and affects how you architect your system.

| Feature | Chatbot | AI Agent |
|---|---|---|
| Interaction model | Single turn or short conversation | Multi-step task execution |
| Tool use | Rarely | Central capability |
| Primary goal | Respond to the user | Complete a task |
| Memory | Usually stateless | Maintains session context |
| External actions | Text output only | Can modify external state |
| Decision making | One response per input | Plans sequences of actions |
| Example | FAQ bot answering "What are your hours?" | Code reviewer that reads files, runs tests, and submits a PR |

**A chatbot** answers: *"What is the capital of France?"* → *"Paris."*

**An agent** executes: *"Book me a flight to Paris"* → checks calendar, searches flights, compares prices, books the best option, confirms via email.

### When to Use Which

Chatbots are the right choice for:
- FAQ deflection and support routing
- Simple question answering with static information
- Guided conversation flows with known branches

Agents are the right choice for:
- Multi-step workflows that require tool calls
- Tasks that branch based on intermediate results
- Processes that need to read and write external systems
- Automations that run without human oversight

Building an agent for a simple FAQ system wastes resources. Building a chatbot for a complex workflow creates a brittle system that breaks on edge cases.

---

## 3. Core Components of an Agent

Every production AI agent is built from four functional components. Understanding each one is essential for building reliable agents.

### 3.1 Perception

The agent's input layer. Perception includes:
- **Natural language input** from users
- **Tool results** from previous actions
- **Environmental data** from APIs, databases, or sensors
- **System state** (what has already been done in this session)

Good perception design means giving the agent the right information at the right time — not everything at once.

### 3.2 Memory

How the agent retains information across steps:

- **In-context memory**: the conversation history passed in every API call (ephemeral, lost when the session ends)
- **External memory**: a database or vector store the agent can query (persistent, survives session restarts)
- **Semantic memory**: retrieved via similarity search from a knowledge base

For most agents, in-context memory is sufficient. Use external memory when tasks span multiple sessions or require retrieval of large knowledge bases.

### 3.3 Planning

How the agent decides what to do next. Planning can be:

- **Reactive**: respond directly to the latest input without looking ahead
- **Deliberative**: build a plan before executing (e.g., "I will first search, then summarise, then write")
- **Hierarchical**: break a large goal into sub-goals, each of which gets its own plan

> 💡 **Key Concept:** Planning quality is the primary determinant of agent reliability. A well-planned agent with average tools outperforms a poorly planned agent with excellent tools.

### 3.4 Action

What the agent can actually do. Common action types:

- **Tool calls**: invoke registered functions (read file, search web, query database)
- **Text generation**: produce output for the user
- **State modification**: update a database, send an email, create a ticket
- **Agent delegation**: hand off a sub-task to another specialised agent

---

## 4. Types of AI Agents

### Reactive Agents

React directly to the current input without maintaining internal state between turns.

**Characteristics:**
- Fast and predictable — no planning overhead
- No memory of prior interactions in the current model
- Suitable for stateless, independent tasks

**Best for:** Classifiers, real-time response systems, high-volume low-complexity tasks

**Example:** A sentiment classifier that labels each customer message as positive, neutral, or negative — each message is evaluated independently, with no regard for prior messages.

### Deliberative Agents

Maintain an internal world model and **plan sequences of actions** before executing.

**Characteristics:**
- Build and update a model of the current situation
- Plan ahead before acting — may reason through multiple options
- Can reason about future states and consequences

**Best for:** Research tasks, complex workflows, tasks with significant branching

**Example:** A research agent that first outlines a plan, then searches three different sources, synthesises the findings, evaluates quality, and finally writes a report.

### Hybrid Agents

Combine reactive and deliberative behaviours. Use a fast reactive path for routine inputs and a deliberative path for complex decisions.

**Characteristics:**
- Fast-path for simple, well-understood inputs
- Slow-path deliberation for ambiguous or complex inputs
- Most production AI agents fall into this category

**Example:** Claude with tools. It responds immediately to simple questions ("What is 2 + 2?") but activates a multi-step reasoning loop when asked to complete a complex coding task.

---

## 5. Real-World Agent Examples

```python
from anthropic import Anthropic

client = Anthropic()

# A simple research agent
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    system="""You are a research agent. When given a topic:
1. Identify the key sub-questions to answer
2. Search for relevant information using your tools
3. Synthesise findings into a structured report
4. Cite your sources""",
    tools=[search_tool, summarise_tool],
    messages=[{"role": "user", "content": "Research the current state of AI agent frameworks"}]
)
```

**Production examples by domain:**

| Domain | Agent Example |
|---|---|
| Software development | Code review agent reads PR, runs tests, comments on issues |
| Customer support | Triage agent classifies tickets, routes to correct team, drafts responses |
| Data analysis | ETL agent fetches data, cleans it, runs analysis, generates reports |
| DevOps | Incident response agent reads alerts, queries metrics, drafts remediation plan |
| Research | Literature review agent searches papers, extracts findings, writes summaries |

---

## 6. Agent Autonomy Levels

Not all agents operate at the same level of autonomy. Think of this as a spectrum:

1. **Level 0 — Assisted**: Human makes every decision; AI provides information only
2. **Level 1 — Supervised**: AI suggests actions; human approves each one
3. **Level 2 — Conditional**: AI acts autonomously within a defined scope; escalates edge cases
4. **Level 3 — Delegated**: AI handles full task autonomously; reports outcome to human
5. **Level 4 — Fully Autonomous**: AI operates indefinitely; self-assigns tasks; minimal human oversight

Most production deployments today operate at Level 2 or 3. Level 4 is appropriate only for well-tested, reversible tasks.

---

## 7. Agent Limitations

Understanding limitations is as important as understanding capabilities.

- **Context window limits**: agents cannot hold unlimited information in memory — long tasks require external memory or summarisation
- **Hallucination**: models can produce confident but incorrect outputs — tool use with ground-truth data sources mitigates this
- **Tool reliability**: agents are only as reliable as their tools — broken APIs cause agent failures
- **Cost accumulation**: long multi-step loops with large context windows are expensive — design for efficiency
- **Determinism**: the same input may produce different outputs across runs — important for audit trails

---

## Summary

**Key takeaways from Chapter 1:**

- An AI agent is defined by its **perceive-reason-act-observe loop** — this cycle is what separates agents from simple chatbots or functions
- The critical difference between a chatbot and an agent is **tool use and multi-step autonomy** — agents can modify external state
- Agents have four core components: **perception, memory, planning, and action** — reliability is determined primarily by planning quality
- Agent types range from **reactive** (fast, stateless) to **deliberative** (planned, stateful) to **hybrid** (most production agents)
- Autonomy exists on a **spectrum** — choose the right level for your use case based on risk, reversibility, and human oversight requirements

---

## What's Next

→ **Chapter 2: Claude Agent SDK** — Learn how to build your first agent using the Anthropic SDK, write effective system prompts, and design reliable tools.
