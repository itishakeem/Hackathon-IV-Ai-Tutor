# Module 2: Claude Agent SDK

## SDK Setup and Installation

The Claude Agent SDK (also known as the Anthropic SDK) lets you build agents that use Claude as the reasoning core. It handles the message loop, tool call serialisation, and response parsing so you can focus on defining tools and goals.

### Prerequisites

- Python 3.10+
- An Anthropic API key (set as `ANTHROPIC_API_KEY` in your environment)

### Installation

```bash
pip install anthropic
```

Or with uv (recommended):

```bash
uv add anthropic
```

### Verify the installation

```python
import anthropic
client = anthropic.Anthropic()
print(client)  # <anthropic.Anthropic object>
```

### Environment Setup

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or use a `.env` file with `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()
```

---

## Creating Your First Agent

An agent built with the Claude SDK consists of three parts:

1. **A client** — the `anthropic.Anthropic()` instance
2. **A system prompt** — defines the agent's persona, goals, and constraints
3. **Tools** — functions the agent can call

### Minimal Agent Example

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "What is 2 + 2?"}
    ]
)

print(response.content[0].text)
```

### Agent with a Tool Loop

The agent loop continues until Claude returns a `stop_reason` of `"end_turn"` or stops requesting tools:

```python
import anthropic
import json

client = anthropic.Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }
    }
]

def get_weather(city: str) -> str:
    # In production this would call a real weather API
    return f"Sunny, 22°C in {city}"

messages = [{"role": "user", "content": "What is the weather in Tokyo?"}]

while True:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages
    )

    if response.stop_reason == "end_turn":
        print(response.content[0].text)
        break

    # Process tool calls
    for block in response.content:
        if block.type == "tool_use":
            result = get_weather(**block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                }]
            })
            break
```

---

## Agent Instructions and Tools

### Writing Effective System Prompts

The system prompt is the agent's constitution. It should define:

1. **Role**: Who is the agent? What is its purpose?
2. **Capabilities**: What can it do? What tools does it have?
3. **Constraints**: What must it never do?
4. **Output format**: How should it structure responses?

```python
system = """You are a code review agent.

Your job is to review Python code for correctness, style, and security issues.

Tools available:
- run_linter: runs flake8 on a file
- run_tests: executes the test suite
- read_file: reads a file from disk

Constraints:
- Never modify files directly
- Always run tests before suggesting a fix is complete
- Report security issues with severity: critical / high / medium / low
"""
```

### Tool Design Principles

Good tools are:

- **Narrow**: do one thing well
- **Safe**: read before write; destructive actions require confirmation
- **Typed**: use JSON Schema to define inputs precisely
- **Idempotent**: safe to call multiple times with the same arguments

### Input Schema Example

```python
{
    "name": "search_codebase",
    "description": "Search for a pattern across all Python files.",
    "input_schema": {
        "type": "object",
        "properties": {
            "pattern": {
                "type": "string",
                "description": "Regex pattern to search for"
            },
            "path": {
                "type": "string",
                "description": "Root directory to search (default: '.')",
                "default": "."
            }
        },
        "required": ["pattern"]
    }
}
```

---

## Summary

**3 key points from this module:**

1. The Claude Agent SDK handles message serialisation and tool call parsing — your job is to define tools with precise JSON schemas and a clear system prompt.
2. The agent loop runs until `stop_reason == "end_turn"` — every tool call must be followed by a `tool_result` message before the loop continues.
3. Effective system prompts define **role, capabilities, constraints, and output format** — vague prompts produce vague agents.
