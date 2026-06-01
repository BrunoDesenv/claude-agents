#!/usr/bin/env pwsh
# Cost Report -- queries agent-costs.db and prints summary metrics

$env:NODE_NO_WARNINGS = "1"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbPath    = if ($env:CLAUDE_AGENTS_REPO) { "$env:CLAUDE_AGENTS_REPO\system\cost-tracker\database\agent-costs.db" } else { "C:\Agents\system\cost-tracker\database\agent-costs.db" }
$QueryJs   = Join-Path $ScriptDir "cost-query.js"

if (-not (Test-Path $DbPath)) {
  Write-Host "No database found at $DbPath. Run at least one session first." -ForegroundColor Yellow
  exit 0
}

$raw = node $QueryJs 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Query failed: $raw" -ForegroundColor Red
  exit 1
}
$data = $raw | ConvertFrom-Json

$totalCostStr    = [math]::Round([double]$data.totalCost, 4).ToString("F4")
$cost30dStr      = [math]::Round([double]$data.cost30d, 4).ToString("F4")
$avgCostStr      = [math]::Round([double]$data.avgCost, 4).ToString("F4")
$sessionCountStr = [string]$data.sessionCount
$sep = "  " + ("=" * 49)
$line = "  " + ("-" * 49)

Write-Host ""
Write-Host $sep -ForegroundColor Cyan
Write-Host "  Agent Session Cost Report" -ForegroundColor Cyan
Write-Host ("  Generated: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) -ForegroundColor DarkGray
Write-Host $sep -ForegroundColor Cyan
Write-Host ""

Write-Host "  Overview" -ForegroundColor Yellow
Write-Host $line
Write-Host "  Total sessions   : $sessionCountStr"
Write-Host "  All-time cost    : `$$totalCostStr"
Write-Host "  Last 30 days     : `$$cost30dStr"
Write-Host "  Avg cost/session : `$$avgCostStr"
Write-Host ""

Write-Host "  Agents" -ForegroundColor Yellow
Write-Host $line
if ($data.mostUsedAgent) {
  $muName = $data.mostUsedAgent.agent_name
  $muRuns = $data.mostUsedAgent.runs
  Write-Host "  Most used      : $muName ($muRuns runs)"
} else {
  Write-Host "  Most used      : (no agent runs yet)"
}
if ($data.mostExpensiveAgent) {
  $meName = $data.mostExpensiveAgent.agent_name
  $meCost = $data.mostExpensiveAgent.total_cost
  Write-Host "  Most expensive : $meName (`$$meCost)"
} else {
  Write-Host "  Most expensive : (no agent runs yet)"
}
Write-Host ""

if ($data.agentBreakdown -and @($data.agentBreakdown).Count -gt 0) {
  Write-Host "  Cost by Agent" -ForegroundColor Yellow
  Write-Host $line
  Write-Host "  Agent                  Runs   Total(USD)   Avg(USD)"
  Write-Host "  -------------------------------------------------------"
  foreach ($row in @($data.agentBreakdown)) {
    $aName = $row.agent_name
    $aRuns = $row.runs
    $aCost = [math]::Round([double]$row.total_cost, 4).ToString("F4")
    $aAvg  = [math]::Round([double]$row.avg_cost, 4).ToString("F4")
    Write-Host ("  {0,-20} {1,6} {2,12} {3,10}" -f $aName, $aRuns, $aCost, $aAvg)
  }
  Write-Host ""
}

if ($data.top5 -and @($data.top5).Count -gt 0) {
  Write-Host "  Top 5 Most Expensive Sessions" -ForegroundColor Yellow
  Write-Host $line
  $i = 1
  foreach ($s in @($data.top5)) {
    $sCost   = $s.cost
    $sStatus = $s.status
    $sDate   = $s.started_at
    $sTask   = $s.task_preview
    Write-Host "  $i. [$sStatus] `$$sCost  $sDate  $sTask"
    $i++
  }
  Write-Host ""
} else {
  Write-Host "  No sessions recorded yet." -ForegroundColor DarkGray
  Write-Host ""
}

Write-Host $sep -ForegroundColor Cyan
Write-Host ""
