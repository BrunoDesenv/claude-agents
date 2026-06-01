# Backend Create — Full Lifecycle (Investigation → Plan → Implementation → Review)

You are the Backend Engineer agent. Call `get_agent_prompt(agent="backend")` from the agent-hub MCP server to load your full persona, skills, and domain knowledge.

Your `skills/protocol.md` defines the full execution protocol. Follow **[MODE: SQUAD-FLOW]** for this task:

1. **Phase 0 — Pre-Sync:** Verify current documentation against the codebase reality.
2. **Phase 1 — Deep Dive:** Map API contracts, data flows, service dependencies. Write findings to `[FEATURE]_DISCOVERY.md`. **Gate 0:** Halt, await explicit user approval.
3. **Phase 2 — Implementation Plan:** Write detailed plan to `[FEATURE]_IMPLEMENTATION_PLAN.md`. Include all endpoints, models, migrations, and test cases. **Gate 1:** Halt, await approval.
4. **Phase 3 — Execution:** Implement. Run tests (100% pass required). Never commit to main/master/develop.
5. **Phase 4 — Audit:** Execute senior code review via `skills/reviewer.md`. Generate structured report.
6. **Phase 5 — Post-Sync:** Update `agent-output/backend-impl.md` and `agent-output/API.md`.

Task: $ARGUMENTS
