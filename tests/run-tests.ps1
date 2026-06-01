#!/usr/bin/env pwsh
# run-tests.ps1 — Shows how to invoke the agent test suites
#
# Usage: .\tests\run-tests.ps1 [smoke|comprehensive]
#
# The actual test runs inside Claude Code via the Workflow tool.
# This script prints the command to paste into Claude Code.

param([string]$Suite = "smoke")

$repoRoot = Split-Path $PSScriptRoot -Parent
$scriptMap = @{
    smoke         = "$repoRoot\tests\smoke.js"
    comprehensive = "$repoRoot\tests\comprehensive.js"
}

if (-not $scriptMap.ContainsKey($Suite)) {
    Write-Host "Unknown suite '$Suite'. Use: smoke | comprehensive" -ForegroundColor Red
    exit 1
}

$path = $scriptMap[$Suite] -replace '\\', '/'
$duration = if ($Suite -eq 'comprehensive') { '~3 hours, 24 scenarios' } else { '~8 min, 13 scenarios' }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Agent Test Suite: $Suite" -ForegroundColor Cyan
Write-Host "  Duration: $duration" -ForegroundColor DarkGray
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Paste this into Claude Code:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Workflow({scriptPath: `"$path`"})" -ForegroundColor Green
Write-Host ""
Write-Host "Results will appear in:" -ForegroundColor DarkGray
Write-Host "  ~/.claude/sessions/agent-tests/[run-id]/" -ForegroundColor DarkGray
Write-Host ""
