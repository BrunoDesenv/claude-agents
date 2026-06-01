# Agent Command Center — API Reference

Base URL: `http://localhost:5200`

The API runs on ASP.NET Core .NET 10 and has six HTTP endpoints plus a SignalR hub. All responses are JSON. There is no authentication.

---

## Endpoints

### POST /api/dashboard/event

Processes a dashboard event. On every call the service updates in-memory state, persists `state.json`, and broadcasts the new state to all connected SignalR clients.

**Request body**

```json
{
  "type": "<event-type>",
  "sessionId": "<uuid-string>",
  "payload": { }
}
```

`type` and `sessionId` are top-level strings. `payload` is an object whose relevant fields vary by event type — all fields are optional at the wire level; the service ignores fields not needed by the event type.

**Response**

```
200 OK
{ "ok": true }
```

The response is returned after the SignalR broadcast completes. There is no error schema for invalid event types — unknown types are a no-op (state is unchanged, broadcast still fires with the current state).

---

### GET /api/dashboard/state

Returns the current in-memory `DashboardState`.

**Response**

```
200 OK
<DashboardState JSON>
```

See the State Schema section for the full shape.

---

### GET /api/dashboard/history

Returns all past sessions from `history/*.json`, ordered by `startedAt` descending.

**Response**

```
200 OK
[<DashboardState>, ...]
```

Returns an empty array if no history files exist or the history directory has not been created yet.

---

### POST /api/dashboard/message

Sends a message from the SPA to the agent pipeline. Validates the request, stores the message in `messages.json` with `status: "pending"`, and broadcasts a `MessageReceived` SignalR event.

**Request body**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Can you increase the timeout on the retry logic?"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `sessionId` | string | Yes | Must match the `sessionId` of the currently active session |
| `content` | string | Yes | 1–2000 characters |

**Response — success**

```
200 OK
<DashboardMessage JSON>
```

Returns the newly created `DashboardMessage` with `status: "pending"`.

**Response — errors**

| Condition | Status | Body |
|---|---|---|
| `content` missing or empty | 400 | `{ "error": "content is required" }` |
| `content` exceeds 2000 characters | 400 | `{ "error": "content exceeds 2000 characters" }` |
| `sessionId` does not match active session (includes idle state) | 400 | `{ "error": "sessionId does not match active session" }` |

---

### GET /api/dashboard/messages

Returns messages for a session. Behaviour differs by the `status` query parameter.

**Query parameters**

| Parameter | Required | Values | Description |
|---|---|---|---|
| `sessionId` | Yes | any string | Filters messages to this session |
| `status` | No | `all` (default), `pending` | Controls filtering and whether a side effect occurs |

**Side effect when `status=pending`:** All messages for the session that are currently in `pending` state are atomically transitioned to `processing` before the response is returned. The returned array contains those messages (with `status: "processing"`). This is the poll mechanism used by master to claim messages for reply.

**No side effect when `status=all`:** Returns all messages for the session regardless of status. No state is mutated. Safe to call repeatedly from the SPA.

**Response — success**

```
200 OK
[<DashboardMessage>, ...]
```

Returns an empty array if no messages exist for the session. Always returns a valid JSON array.

**Response — errors**

| Condition | Status | Body |
|---|---|---|
| `sessionId` missing or empty | 400 | `{ "error": "sessionId is required" }` |
| `status` is not `pending` or `all` | 400 | `{ "error": "status must be 'pending' or 'all'" }` |

---

### PATCH /api/dashboard/messages/{id}/reply

Posts a reply from the master agent to a user message. Sets `status: "replied"`, stores the reply text and `repliedAt` timestamp, and broadcasts a `MessageReplied` SignalR event.

**Route parameter**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | The `id` of the `DashboardMessage` to reply to |

**Request body**

```json
{
  "reply": "I've increased the default timeout to 30 seconds in RetryPolicy.cs."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reply` | string | Yes | The reply text; must be non-empty |

**Response — success**

```
200 OK
<DashboardMessage JSON>
```

Returns the updated `DashboardMessage` with `status: "replied"`, `reply` set, and `repliedAt` set.

If the message was already in `replied` state (double-reply), the existing record is returned unchanged and the `MessageReplied` event is broadcast again. No 409 is returned — the operation is idempotent.

**Response — errors**

| Condition | Status | Body |
|---|---|---|
| `reply` missing or empty | 400 | `{ "error": "reply is required" }` |
| `id` not found | 404 | `{ "error": "message {id} not found" }` |

---

## Event Types

### session-start

Resets state to a fresh session. Adds `master` to `activeAgents` with status `working`. Sets session `status` to `running`.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `task` | string | Yes | Human-readable description of the pipeline task |
| `started` | string (ISO-8601) | No | Session start timestamp; defaults to server time |

**State produced**

- `sessionId` set from the request's top-level `sessionId`
- `task` set from payload
- `phase` set to `"Starting"`
- `status` set to `"running"`
- `activeAgents` contains one entry: `{ name: "master", status: "working", phase: "Starting", spawnedAt: <now> }`
- A log entry of type `session-start` is appended

---

### agent-spawn

Appends a new agent to `activeAgents` with status `working`. Updates the current `phase`.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent` | string | Yes | Agent name (master, architect, backend, frontend, qa, validator, researcher, ux, documentation, forge) |
| `phase` | string | Yes | Phase label to display in the phase bar |
| `model` | string | No | Model ID string (e.g. `claude-opus-4-8`) |

**State produced**

- New `AgentState` entry appended to `activeAgents`
- `phase` updated to the payload value
- A log entry of type `agent-spawn` is appended

---

### agent-done

Finds the named agent in `activeAgents`, moves it to `completedAgents`, and increments `totalCostUsd`.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent` | string | Yes | Name of the agent that completed |
| `cost` | number | No | Cost in USD; defaults to 0 |
| `status` | string | No | `"pass"` (default) or `"fail"` |

**State produced**

- Agent removed from `activeAgents`
- Agent appended to `completedAgents` with `status` set to `"done"` or `"fail"`, `completedAt` set to now, `costUsd` set to payload cost
- `totalCostUsd` incremented by the payload cost
- A log entry of type `agent-done` is appended

If `agent` is not found in `activeAgents`, the event is a no-op.

---

### agent-cost-update

Retroactively updates the `costUsd` of a completed agent. Used in Phase 9 to fill actual costs after the log-session call resolves.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `agent` | string | Yes | Name of the completed agent to update |
| `cost` | number | Yes | Actual cost in USD |

**State produced**

- Finds the first entry in `completedAgents` where `name == agent` and `costUsd == 0`; falls back to the most recent matching entry if all are already priced
- Sets that entry's `costUsd` to the payload value
- Adjusts `totalCostUsd` by the delta between old and new cost
- A state update is broadcast; no log entry is written

If no matching agent is found in `completedAgents`, the event is a no-op.

---

### gate

Sets `currentGate` to the provided name. The Angular app renders a gate banner while this field is non-null.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `gateName` | string | Yes | Display name of the gate (e.g. `"Gate 0 -- Architecture Approval"`) |

**State produced**

- `currentGate` set to `gateName`
- A log entry of type `gate` is appended

---

### gate-clear

Nullifies `currentGate`, removing the gate banner.

**Payload fields**

None required.

**State produced**

- `currentGate` set to `null`
- A log entry of type `gate-clear` is appended

---

### session-end

Closes the session. Drains any remaining `activeAgents` into `completedAgents`, sets the final status and cost, and writes a history file.

**Payload fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | `"completed"` (default) or `"failed"` |
| `totalCost` | number | No | Authoritative total session cost in USD; overrides accumulated value |

**State produced**

- All remaining `activeAgents` moved to `completedAgents` with `status: "done"` and `completedAt: now`
- `activeAgents` set to empty
- `status` set to payload value
- `totalCostUsd` set to `totalCost` if provided, otherwise unchanged
- State written to `history/<sessionId>.json`
- A log entry of type `session-end` is appended

---

### clear

Replaces the entire state with a fresh empty `DashboardState`. Does not delete history files.

**Payload fields**

None.

**State produced**

- All fields reset to defaults (`status: "idle"`, empty agents and log)

---

## State Schema

### DashboardState

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "task": "Implement feature X",
  "phase": "Phase 3 -- Backend",
  "startedAt": "2026-05-30T09:00:00+00:00",
  "updatedAt": "2026-05-30T09:04:12+00:00",
  "status": "running",
  "activeAgents": [ ],
  "completedAgents": [ ],
  "currentGate": null,
  "totalCostUsd": 0.43,
  "log": [ ]
}
```

| Field | Type | Values |
|---|---|---|
| `sessionId` | string | UUID of the current session; empty string when idle |
| `task` | string | Task description; empty string when idle |
| `phase` | string | Current phase label; empty string when idle |
| `startedAt` | DateTimeOffset | ISO-8601 with offset; default value when idle |
| `updatedAt` | DateTimeOffset | Server time of last state change |
| `status` | string | `idle`, `running`, `completed`, `failed` |
| `activeAgents` | AgentState[] | Agents currently executing |
| `completedAgents` | AgentState[] | Agents that have finished (pass or fail) |
| `currentGate` | string or null | Gate name if a gate is active; null otherwise |
| `totalCostUsd` | number | Running cost total in USD |
| `log` | LogEntry[] | Ordered event log for the session |

`DashboardState` does not include messages. Messages are a separate resource queried via `GET /api/dashboard/messages`.

---

### AgentState

```json
{
  "name": "architect",
  "status": "working",
  "phase": "Phase 2 -- Architecture",
  "spawnedAt": "2026-05-30T09:01:00+00:00",
  "completedAt": null,
  "costUsd": 0.00,
  "model": "claude-opus-4-8"
}
```

| Field | Type | Values |
|---|---|---|
| `name` | string | Agent identifier (e.g. `"architect"`) |
| `status` | string | `idle`, `working`, `waiting`, `done`, `fail` |
| `phase` | string | Phase label at time of spawn |
| `spawnedAt` | DateTimeOffset | When the agent was spawned |
| `completedAt` | DateTimeOffset or null | When the agent finished; null while active |
| `costUsd` | number | Cost in USD; 0 until filled by `agent-done` or `agent-cost-update` |
| `model` | string | Model ID string; empty if not provided |

---

### LogEntry

```json
{
  "time": "09:01:03",
  "type": "agent-spawn",
  "agent": "architect",
  "message": "architect spawned -- Phase 2 -- Architecture"
}
```

| Field | Type | Description |
|---|---|---|
| `time` | string | `HH:mm:ss` formatted server time |
| `type` | string | Event type that produced this entry |
| `agent` | string or null | Agent name for agent-scoped events; null for session/gate events |
| `message` | string | Human-readable description |

---

### DashboardMessage

Represents a single message in the SPA-to-agent messaging channel.

```json
{
  "id": "03c34165-9f1b-4c22-b3e7-d8a1f2c5e091",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Can you increase the timeout on the retry logic?",
  "reply": "I've increased the default timeout to 30 seconds in RetryPolicy.cs.",
  "createdAt": "2026-05-30T09:12:00+00:00",
  "repliedAt": "2026-05-30T09:14:37+00:00",
  "status": "replied"
}
```

| Field | Type | Values / Notes |
|---|---|---|
| `id` | string | Server-assigned UUID string; unique per message |
| `sessionId` | string | Session this message belongs to |
| `content` | string | Message text sent by the user; max 2000 characters |
| `reply` | string or null | Reply text from the agent; null until `status` is `"replied"` |
| `createdAt` | DateTimeOffset | UTC timestamp when the message was enqueued |
| `repliedAt` | DateTimeOffset or null | UTC timestamp when the reply was posted; null until replied |
| `status` | string | `"pending"`, `"processing"`, or `"replied"` |

**Status machine**

```
pending  -->  processing  -->  replied
```

| Transition | Triggered by |
|---|---|
| `pending` → `processing` | `GET /messages?status=pending` (master polling) |
| `processing` → `replied` | `PATCH /messages/{id}/reply` (master posting reply) |

There is no backward transition. A message can only move forward through the states.

Messages are stored in `messages.json` at the repository root (same directory as `state.json`). They are not included in `DashboardState` and are not part of the `StateUpdated` broadcast.

---

## SignalR Hub

**Hub URL:** `http://localhost:5200/dashboardHub`

**Protocol:** WebSocket (SignalR negotiates; falls back to Long Polling if needed)

**CORS:** Only `http://localhost:4300` is allowed. Credentials are enabled.

The hub class itself is empty — broadcasts are sent server-side via `IHubContext<DashboardHub>` from the controller. Clients do not send messages to the hub.

**Client events**

| Event name | Payload | When fired |
|---|---|---|
| `StateUpdated` | Full `DashboardState` object | After every successful `POST /api/dashboard/event` call |
| `MessageReceived` | Full `DashboardMessage` object | After a successful `POST /api/dashboard/message` call; `status` is `"pending"` |
| `MessageReplied` | Full `DashboardMessage` object | After a successful `PATCH /api/dashboard/messages/{id}/reply` call; `status` is `"replied"` |

Angular client subscription pattern:

```typescript
hub.on('StateUpdated', (newState: DashboardState) => {
  this.state.set(newState);
});

hub.on('MessageReceived', (msg: DashboardMessage) => {
  this.messages.update(all =>
    all.some(m => m.id === msg.id)
      ? all.map(m => m.id === msg.id ? msg : m)
      : [...all, msg]
  );
});

hub.on('MessageReplied', (msg: DashboardMessage) => {
  this.messages.update(all => all.map(m => m.id === msg.id ? msg : m));
});
```

On reconnect, the Angular client calls `GET /api/dashboard/state` and `GET /api/dashboard/messages?status=all` to resync with any events that arrived during the disconnection window.

---

## Error Handling

**Unknown event type:** The service switch falls through to a no-op case — state is unchanged and the current state is broadcast. Response is still `200 OK { "ok": true }`.

**Malformed JSON body:** ASP.NET Core model binding returns `400 Bad Request` with a validation problem details body.

**agent-done for unknown agent:** Silently ignored; state unchanged.

**agent-cost-update for unknown agent:** Silently ignored; state unchanged.

**File I/O failures:** `state.json` and `messages.json` writes are best-effort — exceptions are caught and swallowed. A failed write does not affect the in-memory state or the SignalR broadcast.

**API startup:** On startup the service reads `state.json` if it exists. For sessions whose `status` is `completed` or `failed` but still have entries in `activeAgents` (possible if the process was killed mid-session), those agents are drained into `completedAgents` before the first request is served. `MessagesService` reads `messages.json` on startup; a corrupt or missing file degrades to an empty list.
