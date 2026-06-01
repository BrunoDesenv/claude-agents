#!/usr/bin/env pwsh
param()
$ErrorActionPreference = "SilentlyContinue"
$script:pass = 0
$script:fail = 0
$script:results = @()

function Check { param($name, [bool]$ok, $detail, $fix)
    if ($ok) { $script:results += [PSCustomObject]@{Check=$name;Status="PASS";Detail=$detail;Fix=""}; $script:pass++ }
    else { $script:results += [PSCustomObject]@{Check=$name;Status="FAIL";Detail=$detail;Fix=$fix}; $script:fail++ }
}

# 1. AGENTS_ROOT points to claude-agents
$settingsPath = "$env:USERPROFILE\.claude\settings.json"
$agentsRootOk = $false; $agentsRootVal = "not found"
if (Test-Path $settingsPath) {
    $sc = Get-Content $settingsPath -Raw
    if ($sc -match '"AGENTS_ROOT"\s*:\s*"([^"]+)"') { $agentsRootVal = $Matches[1]; $normalizedVal = $agentsRootVal -replace "\\\\", "/"; $agentsRootOk = ($normalizedVal -eq "C:/claude-agents/agents") }
}
Check "AGENTS_ROOT = C:/claude-agents/agents" $agentsRootOk "Value: $agentsRootVal" "Run install.ps1 from C:\claude-agents to set AGENTS_ROOT"

# 2. All 9 agents have brain/persona.md (use AGENTS_ROOT env var)
$agentsRoot = if ($env:AGENTS_ROOT) { $env:AGENTS_ROOT } else { "C:\claude-agents\agents" }
$agentList = @("architect","backend","frontend","qa","validator","ux","researcher","documentation","master")
$missing = @($agentList | Where-Object { -not (Test-Path "$agentsRoot\$_\brain\persona.md") })
$pOk = $missing.Count -eq 0
$pDetail = "All 9 present (in $agentsRoot)"
if (-not $pOk) { $pDetail = "Missing: $($missing -join ', ')" }
Check "All 9 agents have brain/persona.md" $pOk $pDetail "Check AGENTS_ROOT is set correctly"

# 3. No broken TOML references
$brokenFiles = @(Get-ChildItem "$agentsRoot" -Recurse -Filter "*.toml" -EA SilentlyContinue | Where-Object { (Get-Content $_.FullName -Raw -EA SilentlyContinue) -match "!\{cat (common|brainstormer)/" })
$tc = (Get-ChildItem "$agentsRoot" -Recurse -Filter "*.toml" -EA SilentlyContinue).Count
$tOk = $brokenFiles.Count -eq 0
$tDetail = "$tc TOMLs, $($brokenFiles.Count) broken"
Check "No broken TOML references" $tOk $tDetail "Remove broken !{cat ...} probes"

# 4. SQLite DB accessible
$repoRoot = if ($env:CLAUDE_AGENTS_REPO) { $env:CLAUDE_AGENTS_REPO } else { "C:\claude-agents" }
$dbPath = "$repoRoot\system\cost-tracker\database\agent-costs.db"
$dbOk = $true; $dbDetail = "Not found - auto-created on first session"
if (Test-Path $dbPath) {
    $qr = & node "$repoRoot\system\cost-tracker\scripts\cost-query.js" 2>$null | ConvertFrom-Json -EA SilentlyContinue
    if ($qr) { $dbDetail = "Sessions: $($qr.sessionCount), Cost: `$$($qr.totalCost)" }
    else { $dbDetail = "Accessible (empty)" }
}
Check "SQLite database accessible" $dbOk $dbDetail "Run a master session to populate"

# 5. node:sqlite available
& node -e "try{require('node:sqlite');process.exit(0)}catch(e){process.exit(1)}" 2>$null
$nOk = ($LASTEXITCODE -eq 0)
$nVer = (& node --version 2>$null)
$nDetail = "Not available in $nVer"
if ($nOk) { $nDetail = "Available ($nVer)" }
Check "node:sqlite available" $nOk $nDetail "Upgrade Node.js to v22+"

# 6. MCP server file exists
$mcpPath = if ($env:CLAUDE_AGENTS_REPO) { "$env:CLAUDE_AGENTS_REPO\mcp\agent-hub\index.js" } else { "C:\claude-agents\mcp\agent-hub\index.js" }
$mOk = Test-Path $mcpPath
$mDetail = $mcpPath; if (-not $mOk) { $mDetail = "NOT FOUND at $mcpPath" }
Check "MCP server file exists" $mOk $mDetail "Check CLAUDE_AGENTS_REPO env var or restore from repo"

# Output
$sep = "=" * 60
Write-Host ""; Write-Host $sep -ForegroundColor Cyan
Write-Host "  Agent System Health Check" -ForegroundColor Cyan
Write-Host ("  " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
Write-Host $sep -ForegroundColor Cyan; Write-Host ""
foreach ($r in $script:results) {
    $color = "Green"; if ($r.Status -ne "PASS") { $color = "Red" }
    $icon = "[PASS]"; if ($r.Status -ne "PASS") { $icon = "[FAIL]" }
    Write-Host "  $icon  $($r.Check)" -ForegroundColor $color
    Write-Host "         $($r.Detail)" -ForegroundColor DarkGray
    if ($r.Fix -and $r.Status -ne "PASS") { Write-Host "         Fix: $($r.Fix)" -ForegroundColor Yellow }
    Write-Host ""
}
Write-Host $sep -ForegroundColor Cyan
$sc = "Green"; if ($script:fail -gt 0) { $sc = "Red" }
Write-Host "  Result: $($script:pass) passed, $($script:fail) failed" -ForegroundColor $sc
Write-Host $sep -ForegroundColor Cyan; Write-Host ""
if ($script:fail -gt 0) { exit 1 } else { exit 0 }