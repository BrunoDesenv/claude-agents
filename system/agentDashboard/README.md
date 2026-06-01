# Agent Command Center

A local real-time dashboard that visualises multi-agent AI pipeline activity. When the master agent runs a pipeline session it calls `update-dashboard.js` at each step; the dashboard shows every agent as a 2D animated SVG character and updates live via SignalR.

---

## Quick Start

```powershell
cd C:\Agents\system\agentDashboard
.\start.ps1
```

`start.ps1` starts the API in a minimised PowerShell window, runs `npm install` in `spa/` if `node_modules` is absent, waits until port 4300 responds, then opens `http://localhost:4300` in the default browser. The Angular dev server stays in the foreground — Ctrl-C stops it.

To shut everything down:

```powershell
.\stop.ps1
```

---

## Architecture

```
master agent (PowerShell)
    |
    |  node scripts/update-dashboard.js <command> [options]
    v
scripts/update-dashboard.js          -- Node.js, zero npm deps
    |
    |  POST http://localhost:5200/api/dashboard/event
    |  POST http://localhost:5200/api/dashboard/message
    |  GET  http://localhost:5200/api/dashboard/messages
    |  PATCH http://localhost:5200/api/dashboard/messages/{id}/reply
    v
api/AgentDashboard.Api               -- ASP.NET Core .NET 10
    |-- DashboardController          -- POST /event, GET /state, GET /history
    |                                   POST /message, GET /messages, PATCH /messages/{id}/reply
    |-- DashboardStateService        -- in-memory state + state.json + history/*.json
    |-- MessagesService              -- in-memory messages + messages.json
    |-- DashboardHub (SignalR)       -- broadcasts "StateUpdated", "MessageReceived", "MessageReplied"
    |
    |  SignalR WebSocket push  "StateUpdated" / "MessageReceived" / "MessageReplied"
    v
spa/src/app/core/dashboard.service.ts   -- Angular 19, port 4300
    |-- state    = signal<DashboardState>
    |-- messages = signal<DashboardMessage[]>
    v
spa/src/app/features/dashboard/
    |-- DashboardComponent           -- header, phase bar, workspace grid, log
    |-- AgentCardComponent           -- per-agent card with status
    |-- AgentSvgComponent            -- animated SVG character (shared)
    |-- GateBannerComponent          -- gate overlay
    |-- LogPanelComponent            -- auto-scrolling event log
    |-- MessagePanelComponent        -- bi-directional messaging thread
    v
Browser at http://localhost:4300
```

State is also written to `C:\Agents\system\agentDashboard\state.json` on every event, and archived to `history/<sessionId>.json` on `session-end`. The API reloads `state.json` on startup so the dashboard survives a restart mid-session.

Messages are stored separately in `C:\Agents\system\agentDashboard\messages.json`. This file is not session-scoped and accumulates messages across sessions; all queries are filtered by `sessionId`.

---

## CLI Commands

All commands are called via Node.js with no npm install required. The script is at `scripts/update-dashboard.js`. If the API is not running the script exits with code 1 and prints nothing — the calling process is never interrupted.

### session-start

Begins a new session. Adds the master agent to the active zone.

```
node update-dashboard.js session-start \
  --session-id <uuid> \
  --task "Implement feature X" \
  --started 2026-05-30T09:00:00Z
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | UUID identifying this pipeline run |
| `--task` | Yes | Human-readable description of the work being done |
| `--started` | No | ISO-8601 UTC timestamp; defaults to `now` |

### agent-spawn

Adds a specialist agent to the active zone with a working animation.

```
node update-dashboard.js agent-spawn \
  --session-id <uuid> \
  --agent architect \
  --phase "Phase 2 -- Architecture" \
  --model claude-opus-4-8
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Must match the active session |
| `--agent` | Yes | Agent name (see Agent Characters table) |
| `--phase` | Yes | Phase label shown in the phase bar |
| `--model` | No | Model ID string shown in the agent card |

### agent-done

Moves an agent from the active zone to the completed zone.

```
node update-dashboard.js agent-done \
  --session-id <uuid> \
  --agent architect \
  --cost 0 \
  --status pass
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Must match the active session |
| `--agent` | Yes | Name of the agent that finished |
| `--cost` | No | Cost in USD at completion time; pass `0` if not yet known |
| `--status` | No | `pass` (default) or `fail` |

Note: individual agent costs are typically unavailable at completion time. Pass `--cost 0` here and use `agent-cost-update` in Phase 9 to backfill actual costs.

### agent-cost-update

Retroactively sets the cost for a completed agent and updates the running total.

```
node update-dashboard.js agent-cost-update \
  --session-id <uuid> \
  --agent architect \
  --cost 0.43
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Must match the active session |
| `--agent` | Yes | Name of the completed agent to update |
| `--cost` | Yes | Actual cost in USD |

When an agent has run multiple times (e.g. `validator` reruns), the update targets the first completed entry with a zero cost, falling back to the most recent entry if all are already priced.

### gate

Displays a gate banner across the workspace. Agents visually pause while a gate is active.

```
node update-dashboard.js gate \
  --session-id <uuid> \
  --gate-name "Gate 0 -- Architecture Approval"
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Must match the active session |
| `--gate-name` | Yes | Display name for the gate |

### gate-clear

Removes the gate banner.

```
node update-dashboard.js gate-clear --session-id <uuid>
```

### session-end

Closes the session. Moves any remaining active agents to completed, sets the final status and cost, and writes `history/<sessionId>.json`.

```
node update-dashboard.js session-end \
  --session-id <uuid> \
  --status completed \
  --total-cost 1.87
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Must match the active session |
| `--status` | No | `completed` (default) or `failed` |
| `--total-cost` | No | Authoritative total cost in USD |

### clear

Resets the dashboard to the idle state. Does not affect history files.

```
node update-dashboard.js clear
```

### poll-messages

Polls for messages sent from the dashboard UI to the master agent. All pending messages are atomically transitioned to `processing` status and returned. Exits 0 on any error (including API down); on error stdout is `[]`.

```
node update-dashboard.js poll-messages --session-id <uuid>
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Session to poll messages for |

stdout is a raw JSON array of `DashboardMessage` objects. Nothing else is written to stdout. Error messages go to stderr only, so the output can always be piped directly to a JSON parser.

### agent-reply

Sends a reply from the master agent to a message that originated in the dashboard UI. Reads the reply text from a file (to avoid shell quoting issues with multi-line content), POSTs it to the API, and deletes the temp file on success. Exits 0 on any error.

```
node update-dashboard.js agent-reply \
  --session-id <uuid> \
  --message-id <message-guid-string> \
  --reply-file <absolute-path-to-temp-file>
```

| Flag | Required | Description |
|---|---|---|
| `--session-id` | Yes | Session this message belongs to |
| `--message-id` | Yes | The `id` field of the `DashboardMessage` being replied to |
| `--reply-file` | Yes | Absolute path to a plain-text file containing the reply content |

The reply file is deleted after a successful PATCH. If the PATCH fails the file is left in place. The BOM (`U+FEFF`) is stripped from the start of the file content before sending, so files written with `Set-Content -Encoding UTF8` (Windows PowerShell 5.x) are handled correctly.

---

## Messaging

The dashboard includes a bi-directional message channel between the browser UI and the master agent. It is a supplementary communication layer — messages are never a gate-approval signal and do not affect pipeline advancement.

### How the message panel works

1. The user types a message in the panel at the bottom of the dashboard and presses Send (or Enter).
2. The SPA POSTs the message to `POST /api/dashboard/message`. An optimistic entry appears in the thread immediately, before the server confirms.
3. The server stores the message in `messages.json` with `status: "pending"` and broadcasts a `MessageReceived` SignalR event. The SPA reconciles the optimistic entry with the server-confirmed record (which carries the real server-assigned id).
4. At its next polling checkpoint, master calls `poll-messages --session-id X`. The API atomically transitions all pending messages to `processing` and returns them. Master now knows what to respond to.
5. Master writes its reply text to a temp file and calls `agent-reply --session-id X --message-id Y --reply-file PATH`.
6. The API stores the reply, sets `status: "replied"`, and broadcasts a `MessageReplied` SignalR event. The SPA updates the thread in real time.

### Status machine

Messages move through exactly three states in forward order only:

| Status | Meaning | UI indicator |
|---|---|---|
| `pending` | Sent by user, not yet seen by master | `●` amber dot |
| `processing` | Picked up by master's poll, reply in progress | `◎` purple ring, pulsing animation |
| `replied` | Master has posted a reply | `✓` green check |

### Why pull, not push

Master is a turn-based agent — it cannot interrupt itself to handle an inbound push event. The only moments it can safely act on user input are at well-defined checkpoints in the pipeline (gate boundaries, phase transitions). Pull-at-checkpoint maps directly onto this execution model. Push (SignalR) is used exclusively in the other direction: API to SPA, where the browser is an always-on listener.

### Storage

Messages are stored in `C:\Agents\system\agentDashboard\messages.json`, separate from `state.json`. They are not included in `DashboardState` and are not broadcast as part of `StateUpdated` events. The `messages` signal in `DashboardService` is populated independently via `GET /api/dashboard/messages` on connect/reconnect and updated in real time via `MessageReceived`/`MessageReplied` SignalR events.

---

## API Endpoints

Base URL: `http://localhost:5200`

### POST /api/dashboard/event

Receives an event, updates in-memory state, persists `state.json`, and broadcasts the new state to all SignalR clients.

Request body:

```json
{
  "type": "session-start",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "task": "Implement feature X",
    "started": "2026-05-30T09:00:00Z",
    "agent": "architect",
    "phase": "Phase 2 -- Architecture",
    "model": "claude-opus-4-8",
    "cost": 0.43,
    "status": "pass",
    "gateName": "Gate 0 -- Architecture Approval",
    "totalCost": 1.87
  }
}
```

All payload fields are optional; only the fields relevant to the event type are read. See the API reference for per-event payload requirements.

Response: `200 OK` with `{ "ok": true }`.

### GET /api/dashboard/state

Returns the current `DashboardState` as JSON.

### GET /api/dashboard/history

Returns an array of past `DashboardState` objects loaded from `history/*.json`, ordered by `startedAt` descending.

### POST /api/dashboard/message

Sends a message from the SPA to the agent. See [API.md](api/AgentDashboard.Api/API.md) for the full contract.

### GET /api/dashboard/messages

Returns messages for a session. When `status=pending` is passed, all pending messages are atomically transitioned to `processing`. When `status=all` is passed no mutation occurs.

### PATCH /api/dashboard/messages/{id}/reply

Posts a reply to a message. See [API.md](api/AgentDashboard.Api/API.md) for the full contract.

---

## Event Types

| Type | Triggered by | Key payload fields |
|---|---|---|
| `session-start` | Start of pipeline | `task`, `started` |
| `agent-spawn` | Agent is invoked | `agent`, `phase`, `model` |
| `agent-done` | Agent returns | `agent`, `cost`, `status` |
| `agent-cost-update` | Phase 9 cost fill | `agent`, `cost` |
| `gate` | Gate check begins | `gateName` |
| `gate-clear` | Gate passes | — |
| `session-end` | Pipeline finishes | `status`, `totalCost` |
| `clear` | Manual reset | — |

---

## Agent Characters

Each agent is a unique 120x160 px inline SVG figure with head, body, arms, legs, and a role-specific prop.

| Agent | Label | Colour | Prop |
|---|---|---|---|
| master | Master | #7c3aed (purple) | Conductor's baton + clipboard |
| architect | Architect | #2563eb (blue) | Blueprint roll + hard hat |
| backend | Backend | #16a34a (green) | Wrench (gear icon on body) |
| frontend | Frontend | #0891b2 (cyan) | Paintbrush + monitor display |
| qa | QA | #ea580c (orange) | Magnifying glass |
| validator | Validator | #dc2626 (red) | Gavel |
| researcher | Researcher | #ca8a04 (yellow) | Book + glasses |
| ux | UX | #db2777 (pink) | Stylus + tablet |
| documentation | Docs | #6b7280 (gray) | Quill + scroll |
| forge | Forge | #92400e (brown) | Hammer + anvil |

Unknown agent names fall back to the master SVG with a gray colour.

---

## Dashboard States and Animations

**Agent status states**

| Status | Visual effect | Status dot colour |
|---|---|---|
| `working` | `sway` animation (1.5 s loop) + agent-coloured glow ring | Green |
| `idle` | `breathe` scale animation (2.5 s loop) | Gray |
| `waiting` | `pulse-wait` opacity fade (2 s loop) | Amber |
| `done` | `wave-done` rotation burst + checkmark pop | Green |
| `fail` | `shake-fail` horizontal shake + X pop | Red |

**Session status badge**

| Status | Colour |
|---|---|
| `idle` | Gray |
| `running` | Green |
| `completed` | Blue |
| `failed` | Red |

**Layout**

The workspace is split into an Active zone (full-size cards) and a Completed zone (cards scaled to 85%). When the active zone is empty and status is `idle`, a "No active session" message is shown. The log panel is a fixed 320 px sidebar on the right with auto-scroll. The message panel sits in a `280px` max-height strip between the gate banner row and the main workspace.

---

## Development Notes

**Ports**

| Component | Port |
|---|---|
| API | 5200 |
| SPA | 4300 |

These are intentionally separate from any other local dev ports (e.g. 5000/4200 used by other projects).

**Dependencies**

- API: .NET 10 SDK. SignalR is included in ASP.NET Core — no extra NuGet packages.
- SPA: Node.js + npm. Run `npm install` once inside `spa/`. The `@microsoft/signalr` package is the only runtime dependency beyond Angular itself.
- CLI: Node.js only. No npm install needed.

**Rebuild API**

```powershell
cd C:\Agents\system\agentDashboard\api\AgentDashboard.Api
dotnet build
dotnet run
```

**Rebuild SPA**

```powershell
cd C:\Agents\system\agentDashboard\spa
npm install
npm run start -- --port 4300
```

**State files**

- `C:\Agents\system\agentDashboard\state.json` — current session state, overwritten on every event
- `C:\Agents\system\agentDashboard\history\<sessionId>.json` — one file per completed session
- `C:\Agents\system\agentDashboard\messages.json` — all messages across sessions, filtered by sessionId at query time

---

## Known Limitations

**Live cost is retroactive, not real-time.** `agent-done` calls pass `--cost 0` because Claude API token usage is not accessible mid-session from within the master orchestration logic. Individual agent costs show $0.0000 in the dashboard until Phase 9, when `agent-cost-update` events fill in actual costs one by one and the running total ticks up. The `session-end --total-cost` value is always the authoritative final figure.

**No fan-out tracking.** If an agent is spawned more than once in a session (e.g. `validator` reruns), both instances appear in the completed zone but share the same agent name. `agent-cost-update` targets the first zero-cost entry chronologically, which is usually correct.

**SignalR reconnect re-syncs via HTTP poll.** On reconnect after a network drop, `DashboardService` calls `GET /api/dashboard/state` and `GET /api/dashboard/messages` to catch up on any events that arrived during the disconnection window. Events that fired while disconnected are visible in the log but may have been missed visually.

**Messages are not broadcast inside DashboardState.** The `messages` signal in `DashboardService` is a separate channel from `state`. `StateUpdated` SignalR events do not carry message data. A freshly connected client learns about existing messages via the explicit `GET /api/dashboard/messages?status=all` call on connect, not from the state snapshot.

**`processing` status is UI-only.** A message in `processing` state indicates master has polled it but not yet replied. If master crashes after polling but before replying, that message remains in `processing` permanently — the `poll-messages` command queries `status=pending` only and will not re-deliver it. The status is useful as a diagnostic indicator but does not provide crash recovery. To recover a stuck message, use `PATCH /api/dashboard/messages/{id}/reply` directly.
