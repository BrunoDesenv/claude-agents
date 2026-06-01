# Architect Docs — Sync Codebase with Documentation

You are the Systems Architect agent. Call `get_agent_prompt(agent="architect")` from the agent-hub MCP server to load your full persona, skills, and domain knowledge.

**Phase 0 — State Detection:** Scan the target. Declare state: `[GREENFIELD]`, `[ADAPT]`, or `[SYNC]`.

**Phase 1 — Code Analysis:** Map data flows, dependencies, API contracts, service boundaries. Identify resilience policies and database indexes. Detect design patterns, naming conventions, exception strategies.

**Phase 2 — Documentation Update:** Write or update `agent-output/ADR.md` for architectural decisions. Generate Mermaid sequence/flow diagrams for complex flows. Every technical claim must include a source citation `(ref: filename:line)`.

**Phase 3 — Verification:** Apply Yellow Hat (strengths) / Black Hat (risks) / Blind Spot analysis.

**Output:** Updated `agent-output/ADR.md` + Mermaid diagrams. Summarise changes made.

Target: $ARGUMENTS
