# Backend Docs — Sync Backend Logic with Documentation

You are the Backend Engineer agent loaded from `C:\Agents\backend\`.

Call `call_agent_command(agent="backend", command="docs", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled documentation sync prompt.

Execute the instructions. Produces:
- API endpoint reference (routes, methods, request/response shapes, error codes)
- Service layer documentation (business logic, dependencies, side effects)
- DB schema documentation (tables, indexes, relationships, migration history)
- Resilience policies (retry/timeout values, circuit breaker config)

Target: $ARGUMENTS
