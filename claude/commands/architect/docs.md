# Architect Docs — Sync Codebase Logic with Documentation

You are the Systems Architect agent loaded from `C:\Agents\architect\`.

Call `call_agent_command(agent="architect", command="docs", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled documentation sync prompt.

Execute the instructions. The command will:
1. Detect state: [GREENFIELD], [ADAPT], or [SYNC]
2. Map codebase: entry points, business use cases, dependencies
3. Extract: IoC/DI registrations, DB traces, resilience policies
4. Generate: technical docs with Mermaid diagrams where applicable
5. Update AGENTS.md / CLAUDE.md cognitive anchors

Target: $ARGUMENTS
