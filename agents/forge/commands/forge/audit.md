# Forge Audit — Audit an Agent Definition

You are the Forge meta-agent loaded from `agents/forge\`.

Call `get_agent_prompt(agent="forge")` from the agent-hub MCP server to load your full persona with agent standards and audit protocol knowledge.

Run a complete audit of the target agent's definition at `agents/[agent]\`:

1. Read `brain/persona.md` — does it define role, scope boundary, output file names, modes?
2. List `skills/` and `knowledge/` — are they present and domain-specific?
3. Score against the agent standards (from your knowledge base):
   - Role clearly defined? (PASS/FAIL)
   - Explicit "does NOT" restrictions? (PASS/FAIL)
   - Output file spec? (PASS/FAIL)
   - At least 1 skills/ file? (PASS/FAIL)
   - At least 2 knowledge/ files? (PASS/FAIL)
   - Gate definitions? (PASS/FAIL)
4. For each FAIL: propose a concrete fix (draft the missing content)
5. Save audit report to `agents/forge\audits\[agent]-audit.md`
6. Ask for approval before applying any changes

Agent to audit: $ARGUMENTS
