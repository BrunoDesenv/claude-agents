# Commands Reference

All commands are available as `/namespace:command [args]` in Claude Code.
They load the agent's full persona + skills + knowledge from `agents/` via the agent-hub MCP.

---

## master

### `/master:run [task description]`
Runs the **full multi-agent pipeline** from intake to documentation.

**When to use:** Any non-trivial engineering task that needs planning, implementation, validation, and documentation.

**What it does:**
1. Writes `task.md` + `requirements.md`
2. Spawns architect → Gate 0 (your approval)
3. Spawns backend + frontend in parallel for planning
4. Validator reviews plans → Gate 1
5. Backend then frontend implement (sequential)
6. Validator checks drift → Gate 2
7. QA runs Playwright tests → Gate 3
8. Documentation synthesises everything
9. Session summary + cost logged to DB

**Example:**
```
/master:run Add a room capacity filter to the rooms list page
```

---

### `/master:quick [task description]`
Runs the **lightweight pipeline** for simple, single-discipline tasks.

**When to use:** Small, scoped changes — "fix X", "add field Y", "update Z" — where only backend OR frontend is involved and no new API contracts, DB migrations, or auth changes are needed.

**What it does:**
1. Writes `task.md` + `requirements.md`
2. Spawns architect → aborts to `/master:run` if `BLOCKED_MAJOR_ARCHITECTURE_DECISION` is found
3. Spawns 1 implementation agent (backend OR frontend) for planning + implementation
4. Session summary + cost logged to DB

**Skipped:** researcher, ux, validator×2, qa, documentation

**Estimated cost:** ~$0.50–$0.80 (vs ~$1.50+ for full pipeline)

**Example:**
```
/master:quick Add a `cancelledAt` timestamp field to the booking response DTO
```

---

### `/master:retrospective [bug description]`
Teaches the agent system from a **production bug** that slipped past QA.

**When to use:** When you find a bug manually that the agents should have caught.

**What it does:** Identifies which agent missed the bug → writes a new rule to `agents/[agent]/knowledge/[rule].md` → agents automatically learn it on the next session.

**Example:**
```
/master:retrospective The booking form closes when a 409 conflict is returned — the input is lost
```

---

## architect

### `/architect:create [goal]`
Full lifecycle: **investigate → plan → implement → review**.

**When to use:** Adding a new system capability that requires architectural decisions.

**Phases:** Phase 0 (sync docs) → Phase 1 (analysis) → Gate 0 → Phase 2 (ADR) → Gate 1 → Phase 3 (implement) → Phase 4 (audit).

**Example:**
```
/architect:create Design a webhook system for booking status changes
```

---

### `/architect:auditor [target]`
Security, performance, or pattern audit. Routes automatically based on keywords.

**Keywords:** `security / vulnerability / auth / secret` → [SECURITY] | `perf / slow / bottleneck` → [PERFORMANCE] | anything else → [GENERAL]

**Output:** Prioritised findings (Critical → Low) + remediation roadmap.

**Example:**
```
/architect:auditor Audit C:\TesteComPRD\api for security vulnerabilities before going to production
```

---

### `/architect:docs [target]`
Syncs codebase logic with documentation. Detects state: [GREENFIELD], [ADAPT], or [SYNC].

**Example:**
```
/architect:docs C:\TesteComPRD\api — the codebase changed significantly in the last sprint
```

---

## backend

### `/backend:create [goal]`
Full backend lifecycle: **investigation → plan → implementation → tests → audit**.

**What it produces:** Controllers, services, repositories, models, migrations, xUnit tests, API.md.

**Example:**
```
/backend:create Add DELETE /api/rooms/{id} with soft-delete and ownership check
```

---

### `/backend:auditor [target]`
Backend-specific audit: security (OWASP), performance (N+1, indexes), quality (SOLID, tests).

**Example:**
```
/backend:auditor C:\TesteComPRD\api\RoomBooking.Api\Controllers\BookingsController.cs
```

---

### `/backend:docs [target]`
Generates API reference, service docs, DB schema documentation.

**Example:**
```
/backend:docs C:\TesteComPRD\api — generate full API.md for the frontend team
```

---

## frontend

### `/frontend:create [goal]`
Full frontend lifecycle: **component tree → state → API integration → implementation**.

**What it produces:** Angular/React components, services, routing, SCSS, COMPONENTS.md.

**Example:**
```
/frontend:create Build a booking history page with date range filter and pagination
```

---

### `/frontend:auditor [target]`
Frontend audit: XSS/CSRF (security), Web Vitals (performance), WCAG AA (accessibility).

**Example:**
```
/frontend:auditor C:\TesteComPRD\spa\src\app\features — audit all feature components
```

---

### `/frontend:docs [target]`
Documents component tree, state management, user journeys, routing.

**Example:**
```
/frontend:docs C:\TesteComPRD\spa — new developer joining, needs to understand the SPA
```

---

## researcher

### `/researcher:investigate [topic]`
**Phase 0 only** — scopes the research, maps sub-questions, asks clarifying questions. Writes `[TOPIC]_DISCOVERY.md` and stops for approval.

**Use before:** `/researcher:report`

**Example:**
```
/researcher:investigate Migrating from SQLite to PostgreSQL — risks, migration strategy, EF Core compatibility
```

---

### `/researcher:report [topic]`
Full research execution. Triangulates ≥3 sources, applies temporal relevance (12-24 months), resolves conflicts.

**Use after:** approving `/researcher:investigate`

**Example:**
```
/researcher:report [after approving DISCOVERY.md from investigate]
```

---

## qa

### `/qa:test [feature or path]`
Writes and runs **Playwright E2E tests** with video + screenshot evidence for every test.

**Mandatory inclusions:**
- Auth integration test (login form → Bearer token → API returns 200)
- Visual quality check (page is not unstyled/blank)
- All major user journeys

**Output:** `QA-REPORT.md` + `evidence/*.webm` + `evidence/*.png`

**Example:**
```
/qa:test The booking creation flow at http://localhost:4200 — test all AC-13 to AC-16
```

---

## validator

### `/validator:review [target]`
Plan review (before implementation) or drift review (after implementation).

**Auto-detects mode** from context:
- If reviewing plan files → `PLAN_REVIEW`
- If comparing plan vs implementation → `DRIFT_REVIEW`

**Applies:** SOLID checklist, security checklist, requirements coverage matrix.

**Output:** `STATUS: PASS | APPROVED_WITH_NOTES | FAIL` + findings table.

**Example:**
```
/validator:review Review the plans in C:\Users\bru_b\.claude\sessions\[session]\agent-output\
```

---

## ux

### `/ux:design [feature]`
Full UX specification: user journey, accessibility, design tokens, component spec, ADR boundary mapping.

**Output:** `ux-plan.md` with WCAG criteria cited by number (e.g., 1.4.3), token names (e.g., `--color-primary`).

**Example:**
```
/ux:design Room comparison feature — side-by-side view of up to 3 rooms with capacity, location, and availability
```

---

### `/ux:audit [target]`
Accessibility + design compliance audit. Cites WCAG criterion by number for every finding.

**Checks:** Level A violations (missing alt, non-semantic HTML) + Level AA violations (contrast, focus) + token violations (raw hex/px).

**Example:**
```
/ux:audit C:\TesteComPRD\spa\src\app — full WCAG 2.1 AA audit before release
```

---

## documentation

### `/documentation:write [session or feature]`
Synthesises specialist agent outputs into final docs.

**Hard gate:** Requires `QA-REPORT.md` with `STATUS: PASS` to proceed.

**Reads:** `ADR.md` + `API.md` + `COMPONENTS.md` + `QA-REPORT.md`
**Writes:** `README.md` + `CHANGELOG.md`

**Example:**
```
/documentation:write Synthesise the booking cancellation feature session docs
```

---

## forge

### `/forge:audit [agent-name]`
Audits an agent's definition against the agent standards (0-6 score).

**Checks:** Role defined, "does NOT" restrictions, output file spec, skills/ files, knowledge/ files, gate definitions.

**Output:** Audit report at `agents/forge\audits\[agent]-audit.md` with proposed fixes.

**Example:**
```
/forge:audit validator
```

---

### `/forge:improve [agent-name]`
Applies improvements approved from `/forge:audit`.

**What it does:** Writes new `knowledge/` and `skills/` files, updates `brain/persona.md`, updates `AGENTS.md`.

**Example:**
```
/forge:improve validator    ← after approving the forge:audit report
```

---

## Quick Reference

| I want to... | Command |
|---|---|
| Build a new feature end-to-end | `/master:run [feature description]` |
| Audit code before a PR | `/backend:auditor [file]` or `/architect:auditor [path]` |
| Design a new screen | `/ux:design [feature]` |
| Research a technology decision | `/researcher:investigate [topic]` |
| Write E2E tests | `/qa:test [feature]` |
| Review plans or implementation | `/validator:review [target]` |
| Generate documentation | `/documentation:write [session]` |
| Teach agents from a bug | `/master:retrospective [bug description]` |
| Improve an agent | `/forge:audit [agent]` → approve → `/forge:improve [agent]` |
| Check system health | `& "$env:CLAUDE_AGENTS_REPO\system\health-check.ps1"` |
| See cost report | `& "$env:CLAUDE_AGENTS_REPO\system\cost-tracker\scripts\cost-report.ps1"` |
