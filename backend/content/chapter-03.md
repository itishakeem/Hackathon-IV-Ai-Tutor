# Model Context Protocol (MCP)

**Estimated reading time: 13 minutes**

---

## What You'll Learn

- What MCP is and the problem it solves in the AI ecosystem
- The three components MCP exposes: tools, resources, and prompts
- How MCP clients and servers communicate via JSON-RPC 2.0
- The two transport types: stdio and HTTP with SSE
- How to build a minimal MCP server in Python
- Security considerations and best practices

---

## 1. What is MCP?

The **Model Context Protocol (MCP)** is an open standard that defines how AI models communicate with external tools and data sources. Think of it as USB-C for AI integrations — a single, well-defined connector that works between any compatible device.

Before MCP, every AI application had to build a custom integration layer. Teams wrote bespoke code to connect models to databases, file systems, and APIs. This code was model-specific, fragile, and not shareable.

> 💡 **Key Concept:** MCP replaces a fragmented ecosystem of one-off integrations with a standardised protocol. Write a tool once as an MCP server, and any MCP-compatible client — Claude, other models, or agent frameworks — can use it.

### The Problem MCP Solves

| Without MCP | With MCP |
|---|---|
| Every team builds custom integration from scratch | Tools packaged as reusable MCP servers |
| Integrations are model-specific and brittle | Any MCP-compatible client can use any MCP server |
| Sharing tools between teams is difficult | Servers publish a standard capability manifest |
| Security handled inconsistently per tool | Each server defines its own permissions and validation |
| Update the tool → update every integration | Update the server → all clients benefit |

---

## 2. MCP Architecture

MCP defines three roles:

- **Client**: the AI model or agent that wants to use tools (e.g., Claude in your application)
- **Server**: a process that exposes capabilities via the MCP protocol
- **Transport**: the communication channel between client and server

### The Three Capabilities

MCP servers can expose three types of capabilities:

| Capability | Description | Example |
|---|---|---|
| **Tool** | A callable function with an input schema | `search_files(pattern, path)` |
| **Resource** | A readable data source | A file, database table, or API response |
| **Prompt** | A reusable prompt template | A code review template with placeholders |

Most implementations focus on **tools** — they are the most commonly used and most directly analogous to Claude's native tool use.

---

## 3. Transport Types

MCP supports two transport mechanisms. Choose based on your deployment architecture.

### stdio Transport

The server runs as a **subprocess**. JSON-RPC messages flow over stdin and stdout.

```
Client process → (stdin)  → Server subprocess
Client process ← (stdout) ← Server subprocess
```

Best for: local tools, CLI integrations, development

```python
# Starting a stdio server from the client side
mcp_config = {
    "type": "stdio",
    "command": "python",
    "args": ["my_mcp_server.py"]
}
```

### HTTP with SSE Transport

The server runs as a **network process**. The client connects over HTTP, with Server-Sent Events for streaming responses.

```
Client → HTTP POST → Server
Client ← SSE stream ← Server
```

Best for: shared team servers, cloud deployments, servers accessed by multiple clients simultaneously

---

## 4. The Connection Handshake

Every MCP session begins with a three-step handshake:

```
Client                          Server
  |                               |
  |  → initialize (capabilities)  |
  |                               |
  |  ← capabilities response      |
  |    (tools, resources, prompts)|
  |                               |
  |  → initialized                |
  |                               |
  |  [normal tool calls begin]    |
```

1. Client sends `initialize` with its supported protocol version and capabilities
2. Server responds with its capabilities: list of tools, resources, and prompts it exposes
3. Client sends `initialized` to confirm and begin the session

After the handshake, the client can call `tools/list` at any time to enumerate available tools.

---

## 5. Tool Calls via MCP

### Listing Tools

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read the contents of a file by path.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {"type": "string", "description": "Absolute file path"}
          },
          "required": ["path"]
        }
      }
    ]
  }
}
```

### Calling a Tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/workspace/main.py"
    }
  }
}
```

Success response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{"type": "text", "text": "def main():\n    print('hello')"}],
    "isError": false
  }
}
```

Error response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{"type": "text", "text": "Error: file not found at /workspace/main.py"}],
    "isError": true
  }
}
```

> 💡 **Key Concept:** MCP errors are returned as `isError: true` in the result — not as JSON-RPC errors. This lets the AI model read the error message and decide how to recover, rather than crashing.

---

## 6. Building a Minimal MCP Server

Install the MCP SDK:

```bash
uv add mcp
```

```python
# server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import asyncio

app = Server("my-file-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """Return all tools this server exposes."""
    return [
        Tool(
            name="read_file",
            description="Read the full contents of a file. Use this to inspect source code, configs, or data files.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute path to the file to read"
                    }
                },
                "required": ["path"]
            }
        ),
        Tool(
            name="list_directory",
            description="List all files and directories at a given path.",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Directory path to list"
                    }
                },
                "required": ["path"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Execute a tool call and return the result."""
    
    if name == "read_file":
        path = arguments["path"]
        try:
            with open(path, "r") as f:
                content = f.read()
            return [TextContent(type="text", text=content)]
        except FileNotFoundError:
            return [TextContent(type="text", text=f"Error: file not found: {path}")]
    
    elif name == "list_directory":
        import os
        path = arguments["path"]
        try:
            entries = os.listdir(path)
            return [TextContent(type="text", text="\n".join(sorted(entries)))]
        except FileNotFoundError:
            return [TextContent(type="text", text=f"Error: directory not found: {path}")]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 7. Using Claude with an MCP Server

The Anthropic SDK has built-in MCP support. Connect a local server to Claude in a few lines:

```python
import anthropic

client = anthropic.Anthropic()

with client.beta.messages.stream(
    model="claude-opus-4-6",
    max_tokens=2048,
    mcp_servers=[
        {
            "type": "stdio",
            "command": "python",
            "args": ["server.py"]
        }
    ],
    messages=[{
        "role": "user",
        "content": "List all Python files in /workspace and read the main.py file"
    }]
) as stream:
    final = stream.get_final_message()
    print(final.content[0].text)
```

Claude automatically discovers the server's tools via the handshake and uses them as needed.

---

## 8. MCP vs Direct Tool Use

| Aspect | Direct tool_use | MCP server |
|---|---|---|
| Setup | Define tools inline in each API call | Build once, connect from anywhere |
| Reusability | Per-application | Shared across all clients |
| Language | Python (or wherever you call the API) | Any language with MCP SDK |
| Discovery | Static list in your code | Dynamic via `tools/list` handshake |
| Versioning | Manual | Server version in capability manifest |
| Best for | Simple, app-specific tools | Shared team tools, complex integrations |

Use **direct tool_use** when your tools are simple and specific to one application. Use **MCP** when you want to share tools across multiple agents or applications, or when the tool implementation is complex enough to deserve its own service.

---

## 9. Security Best Practices

Security in MCP servers requires explicit design — the protocol itself doesn't enforce permissions.

1. **Validate all inputs** — never trust `arguments` without schema validation, even if the schema is already defined
2. **Scope file access** — a file-reading tool should restrict access to an allowed directory prefix

```python
ALLOWED_BASE = "/workspace"

def read_file(path: str) -> str:
    # Prevent directory traversal attacks
    import os
    abs_path = os.path.realpath(path)
    if not abs_path.startswith(ALLOWED_BASE):
        raise PermissionError(f"Access denied: {path} is outside allowed directory")
    with open(abs_path) as f:
        return f.read()
```

3. **Handle errors gracefully** — return `isError: true` with a descriptive message; never crash the server
4. **Keep tools focused** — one tool per operation minimises attack surface
5. **Document precisely** — the `description` field is read by the AI; make it accurate about what the tool can and cannot do

---

## Summary

**Key takeaways from Chapter 3:**

- MCP is a **standardised protocol (JSON-RPC 2.0)** that decouples tool implementations from AI models — write once, use with any MCP-compatible client
- MCP servers expose **tools, resources, and prompts** via a discovery handshake; clients enumerate capabilities at connect time
- Two transport types: **stdio** (subprocess, local) and **HTTP with SSE** (network service, shared)
- A minimal MCP server requires: a `Server` instance, a `list_tools` handler, and a `call_tool` handler
- Security must be **explicitly implemented** — validate inputs, scope file access, and return errors as `isError: true`

---

## What's Next

→ **Chapter 4: Agent Skills (SKILL.md)** — Learn how to decompose agent behaviour into reusable, modular skills that can be composed and tested independently.
