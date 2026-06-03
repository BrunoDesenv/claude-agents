# Contributing — Extending the Agent System

How to add new agents, commands, knowledge files, and improve existing agents.

---

## Adding a New Agent

### Step 1 — Create the folder structure
```
agents/[agent-name]\
├── brain\
│   └── persona.md      ← REQUIRED
├── knowledge\          ← REQUIRED (add at least 2 domain files)
├── skills\             ← REQUIRED (add at least 1 protocol file)
└── README.md           ← RECOMMENDED
```

### Step 2 — Write `brain/persona.md`

Every persona.md must define:
- **Role** — one sentence: "You are a [role] specialized in [domain]."
- **Scope boundary** — at least 3 explicit "does NOT" restrictions
- **Output file spec** — exact file names the agent writes
- **Mode definitions** — if PLAN/IMPLEMENTATION/FIX modes exist, list inputs + outputs per mode
- **Gate definition** — when must the agent halt and wait for approval?

```markdown
# [Agent Name]

You are a [role] specialized in [domain].

## Hard Restrictions
- Does NOT [explicit thing 1]
- Does NOT [explicit thing 2]
- Does NOT [explicit thing 3]

## Responsibilities in the Pipeline
1. Read [inputs]
2. Do [work]
3. Write [output file spec]

## Gate
[when to stop and ask for approval]
```

### Step 3 — Add a thin wrapper in `~/.claude/agents/`

```markdown
---
name: [agent-name]
description: "[one-line description for Claude Code]"
tools: Read, Write, [Edit, Bash, Glob, Grep as needed]
model: sonnet
color: [pick a color]
---

# [Agent Name]

[2-3 sentence identity]

Full persona, domain knowledge, and accumulated learning are loaded
by master via the agent-hub MCP server (`get_agent_prompt("[agent-name]")`)
pointing to `agents/[agent-name]\`.
```

### Step 4 — Add to master's team table

In `agents/master/_claude.md` (or `~/.claude/agents/master.md` after install), add to the `## Your Team` table:
```
| `[agent-name]` | When to spawn this agent |
```

And to the Mandatory vs Conditional section.

### Step 5 — Run forge:audit
```
/forge:audit [agent-name]
```
Score should be 5-6/6. Fix any gaps before considering the agent production-ready.

---

## Adding a Slash Command

### Create the command file
```
agents/[namespace]/commands/[namespace]/[command].md
```

Appears in Claude Code as `/namespace:command`.

### Template
```markdown
# [Agent] [Command] — [Short Description]

You are the [Agent] agent loaded from `agents/[agent]\`.

Call `[call_agent_command or get_agent_prompt](agent="[agent]", ...)` from the agent-hub MCP server
to load your full persona with [domain] knowledge injected.

Execute the instructions. [Brief description of what the command does]

[Optional: list of what it checks / produces]

Task/Target: $ARGUMENTS
```

### For TOML-backed commands (architect, backend, frontend, researcher)
The command file calls `call_agent_command` which reads the `.toml` file at:
```
agents/[agent]\commands\[agent]\[command].toml
```

### For persona-only agents (qa, validator, ux, etc.)
The command file calls `get_agent_prompt` which assembles:
- `brain/persona.md`
- All files in `skills/`
- All files in `knowledge/`

---

## Adding a Knowledge File

Knowledge files are the **learning mechanism** of the system. When a bug is found that an agent should have caught, a new knowledge file is written to that agent's `knowledge/` folder.

### When to add a knowledge file
- A new domain rule that should always apply (e.g., "always use SetIsOriginAllowed for CORS")
- A learned lesson from a production bug
- A domain standard the agent needs to follow consistently

### Format
```markdown
# [Rule Title]

## Rule
[Mandatory language: "must", "always", "never"]
[Specific enough to be actionable — not vague]

## Do NOT do this:
[Concrete bad example — ideally with code]

## Do this instead:
[Concrete correct pattern — ideally with code]

## Why
[One sentence explaining the consequence of getting it wrong]
```

### File naming
Use `[category]-[topic].md` — descriptive, lowercase, hyphenated:
- `auth-absolute-url.md`
- `datetime-utc-reload.md`
- `cors-localhost-all-ports.md`

### The file is auto-included
Once the file exists in `agents/[agent]\knowledge\`, it is automatically included in every future prompt assembly via `readMarkdownDir` in the MCP server. No configuration needed.

---

## Adding a TOML Command

If an agent has a `commands/[agent]/` folder, you can add new TOML commands:

```toml
description = "Brief description of what this command does."

prompt = """
# Persona: [Agent Name]
!{cat [agent]/brain/persona.md}

# Skills
!{cat [agent]/skills/[relevant-skill].md}

# Knowledge
!{cat [agent]/knowledge/[relevant-knowledge].md}

# Probes
!{gemini mcp list}

# Task
Goal: {{args}}
Mode: [MODE: WHATEVER]

## Execution Instructions:
1. Step one
2. Step two
3. Halt for user approval at Gate N
"""
```

**Note:** Do NOT reference `common/` or `brainstormer/` paths — those folders don't exist in `agents/`.

---

## Agent Standards Checklist

Before marking any agent as production-ready, it must score 5+/6 on this checklist (run `/forge:audit [agent]`):

| # | Standard | Test |
|---|----------|------|
| 1 | Role clearly defined in one sentence | Read first line of persona.md |
| 2 | At least 3 explicit "does NOT" restrictions | Search for "does NOT" or "NEVER" |
| 3 | Output file spec with exact paths | Search for `agent-output/` in persona.md |
| 4 | At least 1 file in `skills/` | `ls agents/[agent]\skills\` |
| 5 | At least 2 files in `knowledge/` | `ls agents/[agent]\knowledge\` |
| 6 | Gate definition | Search for "halt", "gate", "approval" in persona.md |

---

## Improving an Existing Agent

Use the forge workflow:
```
/forge:audit [agent]        ← identify gaps
# Review the audit report at agents/forge\audits\[agent]-audit.md
# Approve the proposed fixes
/forge:improve [agent]      ← apply approved improvements
```

Or manually:
1. Read `agents/[agent]\brain\persona.md`
2. Identify what's missing (use the checklist above)
3. Add `knowledge/` files for domain rules the agent is inconsistent about
4. Add `skills/` files for execution protocols
5. Update `persona.md` to add explicit restrictions and output specs

---

## System Infrastructure

The `system/` folder is not an agent — it's infrastructure:

```
C:\claude-agents\system\
├── agentDashboard\     ← real-time visual dashboard
│   ├── PRD.md          ← dashboard requirements
│   ├── api\            ← ASP.NET Core .NET 10 (port 5200)
│   ├── spa\            ← Angular 19 (port 4300)
│   └── scripts\        ← update-dashboard.js (called by master)
│
├── cost-tracker\       ← SQLite cost tracking
│   ├── database\       ← agent-costs.db
│   └── scripts\        ← log-session.js, cost-report.ps1, cost-query.js
│
└── health-check.ps1    ← system health verification (6 checks)
```

To add a new system tool, create a new subfolder under `system/` with its own `README.md`.
