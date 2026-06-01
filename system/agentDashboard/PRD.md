# PRD — Agent Command Center

> **Purpose of this document.** This PRD is the input artifact for an autonomous multi-agent build.
> It describes **WHAT** to build and the **acceptance criteria** to verify it.
> Output directory: `C:\Agents\system\agentDashboard\`

---

## 1. Overview

A local interactive web dashboard built with **Angular 19 + ASP.NET Core (.NET 8)** that visualises multi-agent AI pipeline activity in real-time.

**The agents being visualised are the AI specialist agents defined in `C:\Agents\`:**
- **master** — the orchestrator that coordinates the entire pipeline
- **architect** — designs architecture and produces ADRs
- **backend** — builds APIs, services, and tests
- **frontend** — builds Angular/React components and pages
- **qa** — writes and runs Playwright E2E tests
- **validator** — reviews plans and implementations
- **researcher** — investigates unknowns and compares libraries
- **ux** — designs UX specs and accessibility requirements
- **documentation** — synthesises final docs from all agent outputs
- **forge** — audits and improves other agent definitions

When master runs a pipeline session (e.g., to build a feature or fix a bug), it spawns these agents in sequence. The dashboard shows each agent as a **2D animated SVG character** appearing in a workspace scene as they are called.

The system has three components:
1. **API (C# .NET 8)** — receives dashboard events from master, holds in-memory state, and pushes real-time updates to the Angular app via **SignalR**.
2. **SPA (Angular 19)** — subscribes to SignalR, renders agent characters, shows cost/phase/log.
3. **State Writer CLI** — `update-dashboard.js` (Node.js, no npm deps) — called by master at each pipeline phase, POSTs events to the C# API.

---

## Agent Autonomy Note

> **For agents reading this PRD:**
>
> The technical choices in this document (Angular, C#, SignalR, SVG characters) represent
> a reasonable starting point, but they are **not locked**.
>
> If you identify a better approach for any component — a different real-time mechanism,
> a more efficient rendering strategy, a simpler state management pattern — you are
> **encouraged to propose and adopt it**, provided you:
> 1. Document your reasoning in `PROGRESS.md` under your phase
> 2. Explain what the original suggestion was and why yours is better
> 3. Confirm it still satisfies all the acceptance criteria in §11
>
> The acceptance criteria are fixed. The implementation path is open.
>
> Examples of valid improvements:
> - Replacing SignalR with Server-Sent Events if it's simpler and sufficient
> - Using a different Angular state pattern if signals work better for this use case
> - Building SVG characters inline vs as separate components if that's cleaner
> - Adding a feature not described here if it genuinely improves the UX
>
> When in doubt: simpler and working beats complex and elegant.

---

## 2. Goals & Non-Goals

**Goals**
- Real-time visual feedback during master pipeline execution
- Each agent is a 2D SVG character with role-specific design and animations
- Cost accumulates live; phase/gate transitions are visible
- Works fully locally — no cloud, no auth
- Session history preserved

**Non-Goals**
- Controlling or interrupting agents from the UI
- Remote access or multi-user support
- 3D rendering (WebGL/Three.js) — 2D SVG characters are sufficient
- Mobile support

---

## 3. Tech Stack & Constraints

| Area | Choice | Notes |
|------|--------|-------|
| Backend | ASP.NET Core .NET 8 | Controllers + SignalR hub |
| Frontend | Angular 19 | Standalone components, Signals, no NgModules |
| Real-time | SignalR | Push from API to Angular on every state change |
| State | In-memory + JSON file | API holds state in memory; persists to `state.json` on each update |
| Characters | SVG-based 2D figures | Inline SVG per agent, animated with CSS |
| State Writer | Node.js (built-ins only) | POSTs to the C# API — zero npm deps |
| Ports | API: 5200, SPA: 4300 | Separate from RoomBooking (5000/4200) |

**Hard constraints**
- `update-dashboard.js` — zero npm dependencies, only Node.js built-ins (`http`, `url`, `fs`)
- Angular components are standalone (no NgModules)
- All paths use `C:\Agents\system\agentDashboard\` as root
- API must allow CORS from `http://localhost:4300`

---

## 4. Agent Characters (2D SVG)

Each agent is a unique hand-drawn-style 2D SVG character. Not just emojis — actual figures with head, body, and role-specific props.

| Agent | Character Style | Colour | Role Prop |
|-------|----------------|--------|-----------|
| master | Business suit figure | #7c3aed (purple) | Clipboard / conductor's baton |
| architect | Blueprint-holding figure | #2563eb (blue) | Blueprint roll + hard hat |
| backend | Engineer figure | #16a34a (green) | Gear/wrench in hand |
| frontend | Designer figure | #0891b2 (cyan) | Paintbrush + monitor |
| qa | Inspector figure | #ea580c (orange) | Magnifying glass |
| validator | Judge figure | #dc2626 (red) | Gavel / checkmark |
| researcher | Scientist figure | #ca8a04 (yellow) | Microscope / book |
| ux | Sketch artist figure | #db2777 (pink) | Stylus + tablet |
| documentation | Writer figure | #6b7280 (gray) | Quill + scroll |
| forge | Blacksmith figure | #92400e (brown) | Hammer + anvil |

**SVG character anatomy (each ~120×160px):**
- Head: circle with face (eyes, simple expression)
- Body: rounded rectangle with role-coloured outfit
- Arms: animated (idle = relaxed, working = raised/moving)
- Prop: role-specific object in hand
- Name badge below figure
- Status indicator dot (top-right: green=working, orange=waiting, grey=idle)

**Character states and animations:**
- `idle` — arms down, gentle breathing scale (2s loop)
- `working` — arms raised, body sways, glow ring around character (1.5s loop)
- `waiting` — arms cross, hourglass spins above head
- `done` — checkmark burst animation, character waves, then shrinks to completed zone
- `fail` — X burst animation, character shakes once

---

## 5. System Architecture

```
master.md (PowerShell)
    │
    │  node update-dashboard.js agent-spawn --agent architect ...
    ▼
scripts/update-dashboard.js (Node.js)
    │
    │  POST http://localhost:5200/api/dashboard/event
    ▼
api/Controllers/DashboardController.cs (.NET 8)
    │
    │  Updates in-memory DashboardState
    │  Persists to state.json
    │
    │  Broadcasts via SignalR
    ▼
api/Hubs/DashboardHub.cs (SignalR)
    │
    │  Pushes "StateUpdated" event to all connected clients
    ▼
spa/src/app/core/dashboard.service.ts (Angular)
    │
    │  HubConnection.on("StateUpdated", ...)
    │  Updates DashboardState signal
    ▼
spa/src/app/features/dashboard/dashboard.component.ts
    │
    │  Renders agent characters reactively
    ▼
Browser at http://localhost:4300
```

---

## 6. API Contract

**Base URL:** `http://localhost:5200`

### POST /api/dashboard/event
Receives events from the state writer CLI.

Request body:
```json
{
  "type": "session-start | agent-spawn | agent-done | gate | gate-clear | session-end | clear",
  "sessionId": "uuid",
  "payload": {
    "task": "...",
    "started": "iso-utc",
    "agent": "architect",
    "phase": "Phase 2 — Architecture",
    "model": "claude-opus-4-8",
    "cost": 0.27,
    "status": "pass",
    "gateName": "Gate 0 — Architecture Approval",
    "totalCost": 1.48
  }
}
```

Response: `200 OK { "ok": true }`

### GET /api/dashboard/state
Returns current `DashboardState` as JSON.

### GET /api/dashboard/history
Returns list of past sessions from `history/*.json` files.

---

## 7. State Schema

**DashboardState (C# model + JSON file at `state.json`):**

```csharp
public record DashboardState
{
    public string SessionId { get; init; } = "";
    public string Task { get; init; } = "";
    public string Phase { get; init; } = "";
    public DateTimeOffset StartedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public string Status { get; init; } = "idle"; // idle|running|completed|failed
    public List<AgentState> ActiveAgents { get; init; } = [];
    public List<AgentState> CompletedAgents { get; init; } = [];
    public string? CurrentGate { get; init; }
    public decimal TotalCostUsd { get; init; }
    public List<LogEntry> Log { get; init; } = [];
}

public record AgentState
{
    public string Name { get; init; } = "";
    public string Status { get; init; } = "idle";
    public string Phase { get; init; } = "";
    public DateTimeOffset SpawnedAt { get; init; }
    public DateTimeOffset? CompletedAt { get; init; }
    public decimal CostUsd { get; init; }
    public string Model { get; init; } = "";
}

public record LogEntry
{
    public string Time { get; init; } = "";
    public string Type { get; init; } = "";
    public string? Agent { get; init; }
    public string Message { get; init; } = "";
}
```

---

## 8. Angular App Structure

```
spa/src/app/
├── app.config.ts              — provideRouter, provideHttpClient, SignalR setup
├── app.routes.ts              — single route: / → DashboardComponent
├── core/
│   ├── dashboard.service.ts   — SignalR connection, DashboardState signal
│   └── agent-config.ts        — character definitions (name, color, SVG)
├── features/dashboard/
│   ├── dashboard.component.ts — main layout: header + workspace + log
│   ├── agent-card.component.ts — SVG character card with animations
│   ├── gate-banner.component.ts — active gate display
│   └── log-panel.component.ts — event log + history
└── shared/
    └── agent-svg/             — SVG character components per agent
        ├── master-svg.component.ts
        ├── architect-svg.component.ts
        └── ... (one per agent)
```

**dashboard.service.ts key points:**
- Uses `@microsoft/signalr` npm package
- Connects to `http://localhost:5200/dashboardHub`
- Exposes `state = signal<DashboardState>(EMPTY_STATE)`
- On `StateUpdated` event: `this.state.set(newState)`

---

## 9. State Writer CLI

**File:** `C:\Agents\system\agentDashboard\scripts\update-dashboard.js`

Zero npm dependencies — uses only `node:http` and `node:url`.

POSTs to `http://localhost:5200/api/dashboard/event`.

```
node update-dashboard.js session-start --session-id <uuid> --task "..." --started <iso>
node update-dashboard.js agent-spawn   --session-id <uuid> --agent <name> --phase "..." --model <id>
node update-dashboard.js agent-done    --session-id <uuid> --agent <name> --cost <n> --status pass|fail
node update-dashboard.js gate          --session-id <uuid> --gate-name "..."
node update-dashboard.js gate-clear    --session-id <uuid>
node update-dashboard.js session-end   --session-id <uuid> --status completed|failed --total-cost <n>
node update-dashboard.js clear
```

If the API is not running, the CLI fails silently (non-zero exit code, no crash) — master must not break if dashboard is down.

---

## 10. Start Scripts

**`start.ps1`:**
```powershell
# Starts the API and opens the SPA
Start-Process dotnet -ArgumentList "run" -WorkingDirectory "C:\Agents\system\agentDashboard\api\AgentDashboard.Api"
Start-Sleep 3
Start-Process "http://localhost:4300"
cd "C:\Agents\system\agentDashboard\spa"
ng serve --port 4300 --no-open
```

**`stop.ps1`:**
```powershell
# Kills processes on ports 5200 and 4300
@(5200, 4300) | ForEach-Object {
    $p = Get-NetTCPConnection -LocalPort $_ -EA SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($p) { Stop-Process -Id $p -Force -EA SilentlyContinue }
}
```

---

## 11. Acceptance Criteria

### State Writer CLI
- **AC-1** `session-start` POSTs successfully; API reflects master in activeAgents within 1s
- **AC-2** `agent-spawn` adds agent to activeAgents in API state
- **AC-3** `agent-done` moves agent from activeAgents to completedAgents with cost
- **AC-4** `gate` sets currentGate; `gate-clear` nullifies it
- **AC-5** `session-end` sets status, saves `history/<sessionId>.json`
- **AC-6** CLI fails silently if API is down (non-zero exit, no exception thrown)
- **AC-7** Zero npm deps — `node update-dashboard.js` works without npm install

### API & SignalR
- **AC-8** `GET /api/dashboard/state` returns correct DashboardState JSON
- **AC-9** Every POST to `/api/dashboard/event` triggers a SignalR `StateUpdated` broadcast
- **AC-10** `dotnet run` starts without errors; listens on `http://localhost:5200`
- **AC-11** CORS allows `http://localhost:4300`

### Angular Dashboard
- **AC-12** Opening `http://localhost:4300` shows "No active session" when state is idle
- **AC-13** After `session-start`, master character appears with working animation within 2s
- **AC-14** After `agent-spawn architect`, architect character appears alongside master
- **AC-15** After `agent-done architect`, architect card flies to Completed zone with ✅
- **AC-16** Gate banner appears/disappears correctly
- **AC-17** Cost counter reflects `totalCostUsd` in real-time
- **AC-18** No console errors during normal use
- **AC-19** Each agent character has a distinct 2D SVG figure (not just emoji text)
- **AC-20** Working animation is visible and smooth (character moves/pulses)

### End-to-End
- **AC-21** `start.ps1` boots the system and opens the browser
- **AC-22** Running `claude --agent master` with any task populates the dashboard live

---

## 12. Definition of Done

- All 22 acceptance criteria pass
- `start.ps1` opens the dashboard in one command
- `dotnet build` on `api/` — 0 errors
- `tsc --noEmit` on `spa/` — 0 errors
- `update-dashboard.js` runs without npm install
- `PROGRESS.md` exists with full reasoning log from all agents

---

## 13. PROGRESS.md

A `PROGRESS.md` at `C:\Agents\system\agentDashboard\PROGRESS.md`, written append-only as work proceeds.
Final section: checklist AC-1…AC-22 marked pass/fail with verification method.
