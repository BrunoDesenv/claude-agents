#!/usr/bin/env pwsh
# uninstall.ps1 — Removes claude-agents from this machine
# Only removes files that were installed by install.ps1 (tracked in manifest)

$ErrorActionPreference = "SilentlyContinue"
$claudeHome    = "$env:USERPROFILE\.claude"
$manifestPath  = "$claudeHome\claude-agents-install.json"
$settingsPath  = "$claudeHome\settings.json"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Claude Agents — Uninstall" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $manifestPath)) {
    Write-Host "No install manifest found at $manifestPath" -ForegroundColor Red
    Write-Host "Nothing to uninstall." -ForegroundColor Red
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
Write-Host "Installed from: $($manifest.repoRoot)" -ForegroundColor DarkGray
Write-Host "Installed at:   $($manifest.installedAt)" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Remove installed files ──────────────────────────────────────────────
Write-Host "1. Removing installed files..." -ForegroundColor Yellow
foreach ($file in $manifest.installedFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   - $file" -ForegroundColor DarkGray
    }
}

# Clean up empty command subdirectories
Get-ChildItem "$claudeHome\commands" -Directory -EA SilentlyContinue | ForEach-Object {
    if ((Get-ChildItem $_.FullName).Count -eq 0) {
        Remove-Item $_.FullName -Force
    }
}

# ── 2. Remove agent-hub from settings.json ────────────────────────────────
Write-Host "2. Removing agent-hub from settings.json..." -ForegroundColor Yellow
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    if ($settings.mcpServers.PSObject.Properties["agent-hub"]) {
        $settings.mcpServers.PSObject.Properties.Remove("agent-hub")
        $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding utf8
        Write-Host "   Done." -ForegroundColor DarkGray
    }
}

# ── 3. Remove environment variables ───────────────────────────────────────
Write-Host "3. Removing environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("CLAUDE_AGENTS_REPO", $null, "User")
[Environment]::SetEnvironmentVariable("AGENTS_ROOT", $null, "User")
Write-Host "   CLAUDE_AGENTS_REPO removed" -ForegroundColor DarkGray
Write-Host "   AGENTS_ROOT removed" -ForegroundColor DarkGray

# ── 4. Remove manifest ─────────────────────────────────────────────────────
Remove-Item $manifestPath -Force
Write-Host "4. Manifest removed." -ForegroundColor Yellow

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Uninstall complete." -ForegroundColor Green
Write-Host "  Restart Claude Code to apply changes." -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
