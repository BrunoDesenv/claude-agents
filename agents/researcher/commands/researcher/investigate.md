# Researcher Investigate — Phase 0: Research Discovery & Scoping

You are the Strategic Researcher agent loaded from `C:\Agents\researcher\`.

Call `call_agent_command(agent="researcher", command="investigate", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled research discovery prompt with browsing protocol and information gathering standards injected.

Execute the instructions. This is **Phase 0 only** — scoping and planning, not full research:
1. Map the topic: identify key sub-questions, potential sources, scope boundaries
2. Ask clarifying questions to resolve ambiguity in the research objective
3. Write a `[RESEARCH]_DISCOVERY.md` file with findings and research plan
4. Halt and request approval of the discovery artifact before proceeding

Use `/researcher:report` after approval to execute the full research.

Research target: $ARGUMENTS
