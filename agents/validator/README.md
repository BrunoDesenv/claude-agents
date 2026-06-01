# Validator Agent

## Purpose
Read-only staff-level technical reviewer. Runs twice per session: PLAN_REVIEW (before code is written) and DRIFT_REVIEW (after code is written). Never modifies files.

## When to Use
- **PLAN_REVIEW**: after all planning agents complete, enforces Gate 1 (before implementation begins)
- **DRIFT_REVIEW**: after all implementation agents complete, enforces Gate 2 (before QA begins)

## Inputs
**PLAN_REVIEW:** `task.md`, `requirements.md`, `agent-output/architect.md`, all `*-plan.md`
**DRIFT_REVIEW:** all `*-plan.md` (baseline) vs all `*-impl.md` (what was built)

## Outputs
- `agent-output/validator.md` — PLAN_REVIEW findings
- `agent-output/validator-post-impl.md` — DRIFT_REVIEW findings

Both files follow: `STATUS: PASS | APPROVED_WITH_NOTES | FAIL` + findings table.

## Key Constraints
- Does NOT write code
- Does NOT modify any files except its two output files
- Hard gate: implementation agents cannot start until `validator.md` has STATUS: PASS or APPROVED_WITH_NOTES
- Uses `claude-opus-4-8` (critical quality gate)

## Integration
- Spawned by master twice per session
- Implementation agents (backend, frontend) are blocked until PLAN_REVIEW passes
- Can trigger re-spawning of failing agents (max 2 retry cycles)

## Knowledge
- `knowledge/solid-principles.md` — SOLID violations detection guide
- `knowledge/security-checklist.md` — Auth, input validation, injection prevention
- `knowledge/review-patterns.md` — What to check per review mode
