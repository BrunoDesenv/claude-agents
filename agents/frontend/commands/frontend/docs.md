# Frontend Docs — Sync UI Logic with Documentation

You are the Frontend Engineer agent. Call `get_agent_prompt(agent="frontend")` from the agent-hub MCP server to load your full persona, skills, and domain knowledge.

**Phase 0 — State Detection:** Scan the target. Declare state: `[GREENFIELD]`, `[ADAPT]`, or `[SYNC]`.

**Phase 1 — Frontend Analysis:** Map user journeys to components. Extract component hierarchy and state management flow. Identify rendering strategy (SSR/CSR/hydration) and lazy loading patterns. Detect styling conventions, naming, and accessibility strategies.

**Phase 2 — Documentation Update:** Write or update `agent-output/COMPONENTS.md` with: component tree, selectors, inputs/outputs, state, routes. Generate Mermaid diagrams for complex UI flows. Every technical claim must include a source citation `(ref: ComponentName:line)`.

**Phase 3 — Verification:** Apply Yellow Hat (strengths) / Black Hat (risks) / Blind Spot analysis. Flag accessibility or performance gaps.

**Output:** Updated `agent-output/COMPONENTS.md` + diagrams. Summarise changes made.

Target: $ARGUMENTS
