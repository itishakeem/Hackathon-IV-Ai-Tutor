# Multi-Agent Systems

**Estimated reading time: 15 minutes**

---

## What You'll Learn

- Why single agents have fundamental limitations and when to use multiple agents
- The Agent-to-Agent (A2A) protocol and communication patterns
- The four key orchestration patterns: hierarchical, pipeline, fan-out/fan-in, and debate
- How to manage state in stateless multi-agent architectures
- Observability and distributed tracing across agent boundaries
- Production deployment with containers, failure handling, and retry policies

---

## 1. Why Multi-Agent Systems?

A single agent running in a single context window has four hard limits:

| Limit | Problem | Multi-Agent Solution |
|---|---|---|
| **Context window** | One agent cannot hold an entire large codebase in memory | Split work across specialised agents, each with its own context |
| **Specialisation** | A generalist agent is worse at every task than a specialist | Deploy specialist agents for each domain |
| **Parallelism** | One agent processes sequentially | Multiple agents work on subtasks simultaneously |
| **Reliability** | If one context fails, the whole task fails | If one agent fails, others can retry or compensate |

> 💡 **Key Concept:** Multi-agent systems don't make individual agents smarter — they enable **parallelism, specialisation, and fault isolation** that a single agent cannot achieve alone.

---

## 2. Agent-to-Agent (A2A) Communication

The **Agent-to-Agent (A2A) protocol** defines how agents discover each other, delegate tasks, and exchange results.

### Communication Patterns

**Synchronous** — orchestrator waits for the subagent to complete:

```
Orchestrator → delegate_task(task) → Subagent
Orchestrator  <waits>
Orchestrator ← return_result(result) ← Subagent
```

Use when: the orchestrator needs the result before it can proceed.

**Asynchronous** — orchestrator continues other work while the subagent processes:

```
Orchestrator → delegate_task(task, callback_url) → Subagent
Orchestrator → [continues other work]
Subagent → callback_url(result) → Orchestrator
```

Use when: multiple independent subtasks can run in parallel.

**Broadcast** — orchestrator sends the same task to multiple agents for redundancy or consensus:

```
Orchestrator → task → Subagent A
             → task → Subagent B
             → task → Subagent C
             ← results ← all three
```

Use when: you need independent perspectives or want to select the best answer.

### Agent Cards

An **Agent Card** is a JSON document that describes what an agent can do. It's the A2A equivalent of an MCP server's tool list:

```json
{
  "name": "code-reviewer",
  "version": "1.2.0",
  "description": "Reviews Python code for correctness, style, and security vulnerabilities.",
  "capabilities": ["code_review", "security_scan", "style_check"],
  "endpoint": "https://agents.example.com/code-reviewer",
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "Path to the Python file to review"
      },
      "review_type": {
        "type": "string",
        "enum": ["full", "security", "style"],
        "default": "full"
      }
    },
    "required": ["file_path"]
  }
}
```

An orchestrator reads Agent Cards at startup to understand what specialist agents are available and what tasks each can handle.

---

## 3. The Four Orchestration Patterns

### Pattern 1: Hierarchical Orchestration

One orchestrator manages a team of specialist subagents:

```
Orchestrator (planner + coordinator)
├── Research Agent    (web search, document reading)
├── Writer Agent      (content drafting)
├── Reviewer Agent    (critique and editing)
└── Publisher Agent   (formatting, output)
```

**How it works:**
1. Orchestrator receives a high-level goal
2. Breaks the goal into subtasks
3. Delegates each subtask to the most appropriate specialist
4. Collects and aggregates results
5. Handles failures by retrying or delegating to a different agent

**Best for:** Complex tasks where work can be clearly divided by domain expertise.

### Pattern 2: Pipeline

Agents form a linear chain. Each agent's output becomes the next agent's input:

```
Input → Extractor → Transformer → Validator → Formatter → Output
```

```python
async def run_pipeline(input_data: str) -> str:
    extracted = await extractor_agent.run(input_data)
    transformed = await transformer_agent.run(extracted)
    validated = await validator_agent.run(transformed)
    return await formatter_agent.run(validated)
```

**Best for:** ETL-style workflows where each step has a clear input/output contract and order matters. Predictable, easy to debug, easy to test each stage independently.

### Pattern 3: Fan-Out / Fan-In

The orchestrator splits a task into independent parallel subtasks, waits for all results, then merges:

```python
import asyncio

async def fan_out_research(topic: str) -> str:
    # Launch 3 independent research tasks in parallel
    results = await asyncio.gather(
        academic_agent.search(topic),
        news_agent.search(topic),
        docs_agent.search(topic)
    )
    
    # Merge and synthesise results
    combined = "\n\n---\n\n".join(results)
    return await synthesis_agent.run(combined)
```

> 💡 **Key Concept:** In fan-out/fan-in, total latency is bounded by the **slowest subtask** — not the sum of all subtasks. Running 5 tasks that each take 10 seconds still takes ~10 seconds, not 50 seconds.

**Best for:** Tasks where subtasks are independent and parallel execution significantly reduces total latency.

### Pattern 4: Debate

Multiple agents solve the same problem independently. A judge agent evaluates all answers and selects or synthesises the best one:

```
Problem → Agent A → Solution A ─┐
        → Agent B → Solution B ─┼→ Judge Agent → Final Answer
        → Agent C → Solution C ─┘
```

```python
async def debate(problem: str) -> str:
    # Three agents independently propose solutions
    solutions = await asyncio.gather(
        agent_a.solve(problem),
        agent_b.solve(problem),
        agent_c.solve(problem)
    )
    
    # Judge evaluates and selects the best
    return await judge_agent.evaluate(problem, solutions)
```

**Best for:** High-stakes decisions where accuracy matters more than speed. The redundancy of multiple independent solutions reduces the risk of systematic errors.

| Pattern | Agents | Order | Best For |
|---|---|---|---|
| Hierarchical | Many specialists | Delegated | Complex multi-domain tasks |
| Pipeline | Sequential chain | Strict | ETL, data transformation |
| Fan-out/Fan-in | Parallel workers | Independent | Research, parallel processing |
| Debate | Redundant solvers | Independent + judge | High-stakes decisions |

---

## 4. State Management

Agents should be **stateless by default** — all shared state lives in external storage. This enables scaling, restarts, and replacements without data loss.

```
Agent A ─┐
Agent B ─┼─→ External State Store ←─┬─ Agent A
Agent C ─┘                           ├─ Agent B
                                     └─ Agent C
```

### State Type to Storage Mapping

| State Type | Storage | Reason |
|---|---|---|
| Session context (active conversation) | Redis (short TTL) | Fast access, auto-expires |
| Task results | PostgreSQL | Durable, queryable |
| Large artifacts (files, reports) | Object storage (R2 / S3) | Cost-efficient at scale |
| Agent registry (who can do what) | PostgreSQL or etcd | Consistent, discoverable |

### Passing Context Between Agents

```python
import uuid
import redis

redis_client = redis.Redis()

def store_context(trace_id: str, data: dict) -> None:
    """Store context for the current trace (15-minute TTL)."""
    import json
    redis_client.setex(
        f"ctx:{trace_id}",
        900,  # 15 minutes
        json.dumps(data)
    )

def get_context(trace_id: str) -> dict:
    """Retrieve context for the current trace."""
    import json
    raw = redis_client.get(f"ctx:{trace_id}")
    return json.loads(raw) if raw else {}
```

---

## 5. Observability and Distributed Tracing

In multi-agent systems, a single user request may touch 5+ agents. Debugging requires **distributed tracing** — the ability to follow a request across all agent boundaries.

### The Trace ID Pattern

Assign a UUID at the entry point and pass it through every inter-agent call:

```python
import uuid

async def handle_user_request(user_input: str) -> str:
    trace_id = str(uuid.uuid4())  # One trace ID for the entire workflow
    
    result = await orchestrator.run(
        input=user_input,
        trace_id=trace_id  # Passed to every subagent
    )
    return result
```

### Structured Log Format

Every agent should emit structured logs with these fields:

```json
{
  "trace_id": "a3f9-...",
  "agent_id": "research-agent",
  "task_id": "task-42",
  "event": "tool_call_completed",
  "tool": "web_search",
  "duration_ms": 432,
  "status": "success",
  "timestamp": "2025-04-25T10:23:45Z"
}
```

### Key Metrics to Monitor

- **Task completion rate** per agent (target: >99%)
- **Retry rate** (high retry rate indicates tool or input quality problems)
- **p95 latency** per agent (set alerts when SLO is breached)
- **Error rate** (alert when any agent exceeds 1% error rate)

---

## 6. Failure Handling and Retry Policies

Every agent call in a production system must have three policies defined:

```python
async def delegate_with_retry(
    agent,
    task: dict,
    max_retries: int = 3,
    timeout_seconds: float = 30.0
) -> dict:
    """Delegate a task with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            return await asyncio.wait_for(
                agent.execute(task),
                timeout=timeout_seconds
            )
        except asyncio.TimeoutError:
            if attempt == max_retries - 1:
                raise  # Exhausted retries — escalate
            wait = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
            await asyncio.sleep(wait)
        except AgentError as e:
            if e.is_retryable and attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError("Max retries exceeded")
```

| Policy | What to Define | Example |
|---|---|---|
| **Timeout** | Max time to wait for a subagent response | 30 seconds |
| **Retry policy** | How many retries, what backoff strategy | 3 retries, exponential backoff |
| **Fallback** | What to do when retries are exhausted | Return partial result, escalate to human, use cached result |

---

## 7. Production Deployment

### Container Architecture

Each agent runs as an independent container:

```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY pyproject.toml .
RUN pip install uv && uv sync --frozen

COPY . .

# Expose health check endpoint
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["uv", "run", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8080"]
```

### Agent Registry Pattern

Maintain a registry so the orchestrator knows what agents are available:

```python
AGENT_REGISTRY = {
    "research": {
        "endpoint": "http://research-agent:8080",
        "capabilities": ["web_search", "document_read"],
        "max_concurrent": 5
    },
    "writer": {
        "endpoint": "http://writer-agent:8080",
        "capabilities": ["draft_content", "edit_content"],
        "max_concurrent": 3
    }
}
```

### Cost Management

Multi-agent systems can accumulate significant LLM costs. Control them with:

- **Context budgets**: limit max tokens per agent per call
- **Caching**: cache tool results for identical inputs (TTL-based)
- **Model selection**: use smaller, cheaper models for simple subagents
- **Monitoring**: alert when daily cost exceeds threshold

---

## Summary

**Key takeaways from Chapter 5:**

- Multi-agent systems overcome single-agent limits — **context, specialisation, parallelism, and reliability** — by distributing work across specialised agents
- The four orchestration patterns: **hierarchical** (delegated specialisation), **pipeline** (sequential ETL), **fan-out/fan-in** (parallel, bounded by slowest), **debate** (redundant + judge)
- Agents should be **stateless** — all shared state in external storage enables scaling and fault tolerance
- Distributed tracing with a **shared trace ID** is non-negotiable in production multi-agent systems
- Every agent call needs three explicit policies: **timeout, retry, and fallback** — these are not optional

---

## What's Next

You have completed all 5 chapters of the AI Agent Development course.

**Recommended next steps:**

1. Build a minimal single-agent using the Claude SDK (Chapter 2 project)
2. Package one tool as an MCP server (Chapter 3 project)
3. Implement a fan-out pattern with 2–3 specialist agents (Chapter 5 project)
4. Deploy to production using the containerisation pattern from this chapter

→ Test your knowledge: take the **Chapter 5 quiz** to verify your understanding of multi-agent architectures.
