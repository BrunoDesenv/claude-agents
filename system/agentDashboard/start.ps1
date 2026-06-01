# Agent Command Center — start script

$root = "$env:CLAUDE_AGENTS_REPO\system\agentDashboard"

Write-Host "Starting Agent Dashboard API on http://localhost:5200 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -Command `"dotnet run --project '$root\api\AgentDashboard.Api\AgentDashboard.Api.csproj'`"" -WindowStyle Minimized

Write-Host "Starting Angular SPA on http://localhost:4300 ..." -ForegroundColor Cyan
Set-Location "$root\spa"
if (-not (Test-Path "node_modules")) { npm install 2>&1 | Out-Null }

# Start ng serve in background, open browser once port 4300 responds
Start-Job -Name "spa-watcher" -ScriptBlock {
    $ready = $false; $tries = 0
    while (-not $ready -and $tries -lt 90) {
        try {
            Invoke-WebRequest "http://localhost:4300" -UseBasicParsing -TimeoutSec 2 -EA Stop | Out-Null
            $ready = $true
        } catch { Start-Sleep 3; $tries++ }
    }
    if ($ready) { Start-Process "http://localhost:4300" }
    else { Write-Warning "Angular did not respond after 270s -- open http://localhost:4300 manually." }
} | Out-Null

# Run ng serve in the foreground so its output stays visible
npm run start -- --port 4300 --open false
