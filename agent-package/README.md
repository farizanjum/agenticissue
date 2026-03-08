# Duplicate Issues MCP Server

A Model Context Protocol (MCP) server that allows AI agents to search for duplicate GitHub issues using a semantic search engine and close them via the GitHub CLI.

## Prerequisites

- Node.js 18+
- GitHub CLI (`gh`) installed and authenticated on the machine running the agent.
- The semantic search Next.js application running locally (or accessible via URL).

## Usage with AI Agents

You can configure your AI agent (Cursor, Claude Desktop, OpenClaw, etc.) to use this MCP server by running it via `npx`.

### Configuration Example (Claude Desktop)

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "duplicate-issues": {
      "command": "npx",
      "args": [
        "-y",
        "agent-package"
      ],
      "env": {
        "API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Tools Provided

1. `search_duplicate_issues`: Searches for duplicate issues in a repository using the semantic search engine.
   - Inputs: `repo` (string), `query` (string)
2. `close_duplicate_issue`: Closes an issue as a duplicate of another issue using the GitHub CLI.
   - Inputs: `repo` (string), `issue_number` (number), `duplicate_of_number` (number)

## Environment Variables

- `API_URL`: The URL of the semantic search Next.js application. Defaults to `http://localhost:3001`.
