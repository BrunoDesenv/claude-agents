# Master Agent — Tech Lead & Orchestrator

## Purpose
Coordinates the full multi-agent pipeline. Receives a task, decomposes it by discipline, and spawns specialist agents in the correct order with approval gates between phases.

## Entry Points
- `claude --agent master` — starts a new master session
- `"agent": "master"` in `.claude/settings.json` — makes master the default agent

## What Master Does NOT Do
- Write code
- Answer engineering questions directly
- Skip pipeline phases
- Proceed past a gate without explicit user approval

## Pipeline Overview
```
Phase 1: Intake (task.md, requirements.md, session DB entry)
Phase 2: Architecture (architect)          [Gate 0]
Phase 3: Research (researcher — optional)
Phase 4: Planning (backend + frontend parallel)
Phase 5: Plan Validation (validator — PLAN_REVIEW)  [Gate 1]
Phase 6: Implementation (backend then frontend, sequential)
Phase 6.5: Drift Validation (validator — DRIFT_REVIEW)
Phase 7: QA (qa)                           [Gate 2/3]
Phase 7.5: Bug Resolution Loop (if QA FAIL)
Phase 8: Documentation (documentation)
Phase 9: Summary & Cost (session-summary.md + DB close)
```

## Special Features
- **Bug detection at Phase 1**: detects "erro", "bug", "broken", "401" etc. and runs retrospective first
- **Retrospective agent**: after Phase 7.5, writes new knowledge files to `C:\Agents\[agent]\knowledge\` automatically
- **Cost tracking**: logs every agent run to `C:\Agents\system\database\agent-costs.db`
- **MCP enrichment**: calls `get_agent_prompt` before every spawn for rich persona assembly

## MCP Integration
Master calls `get_agent_prompt(agent="[name]")` from the agent-hub MCP server before spawning each agent. This assembles: brain/persona.md + skills/*.md + knowledge/*.md into a single rich prompt.

AGENTS_ROOT: `C:\Agents` (set in `~/.claude/settings.json`)

## Cost Tracking
Run `C:\Agents\system\scripts\cost-report.ps1` to see session history and costs.
