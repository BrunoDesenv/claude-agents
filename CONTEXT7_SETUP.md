# Context7 MCP Setup

Context7 delivers up-to-date, version-specific library documentation directly into agent context — preventing hallucinated APIs from stale training data.

## Install

Add to `~/.claude/settings.json` under `mcpServers`:

```json
"context7": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp@latest"],
  "env": {
    "CONTEXT7_API_KEY": "<your-key>"
  },
  "autoapprove": [
    "mcp__context7__resolve-library-id",
    "mcp__context7__query-docs"
  ]
}
```

Get your key at https://context7.com → Settings → API Keys.
Restart Claude Code after editing `settings.json`.

## How agents use it

| Agent | Usage |
|-------|-------|
| **researcher** | `resolve-library-id` → `query-docs` when comparing libraries (Phase 1, rule 4) |
| **architect** | Validates capability claims before finalising ADR — produces `## Dependency Evidence (Context7)` |
| **backend** | Fetches exact API contracts before planning — produces `## Dependency & API Contracts (Context7)` |
| **frontend** | Same as backend for UI library APIs |

## MCP tools

- `resolve-library-id` — maps a library name to its Context7 ID
- `query-docs` — fetches ranked, version-specific docs for a given library + topic
