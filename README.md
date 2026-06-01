# claude-agents

A local multi-agent AI engineering system for Claude Code. Specialist agents (architect, backend, frontend, qa, validator, ux, researcher, documentation, forge) orchestrated by a master agent through a structured pipeline with approval gates and autonomous learning.

---

## Install (Windows)

```powershell
git clone https://github.com/YOUR_USERNAME/claude-agents.git
cd claude-agents
.\install.ps1
```

Then **restart Claude Code**. That's it.

---

## What gets installed

```
CLAUDE_AGENTS_REPO = C:\path\to\claude-agents   (User env var)
AGENTS_ROOT        = C:\path\to\claude-agents\agents

~/.claude/agents/   ← agent wrappers (master + 9 specialists)
~/.claude/commands/ ← slash commands for all agents
~/.claude/settings.json updated with agent-hub MCP
```

---

## Usage

```
/master:run        Build a feature end-to-end (full pipeline)
/architect:create  Architecture → ADR → implementation
/backend:create    API endpoints, services, DB, tests
/backend:auditor   Security + quality audit
/frontend:create   Angular/React components and pages
/qa:test           Playwright E2E tests with video evidence
/validator:review  Plan review or drift review
/ux:design         UX spec with WCAG + design tokens
/forge:audit       Audit an agent definition
```

Type `/` in Claude Code to see all available commands.

---

## The Pipeline

```
/master:run [task]
  ├── Phase 2: architect  → ADR + architecture decisions  [Gate 0]
  ├── Phase 4: backend + frontend plan (parallel)
  ├── Phase 5: validator  → plan review                   [Gate 1]
  ├── Phase 6: backend + frontend implementation
  ├── Phase 6.5: validator → drift review                 [Gate 2]
  ├── Phase 7: qa         → Playwright E2E + evidence     [Gate 3]
  ├── Phase 8: documentation → README + CHANGELOG
  └── Phase 9: session summary + cost logged to DB
```

---

## Self-Improving

When a bug slips past QA, the system learns:
```
/master:retrospective [bug description]
```
Writes a new rule to `agents/[agent]/knowledge/` — included automatically next session.

---

## Agent Dashboard (optional)

Real-time visualisation of agents as 2D characters:

```powershell
& ".\system\agentDashboard\start.ps1"
# API at http://localhost:5200
# SPA at http://localhost:4300
```

---

## Cost Tracking

```powershell
& ".\system\cost-tracker\scripts\cost-report.ps1"
```

Sessions and per-agent costs stored in `system/cost-tracker/database/agent-costs.db`.

---

## System Health

```powershell
& ".\system\health-check.ps1"
```

Checks: env vars, all 9 agent personas, TOML references, SQLite DB, Node.js, MCP server.

---

## Uninstall

```powershell
.\uninstall.ps1
```

Removes only files installed by this repo. Never touches your other Claude Code configuration.

---

## Structure

```
claude-agents/
├── agents/          ← agent definitions (personas, skills, knowledge, commands)
├── claude/          ← installed into ~/.claude/ by install.ps1
│   ├── agents/      ← master.md (orchestrator) + thin wrappers
│   └── commands/    ← slash commands (/architect:create, /backend:auditor, ...)
├── mcp/agent-hub/   ← MCP server that assembles agent prompts
├── system/
│   ├── agentDashboard/   ← real-time visual dashboard (Angular + C#)
│   ├── cost-tracker/     ← SQLite session cost tracking
│   └── health-check.ps1
├── install.ps1
├── uninstall.ps1
└── .gitignore
```

See [agents/README.md](agents/README.md) for full documentation.
