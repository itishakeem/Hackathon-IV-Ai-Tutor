# Claude Agent SDK

**Estimated reading time: 14 minutes**

---

## What You'll Learn

- How to install and configure the Anthropic SDK
- The structure of a basic Claude API call
- How to build a tool-using agent with a complete loop
- How to write effective system prompts
- Best practices for tool design and JSON Schema
- How to handle errors and test your agents

---

## 1. SDK Setup and Installation

The Anthropic SDK is a Python library that provides a clean interface to Claude's APIs. It handles HTTP communication, retries, and response parsing — so you can focus on building agent logic.

### Prerequisites

- Python 3.10 or higher
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# Using pip
pip install anthropic

# Using uv (recommended for new projects)
uv add anthropic
```

### Configuration

Never hardcode your API key in source files. Use environment variables:

```bash
# In your shell or .env file
export ANTHROPIC_API_KEY="sk-ant-..."
```

Load it in Python:

```python
from dotenv import load_dotenv
import anthropic

load_dotenv()  # reads from .env file
client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY automatically
```

### Verify the Installation

```python
import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=100,
    messages=[{"role": "user", "content": "Say hello in one word."}]
)
print(response.content[0].text)  # → "Hello!"
```

---

## 2. Your First Agent

Every agent built with the Claude SDK has three core elements:

1. **A client** — the `anthropic.Anthropic()` instance that manages API calls
2. **A system prompt** — defines the agent's persona, capabilities, and constraints
3. **Tools** — named functions the agent can invoke to interact with the world

### Minimal Agent Without Tools

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful assistant. Be concise and accurate.",
    messages=[
        {"role": "user", "content": "What is the difference between a function and a method?"}
    ]
)

print(response.content[0].text)
```

> 💡 **Key Concept:** The `system` parameter sets the agent's identity and constraints. Everything in the system prompt is always in scope — the model reads it before processing every user message.

---

## 3. Building an Agent with Tools

Tools transform Claude from a text generator into an agent that can take real-world actions. A tool is a named function with a description and an input schema.

### Defining a Tool

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather conditions for a city. Use this when the user asks about weather in a specific location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The name of the city, e.g. 'Tokyo' or 'New York'"
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature units (default: celsius)",
                    "default": "celsius"
                }
            },
            "required": ["city"]
        }
    }
]
```

### The Complete Tool Loop

Claude signals that it wants to use a tool by returning `stop_reason = "tool_use"`. Your code must execute the tool and return the result before Claude can continue.

```python
import anthropic
import json

client = anthropic.Anthropic()

def get_weather(city: str, units: str = "celsius") -> str:
    # In production, call a real weather API
    return f"Sunny, 22°C in {city} (converted: {22 * 9/5 + 32:.0f}°F)"

messages = [{"role": "user", "content": "What is the weather in Tokyo?"}]

while True:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages
    )

    # Done — Claude has finished the task
    if response.stop_reason == "end_turn":
        print(response.content[0].text)
        break

    # Claude wants to use a tool
    if response.stop_reason == "tool_use":
        # Find the tool_use block
        tool_block = next(b for b in response.content if b.type == "tool_use")
        
        # Execute the tool
        if tool_block.name == "get_weather":
            result = get_weather(**tool_block.input)
        else:
            result = f"Unknown tool: {tool_block.name}"
        
        # Append assistant's tool call and our tool result to the conversation
        messages.append({"role": "assistant", "content": response.content})
        messages.append({
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": result
            }]
        })
```

### Why the Loop is Necessary

Claude may call multiple tools in sequence. The loop continues until `stop_reason == "end_turn"`, which means Claude has everything it needs to write a final response.

| stop_reason | Meaning | Action |
|---|---|---|
| `end_turn` | Task complete | Read `content[0].text` and return to user |
| `tool_use` | Needs to call a tool | Execute the tool, append result, loop again |
| `max_tokens` | Hit token limit | Increase `max_tokens` or summarise context |

---

## 4. Writing Effective System Prompts

The system prompt is the most important variable in your agent. A vague prompt produces a vague agent. Precision here pays dividends in reliability.

### Four Sections Every System Prompt Needs

```python
system = """You are a code review agent for Python projects.

## Role
Review Python code for correctness, style, and security issues. You work on
files in the user's working directory.

## Capabilities
You have access to these tools:
- read_file: read the contents of a file by path
- run_linter: run flake8 on a Python file and return results
- run_tests: execute the test suite and return pass/fail results

## Constraints
- Never modify files directly — only read and report
- Always run the linter and tests before giving a final verdict
- Report security issues with severity: CRITICAL / HIGH / MEDIUM / LOW
- Cite specific line numbers when describing issues

## Output Format
Structure your review as:
1. **Summary** — one sentence overall verdict
2. **Issues** — bullet list with severity, line number, and description
3. **Recommendations** — prioritised action list
"""
```

### Common System Prompt Mistakes

| Mistake | Better Alternative |
|---|---|
| "Be helpful" | "When the user asks X, respond with Y format" |
| "Use tools when needed" | "Always call read_file before answering questions about specific files" |
| "Don't make errors" | "If you are unsure, say so and ask a clarifying question" |
| No output format specified | Specify exact output structure with examples |

---

## 5. Tool Design Principles

Well-designed tools are the foundation of reliable agents. Apply these four properties to every tool you build.

### The Four Properties

**Narrow** — each tool does exactly one thing. A tool called `read_and_process_file` violates this. Two tools, `read_file` and `process_content`, are better.

**Safe** — reads before writes; destructive operations require explicit confirmation. A `delete_file` tool should verify the file exists and optionally prompt before deleting.

**Typed** — use JSON Schema precisely. Every parameter should have a `type`, `description`, and validation constraints.

**Idempotent** — calling the same tool with the same arguments multiple times should produce the same result. This makes retries safe.

### JSON Schema Example

```python
{
    "name": "search_codebase",
    "description": "Search all Python files in the project for a regex pattern. Returns matching file paths and line numbers.",
    "input_schema": {
        "type": "object",
        "properties": {
            "pattern": {
                "type": "string",
                "description": "Regex pattern to search for, e.g. 'def handle_.*request'"
            },
            "path": {
                "type": "string",
                "description": "Root directory to search. Defaults to current directory.",
                "default": "."
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results to return",
                "default": 50,
                "minimum": 1,
                "maximum": 500
            }
        },
        "required": ["pattern"]
    }
}
```

---

## 6. Error Handling

Robust agents handle failures gracefully rather than crashing the entire loop.

```python
def safe_tool_call(tool_name: str, tool_input: dict) -> str:
    try:
        if tool_name == "read_file":
            return read_file(**tool_input)
        elif tool_name == "run_linter":
            return run_linter(**tool_input)
        else:
            return f"Error: unknown tool '{tool_name}'"
    except FileNotFoundError as e:
        return f"Error: file not found — {e}"
    except PermissionError as e:
        return f"Error: permission denied — {e}"
    except Exception as e:
        return f"Error: unexpected failure — {type(e).__name__}: {e}"
```

When a tool returns an error string, Claude reads it and decides how to respond — it might try a different approach, ask for clarification, or report the error to the user. This is much better than raising an exception that crashes the loop.

---

## 7. Testing Your Agents

Agent testing requires a different approach than unit testing.

### Test Individual Tools First

```python
def test_read_file():
    result = read_file("tests/fixtures/sample.py")
    assert "def " in result
    assert len(result) > 0

def test_read_file_missing():
    result = safe_tool_call("read_file", {"path": "nonexistent.py"})
    assert result.startswith("Error:")
```

### Test the Full Agent Loop

```python
def test_agent_reviews_code():
    response = run_agent("Review the file at tests/fixtures/bad_code.py")
    assert "issue" in response.lower() or "error" in response.lower()
    assert response  # non-empty response
```

### Prompt Regression Tests

Keep a set of known inputs and expected output patterns. Run them after every system prompt change to catch regressions.

---

## Summary

**Key takeaways from Chapter 2:**

- The Anthropic SDK handles HTTP and serialisation — your job is to define **tools with precise JSON schemas** and a **clear system prompt**
- The agent loop runs until `stop_reason == "end_turn"` — every `tool_use` response must be followed by a `tool_result` message before the loop continues
- Effective system prompts define **role, capabilities, constraints, and output format** — vague prompts produce vague agents
- Tools should be **narrow, safe, typed, and idempotent** — these properties make agents reliable and retryable
- **Error handling in tools** should return descriptive error strings rather than raising exceptions — let Claude decide how to recover

---

## What's Next

→ **Chapter 3: Model Context Protocol (MCP)** — Learn how to package your tools as reusable MCP servers that any compatible AI client can use.
