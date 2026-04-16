# Module 5: Multi-Agent Systems

## Agent-to-Agent (A2A) Protocol

In a multi-agent system, agents collaborate to complete tasks that are too complex for a single agent. The **Agent-to-Agent (A2A) protocol** defines how agents discover each other, delegate tasks, and exchange results.

### Why Multi-Agent?

Single agents have limits:
- **Context window**: one agent cannot hold an entire large codebase in memory
- **Specialisation**: a generalist agent is worse than a specialist at every task
- **Parallelism**: one agent processes sequentially; many agents work in parallel
- **Reliability**: if one agent fails, others can retry or compensate

Multi-agent systems address all four limits.

### A2A Communication Patterns

**Synchronous call** — orchestrator waits for subagent result:
```
Orchestrator → [delegate task] → Subagent
Orchestrator ← [return result] ← Subagent
```

**Asynchronous call** — orchestrator continues while subagent works:
```
Orchestrator → [delegate task] → Subagent
Orchestrator → [other work]
Orchestrator ← [result ready] ← Subagent (via callback or polling)
```

**Broadcast** — orchestrator sends the same task to multiple subagents:
```
Orchestrator → [task] → Subagent A
             → [task] → Subagent B
             → [task] → Subagent C
             ← [results] ← all three
```

### Agent Cards

An **Agent Card** is a JSON document that describes what an agent can do — its name, capabilities, and the endpoint to call it. This is the A2A equivalent of an MCP server's tool list:

```json
{
  "name": "code-reviewer",
  "version": "1.0.0",
  "description": "Reviews Python code for correctness, style, and security.",
  "capabilities": ["code_review", "security_scan", "style_check"],
  "endpoint": "https://agents.example.com/code-reviewer",
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {"type": "string"},
      "review_type": {"type": "string", "enum": ["full", "security", "style"]}
    }
  }
}
```

---

## Orchestration Patterns

### Hierarchical Orchestration

One orchestrator agent manages a team of specialist subagents:

```
Orchestrator (planner)
├── Research Agent    (searches the web, reads docs)
├── Writer Agent      (drafts content)
├── Reviewer Agent    (critiques and edits)
└── Publisher Agent   (formats and outputs)
```

The orchestrator breaks the goal into tasks, delegates to the right specialist, aggregates results, and handles failures.

### Pipeline Pattern

Agents form a linear chain — each agent's output is the next agent's input:

```
Input → Extractor → Transformer → Validator → Output
```

Pipelines are predictable and easy to debug. Use them for ETL-style workflows.

### Fan-out / Fan-in Pattern

The orchestrator splits a task into parallel subtasks, waits for all results, then merges:

```python
import asyncio

async def fan_out(orchestrator, tasks):
    results = await asyncio.gather(*[
        orchestrator.delegate(task) for task in tasks
    ])
    return orchestrator.merge(results)
```

Use fan-out when subtasks are independent and the overall latency is bounded by the slowest subtask (not the sum of all).

### Debate Pattern

Multiple agents solve the same problem independently. A judge agent evaluates all answers and selects or synthesises the best one:

```
Problem → Agent A (solution A) ─┐
        → Agent B (solution B) ─┼→ Judge → Final answer
        → Agent C (solution C) ─┘
```

Use the debate pattern for high-stakes decisions where accuracy matters more than speed.

---

## Production Deployment

### Containerisation

Each agent runs as an independent container. Use Docker and a container orchestrator (Kubernetes or Fly.io):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install uv && uv sync
COPY . .
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### State Management

Agents are stateless by default — all shared state lives in external storage:

| State type | Storage |
|---|---|
| Session context | Redis (short TTL) |
| Task results | PostgreSQL |
| Large artifacts | Object storage (R2 / S3) |
| Agent registry | PostgreSQL or etcd |

### Observability

In multi-agent systems, debugging requires **distributed tracing** — the ability to follow a request across agent boundaries:

1. **Trace ID**: assign a UUID at the entry point; pass it in every inter-agent call
2. **Structured logs**: every agent logs `{trace_id, agent_id, task_id, duration_ms, status}`
3. **Metrics**: track task completion rate, retry rate, and p95 latency per agent
4. **Alerts**: alert when any agent's error rate exceeds 1% or p95 latency exceeds SLO

### Failure Handling

```python
async def delegate_with_retry(agent, task, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await agent.execute(task)
        except AgentTimeoutError:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # exponential backoff
```

Always define:
- **Timeout**: max time to wait for a subagent (e.g., 30s)
- **Retry policy**: how many times to retry and with what backoff
- **Fallback**: what to do when retries are exhausted

---

## Summary

**3 key points from this module:**

1. Multi-agent systems overcome single-agent limits (context, specialisation, parallelism, reliability) by distributing work across **specialised agents** coordinated by an orchestrator.
2. The four key orchestration patterns are **hierarchical, pipeline, fan-out/fan-in, and debate** — choose based on whether tasks are sequential, parallel, or require consensus.
3. Production multi-agent systems require **stateless agents + external state storage, distributed tracing with a shared trace ID, and explicit retry/timeout/fallback policies** — these are not optional in production.
