# Integration Guide — Connecting an Agent Orchestrator to the Dashboard

This guide explains how to wire a master/orchestrator agent into the Agent Command Center dashboard. It covers the full session lifecycle, gate handling, cost reporting, graceful degradation, messaging, and includes a complete worked example.

The CLI script is at `$env:CLAUDE_AGENTS_REPO\system\agentDashboard\scripts\update-dashboard.js`. It requires Node.js and no npm install.

---

## Prerequisites

The dashboard must be running before any CLI calls will take effect:

```powershell
cd $env:CLAUDE_AGENTS_REPO\system\agentDashboard
.\start.ps1
```

If it is not running, every CLI call exits silently with code 1 — the orchestrator continues unaffected.

---

## Session Lifecycle

A well-formed session follows this sequence:

```
session-start
    |
    +-- agent-spawn (one or more agents per phase)
    |       |
    |       +-- [gate]
    |       +-- [poll-messages]          <-- new: check for user messages at checkpoints
    |       +-- [agent-reply]            <-- new: reply to any messages found
    |       +-- [gate-clear]
    |       +-- agent-done
    |       (repeat for each agent in the phase)
    |
    +-- agent-cost-update (Phase 9, one per agent that had cost 0)
    |
    session-end
```

`clear` is available at any time to reset the display without affecting history.

---

## When to Call Each Command

### session-start

Call once at the very beginning of the pipeline run, before any agents are spawned.

```powershell
$sessionId = [guid]::NewGuid().ToString()
$started   = (Get-Date -Format "o")

node "$env:CLAUDE_AGENTS_REPO\system\agentDashboard\scripts\update-dashboard.js" session-start `
  --session-id $sessionId `
  --task "DMX-1234: Implement checkout flow" `
  --started $started
```

Store `$sessionId` — every subsequent call in this run must pass the same value.

`session-start` implicitly adds the master agent to the active zone. You do not need a separate `agent-spawn` for master.

---

### agent-spawn

Call immediately before invoking a specialist agent. The dashboard shows the character with a working animation while the agent is running.

```powershell
node "...\update-dashboard.js" agent-spawn `
  --session-id $sessionId `
  --agent architect `
  --phase "Phase 2 -- Architecture" `
  --model "claude-opus-4-8"
```

Valid agent names: `master`, `architect`, `backend`, `frontend`, `qa`, `validator`, `researcher`, `ux`, `documentation`, `forge`.

Passing an unrecognised name is not an error — the dashboard will display a fallback character.

---

### agent-done

Call immediately after the agent returns, whether it passed or failed.

```powershell
node "...\update-dashboard.js" agent-done `
  --session-id $sessionId `
  --agent architect `
  --cost 0 `
  --status pass
```

Pass `--cost 0` here. Actual Claude API token costs are not available at this point in the orchestration flow (they require a separate log-session lookup). The costs are filled retroactively in Phase 9 using `agent-cost-update`.

For a failed agent:

```powershell
node "...\update-dashboard.js" agent-done `
  --session-id $sessionId `
  --agent qa `
  --cost 0 `
  --status fail
```

---

### gate / gate-clear

Call `gate` when the pipeline pauses for a human or automated approval check. Call `gate-clear` when the gate passes.

```powershell
# Gate opens
node "...\update-dashboard.js" gate `
  --session-id $sessionId `
  --gate-name "Gate 0 -- Architecture Approval"

# ... wait for approval ...

# Gate clears
node "...\update-dashboard.js" gate-clear --session-id $sessionId
```

Only one gate is displayed at a time. Opening a second gate before clearing the first overwrites the displayed name.

---

### agent-cost-update

Call once per agent in Phase 9, after the log-session tool has returned actual usage figures. The dashboard retroactively fills each agent's cost and the running total ticks up with each call.

```powershell
node "...\update-dashboard.js" agent-cost-update `
  --session-id $sessionId `
  --agent architect `
  --cost 0.43
```

If the same agent ran multiple times (e.g. `validator` reruns), call `agent-cost-update` once per run. The service targets the first completed entry with a zero cost on each call, filling them chronologically.

---

### session-end

Call at the end of the pipeline, after Phase 9 cost fill. Provides the authoritative total cost, sets the final status, and archives the session to `history/<sessionId>.json`.

```powershell
node "...\update-dashboard.js" session-end `
  --session-id $sessionId `
  --status completed `
  --total-cost 1.87
```

For a failed pipeline:

```powershell
node "...\update-dashboard.js" session-end `
  --session-id $sessionId `
  --status failed `
  --total-cost 0.31
```

---

## Messaging from Master

The dashboard supports a bi-directional message channel between the browser UI and master. Users type messages into the panel and master polls for them at defined checkpoints in the pipeline. Messages are never a gate-approval signal — they are an advisory channel only and do not affect pipeline advancement.

### poll-messages

Fetches all pending messages for the session and atomically transitions them to `processing` status. Master should call this at natural checkpoints (gate boundaries, between phases, before invoking expensive agents) so the user can steer the run while it is underway.

```powershell
$rawMessages = node "...\update-dashboard.js" poll-messages --session-id $sessionId
```

**stdout contract:** The command writes a raw JSON array to stdout and nothing else. No log lines, no decoration. On any error (including API down) the command exits 0 and stdout is `[]`. This means the output can always be safely parsed without checking the exit code.

```powershell
# Recommended polling pattern
$rawMessages = node "...\update-dashboard.js" poll-messages --session-id $sessionId 2>$null
if ($rawMessages -and $rawMessages -ne '[]') {
    $msgs = $rawMessages | ConvertFrom-Json
    foreach ($msg in $msgs) {
        # Process $msg.id and $msg.content
        # ...write reply to temp file, then call agent-reply
    }
}
```

Each object in the returned array is a `DashboardMessage` (see API.md for the full schema). The fields used by master are `id` and `content`. The `status` field will be `"processing"` in the returned array (the transition from `pending` to `processing` happens server-side as part of the poll).

---

### agent-reply

Posts a reply to a specific message. The reply content is passed via a temp file to avoid shell quoting issues with multi-line or special-character text.

```powershell
# Write reply to a temp file
$tmpFile = [IO.Path]::GetTempFileName()
[IO.File]::WriteAllText($tmpFile, $replyText, [Text.Encoding]::UTF8)

# Send the reply
node "...\update-dashboard.js" agent-reply `
  --session-id $sessionId `
  --message-id $msg.id `
  --reply-file $tmpFile
```

**`--reply-file` convention:**
- The file must be plain text (UTF-8).
- Use `[IO.File]::WriteAllText($path, $text, [Text.Encoding]::UTF8)` rather than `Set-Content -Encoding UTF8` to avoid a UTF-8 BOM. If a BOM is present the CLI strips it automatically (the `U+FEFF` character is removed from the start of the content before sending).
- The file is deleted by the CLI after a successful PATCH. If the PATCH fails the file is left in place; no cleanup is required from the calling script.

**Exit behaviour:** The command always exits 0. Errors (API down, missing file, non-existent message id) are written to stderr only.

---

### Recommended polling placement in master's pipeline

Poll at every checkpoint where human input could reasonably change the plan. The minimum recommended points are:

1. After `session-start`, before spawning Phase 1 agents — catches any pre-run context.
2. After each gate clears — the user has been watching and may want to respond.
3. After each agent's output is available but before passing it to the next phase — the user can react to intermediate results.

Polling is cheap (one HTTP GET that exits 0 on error) and does not block the pipeline when the message queue is empty.

---

## Cost Reporting Pattern

Token costs in Claude pipelines are only available after calling the `log-session` tool, which happens at the end of the run (Phase 9). The dashboard handles this with a two-pass approach:

**During the run (Phases 1-8)**

- `agent-done` is called with `--cost 0` for every agent
- `totalCostUsd` stays at $0.0000 throughout the active session
- This is expected and by design

**Phase 9 — cost fill**

After `log-session` returns the cost table, iterate over each agent and call `agent-cost-update`:

```powershell
# Example: Phase 9 cost fill loop
$costs = @{
  architect  = 0.43
  backend    = 0.61
  qa         = 0.28
  validator  = 0.19
  documentation = 0.36
}

foreach ($agent in $costs.Keys) {
  node "...\update-dashboard.js" agent-cost-update `
    --session-id $sessionId `
    --agent $agent `
    --cost $costs[$agent]
}
```

The cost counter in the dashboard header ticks up visibly with each `agent-cost-update` call.

**session-end**

The `--total-cost` flag on `session-end` sets the definitive figure and overrides whatever the running accumulation reached. This handles rounding and any agents whose costs were not individually updated.

---

## Graceful Degradation

The CLI is designed to never break the orchestrator. If the dashboard API is not running:

- The script catches the connection error
- It exits with code 1 (for event commands) or code 0 (for `poll-messages` and `agent-reply`)
- It writes nothing to stdout or stderr (event commands); `poll-messages` writes `[]` to stdout
- The calling PowerShell script continues normally

You do not need to check the exit code or wrap calls in try/catch. The dashboard is an optional observer of the pipeline, not a dependency of it.

If the dashboard was running but crashed mid-session, subsequent CLI calls will fail silently. When the API is restarted it will reload `state.json` and `messages.json` and resume from the last persisted state. Events that fired during the outage will be missing from the log but the last known state will be correct.

---

## Worked Example — 3-Phase Pipeline

This example shows a minimal pipeline with three specialist agents, one gate, and message polling at each checkpoint.

```powershell
$CLI = "$env:CLAUDE_AGENTS_REPO\system\agentDashboard\scripts\update-dashboard.js"
$sessionId = [guid]::NewGuid().ToString()
$started   = (Get-Date -Format "o")

# Helper: poll and reply to any pending messages
function Invoke-MessagePoll {
    param([string]$SessionId)
    $raw = node $CLI poll-messages --session-id $SessionId 2>$null
    if ($raw -and $raw -ne '[]') {
        $msgs = $raw | ConvertFrom-Json
        foreach ($msg in $msgs) {
            # (In a real pipeline, master would generate a contextual reply here)
            $reply = "Acknowledged: $($msg.content)"
            $tmp = [IO.Path]::GetTempFileName()
            [IO.File]::WriteAllText($tmp, $reply, [Text.Encoding]::UTF8)
            node $CLI agent-reply `
                --session-id $SessionId `
                --message-id $msg.id `
                --reply-file $tmp
        }
    }
}

# ── Phase 0: Start ──────────────────────────────────────────────────────────
node $CLI session-start `
  --session-id $sessionId `
  --task "DMX-1234: Add user profile page" `
  --started $started

Invoke-MessagePoll $sessionId

# ── Phase 1: Architecture ───────────────────────────────────────────────────
node $CLI agent-spawn `
  --session-id $sessionId --agent architect `
  --phase "Phase 1 -- Architecture" --model "claude-opus-4-8"

# ... invoke architect agent, wait for output ...

node $CLI agent-done --session-id $sessionId --agent architect --cost 0 --status pass

# Gate: require architecture approval before building
node $CLI gate --session-id $sessionId --gate-name "Gate 1 -- Architecture Approval"

# ... approval received (automated or human) ...

node $CLI gate-clear --session-id $sessionId

Invoke-MessagePoll $sessionId     # user may have commented during the gate wait

# ── Phase 2: Backend ────────────────────────────────────────────────────────
node $CLI agent-spawn `
  --session-id $sessionId --agent backend `
  --phase "Phase 2 -- Backend Implementation" --model "claude-sonnet-4-6"

# ... invoke backend agent ...

node $CLI agent-done --session-id $sessionId --agent backend --cost 0 --status pass

Invoke-MessagePoll $sessionId

# ── Phase 3: QA ─────────────────────────────────────────────────────────────
node $CLI agent-spawn `
  --session-id $sessionId --agent qa `
  --phase "Phase 3 -- QA" --model "claude-sonnet-4-6"

# ... invoke qa agent ...

node $CLI agent-done --session-id $sessionId --agent qa --cost 0 --status pass

Invoke-MessagePoll $sessionId

# ── Phase 9: Cost Fill ───────────────────────────────────────────────────────
# After log-session returns actual costs:
node $CLI agent-cost-update --session-id $sessionId --agent architect --cost 0.43
node $CLI agent-cost-update --session-id $sessionId --agent backend   --cost 0.61
node $CLI agent-cost-update --session-id $sessionId --agent qa        --cost 0.28

# ── Session End ──────────────────────────────────────────────────────────────
node $CLI session-end `
  --session-id $sessionId `
  --status completed `
  --total-cost 1.32
```

**What the dashboard shows during this run:**

1. After `session-start`: master appears in the Active zone with a working animation, phase bar shows "Starting".
2. After `agent-spawn architect`: architect appears alongside master, phase bar updates.
3. After `agent-done architect`: architect moves to the Completed zone with a checkmark wave.
4. After `gate`: a gate banner overlays the workspace.
5. After `gate-clear`: banner disappears.
6. After `agent-spawn backend`: backend appears, phase bar updates.
7. After `agent-done backend`: backend moves to Completed.
8. After `agent-spawn qa` / `agent-done qa`: same pattern.
9. After each `agent-cost-update`: the cost counter in the header increments.
10. After `session-end`: all agents in Completed zone, status badge turns blue ("completed"), session is archived.
11. Any message sent by the user in the panel appears with `●` (pending), transitions to `◎` (processing) when polled, and to `✓` (replied) when master's reply is posted.

---

## Multiple Runs of the Same Agent

If your pipeline re-invokes the same agent (e.g. `validator` fails and is retried), call `agent-spawn` and `agent-done` again with the same agent name. Both runs appear in the Completed zone. During Phase 9, call `agent-cost-update` once per run — costs are applied to zero-cost entries in chronological order.

```powershell
# First validator run (fails)
node $CLI agent-spawn --session-id $sessionId --agent validator --phase "Phase 6 -- Validation" --model "claude-opus-4-8"
node $CLI agent-done  --session-id $sessionId --agent validator --cost 0 --status fail

# Second validator run (passes)
node $CLI agent-spawn --session-id $sessionId --agent validator --phase "Phase 6 -- Validation (retry)" --model "claude-opus-4-8"
node $CLI agent-done  --session-id $sessionId --agent validator --cost 0 --status pass

# Phase 9 cost fill — two calls, applied chronologically
node $CLI agent-cost-update --session-id $sessionId --agent validator --cost 0.18
node $CLI agent-cost-update --session-id $sessionId --agent validator --cost 0.21
```
