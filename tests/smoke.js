
export const meta = {
  name: 'agent-smoke-tests',
  description: 'Quick agent verification — 13 scenarios, ~8 min. Run after any agent change.',
  phases: [
    { title: 'Smoke Tests' },
    { title: 'Chain Tests' },
    { title: 'Report' },
  ],
}

// Output goes to a timestamped temp dir — never committed
const RUN_ID = 'smoke-' + Math.random().toString(36).slice(2, 8)
const BASE = `C:/Users/bru_b/.claude/sessions/agent-tests/${RUN_ID}`
const MOCK = BASE + '/mock'

const R = {
  type: 'object',
  required: ['scenario', 'status', 'notes'],
  properties: {
    scenario: { type: 'string' },
    status:   { type: 'string', enum: ['PASS', 'FAIL'] },
    notes:    { type: 'string' },
  },
}

// ── Setup: create mock flawed codebase ────────────────────────────────────
phase('Smoke Tests')

await agent(
  `Create a small mock Angular+.NET project at ${MOCK} with intentionally flawed code:
1. ${MOCK}/src/controllers/BookingController.cs — missing [Authorize], no input validation, raw SQL string concatenation
2. ${MOCK}/src/app/booking/booking.component.ts — leaked subscriptions (no unsubscribe), missing trackBy on *ngFor, plain class properties instead of signal()
3. ${MOCK}/src/app/booking/booking.component.html — clickable <div> instead of <button>, missing alt text on images, low-contrast text
4. ${MOCK}/package.json — minimal Angular 19 descriptor
Write realistic TypeScript/C# code for each file. Return "done".`,
  { subagent_type: 'general-purpose', label: 'setup', phase: 'Smoke Tests' }
)

// ── 9 agent smoke tests in parallel ──────────────────────────────────────
const smokeResults = await parallel([

  () => agent(
    `You are the architect agent. Analyze ${MOCK}/src/controllers/BookingController.cs.
Identify top 3 architectural concerns. Write findings to ${BASE}/smoke/architect.md (create dir).
Return structured result with scenario="smoke:architect". Status PASS if you identified real concerns.`,
    { subagent_type: 'architect', label: 'smoke:architect', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the backend agent. Review ${MOCK}/src/controllers/BookingController.cs for missing auth, validation, and security issues.
Write findings to ${BASE}/smoke/backend.md. Return structured result with scenario="smoke:backend".`,
    { subagent_type: 'backend', label: 'smoke:backend', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the frontend agent. Review ${MOCK}/src/app/booking/booking.component.ts for performance and subscription issues.
Write findings to ${BASE}/smoke/frontend.md. Return structured result with scenario="smoke:frontend".`,
    { subagent_type: 'frontend', label: 'smoke:frontend', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the UX/UI designer agent. Review ${MOCK}/src/app/booking/booking.component.html for WCAG 2.1 AA violations.
Write findings to ${BASE}/smoke/ux.md. Return structured result with scenario="smoke:ux".`,
    { subagent_type: 'ux', label: 'smoke:ux', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the validator agent. Review ${MOCK}/src/app/booking/booking.component.ts for SOLID violations.
Write findings to ${BASE}/smoke/validator.md. STATUS FAIL if violations found (they exist — that is correct behaviour).
Return structured result with scenario="smoke:validator".`,
    { subagent_type: 'validator', label: 'smoke:validator', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the QA agent. Review ${MOCK}/src/app/booking/booking.component.ts.
Identify what Playwright test cases are missing. Write test plan to ${BASE}/smoke/qa.md.
Return structured result with scenario="smoke:qa". Status PASS if you produced a meaningful test plan.`,
    { subagent_type: 'qa', label: 'smoke:qa', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the researcher agent. Compare Angular Signals vs NgRx for a medium-complexity booking form.
Write comparison to ${BASE}/smoke/researcher.md. Return structured result with scenario="smoke:researcher".`,
    { subagent_type: 'researcher', label: 'smoke:researcher', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the documentation agent. Read ${MOCK}/src/controllers/BookingController.cs.
Write API documentation (method signatures, purpose, params) to ${BASE}/smoke/documentation.md.
Return structured result with scenario="smoke:documentation".`,
    { subagent_type: 'documentation', label: 'smoke:documentation', phase: 'Smoke Tests', schema: R }),

  () => agent(
    `You are the Forge meta-agent. Audit the UX agent at C:\\Agents\\ux.
Score 0-6: role defined, 3+ restrictions, output spec, skills/ file, knowledge/ files, gate definition.
Save audit to C:\\Agents\\forge\\audits\\ux-smoke-${RUN_ID}.md.
Return structured result with scenario="smoke:forge". Status PASS if you produced a scored audit.`,
    { subagent_type: 'general-purpose', label: 'smoke:forge', phase: 'Smoke Tests', schema: R }),

])

// ── 4 chain + recovery tests in parallel ─────────────────────────────────
phase('Chain Tests')

const chainResults = await parallel([

  // T1: Backend → Validator handoff
  async () => {
    const d = BASE + '/T1-back-validator'
    await agent(`Backend: plan JWT auth for ${MOCK}/src/controllers/BookingController.cs. Write to ${d}/backend-plan.md (create dir).`,
      { subagent_type: 'backend', label: 'T1:backend', phase: 'Chain Tests' })
    await agent(`Validator: PLAN_REVIEW of ${d}/backend-plan.md. Find security gaps. Write to ${d}/validator.md with STATUS.`,
      { subagent_type: 'validator', label: 'T1:validator', phase: 'Chain Tests' })
    return agent(`Judge T1 (Backend→Validator): verify validator found real issues or confirmed the plan. scenario="T1: Backend→Validator"`,
      { subagent_type: 'general-purpose', label: 'T1:judge', schema: R })
  },

  // T2: UX → Frontend handoff
  async () => {
    const d = BASE + '/T2-ux-frontend'
    await agent(`UX: audit ${MOCK}/src/app/booking/booking.component.html for WCAG AA. Write findings to ${d}/ux-findings.md (create dir).`,
      { subagent_type: 'ux', label: 'T2:ux', phase: 'Chain Tests' })
    await agent(`Frontend: read ${d}/ux-findings.md. Write fix plan to ${d}/frontend-plan.md.`,
      { subagent_type: 'frontend', label: 'T2:frontend', phase: 'Chain Tests' })
    return agent(`Judge T2 (UX→Frontend): verify frontend plan addresses UX findings. scenario="T2: UX→Frontend"`,
      { subagent_type: 'general-purpose', label: 'T2:judge', schema: R })
  },

  // T3: Researcher → Architect handoff
  async () => {
    const d = BASE + '/T3-researcher-architect'
    await agent(`Researcher: compare Angular Signals vs NgRx for a large booking form. Write recommendation to ${d}/research.md (create dir).`,
      { subagent_type: 'researcher', label: 'T3:researcher', phase: 'Chain Tests' })
    await agent(`Architect: read ${d}/research.md. Write ADR adopting the recommended approach to ${d}/adr.md.`,
      { subagent_type: 'architect', label: 'T3:architect', phase: 'Chain Tests' })
    return agent(`Judge T3 (Researcher→Architect): verify ADR cites research findings. scenario="T3: Researcher→Architect"`,
      { subagent_type: 'general-purpose', label: 'T3:judge', schema: R })
  },

  // T4: Failure recovery loop (FAIL → fix → PASS)
  async () => {
    const d = BASE + '/T4-failure-recovery'
    await agent(`Backend: write DELETE /api/bookings/{id} plan. INTENTIONALLY omit ownership check. Write to ${d}/backend-plan-v1.md (create dir).`,
      { subagent_type: 'backend', label: 'T4:backend-v1', phase: 'Chain Tests' })
    await agent(`Validator: PLAN_REVIEW of ${d}/backend-plan-v1.md. Must STATUS: FAIL — flag missing ownership check. Write to ${d}/validator-v1.md.`,
      { subagent_type: 'validator', label: 'T4:validator-v1', phase: 'Chain Tests' })
    await agent(`Backend: read ${d}/validator-v1.md. Fix the ownership check gap. Write corrected plan to ${d}/backend-plan-v2.md.`,
      { subagent_type: 'backend', label: 'T4:backend-v2', phase: 'Chain Tests' })
    await agent(`Validator: re-review ${d}/backend-plan-v2.md. Verify ownership check added. Write STATUS: PASS to ${d}/validator-v2.md.`,
      { subagent_type: 'validator', label: 'T4:validator-v2', phase: 'Chain Tests' })
    return agent(`Judge T4: confirm v1 FAIL, v2 PASS, gap correctly fixed. scenario="T4: Failure Recovery Loop"`,
      { subagent_type: 'general-purpose', label: 'T4:judge', schema: R })
  },

])

// ── Report ────────────────────────────────────────────────────────────────
phase('Report')

const all    = [...smokeResults, ...chainResults].filter(Boolean)
const passed = all.filter(r => r.status === 'PASS').length
const failed = all.filter(r => r.status === 'FAIL').length

log(`Results: ${passed} PASS, ${failed} FAIL out of ${all.length} total`)

const report = await agent(
  `Write a concise agent verification report.

Note: smoke:frontend, smoke:ux, and smoke:validator are EXPECTED to report FAIL status —
they found real intentional defects in the mock code. That is CORRECT behaviour, not a regression.
Only flag them as regressions if the agent produced NO output or crashed.

Results (${all.length} scenarios):
${JSON.stringify(all, null, 2)}

Write the report as:
## Agent Smoke Test Results
### Summary: ${passed}/${all.length} PASS
### By scenario [table: scenario | status | key finding]
### Expected FAILs (intentional defects found — correct behaviour)
### Unexpected FAILs (actual regressions)
### Verdict: HEALTHY / ISSUES FOUND`,
  { subagent_type: 'general-purpose', label: 'report', phase: 'Report' }
)

return { runId: RUN_ID, outputDir: BASE, total: all.length, passed, failed, report }
