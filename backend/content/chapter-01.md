# Module 1: Introduction to AI Agents

## What is an AI Agent?

An AI agent is a software system that perceives its environment, makes decisions, and takes actions to achieve defined goals — all without requiring a human to direct every step.

Unlike a simple function that maps one input to one output, an agent operates in a loop:

1. **Perceive** — receive input (text, data, tool results)
2. **Reason** — decide what to do next based on goals and context
3. **Act** — call a tool, write a response, or request more information
4. **Observe** — receive the result and update its understanding

This perceive-reason-act-observe loop is the defining characteristic of an agent. The loop may run once or hundreds of times depending on task complexity.

### Key Properties of an Agent

- **Goal-directed**: operates toward an objective, not just a prompt
- **Tool-using**: can call external functions (APIs, databases, code execution)
- **Context-aware**: maintains memory of prior steps within a session
- **Autonomous**: makes multi-step decisions without per-step human input

---

## Agent vs Chatbot

Many people confuse AI agents with chatbots. The distinction is fundamental:

| Property | Chatbot | AI Agent |
|---|---|---|
| Interaction model | Single turn or short conversation | Multi-step task execution |
| Tool use | Rarely | Central capability |
| Goal | Respond to the user | Complete a task |
| Memory | Usually stateless | Maintains session context |
| Actions | Text output only | Can modify external state |
| Example | FAQ bot | Code reviewer that reads files, runs tests, and submits a PR |

A chatbot answers the question "What is the capital of France?"  
An agent books a flight to Paris, checks your calendar, and emails the itinerary.

### Why This Matters

Building the wrong system for the wrong job is expensive. Chatbots are appropriate for:
- FAQ and support deflection
- Simple question answering
- Guided conversation flows

Agents are appropriate for:
- Multi-step workflows
- Tasks requiring tool calls (search, code execution, APIs)
- Processes that branch based on intermediate results

---

## Types of Agents

### Reactive Agents

React directly to the current input without maintaining internal state between turns.

**Characteristics:**
- Fast and predictable
- No memory of prior interactions
- Suitable for stateless tasks

**Example:** A sentiment classifier that labels each customer message independently.

### Deliberative Agents

Maintain an internal world model and plan sequences of actions before executing.

**Characteristics:**
- Build and update a model of the environment
- Plan ahead before acting
- Can reason about future states

**Example:** A research agent that outlines a plan, searches multiple sources, synthesises findings, then writes a report.

### Hybrid Agents

Combine reactive and deliberative behaviours — reacting quickly to simple inputs while deliberating on complex sub-tasks.

**Characteristics:**
- Fast-path for routine actions
- Slow-path for complex reasoning
- Most production AI agents fall here

**Example:** Claude with tools — responds immediately to simple questions but invokes a deliberative loop when asked to complete multi-step coding tasks.

---

## Summary

**3 key points from this module:**

1. An AI agent is defined by its perceive-reason-act-observe loop, not by any particular model or framework.
2. The critical difference between a chatbot and an agent is **tool use and multi-step autonomy** — agents can change external state.
3. Most production agents are **hybrid** — combining fast reactive responses with deliberative planning for complex sub-tasks.
