# Agent Cost Tracking System

Local SQLite cost tracking for AI agent sessions run by the `master` agent pipeline.

## Structure

```
$env:CLAUDE_AGENTS_REPO\system\
├── README.md
├── database\
│   └── agent-costs.db       ← SQLite database (auto-created)
└── scripts\
    ├── log-session.js        ← CLI: log sessions and agent runs
    ├── cost-query.js         ← Query helper for the report
    ├── cost-report.ps1       ← PowerShell summary report
    └── package.json
```

## Usage

### Run the cost report
```powershell
$env:NODE_NO_WARNINGS = "1"
& "$env:CLAUDE_AGENTS_REPO\system\scripts\cost-report.ps1"
```

### Log a session (called by master agent)
```powershell
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js session `
  --id <uuid> --task "task description" `
  --started "2026-05-30T10:00:00Z" --status partial
```

### Log an agent run
```powershell
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js agent `
  --session-id <uuid> --agent architect --model claude-opus-4-8 `
  --phase "Phase 2 - Architecture" --attempt 1 `
  --tokens-in 15000 --tokens-out 3000 --cost 0.27 --status pass
```

### Query sessions
```powershell
# Table (default)
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js query --last 10

# JSON
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js query --last 10 --format json

# CSV export
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js query --last 0 --format csv > sessions.csv

# Filter by agent
node $env:CLAUDE_AGENTS_REPO\system\scripts\log-session.js query --agent backend --format table
```

## Model Rates (reference)

| Model | Input | Output |
|-------|-------|--------|
| claude-opus-4-8 | $15.00/M | $75.00/M |
| claude-sonnet-4-6 | $3.00/M | $15.00/M |
| claude-haiku-4-5 | $0.80/M | $4.00/M |

## Typical Session Cost

| Agent | Model | Est. Cost |
|-------|-------|-----------|
| architect | opus | ~$0.27 |
| backend | sonnet | ~$0.24 |
| frontend | sonnet | ~$0.21 |
| validator x2 | opus | ~$0.60 |
| qa | sonnet | ~$0.15 |
| documentation | sonnet | ~$0.09 |
| **Total** | | **~$1.56** |
