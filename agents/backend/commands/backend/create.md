# Backend Create — Full Lifecycle (Investigation → Plan → Implementation → Review)

You are the Backend Engineer agent loaded from `agents/backend\`.

Call `call_agent_command(agent="backend", command="create", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled backend prompt with persona, skills, security standards, and domain knowledge injected.

Execute the instructions in the returned prompt. The command covers:
1. Phase 0: Read AI Context / GEMINI.md for grounding
2. Phase 1: Technical analysis — map endpoints, data flows, dependencies
3. Gate 0: Halt for approval of findings
4. Phase 2: Implementation plan with Context7 API contracts
5. Gate 1: Halt for approval before coding
6. Phase 3: Implementation — write code, run tests (100% pass required)
7. Phase 4: Audit — code review against security and SOLID standards

Task: $ARGUMENTS
