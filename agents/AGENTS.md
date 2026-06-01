# Agents Catalog

## Overview

This is a multi-agent AI engineering team hosted at `C:\Agents` and loaded via the `agent-hub` MCP server (`get_agent_prompt`). The system covers the full software delivery lifecycle: architecture decisions, research, UX design, backend and frontend implementation, validation, QA, and documentation.

Each agent is a specialist with clearly bounded responsibilities. **Master** is the sole orchestrator — it spawns all other agents in sequence, enforces approval gates, and routes bugs to their owners. Specialist agents execute and write their own documentation artifacts. The **documentation** agent synthesises at the end.

Agents are loaded by the MCP server from `C:\Agents\[agent]\brain\persona.md` plus all files in `skills\` and `knowledge\`. This means knowledge files added by retrospective agents are automatically included in future runs without any configuration change.

---

## Recommended Pipeline

```
master
  └─ Phase 2:  architect          → ADR.md
  └─ Phase 3:  researcher         → research.md          (optional — only if unknowns exist)
  └─ Phase 4:  ux                 → ux-plan.md           (optional — only for UI-heavy tasks)
  └─ Phase 4:  backend  (PLAN)    → backend-plan.md      ─┐ parallel
  └─ Phase 4:  frontend (PLAN)    → frontend-plan.md     ─┘
  └─ Phase 5:  validator          → validator.md         (PLAN_REVIEW)
  └─ [GATE 1 — user approves plans]
  └─ Phase 6:  backend  (IMPL)    → backend-impl.md, API.md
  └─ Phase 6:  frontend (IMPL)    → frontend-impl.md, COMPONENTS.md
  └─ Phase 6.5 validator          → validator-post-impl.md (DRIFT_REVIEW)
  └─ [GATE 2 — user approves implementation]
  └─ Phase 7:  qa                 → QA-REPORT.md + evidence/
  └─ Phase 7.5 retrospective      → C:\Agents\[agent]\knowledge\[lesson].md  (auto, on bug)
  └─ [GATE 3 — user approves QA]
  └─ Phase 8:  documentation      → README.md, CHANGELOG.md
  └─ Phase 9:  master             → session-summary.md + cost DB write
```

---

## Index

| Agent | Type | Primary Responsibility | When to Use | Recommended Model | Estimated Cost |
|-------|------|----------------------|-------------|-------------------|----------------|
| master | Orchestrator | Coordinates all agents through the pipeline | Every session | claude-sonnet-4-6 | N/A (overhead) |
| architect | Specialist | Architecture decisions, ADR, API contracts | Always first, every session | claude-opus-4-8 | ~$0.27/run |
| researcher | Specialist | Investigates unknowns, compares libraries | When unknowns or library decisions exist | claude-sonnet-4-6 | ~$0.12/run |
| ux | Specialist | UX specs, accessibility, component design | When screens, interactions, or a11y decisions needed | claude-sonnet-4-6 | ~$0.10/run |
| backend | Specialist | APIs, services, DB, auth, xUnit tests | When API, service, DB, or auth work needed | claude-sonnet-4-6 | ~$0.24 (plan) + ~$0.35 (impl) |
| frontend | Specialist | Angular/React/Vue components, SPA pages | When UI, components, or state management needed | claude-sonnet-4-6 | ~$0.21 (plan) + ~$0.30 (impl) |
| validator | Specialist | Read-only plan review and drift review | Twice per session: after planning and after implementation | claude-opus-4-8 | ~$0.30/run (×2) |
| qa | Specialist | Playwright E2E browser tests, visual evidence | After post-implementation validation passes | claude-sonnet-4-6 | ~$0.15/run |
| documentation | Specialist | Synthesises agent docs into README + CHANGELOG | Always last, after QA passes | claude-sonnet-4-6 | ~$0.08/run |
| system | Infrastructure | Cost tracking (SQLite), session logs | Automatically used by master in Phase 9 | N/A | N/A |

---

## Agents

---

### master

**Name:**
Master Agent — Tech Lead

**Responsibility:**
Receives a task, decomposes it by discipline, and coordinates all specialist agents through a structured pipeline with approval gates. Does not write code, answer engineering questions, or skip any phase.

**When to use:**
Every session. Entry point via `claude --agent master` or by setting `"agent": "master"` in `.claude/settings.json`. Automatically detects production bug reports at Phase 1 (keyword scan for: "erro", "bug", "broken", "não aparece", "401", "crash") and runs a retrospective agent before fixing.

**Expected inputs:**
- User's task description (plain language)

**Mandatory outputs:**
- `task.md` — verbatim task written at Phase 1
- `requirements.md` — discipline breakdown (backend/frontend/ux/research yes/no)
- `session-summary.md` — final session summary with cost estimate
- Cost entry written to `C:\Agents\system\database\agent-costs.db`

**Files it may write:**
- `[session-dir]/task.md`
- `[session-dir]/requirements.md`
- `[session-dir]/session-summary.md`
- `C:\Agents\system\database\agent-costs.db` (via log-session.js)
- `C:\Agents\[agent]\knowledge\[lesson].md` (via retrospective sub-agent)

**Approval gates:**
- **Gate 0** — after architect: present ADR summary, halt until user approves
- **Gate 1** — after plan validation: present all plans, halt until user approves
- **Gate 2** — after drift validation: present drift findings, halt until user approves
- **Gate 3** — after QA: present test results, halt until user approves

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** Não definido (overhead agent — no direct LLM tokens for its own reasoning, all tokens are in sub-agents)

**Available commands:** None (master does not use TOML commands)

**Relevant skills:** None defined in `C:\Agents\master\skills\`

**Knowledge used:** None defined in `C:\Agents\master\knowledge\`

**Limits and restrictions:**
- PROHIBITED from writing code directly
- PROHIBITED from answering engineering questions inline
- PROHIBITED from skipping any pipeline phase
- PROHIBITED from proceeding past a gate without explicit user approval
- PROHIBITED from spawning an agent without first calling `get_agent_prompt` from agent-hub MCP

**Sources:**
- `C:\Agents\master\brain\persona.md`
- `C:\Users\bru_b\.claude\agents\master.md` (full orchestration pipeline definition)

---

### architect

**Name:**
Systems Architect

**Responsibility:**
Analyzes requirements, produces architecture decisions, API contracts, ADR drafts, security/performance audits, and documentation synchronization. Operates under a Zero Trust model — no implementation proceeds without a peer-reviewed, user-validated plan.

**When to use:**
Always first in every session. Also use directly for: "design this", "ADR for X", "architecture review", "what pattern should I use for X".

**Expected inputs:**
- `task.md` and `requirements.md` from the session directory
- PRD or feature description (passed inline by master)

**Mandatory outputs:**
- `agent-output/architect.md` — working analysis for downstream agents
- `agent-output/ADR.md` — permanent Architecture Decision Record (Status, Context, Decision, Rationale, Consequences)

**Files it may write:**
- `agent-output/architect.md`
- `agent-output/ADR.md`
- `docs/pages/[feature]-analysis.md` (when using SQUAD-FLOW via TOML)
- `docs/pages/[feature]-architecture.md` (when using SQUAD-FLOW via TOML)

**Approval gates:**
- **Gate 0** — halts after producing architect.md; awaits explicit user approval before planning begins
- If output contains `BLOCKED_MAJOR_ARCHITECTURE_DECISION`, master surfaces both options to the user and re-spawns with the decision

**Recommended model:** claude-opus-4-8

**Estimated cost:** ~$0.27/run (~15k input tokens, ~3k output tokens at Opus rates)

**Available commands:**
- `architect:create` — Full lifecycle (Investigation → Plan → Implementation → Review) with SQUAD-FLOW mode
- `architect:auditor` — Specialized audit (SECURITY / PERFORMANCE / GENERAL) with MCP server integration
- `architect:docs` — Sync codebase logic with Logseq documentation; Triple-Anchor Update (AGENTS.md, GEMINI.md, CLAUDE.md)

**Relevant skills:**
- `skills/protocol.md` — Engineering Execution Protocol (DISCOVERY, PLAN, IMPLEMENT, SQUAD-FLOW modes)
- `skills/reviewer.md` — High-level architecture review (system boundaries, contract integrity, scalability)
- `skills/security_auditor.md` — Architectural security (trust boundaries, identity federation, compliance, infrastructure resilience)
- `skills/documentation-output.md` — ADR.md template and writing standard

**Knowledge used:**
- `knowledge/patterns.md` — SOLID, GRASP, GoF patterns, enterprise integration patterns, architectural styles (Clean, Hexagonal, CQRS, Event-Driven)
- `knowledge/security_standards.md` — OWASP Top 10 (2021), input validation, data protection, GDPR/HIPAA references
- `knowledge/bottlenecks.md` — 7-vector performance and resilience audit (DB, distributed systems, algorithm, async, network, observability, scaling)
- `knowledge/dependencies.md` — Infrastructure selection matrix (PostgreSQL, MongoDB, Redis, RabbitMQ, Kafka, Elasticsearch, Kong/NGINX, Kubernetes)
- `knowledge/roi_logic.md` — ROI formula, technical debt valuation, risk buffer (20%)
- `knowledge/docs_standard.md` — AI Context, ADR, Mermaid diagrams, AST citations, depth-first documentation mandate

**Limits and restrictions:**
- Does NOT write application code
- Does NOT proceed to planning without user-approved Gate 0
- Does NOT skip security or performance analysis when flagged by task description

**Sources:**
- `C:\Agents\architect\brain\persona.md`
- `C:\Agents\architect\skills\` (4 files)
- `C:\Agents\architect\knowledge\` (6 files)
- `C:\Agents\architect\commands\architect\` (3 TOML files)
- `C:\Agents\architect\README.md`

---

### backend

**Name:**
Backend Engineer

**Responsibility:**
Builds APIs, services, database logic, authentication flows, and developer tests (xUnit). Produces working, testable, documented server-side code. Owns the API contract defined by the architect.

**When to use:**
When the task requires API endpoints, services, DB schema, auth flows, or server-side business logic. Spawned by master in two phases: PLAN (design only) then IMPLEMENTATION (code).

**Expected inputs:**
- `agent-output/backend-plan.md` (IMPLEMENTATION mode)
- `agent-output/architect.md` (both modes)
- PRD or task description (passed by master)

**Mandatory outputs:**
- `agent-output/backend-plan.md` — implementation plan (PLAN mode)
- `agent-output/backend-impl.md` — implementation notes and deviations (IMPLEMENTATION mode)
- `agent-output/API.md` — permanent API reference (all endpoints, request/response shapes, error codes)
- `api/evidence/results.trx`, `api/evidence/results.html`, `api/evidence/test-output.txt` — test evidence

**Files it may write:**
- `agent-output/backend-plan.md`
- `agent-output/backend-impl.md`
- `agent-output/API.md`
- All backend source files: controllers, services, repositories, models, migrations, xUnit test files
- `api/evidence/` (test evidence directory)

**Approval gates:**
- None directly. Validator enforces Gate 1 (plan review) and Gate 2 (drift review). Backend may be re-spawned with findings if validator returns FAIL.

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.24/run (PLAN: ~40k input + ~8k output) · ~$0.35/run (IMPLEMENTATION: larger context)

**Available commands:**
- `backend:create` — Full lifecycle with Logseq PRD reading, API contract mapping, ADR generation, implementation, audit
- `backend:auditor` — Backend quality audit (SECURITY / PERFORMANCE / GENERAL) with MCP server integration
- `backend:docs` — Backend documentation sync (API endpoints, data models, resilience policies, DB indexes)

**Relevant skills:**
- `skills/protocol.md` — Engineering Execution Protocol (DISCOVERY, PLAN, IMPLEMENT, SQUAD-FLOW)
- `skills/reviewer.md` — Backend review (N+1, indexes, resilience, API integrity, rate limiting, contract sync)
- `skills/security_auditor.md` — Server-side protection (injection, CSRF/XSS, SSRF, infrastructure, TLS)
- `skills/documentation-output.md` — API.md template and writing standard
- `skills/test-evidence.md` — Mandatory `dotnet test` evidence collection with TRX, HTML, and console output

**Knowledge used:**
- `knowledge/patterns.md` — SOLID, GoF, enterprise integration patterns, architectural styles
- `knowledge/security_standards.md` — OWASP Top 10, input validation, data protection
- `knowledge/bottlenecks.md` — Performance and resilience audit vectors
- `knowledge/dependencies.md` — Infrastructure selection matrix
- `knowledge/roi_logic.md` — ROI and technical debt valuation
- `knowledge/docs_standard.md` — Documentation standards and AI Context
- `knowledge/testing_tools.md` — Unit testing (Jest, Vitest, Mocha), integration testing (supertest), resilience testing

**Limits and restrictions:**
- Does NOT touch frontend components, Angular/React files, CSS, or UX assets
- Does NOT ship code with failing tests
- xUnit tests are backend's exclusive responsibility — QA agent does NOT run `dotnet test`

**Sources:**
- `C:\Agents\backend\brain\persona.md`
- `C:\Agents\backend\skills\` (5 files)
- `C:\Agents\backend\knowledge\` (7 files)
- `C:\Agents\backend\commands\backend\` (3 TOML files)
- `C:\Agents\backend\README.md`

---

### frontend

**Name:**
Frontend Engineer

**Responsibility:**
Builds Angular/React/Vue components, SPA pages, UI state management, and frontend services. Produces component-driven, type-safe, accessible UIs following existing code patterns.

**When to use:**
When the task requires UI components, pages, routing, forms, or state management. Spawned by master in two phases: PLAN (design only) then IMPLEMENTATION (code).

**Expected inputs:**
- `agent-output/frontend-plan.md` (IMPLEMENTATION mode)
- `agent-output/architect.md` and `agent-output/ux-plan.md` (both modes)
- `agent-output/backend-plan.md` (to understand the API being consumed)

**Mandatory outputs:**
- `agent-output/frontend-plan.md` — implementation plan with UX Spec Traceability table (PLAN mode)
- `agent-output/frontend-impl.md` — implementation notes and deviations (IMPLEMENTATION mode)
- `agent-output/COMPONENTS.md` — permanent component documentation (Component Tree, Selector, Route, Inputs, Outputs, State, Responsibilities)

**Files it may write:**
- `agent-output/frontend-plan.md`
- `agent-output/frontend-impl.md`
- `agent-output/COMPONENTS.md`
- All frontend source files: Angular components, services, pages, routing, templates, SCSS/CSS

**Approval gates:**
- None directly. Validator enforces Gate 1 (plan review) and Gate 2 (drift review).

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.21/run (PLAN: ~35k input + ~7k output) · ~$0.30/run (IMPLEMENTATION)

**Available commands:**
- `frontend:create` — Full lifecycle with Design Extraction via Stitch MCP, component mapping, state flow analysis, ADR, UI implementation, audit
- `frontend:auditor` — Frontend audit (SECURITY / PERFORMANCE / GENERAL) with Playwright and Stitch MCP integration
- `frontend:docs` — Frontend documentation sync (user journeys, component hierarchy, state flow, rendering strategy, UI DNA)

**Relevant skills:**
- `skills/protocol.md` — Engineering Execution Protocol with Visual Verification step (Playwright CLI for agent-driven browser screenshots)
- `skills/reviewer.md` — UI/UX integrity, state management, performance, bundle size, a11y, responsive design
- `skills/security_auditor.md` — Client-side vulnerabilities (XSS, client state, CORS), API interaction (token handling, exposure)
- `skills/documentation-output.md` — COMPONENTS.md template and writing standard
- `skills/ux-traceability.md` — Mandatory UX Spec Traceability table (ADDRESSED / DEFERRED / N/A for every UX requirement)

**Knowledge used:**
- `knowledge/patterns.md` — Component architecture (Atomic, Container/Presentational, HOCs, Composables), state management (Redux, Pinia, NgRx, Zustand), rendering/hydration, UI/UX standards
- `knowledge/security_standards.md` — Top web vulnerabilities (XSS, CSRF, CORS, CSP), secure storage, input sanitization, WCAG/OWASP
- `knowledge/bottlenecks.md` — Web Vitals (LCP, CLS, INP), rendering/main thread, bundle/asset optimization, state/data fetching, resilience/a11y
- `knowledge/dependencies.md` — Frontend ecosystem (React, Vue 3, Angular, Vite/Webpack, Tailwind, Vitest, Cypress, Playwright, TanStack Query)
- `knowledge/roi_logic.md` — Frontend ROI (conversion, retention, SEO, a11y compliance, performance as a feature)
- `knowledge/docs_standard.md` — Documentation standards
- `knowledge/testing_tools.md` — Unit/component testing (Vitest, RTL), E2E (Playwright CLI), visual/responsive testing

**Limits and restrictions:**
- Does NOT touch backend controllers, services, repositories, DB migration files
- Must use `signal()` for reactive state in Angular — not plain class properties (causes Angular 19 zoneless CD failures)
- UX Spec Traceability table is mandatory when `ux-plan.md` exists — missing rows = FAIL at validator

**Sources:**
- `C:\Agents\frontend\brain\persona.md`
- `C:\Agents\frontend\skills\` (5 files)
- `C:\Agents\frontend\knowledge\` (7 files)
- `C:\Agents\frontend\commands\frontend\` (3 TOML files)
- `C:\Agents\frontend\README.md`

---

### qa

**Name:**
QA Engineer

**Responsibility:**
Writes and runs Playwright E2E browser tests. Tests user-visible behavior only — black-box, no code inspection. Produces visual evidence (screenshots + videos) for every run. Reports bugs with owner identification; does not fix bugs.

**When to use:**
After post-implementation validation (drift review) passes. Also use directly for: "write E2E tests", "test this feature", "QA for X".

**Expected inputs:**
- `task.md` and all `agent-output/*-impl.md` files from the session directory
- Running instances of API and SPA (QA starts them if needed)

**Mandatory outputs:**
- `agent-output/QA-REPORT.md` — STATUS (PASS/FAIL), test results table, bugs found (with owner), coverage gaps, evidence file list
- `e2e/evidence/[test-name]/video.webm` — screen recording for every test
- `e2e/evidence/[test-name]/test-finished-1.png` — screenshot for every test
- `e2e/evidence/[test-name]/trace.zip` — trace on failure only

**Files it may write:**
- `agent-output/QA-REPORT.md`
- `e2e/tests/[feature].spec.ts` (Playwright test file)
- `e2e/playwright.config.ts`
- `e2e/evidence/` (all visual evidence)

**Approval gates:**
- Gate 3 — master reads QA-REPORT.md and halts for user approval before documentation begins

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.15/run (~25k input + ~5k output). Re-runs after bug fixes add ~$0.10 each.

**Available commands:** None (QA does not use TOML commands)

**Relevant skills:**
- `skills/evidence-collection.md` — Mandatory Playwright config: `screenshot: 'on'`, `video: { mode: 'on', size: 1280×720 }`, `trace: 'retain-on-failure'`, `outputDir: './evidence'`
- `skills/test-patterns.md` — Test structure (beforeEach, naming, independence), timezone testing (`test.use({ timezoneId: 'America/Sao_Paulo' })`) for UTC-3 scenarios

**Knowledge used:** None defined in `C:\Agents\qa\knowledge\`

**Limits and restrictions:**
- NEVER runs `dotnet test`, xUnit, NUnit, or any developer tests — those belong to backend agent
- Does NOT fix bugs — identifies owner (backend/frontend) and escalates to master via QA-REPORT.md
- Auth integration test is MANDATORY for any feature with protected routes: login form → Bearer token → API returns 200
- Timezone test is MANDATORY for any feature with datetime-local inputs or UTC conversion

**Sources:**
- `C:\Agents\qa\brain\persona.md`
- `C:\Agents\qa\skills\evidence-collection.md`
- `C:\Agents\qa\skills\test-patterns.md`

---

### validator

**Name:**
Validator — Staff-Level Technical Reviewer

**Responsibility:**
Read-only analysis of plans and implementations. Runs twice per session: PLAN_REVIEW (after planning, before code is written) and DRIFT_REVIEW (after implementation, comparing plan vs code).

**When to use:**
- **PLAN_REVIEW**: after all planning agents complete, before Gate 1
- **DRIFT_REVIEW**: after all implementation agents complete, before Gate 2
Also use directly for: "validate this", "review implementation", "check requirements coverage".

**Expected inputs:**
- PLAN_REVIEW: `task.md`, `requirements.md`, `agent-output/architect.md`, all `agent-output/*-plan.md`
- DRIFT_REVIEW: all `agent-output/*-plan.md` (baseline) vs all `agent-output/*-impl.md` (what was built)

**Mandatory outputs:**
- `agent-output/validator.md` — PLAN_REVIEW findings with STATUS: PASS | APPROVED_WITH_NOTES | FAIL
- `agent-output/validator-post-impl.md` — DRIFT_REVIEW findings with STATUS

**Files it may write:**
- `agent-output/validator.md`
- `agent-output/validator-post-impl.md`

**Approval gates:**
- Hard gate: implementation agents (backend, frontend) CANNOT be spawned until validator.md contains STATUS: PASS or APPROVED_WITH_NOTES from a PLAN_REVIEW pass

**Recommended model:** claude-opus-4-8 (critical quality gate — accuracy over cost)

**Estimated cost:** ~$0.30/run (~10k input + ~2k output at Opus rates) × 2 runs = ~$0.60/session

**Available commands:** None

**Relevant skills:** None defined in `C:\Agents\validator\skills\`

**Knowledge used:** None defined in `C:\Agents\validator\knowledge\`

**Limits and restrictions:**
- Does NOT write code
- Does NOT modify any files except its two output files
- Does NOT approve plans with blocking issues (security gaps, missing requirements coverage, broken architectural alignment)

**Sources:**
- `C:\Agents\validator\brain\persona.md`

---

### researcher

**Name:**
Strategic Researcher

**Responsibility:**
Investigates unknowns, compares libraries and approaches, assesses technical feasibility. Applies a clinical, evidence-based approach: triangulates ≥3 sources, prioritizes primary sources, flags gaps honestly. Closes every report with a single "Gut Check" question.

**When to use:**
When the task contains unknowns, technology choices, or unclear approaches. Spawned by master only after architect.md exists (prerequisite check). Also use directly for: "research X", "compare A vs B", "feasibility of X".

**Expected inputs:**
- `task.md`, `requirements.md`, `agent-output/architect.md` (all required — researcher depends on architect completing first)
- Research question (passed by master)

**Mandatory outputs:**
- `agent-output/researcher.md` — research findings with Executive Summary, Verified Knowledge Base, Critical Analysis, Strategic Foundation, Sources & Citations

**Files it may write:**
- `agent-output/researcher.md`
- `[RESEARCH]_DISCOVERY.md` (Phase 0 via TOML)

**Approval gates:**
- Phase 0 (via `researcher:investigate` TOML): halts after writing DISCOVERY.md, awaits user approval before full research begins

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.12/run (~20k input + ~4k output)

**Available commands:**
- `researcher:investigate` — Deep Dive Phase 0: source mapping, clarification questions, writes `[RESEARCH]_DISCOVERY.md`, halts for approval
- `researcher:report` — Full research execution: loads discovery artifact, applies Phase 1 rules (triangulation, temporal relevance, conflict resolution), outputs final report

**Relevant skills:**
- `skills/browsing.md` — Research Protocol: Phase 0 (DISCOVERY), Phase 1 (Information Gathering: ≥3 sources, 12-24 month temporal relevance, data hierarchy L1/L2/L3), Phase 2 (Formatting: citations, tables, professional language)

**Knowledge used:** None defined in `C:\Agents\researcher\knowledge\`

**Limits and restrictions:**
- NEVER runs before architect.md exists (master enforces prerequisite check)
- Does NOT invent information or provide false positives — states uncertainty explicitly
- Does NOT use software/sports metaphors (operational style constraint)

**Sources:**
- `C:\Agents\researcher\brain\persona.md`
- `C:\Agents\researcher\skills\browsing.md`
- `C:\Agents\researcher\commands\researcher\investigate.toml`
- `C:\Agents\researcher\commands\researcher\report.toml`
- `C:\Agents\researcher\README.md`

---

### ux

**Name:**
UX Designer

**Responsibility:**
Designs user journeys, accessibility specifications, component design guidance, and interaction patterns. Translates design intent into concrete frontend guidance. Does NOT write application code.

**When to use:**
When tasks involve user-facing screens, interactions, accessibility requirements, or component UX decisions. Also use directly for: "UX for X", "design this screen", "accessibility check", "component design for X".

**Expected inputs:**
- `task.md`, `requirements.md`, `agent-output/architect.md`
- `agent-output/frontend-plan.md` if it exists (for context)

**Mandatory outputs:**
- `agent-output/ux-plan.md` — User Journey, Component Design, Accessibility Requirements, all UI States, Design System Components, ADR Boundary Mapping table

**Files it may write:**
- `agent-output/ux-plan.md`

**Approval gates:**
- None directly. Frontend plan must include UX Spec Traceability table; validator catches gaps at Gate 1.

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.10/run (~12k input + ~3k output)

**Available commands:** None

**Relevant skills:** None defined in `C:\Agents\ux\skills\`

**Knowledge used:** None defined in `C:\Agents\ux\knowledge\`

**Limits and restrictions:**
- Does NOT write application code (HTML, CSS, TypeScript, etc.)
- ADR Boundary Mapping is MANDATORY: every proposed component must declare its ADR service boundary; cross-boundary components must be flagged for architect review before the plan is finalised

**Sources:**
- `C:\Agents\ux\brain\persona.md`

---

### documentation

**Name:**
Documentation Engineer

**Responsibility:**
Synthesis-only agent. Consolidates specialist agent outputs (ADR.md, API.md, COMPONENTS.md, QA-REPORT.md) into a final README.md and CHANGELOG.md. Does NOT re-document what agents already wrote.

**When to use:**
Always last in every session, after QA passes. Also use directly for: "write ADR for X", "document this", "API docs for X", "write migration guide".

**Expected inputs:**
- `agent-output/ADR.md` (from architect)
- `agent-output/API.md` (from backend)
- `agent-output/COMPONENTS.md` (from frontend)
- `agent-output/QA-REPORT.md` (from QA) — **must have STATUS: PASS**
- `agent-output/backend-impl.md` (for migration/deployment notes)

**Mandatory outputs:**
- `agent-output/README.md` — developer onboarding guide (What / Architecture / API / Components / How to Run / Tests / Known Limitations)
- `agent-output/CHANGELOG.md` — what was built this session (Added / Changed / Fixed / Known Issues)

**Files it may write:**
- `agent-output/README.md`
- `agent-output/CHANGELOG.md`

**Approval gates:**
- Hard gate: QA-REPORT.md must exist with STATUS: PASS. If missing or FAIL, writes BLOCKED to agent-output/README.md and stops.

**Recommended model:** claude-sonnet-4-6

**Estimated cost:** ~$0.08/run (~15k input + ~3k output)

**Available commands:** None

**Relevant skills:** None defined in `C:\Agents\documentation\skills\`

**Knowledge used:** None defined in `C:\Agents\documentation\knowledge\`

**Limits and restrictions:**
- Does NOT rewrite ADR.md, API.md, or COMPONENTS.md — those are owned by their respective agents
- Does NOT run before QA passes
- If any source doc is missing, flags it explicitly rather than inventing content

**Sources:**
- `C:\Agents\documentation\brain\persona.md`

---

## Infrastructure

### system/

The `system/` folder is not an agent. It is the cost tracking and reporting infrastructure for the entire multi-agent system.

**Purpose:** Persist every master session and agent run to a local SQLite database. Enables cost monitoring, usage analytics, and historical session lookup without any external service.

**Location:** `C:\Agents\system\`

**Database:** `C:\Agents\system\database\agent-costs.db`

SQLite schema:
```sql
-- One row per master session. Created at Phase 1 (status=partial), updated at Phase 9 (status=completed).
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,    -- UUID generated at Phase 1
  task        TEXT NOT NULL,       -- content of task.md
  started_at  TEXT NOT NULL,       -- ISO-8601 UTC (Phase 1)
  finished_at TEXT,                -- NULL until Phase 9 completes
  total_cost  REAL,
  total_tokens INTEGER,
  session_dir TEXT,
  status      TEXT DEFAULT 'partial' CHECK(status IN ('completed','failed','partial'))
);

-- One row per agent spawned. attempt column + UNIQUE key provide idempotency.
CREATE TABLE agent_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id),
  agent_name  TEXT NOT NULL,
  model       TEXT NOT NULL,  -- standardised: claude-opus-4-8, claude-sonnet-4-6, claude-haiku-4-5
  phase       TEXT,
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  cost_usd    REAL,
  duration_ms INTEGER,
  attempt     INTEGER DEFAULT 1,
  status      TEXT DEFAULT 'pass' CHECK(status IN ('pass','fail','blocked')),
  UNIQUE(session_id, agent_name, phase, attempt)
);
```

**Scripts:**
- `scripts/log-session.js` — CLI with 3 commands:
  - `session-start --id <uuid> --task-file <path> --started <iso> --session-dir <path>` — creates session (status=partial)
  - `session-end --id <uuid> --finished <iso> --total-cost <n> --total-tokens <n> --status completed` — closes session
  - `agent --session-id <uuid> --agent <name> --model <id> --phase <text> --tokens-in <n> --tokens-out <n> --cost <n> --status pass` — records agent run (INSERT OR REPLACE)
  - `query --last <n> [--agent <name>] [--format table|json|csv]` — query historical data
- `scripts/cost-query.js` — internal SQL query helper used by cost-report.ps1
- `scripts/cost-report.ps1` — PowerShell summary: total cost all-time, 30-day cost, most-used agent, top 5 sessions by cost, average cost per task

**How to run the cost report:**
```powershell
C:\Agents\system\scripts\cost-report.ps1
```

**Model rates used for calculations:**
| Model ID | Input per M tokens | Output per M tokens |
|----------|-------------------|---------------------|
| claude-opus-4-8 | $15.00 | $75.00 |
| claude-sonnet-4-6 | $3.00 | $15.00 |
| claude-haiku-4-5 | $0.80 | $4.00 |

**Tracked metrics:** session ID, task description, start/end timestamps, total cost, total tokens, per-agent cost, per-agent model, per-agent phase, attempt count, status (pass/fail/blocked).

**Dependencies:** Uses Node.js built-in `node:sqlite` — no npm packages required.

---

## Issues Detected

### Broken TOML references (15 total)

The following `!{cat ...}` probes in TOML command files reference paths that do not exist under `C:\Agents`. These will cause `call_agent_command` to fail silently (the probe is replaced with an error string). The `get_agent_prompt` path (used by master) is unaffected.

| Missing file | Referenced by | TOML count |
|---|---|---|
| `common/skills/logseq_knowledge.md` | architect (create, docs, auditor), backend (create, docs, auditor), frontend (create, docs, auditor), researcher (investigate, report) | 11 TOMLs |
| `common/knowledge/auth_standard.md` | architect (auditor), backend (auditor) | 2 TOMLs |
| `brainstormer/knowledge/gatekeeping.md` | researcher (investigate, report) | 2 TOMLs |

**Root cause:** These agent folders and their `common/` knowledge were removed from `C:\Agents` to enforce the "no shared knowledge" design principle. The TOML files were copied from `C:\ai-agents` and not updated to reflect the removal.

**Impact:** Only affects Gemini CLI / AntiGravity slash commands (`/architect:create`, etc.). The `get_agent_prompt` path used by Claude Code and master is fully functional.

**Recommended fix:** Remove the broken `!{cat ...}` probes from each affected TOML, or create stub files at the missing paths.

---

### Agents with minimal definitions (no skills/, no knowledge/, no commands/)

| Agent | Missing | Impact |
|-------|---------|--------|
| master | skills/, knowledge/, commands/ | Low — master runs inline in Claude Code session, does not use MCP content |
| validator | skills/, knowledge/, commands/ | Medium — validator has no domain knowledge base; relies entirely on persona.md |
| documentation | skills/, knowledge/, commands/ | Low — synthesis-only agent, minimal domain knowledge needed |
| ux | skills/, knowledge/, commands/ | Medium — no WCAG reference, no design patterns file, no accessibility knowledge base |
| qa | knowledge/, commands/ | Medium — no Playwright best-practices knowledge beyond two skill files |

---

### Agents missing README.md

documentation, master, qa, ux, validator — none have a README.md. Only architect, backend, frontend, researcher, and system do.

---

### Contract gap: documentation agent prerequisite chain

The documentation agent expects `ADR.md`, `API.md`, and `COMPONENTS.md` to exist in `agent-output/` before it runs. These files are written by architect, backend, and frontend respectively **during their implementation phases**. If any implementation agent is skipped (e.g., backend-only task with no frontend), the documentation agent will either fail silently or produce an incomplete README. Master should verify which source docs exist before spawning documentation.

---

### Knowledge asymmetry

architect, backend, and frontend have rich knowledge bases (6–7 files each). validator, qa, ux, documentation, and master have none. This means the richer agents will behave more consistently across different tasks while the lighter agents rely entirely on their persona for domain judgment.
