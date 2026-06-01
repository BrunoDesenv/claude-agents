# Agent Command Center — stop script
# Kills any processes listening on ports 5200 (API) and 4300 (SPA)

@(5200, 4300) | ForEach-Object {
    $port = $_
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            Write-Host "Stopping process $pid on port $port" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "Nothing running on port $port" -ForegroundColor DarkGray
    }
}

Write-Host "Agent Dashboard stopped." -ForegroundColor Green
