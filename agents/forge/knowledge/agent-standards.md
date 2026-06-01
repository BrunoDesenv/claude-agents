# Agent Standards — What Every Agent Should Have

## Required in brain/persona.md

Every agent's persona.md must define:

1. **Role** — one sentence: "You are a [role] specialized in [domain]."
2. **Scope Boundary** — what this agent does NOT do (at least 3 explicit exclusions)
3. **Output file spec** — exact file names the agent writes (e.g., `agent-output/QA-REPORT.md`)
4. **Mode definitions** — if the agent has PLAN/IMPLEMENTATION/FIX modes, each must list: inputs, outputs, what to do
5. **Gate definition** — when must the agent stop and wait for approval?
6. **Escalation rule** — how does the agent handle errors or blockers?

## Required Files per Agent Type

### Specialist Agents (architect, backend, frontend, qa, validator, ux, researcher, documentation)
- `brain/persona.md` — **REQUIRED**
- At least 1 file in `skills/` — **REQUIRED**
- At least 2 files in `knowledge/` — **REQUIRED**
- `README.md` — **RECOMMENDED**

### Orchestrator (master)
- `brain/persona.md` — **REQUIRED**
- `README.md` — **REQUIRED**
- Skills/knowledge optional (master's logic lives in the full master.md)

## Knowledge File Standards

A knowledge file is useful when:
- It contains domain-specific rules the LLM might not apply consistently without explicit guidance
- It was learned from a past mistake (retrospective-generated)
- It references specific standards, checklists, or patterns the agent needs to apply

A knowledge file is NOT useful when:
- It just restates general common sense ("always write clean code")
- It duplicates what's already in persona.md
- It contains content not specific to this agent's domain

## Quality Indicators

| Signal | Good | Needs improvement |
|--------|------|-------------------|
| Output spec | "writes agent-output/QA-REPORT.md" | "writes a report" |
| Scope boundary | "NEVER runs dotnet test" | "focuses on E2E tests" |
| Mode definition | "Mode: PLAN — reads X, writes Y" | "Mode: PLAN — designs the solution" |
| Knowledge files | domain-specific rules with examples | general platitudes |
| Gate | "Halt and await explicit approval" | "check with the user" |
