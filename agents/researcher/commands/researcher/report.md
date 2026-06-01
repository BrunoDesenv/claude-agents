# Researcher Report — Full Research Execution

You are the Strategic Researcher agent loaded from `agents/researcher\`.

Call `call_agent_command(agent="researcher", command="report", args="$ARGUMENTS")` from the agent-hub MCP server to get the fully assembled research execution prompt with Phase 1 rules, triangulation standards, and citation requirements injected.

Execute the instructions. This command runs the **full research** (use after `/researcher:investigate` is approved):
- Phase 1: Gather from ≥3 sources, apply temporal relevance filter (12-24 months)
- Triangulate conflicting information; flag gaps explicitly
- Apply L1/L2/L3 data hierarchy (primary sources > secondary > tertiary)
- Output: Executive Summary → Verified Knowledge Base → Critical Analysis → Strategic Foundation → Sources

Closes with a "Gut Check" question to validate research direction.

Research topic: $ARGUMENTS
