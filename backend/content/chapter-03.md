# Module 3: Model Context Protocol (MCP)

## What is MCP?

The Model Context Protocol (MCP) is an open standard that defines how AI models communicate with external tools and data sources. It standardises the interface between an AI model (the **client**) and external capabilities (the **server**).

Before MCP, every AI application had to build its own integration layer — custom code to connect models to databases, APIs, and file systems. MCP replaces this fragmented ecosystem with a single, well-defined protocol.

### The Problem MCP Solves

Without MCP:
- Every team builds its own tool integration from scratch
- Integrations are brittle and model-specific
- Sharing tools between teams is difficult
- Security and permissions are handled inconsistently

With MCP:
- Tools are packaged as MCP servers with a standard interface
- Any MCP-compatible client can use any MCP server
- Servers define their own permissions and validation
- The same server works with Claude, GPT, or any MCP client

### Core Concepts

| Concept | Description |
|---|---|
| **Client** | The AI model or agent that wants to use tools |
| **Server** | A process exposing tools via the MCP protocol |
| **Tool** | A named function with an input schema the client can call |
| **Resource** | A data source the client can read (files, DB rows, API responses) |
| **Prompt** | A reusable prompt template the server can expose |

---

## MCP Servers and Clients

### How Communication Works

MCP uses JSON-RPC 2.0 as its wire protocol. The transport can be:

- **stdio** — the server runs as a subprocess; JSON messages flow over stdin/stdout
- **HTTP with SSE** — the server is a network process; clients connect over HTTP

### The Handshake

When a client connects to an MCP server, it:

1. Sends `initialize` with its capabilities
2. Server responds with its capabilities (list of tools, resources, prompts)
3. Client sends `initialized` to confirm
4. Normal tool calls begin

### Listing Tools

The client sends `tools/list` and receives a list of tool definitions — each with a name, description, and JSON Schema input specification. This is identical in structure to the tool definitions you pass directly to `client.messages.create()`.

### Calling a Tool

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": {
      "pattern": "TODO",
      "path": "/workspace"
    }
  }
}
```

The server executes the tool and responds:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {"type": "text", "text": "Found 12 TODO comments in 7 files."}
    ],
    "isError": false
  }
}
```

### Using Claude with MCP

The `anthropic` SDK has built-in MCP support. You can connect to an MCP server and expose its tools directly to Claude:

```python
import anthropic

client = anthropic.Anthropic()

# Connect to a local MCP server over stdio
with client.beta.messages.stream(
    model="claude-opus-4-6",
    max_tokens=1024,
    mcp_servers=[
        {
            "type": "stdio",
            "command": "python",
            "args": ["my_mcp_server.py"]
        }
    ],
    messages=[{"role": "user", "content": "List all Python files in /workspace"}]
) as stream:
    print(stream.get_final_message().content[0].text)
```

---

## Building Custom MCP Tools

### Project Structure

```
my_mcp_server/
├── server.py        # Entry point
├── tools/
│   ├── __init__.py
│   └── file_tools.py
└── pyproject.toml
```

### Minimal MCP Server

```python
# server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import mcp.types as types

app = Server("my-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="read_file",
            description="Read the contents of a file.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path to read"}
                },
                "required": ["path"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "read_file":
        path = arguments["path"]
        with open(path) as f:
            return [TextContent(type="text", text=f.read())]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Install MCP SDK

```bash
uv add mcp
```

### Best Practices for MCP Servers

1. **Validate all inputs** — never trust `arguments` without schema validation
2. **Handle errors gracefully** — return `isError: true` with a descriptive message rather than crashing
3. **Keep tools focused** — one tool per distinct operation
4. **Document thoroughly** — the `description` field is what the model reads; make it precise
5. **Scope permissions** — a file-reading tool should only read within an allowed directory

---

## Summary

**3 key points from this module:**

1. MCP is a **standardised protocol** (JSON-RPC 2.0) that decouples tool implementations from AI models — write once, use with any MCP-compatible client.
2. MCP servers expose **tools, resources, and prompts** via a discovery handshake; clients enumerate capabilities at connect time.
3. A minimal MCP server requires three things: a `Server` instance, a `list_tools` handler, and a `call_tool` handler — the protocol handles everything else.
