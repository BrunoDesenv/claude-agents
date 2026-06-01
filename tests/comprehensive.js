
export const meta = {
  name: 'agent-comprehensive-tests',
  description: 'Full agent orchestration test — 24 scenarios across all agents. ~3 hours. Run after major restructures.',
  phases: [
    { title: 'Setup — Mock Codebase' },
    { title: 'Smoke Tests — All Agents Solo' },
    { title: 'Two-Agent Chains' },
    { title: 'Three-Agent Chains' },
    { title: 'Failure & Recovery Loops' },
    { title: 'Full Pipeline Variants' },
    { title: 'Real Code Scenarios' },
    { title: 'Report' },
  ],
}

const RUN_ID = 'comprehensive-' + Math.random().toString(36).slice(2, 8)
const BASE  = `C:/Users/bru_b/.claude/sessions/agent-tests/\`
const MOCK  = BASE + '/mock-project'

const R = {
  type: 'object',
  required: ['scenario', 'status', 'agents_called', 'notes'],
  properties: {
    scenario:     { type: 'string' },
    status:       { type: 'string', enum: ['PASS', 'FAIL'] },
    agents_called:{ type: 'array', items: { type: 'string' } },
    notes:        { type: 'string' },
  },
}

// ═══════════════════════════════════════════════════════════════
// SETUP — create mock codebase with intentional issues
// ═══════════════════════════════════════════════════════════════
phase('Setup — Mock Codebase')

await agent(
  `Create a realistic mock Angular + .NET project at ${MOCK} with these files:

1. ${MOCK}/src/app/trip-card/trip-card.component.ts — Angular component violating SRP (booking + analytics + navigation + display all in one class), no OnDestroy, magic numbers

2. ${MOCK}/src/app/services/booking.service.ts — Service with no error handling on HTTP calls, hardcoded API URLs

3. ${MOCK}/src/controllers/BookingController.cs — .NET controller missing [Authorize], no input validation, raw string concatenation in SQL

4. ${MOCK}/src/app/trip-list/trip-list.component.ts — Angular with missing trackBy on *ngFor, unmanaged subscriptions

5. ${MOCK}/src/tests/booking.service.spec.ts — Mostly empty spec file with only a "should be created" test

6. ${MOCK}/src/app/shared/user-profile/user-profile.component.ts — Component logging passport numbers to console, rendering unmasked PII

7. ${MOCK}/package.json — minimal Angular project descriptor

Write realistic TypeScript/C# code for each file. These are TEST fixtures.`,
  { subagent_type: 'general-purpose', label: 'setup:mock-codebase', phase: 'Setup — Mock Codebase' }
)

// ═══════════════════════════════════════════════════════════════
// PHASE 1 — Smoke Tests: every agent type solo
// ═══════════════════════════════════════════════════════════════
phase('Smoke Tests — All Agents Solo')

const smokeResults = await parallel([

  () => agent(`You are the architect agent. Analyze ${MOCK}/src/controllers/BookingController.cs and ${MOCK}/src/app/services/booking.service.ts. Identify the top 3 architectural concerns. Write findings to ${BASE}/smoke/architect.md (create dir). Return a structured test result with scenario="smoke:architect" and status PASS if you identified real concerns, FAIL otherwise.`,
    { subagent_type: 'architect', label: 'smoke:architect', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the backend agent. Review ${MOCK}/src/controllers/BookingController.cs for missing auth, validation, and security issues. Write findings to ${BASE}/smoke/backend.md. Return structured result with scenario="smoke:backend".`,
    { subagent_type: 'backend', label: 'smoke:backend', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the frontend agent. Review ${MOCK}/src/app/trip-list/trip-list.component.ts for performance and subscription issues. Write findings to ${BASE}/smoke/frontend.md. Return structured result with scenario="smoke:frontend".`,
    { subagent_type: 'frontend', label: 'smoke:frontend', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the UX/UI designer agent. Review ${MOCK}/src/app/trip-card/trip-card.component.ts for component design issues (SRP, responsibilities, missing UX states). Write findings to ${BASE}/smoke/ux.md. Return structured result with scenario="smoke:ux".`,
    { subagent_type: 'ux', label: 'smoke:ux', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the validator agent. Review ${MOCK}/src/app/trip-card/trip-card.component.ts for SOLID violations. Write findings to ${BASE}/smoke/validator.md. STATUS: FAIL if violations found. Return structured result with scenario="smoke:validator".`,
    { subagent_type: 'validator', label: 'smoke:validator', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the QA agent. Review ${MOCK}/src/tests/booking.service.spec.ts. Identify missing test cases. Write a test plan to ${BASE}/smoke/qa.md. Return structured result with scenario="smoke:qa".`,
    { subagent_type: 'qa', label: 'smoke:qa', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the researcher agent. Compare Angular Signals vs NgRx for a medium-complexity booking form. Write comparison to ${BASE}/smoke/researcher.md. Return structured result with scenario="smoke:researcher".`,
    { subagent_type: 'researcher', label: 'smoke:researcher', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are the documentation agent. Read ${MOCK}/src/app/services/booking.service.ts and write API documentation (method signatures, params, return types) to ${BASE}/smoke/documentation.md. Return structured result with scenario="smoke:documentation".`,
    { subagent_type: 'documentation', label: 'smoke:documentation', phase: 'Smoke Tests — All Agents Solo', schema: R }),

  () => agent(`You are a Compliance Auditor. Review ${MOCK}/src/app/shared/user-profile/user-profile.component.ts for PII handling violations. Write findings to ${BASE}/smoke/compliance.md. Return structured result with scenario="smoke:compliance".`,
    { subagent_type: 'general-purpose', label: 'smoke:compliance', phase: 'Smoke Tests — All Agents Solo', schema: R }),

])

log('Smoke tests done: ' + smokeResults.filter(Boolean).length + '/9')

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — Two-Agent Chains
// ═══════════════════════════════════════════════════════════════
phase('Two-Agent Chains')

const twoAgentResults = await parallel([

  async () => {
    const d = BASE + '/T1-ux-frontend'
    await agent(`UX agent: review ${MOCK}/src/app/trip-card/trip-card.component.ts for component design and UX issues. Write findings to ${d}/ux-findings.md (create dir).`, { subagent_type: 'ux', label: 'T1:ux', phase: 'Two-Agent Chains' })
    await agent(`Frontend agent: read UX findings at ${d}/ux-findings.md. Write an implementation plan to address each finding in ${d}/frontend-fix-plan.md.`, { subagent_type: 'frontend', label: 'T1:frontend', phase: 'Two-Agent Chains' })
    return agent(`Judge T1 (UX→Frontend): read both files. Verify frontend plan addresses UX findings. scenario="T1: UX→Frontend"`, { subagent_type: 'general-purpose', label: 'T1:judge', schema: R })
  },

  async () => {
    const d = BASE + '/T2-researcher-architect'
    await agent(`Researcher: compare Angular Signals vs NgRx for a large booking form. Write recommendation to ${d}/research.md (create dir).`, { subagent_type: 'researcher', label: 'T2:researcher', phase: 'Two-Agent Chains' })
    await agent(`Architect: read ${d}/research.md. Write an ADR adopting the recommended approach. Write to ${d}/adr.md.`, { subagent_type: 'architect', label: 'T2:architect', phase: 'Two-Agent Chains' })
    return agent(`Judge T2 (Researcher→Architect): verify ADR references research findings. scenario="T2: Researcher→Architect"`, { subagent_type: 'general-purpose', label: 'T2:judge', schema: R })
  },

  async () => {
    const d = BASE + '/T3-backend-validator'
    await agent(`Backend: write an implementation plan for adding JWT auth to ${MOCK}/src/controllers/BookingController.cs. Write to ${d}/backend-plan.md (create dir).`, { subagent_type: 'backend', label: 'T3:backend', phase: 'Two-Agent Chains' })
    await agent(`Validator: PLAN_REVIEW of ${d}/backend-plan.md. Write to ${d}/validator.md with STATUS.`, { subagent_type: 'validator', label: 'T3:validator', phase: 'Two-Agent Chains' })
    return agent(`Judge T3 (Backend→Validator): verify validator found real issues or confirmed the plan. scenario="T3: Backend→Validator"`, { subagent_type: 'general-purpose', label: 'T3:judge', schema: R })
  },

  async () => {
    const d = BASE + '/T4-frontend-qa'
    await agent(`Frontend: write implementation notes for refactoring ${MOCK}/src/app/trip-list/trip-list.component.ts (fix trackBy, subscriptions). Write to ${d}/frontend-impl.md (create dir).`, { subagent_type: 'frontend', label: 'T4:frontend', phase: 'Two-Agent Chains' })
    await agent(`QA: read ${d}/frontend-impl.md. Write a Playwright test plan covering the refactored behavior. Write to ${d}/qa-plan.md.`, { subagent_type: 'qa', label: 'T4:qa', phase: 'Two-Agent Chains' })
    return agent(`Judge T4 (Frontend→QA): verify QA tests cover changes in impl notes. scenario="T4: Frontend→QA"`, { subagent_type: 'general-purpose', label: 'T4:judge', schema: R })
  },

  async () => {
    const d = BASE + '/T5-compliance-backend'
    await agent(`Compliance Auditor: audit ${MOCK}/src/app/shared/user-profile/user-profile.component.ts for GDPR violations. Write findings to ${d}/compliance.md (create dir).`, { subagent_type: 'general-purpose', label: 'T5:compliance', phase: 'Two-Agent Chains' })
    await agent(`Backend: read ${d}/compliance.md. Write a remediation plan addressing every violation to ${d}/backend-remediation.md.`, { subagent_type: 'backend', label: 'T5:backend', phase: 'Two-Agent Chains' })
    return agent(`Judge T5 (Compliance→Backend): verify remediation addresses every compliance finding. scenario="T5: Compliance→Backend"`, { subagent_type: 'general-purpose', label: 'T5:judge', schema: R })
  },

  async () => {
    const d = BASE + '/T6-validator-docs'
    await agent(`Validator: DRIFT_REVIEW — compare planned behavior (SRP, OnDestroy, no magic numbers) vs actual ${MOCK}/src/app/trip-card/trip-card.component.ts. Write drift findings to ${d}/validator.md (create dir).`, { subagent_type: 'validator', label: 'T6:validator', phase: 'Two-Agent Chains' })
    await agent(`Documentation: read ${d}/validator.md. Write a tech debt document describing what needs fixing. Write to ${d}/tech-debt.md.`, { subagent_type: 'documentation', label: 'T6:docs', phase: 'Two-Agent Chains' })
    return agent(`Judge T6 (Validator→Docs): verify tech debt doc reflects validator findings. scenario="T6: Validator→Documentation"`, { subagent_type: 'general-purpose', label: 'T6:judge', schema: R })
  },

])

log('Two-agent chains: ' + twoAgentResults.filter(Boolean).length + '/6')

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — Three-Agent Chains
// ═══════════════════════════════════════════════════════════════
phase('Three-Agent Chains')

const threeAgentResults = await parallel([

  async () => {
    const d = BASE + '/TH1-brainstorm-arch-back'
    await agent(`Brainstormer/PO: a user wants "Email notifications when a trip price drops". Write a mini-PRD with acceptance criteria to ${d}/prd.md (create dir).`, { subagent_type: 'general-purpose', label: 'TH1:brainstormer', phase: 'Three-Agent Chains' })
    await agent(`Architect: read ${d}/prd.md. Design the notification system. Write ADR to ${d}/adr.md.`, { subagent_type: 'architect', label: 'TH1:architect', phase: 'Three-Agent Chains' })
    await agent(`Backend: read ${d}/adr.md and ${d}/prd.md. Write implementation plan. Write to ${d}/backend-plan.md.`, { subagent_type: 'backend', label: 'TH1:backend', phase: 'Three-Agent Chains' })
    return agent(`Judge TH1 (Brainstormer→Architect→Backend): verify chain is coherent. scenario="TH1: Brainstormer→Architect→Backend"`, { subagent_type: 'general-purpose', label: 'TH1:judge', schema: R })
  },

  async () => {
    const d = BASE + '/TH2-research-arch-front'
    await agent(`Researcher: evaluate Angular virtual scrolling options for a list of 10,000+ trips. Write comparison to ${d}/research.md (create dir).`, { subagent_type: 'researcher', label: 'TH2:researcher', phase: 'Three-Agent Chains' })
    await agent(`Architect: read ${d}/research.md. Write ADR adopting the best approach. Write to ${d}/adr.md.`, { subagent_type: 'architect', label: 'TH2:architect', phase: 'Three-Agent Chains' })
    await agent(`Frontend: read ${d}/adr.md. Plan the virtual scroll implementation. Write plan to ${d}/frontend-plan.md.`, { subagent_type: 'frontend', label: 'TH2:frontend', phase: 'Three-Agent Chains' })
    return agent(`Judge TH2 (Researcher→Architect→Frontend): verify frontend plan uses the researched approach. scenario="TH2: Researcher→Architect→Frontend"`, { subagent_type: 'general-purpose', label: 'TH2:judge', schema: R })
  },

  async () => {
    const d = BASE + '/TH3-back-validator-docs'
    await agent(`Backend: write implementation plan for refactoring ${MOCK}/src/app/services/booking.service.ts (add error handling, retry). Write to ${d}/backend-plan.md (create dir).`, { subagent_type: 'backend', label: 'TH3:backend', phase: 'Three-Agent Chains' })
    await agent(`Validator: PLAN_REVIEW of ${d}/backend-plan.md. Write to ${d}/validator.md with STATUS.`, { subagent_type: 'validator', label: 'TH3:validator', phase: 'Three-Agent Chains' })
    await agent(`Documentation: read ${d}/backend-plan.md and ${d}/validator.md. Write final docs to ${d}/docs.md.`, { subagent_type: 'documentation', label: 'TH3:docs', phase: 'Three-Agent Chains' })
    return agent(`Judge TH3 (Backend→Validator→Docs): verify docs reflect validator-approved plan. scenario="TH3: Backend→Validator→Docs"`, { subagent_type: 'general-purpose', label: 'TH3:judge', schema: R })
  },

])

log('Three-agent chains: ' + threeAgentResults.filter(Boolean).length + '/3')

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — Failure & Recovery Loops
// ═══════════════════════════════════════════════════════════════
phase('Failure & Recovery Loops')

const failureResults = []

// FR1: Validator FAIL → Frontend retry → Validator PASS
{
  const d = BASE + '/FR1-frontend-validator'
  await agent(`Frontend: write an implementation plan for a Date Range Picker. INTENTIONALLY omit keyboard navigation and screen reader support. Write to ${d}/frontend-plan-v1.md (create dir).`, { subagent_type: 'frontend', label: 'FR1:frontend-v1', phase: 'Failure & Recovery Loops' })
  await agent(`Validator: PLAN_REVIEW of ${d}/frontend-plan-v1.md. Check strictly for accessibility gaps. Must STATUS: FAIL. Write to ${d}/validator-v1.md.`, { subagent_type: 'validator', label: 'FR1:validator-v1', phase: 'Failure & Recovery Loops' })
  await agent(`Frontend: read ${d}/validator-v1.md. Fix all gaps. Write corrected plan to ${d}/frontend-plan-v2.md.`, { subagent_type: 'frontend', label: 'FR1:frontend-v2', phase: 'Failure & Recovery Loops' })
  await agent(`Validator: PLAN_REVIEW of ${d}/frontend-plan-v2.md. Verify all previous gaps resolved. Write to ${d}/validator-v2.md. Should be STATUS: PASS.`, { subagent_type: 'validator', label: 'FR1:validator-v2', phase: 'Failure & Recovery Loops' })
  failureResults.push(await agent(`Judge FR1: confirm v1 failed, v2 passed. scenario="FR1: Frontend Validator Loop"`, { subagent_type: 'general-purpose', label: 'FR1:judge', schema: R }))
}

// FR2: QA FAIL → Backend fix → QA PASS
{
  const d = BASE + '/FR2-qa-backend'
  await agent(`Backend: write implementation notes for input validation. INTENTIONALLY omit validation for past dates. Write to ${d}/backend-impl-v1.md (create dir).`, { subagent_type: 'backend', label: 'FR2:backend-v1', phase: 'Failure & Recovery Loops' })
  await agent(`QA: test plan for ${d}/backend-impl-v1.md. You MUST test past-date validation. Since it's missing, write STATUS: FAIL. Write to ${d}/qa-v1.md.`, { subagent_type: 'qa', label: 'FR2:qa-v1', phase: 'Failure & Recovery Loops' })
  await agent(`Backend: read ${d}/qa-v1.md. Add past-date validation. Write updated impl to ${d}/backend-impl-v2.md.`, { subagent_type: 'backend', label: 'FR2:backend-v2', phase: 'Failure & Recovery Loops' })
  await agent(`QA: re-test ${d}/backend-impl-v2.md. Verify past-date validation covered. Write STATUS: PASS to ${d}/qa-v2.md.`, { subagent_type: 'qa', label: 'FR2:qa-v2', phase: 'Failure & Recovery Loops' })
  failureResults.push(await agent(`Judge FR2: confirm QA v1 failed, backend fixed, QA v2 passed. scenario="FR2: QA→Backend Fix Loop"`, { subagent_type: 'general-purpose', label: 'FR2:judge', schema: R }))
}

// FR3: Architecture BLOCKED
{
  const d = BASE + '/FR3-arch-blocked'
  await agent(`Architect: analyze two conflicting caching approaches (Redis vs Service Worker). You cannot decide — write BLOCKED_MAJOR_ARCHITECTURE_DECISION to ${d}/architect.md explaining both options. Create dir.`, { subagent_type: 'architect', label: 'FR3:architect', phase: 'Failure & Recovery Loops' })
  failureResults.push(await agent(`Judge FR3: read ${d}/architect.md. Verify it contains BLOCKED_MAJOR_ARCHITECTURE_DECISION with both options clearly presented. scenario="FR3: Architecture BLOCKED"`, { subagent_type: 'general-purpose', label: 'FR3:judge', schema: R }))
}

log('Failure/recovery: ' + failureResults.filter(Boolean).length + '/3')

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — Full Pipeline
// ═══════════════════════════════════════════════════════════════
phase('Full Pipeline Variants')

const d_fp = BASE + '/FP-full-pipeline'
log('Full pipeline: Architect → Backend + Frontend (parallel) → Validator → QA → Docs')

await agent(`Architect: design a "Trip Rating & Review" feature. Create ${d_fp}/agent-output. Write ADR to ${d_fp}/agent-output/architect.md.`, { subagent_type: 'architect', label: 'FP:architect', phase: 'Full Pipeline Variants' })

await parallel([
  () => agent(`Backend: read ${d_fp}/agent-output/architect.md. Plan API for Trip Rating. Write to ${d_fp}/agent-output/backend-plan.md.`, { subagent_type: 'backend', label: 'FP:backend', phase: 'Full Pipeline Variants' }),
  () => agent(`Frontend: read ${d_fp}/agent-output/architect.md. Plan UI for Trip Rating. Write to ${d_fp}/agent-output/frontend-plan.md.`, { subagent_type: 'frontend', label: 'FP:frontend', phase: 'Full Pipeline Variants' }),
])

await agent(`Validator: PLAN_REVIEW of all files in ${d_fp}/agent-output/. Write to ${d_fp}/agent-output/validator.md with STATUS.`, { subagent_type: 'validator', label: 'FP:validator', phase: 'Full Pipeline Variants' })
await agent(`QA: read all plan files in ${d_fp}/agent-output/. Write test plan to ${d_fp}/agent-output/qa.md.`, { subagent_type: 'qa', label: 'FP:qa', phase: 'Full Pipeline Variants' })
await agent(`Documentation: read all files in ${d_fp}/agent-output/. Write final docs to ${d_fp}/agent-output/docs.md. (Note: QA-REPORT.md may be named qa.md here — accept both.)`, { subagent_type: 'documentation', label: 'FP:docs', phase: 'Full Pipeline Variants' })

const pipelineResult = await agent(`Judge Full Pipeline: read all files in ${d_fp}/agent-output/. Verify 6 agents produced coherent, connected output. scenario="FP: Full Pipeline (6 agents)"`, { subagent_type: 'general-purpose', label: 'FP:judge', phase: 'Full Pipeline Variants', schema: R })

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — Real Code Scenarios
// ═══════════════════════════════════════════════════════════════
phase('Real Code Scenarios')

const realCodeResults = await parallel([

  async () => {
    const d = BASE + '/RC1-solid-fix'
    await agent(`Validator: analyze ${MOCK}/src/app/trip-card/trip-card.component.ts for SOLID violations. Write to ${d}/violations.md (create dir).`, { subagent_type: 'validator', label: 'RC1:validator', phase: 'Real Code Scenarios' })
    await agent(`Frontend: read ${d}/violations.md. Write a refactored version fixing all SOLID violations to ${d}/trip-card.refactored.ts.`, { subagent_type: 'frontend', label: 'RC1:frontend', phase: 'Real Code Scenarios' })
    return agent(`Judge RC1: verify refactored file addresses every violation. scenario="RC1: Real SOLID Refactor"`, { subagent_type: 'general-purpose', label: 'RC1:judge', schema: R })
  },

  async () => {
    const d = BASE + '/RC2-security-fix'
    await agent(`Backend: audit ${MOCK}/src/controllers/BookingController.cs for security issues. Write to ${d}/security-audit.md (create dir).`, { subagent_type: 'backend', label: 'RC2:backend-audit', phase: 'Real Code Scenarios' })
    await agent(`Backend: read ${d}/security-audit.md. Write a secured version to ${d}/BookingController.secured.cs.`, { subagent_type: 'backend', label: 'RC2:backend-fix', phase: 'Real Code Scenarios' })
    return agent(`Judge RC2: compare original vs secured controller. Verify all security issues resolved. scenario="RC2: Real Security Fix"`, { subagent_type: 'general-purpose', label: 'RC2:judge', schema: R })
  },

])

// ═══════════════════════════════════════════════════════════════
// PHASE 7 — Final Report
// ═══════════════════════════════════════════════════════════════
phase('Report')

const allResults = [
  ...smokeResults,
  ...twoAgentResults,
  ...threeAgentResults,
  ...failureResults,
  pipelineResult,
  ...realCodeResults,
].filter(Boolean)

const passed = allResults.filter(r => r.status === 'PASS').length
const failed = allResults.filter(r => r.status === 'FAIL').length

log('Total: ' + allResults.length + ' | PASS: ' + passed + ' | FAIL: ' + failed)

const report = await agent(
  `Write the final verification report for the agent migration test.

Context: We just migrated agents from ~/.claude/agents/*.md (flat files) to C:\\Agents\\[agent]\\brain/, knowledge/, skills/ folder structure. The MCP server now points to C:\\Agents (AGENTS_ROOT). We ran ${allResults.length} test scenarios to verify agents still work correctly.

Results:
${JSON.stringify(allResults, null, 2)}

Write a concise report:
## Migration Verification Report

### Summary
- Total: ${allResults.length} scenarios | Passed: ${passed} | Failed: ${failed}
- Pass rate: X%

### By Category (smoke / two-agent / three-agent / failure-recovery / full-pipeline / real-code)
[each scenario: name | PASS/FAIL | one-line note]

### Failures
[if any: what failed and why]

### Migration Status
[did all agent types respond correctly after migration to C:\\Agents?]

Return as plain markdown.`,
  { subagent_type: 'general-purpose', label: 'final-report', phase: 'Report' }
)

return { total: allResults.length, passed, failed, report }
