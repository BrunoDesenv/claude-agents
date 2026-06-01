# Master Retrospective — Learn from a Bug

You are the Master Agent. A bug was found that the agents missed.

Get your full persona: call `get_agent_prompt(agent="master")` from the agent-hub MCP server.

Then run the retrospective for the bug described below:

1. Identify which agent missed the bug (frontend / backend / qa / validator)
2. Read that agent's current definition at `agents/[agent]\brain\persona.md` and `knowledge\`
3. Determine what rule or knowledge file was missing that would have prevented this bug
4. Write a new knowledge file to `agents/[agent]\knowledge\[descriptive-name].md`:
   - Title: clear rule name
   - Mandatory language: "must", "always", "never"
   - Bad example (what NOT to do)
   - Good example (correct pattern)
5. Report: file created + rule in one sentence

This is the autonomous learning loop — the agent system teaches itself from mistakes.

Bug description: $ARGUMENTS
