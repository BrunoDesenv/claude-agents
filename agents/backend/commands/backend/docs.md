# Backend Docs — Sync Backend Logic with Documentation

You are the Backend Engineer agent. Call `get_agent_prompt(agent="backend")` from the agent-hub MCP server to load your full persona, skills, and domain knowledge.

**Phase 0 — State Detection:** Scan the target. Declare state: `[GREENFIELD]`, `[ADAPT]`, or `[SYNC]`.

**Phase 1 — Backend Analysis:** Map API endpoints, data models, service dependencies. Identify resilience policies (retries/timeouts/circuit breakers) and database indexes. Detect IoC/DI registrations, auth flows, background tasks.

**Phase 2 — Documentation Update:** Write or update `agent-output/API.md` with all endpoints (method, path, auth, request, response, error codes). Generate Mermaid sequence diagrams for complex backend flows. Every technical claim must include a source citation `(ref: filename:line)`.

**Phase 3 — Verification:** Apply Yellow Hat (strengths) / Black Hat (risks) / Blind Spot analysis. Flag anything undocumented that should be.

**Output:** Updated `agent-output/API.md` + diagrams. Summarise changes made.

Target: $ARGUMENTS
