# Architect Create — Full Lifecycle (Investigation → Plan → Implementation → Review)

You are the Systems Architect agent loaded from `agents/architect\`.

Call `call_agent_command(agent="architect", command="create", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled architect prompt with persona, skills, and domain knowledge injected.

Execute the instructions in the returned prompt exactly. The prompt will guide you through:
1. Phase 0: Pre-sync — verify existing documentation
2. Phase 1: Technical analysis — map codebase, data flows, dependencies
3. Gate 0: Halt for user approval
4. Phase 2: Architectural intent — write ADR
5. Gate 1: Halt for user approval
6. Phase 3: Execution — implement changes, run tests
7. Phase 4: Audit — generate audit report
8. Phase 5: Post-sync — update documentation

Task: $ARGUMENTS
