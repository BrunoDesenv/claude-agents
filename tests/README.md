# Agent Test Suites

Two test suites for verifying the agent system works correctly.

---

## Quick Reference

| Suite | Scenarios | Duration | When to run |
|-------|-----------|----------|-------------|
| `smoke.js` | 13 | ~8 min | After any agent change |
| `comprehensive.js` | 24 | ~3 hours | After major restructures |

---

## How to Run

**Step 1** — Get the command:
```powershell
.\tests\run-tests.ps1 smoke
# or
.\tests\run-tests.ps1 comprehensive
```

**Step 2** — Paste the output into Claude Code:
```
Workflow({scriptPath: "C:/claude-agents/tests/smoke.js"})
```

Results are saved to `~/.claude/sessions/agent-tests/[run-id]/` — not committed to the repo.

---

## smoke.js — 13 scenarios

**Setup:** Creates a mock Angular+.NET project with intentional defects (missing auth, leaked subscriptions, WCAG violations).

| # | Scenario | What it tests |
|---|----------|---------------|
| 1 | smoke:architect | Identifies architectural concerns in a controller |
| 2 | smoke:backend | Security audit of missing auth and SQL injection |
| 3 | smoke:frontend | Performance issues (leaked subscriptions, trackBy) |
| 4 | smoke:ux | WCAG 2.1 AA violations |
| 5 | smoke:validator | SOLID violations in a component |
| 6 | smoke:qa | Missing Playwright test cases |
| 7 | smoke:researcher | Angular Signals vs NgRx comparison |
| 8 | smoke:documentation | API docs from controller source |
| 9 | smoke:forge | Audit of UX agent definition (0-6 score) |
| 10 | T1: Backend→Validator | Plan handoff + validator catches security gaps |
| 11 | T2: UX→Frontend | Accessibility findings → implementation plan |
| 12 | T3: Researcher→Architect | Research → ADR with traceable citations |
| 13 | T4: Failure Recovery | Backend FAIL → fix → Validator PASS loop |

**Expected FAILs (intentional — correct behaviour):**
- `smoke:frontend`, `smoke:ux`, `smoke:validator` — agents correctly identify defects in the mock code. These are NOT regressions.

**Healthy result:** 10/13 PASS

---

## comprehensive.js — 24 scenarios

Covers all agent types in deeper combinations:
- 9 smoke tests (all agents solo)
- 6 two-agent chains (UX→Frontend, Researcher→Architect, Backend→Validator, Frontend→QA, Compliance→Backend, Validator→Docs)
- 3 three-agent chains (Brainstormer→Architect→Backend, Researcher→Architect→Frontend, Backend→Validator→Docs)
- 3 failure/recovery loops (Validator loop, QA loop, Architecture BLOCKED)
- 1 full pipeline (6 agents sequential)
- 2 real code scenarios (SOLID refactor, security fix)

**Healthy result:** ~21/24 PASS (same 3 intentional FAILs as smoke)

---

## Adding New Tests

Edit `smoke.js` or `comprehensive.js` directly in this folder. The next time you run `Workflow({scriptPath: "..."})`, it picks up the latest version.

Follow the pattern:
```javascript
// Single agent test
() => agent(`You are the [agent] agent. [task]. Return scenario="[name]".`,
  { subagent_type: '[agent]', schema: R })

// Chain test
async () => {
  const d = BASE + '/[chain-name]'
  await agent(`[agent1]: [task1]. Write to ${d}/output1.md.`, { subagent_type: '[agent1]' })
  await agent(`[agent2]: read ${d}/output1.md. [task2]. Write to ${d}/output2.md.`, { subagent_type: '[agent2]' })
  return agent(`Judge: verify chain. scenario="[name]"`, { subagent_type: 'general-purpose', schema: R })
}
```
