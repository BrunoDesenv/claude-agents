#!/usr/bin/env pwsh
param([string]$RepoRoot = $PSScriptRoot)
$ErrorActionPreference = "Stop"
$claudeHome = "$env:USERPROFILE\.claude"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Claude Agents -- Install" -ForegroundColor Cyan
Write-Host "  Repo: $RepoRoot" -ForegroundColor DarkGray
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Set environment variables (User level -- no admin required)
Write-Host "1. Setting environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("CLAUDE_AGENTS_REPO", $RepoRoot, "User")
[Environment]::SetEnvironmentVariable("AGENTS_ROOT", "$RepoRoot\agents", "User")
$env:CLAUDE_AGENTS_REPO = $RepoRoot
$env:AGENTS_ROOT = "$RepoRoot\agents"
Write-Host "   CLAUDE_AGENTS_REPO = $RepoRoot" -ForegroundColor DarkGray
Write-Host "   AGENTS_ROOT        = $RepoRoot\agents" -ForegroundColor DarkGray

# 2. Install MCP server dependencies
Write-Host "2. Installing MCP server dependencies..." -ForegroundColor Yellow
Push-Location "$RepoRoot\mcp\agent-hub"
npm install --silent
Pop-Location
Write-Host "   Done." -ForegroundColor DarkGray

# 3. Copy thin wrappers to ~/.claude/agents/
Write-Host "3. Installing agent wrappers to ~/.claude/agents/..." -ForegroundColor Yellow
$targetAgents = "$claudeHome\agents"
New-Item -ItemType Directory -Force $targetAgents | Out-Null
$installedFiles = [System.Collections.Generic.List[string]]::new()

Get-ChildItem "$RepoRoot\agents" -Directory | ForEach-Object {
    $wrapper = Join-Path $_.FullName "_claude.md"
    if (Test-Path $wrapper) {
        $dest = Join-Path $targetAgents "$($_.Name).md"
        Copy-Item $wrapper $dest -Force
        $installedFiles.Add($dest)
        Write-Host "   + $($_.Name).md" -ForegroundColor DarkGray
    }
}

# 4. Copy slash commands (.md only) to ~/.claude/commands/
Write-Host "4. Installing commands to ~/.claude/commands/..." -ForegroundColor Yellow
$targetCommands = "$claudeHome\commands"
New-Item -ItemType Directory -Force $targetCommands | Out-Null

Get-ChildItem "$RepoRoot\agents" -Directory | ForEach-Object {
    $cmdRoot = Join-Path $_.FullName "commands"
    if (Test-Path $cmdRoot) {
        Get-ChildItem $cmdRoot -Directory | ForEach-Object {
            $ns = $_.Name
            $nsTarget = Join-Path $targetCommands $ns
            New-Item -ItemType Directory -Force $nsTarget | Out-Null
            $mdFiles = Get-ChildItem "$($_.FullName)\*.md"
            $mdFiles | ForEach-Object {
                $dest = Join-Path $nsTarget $_.Name
                Copy-Item $_.FullName $dest -Force
                $installedFiles.Add($dest)
            }
            if ($mdFiles.Count -gt 0) {
                Write-Host "   + $ns/ ($($mdFiles.Count) commands)" -ForegroundColor DarkGray
            }
        }
    }
}

# 5. Update ~/.claude/settings.json with agent-hub MCP
Write-Host "5. Updating ~/.claude/settings.json with agent-hub MCP..." -ForegroundColor Yellow
$settingsPath = "$claudeHome\settings.json"

if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
} else {
    New-Item -ItemType Directory -Force $claudeHome | Out-Null
    $settings = [PSCustomObject]@{ permissions = [PSCustomObject]@{ allow = @(); additionalDirectories = @() }; mcpServers = [PSCustomObject]@{} }
}

if (-not $settings.PSObject.Properties["mcpServers"]) {
    $settings | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value ([PSCustomObject]@{})
}

$agentHubConfig = [PSCustomObject]@{
    type    = "stdio"
    command = "node"
    args    = @("$RepoRoot\mcp\agent-hub\index.js")
    env     = [PSCustomObject]@{ AGENTS_ROOT = "$RepoRoot\agents" }
}

$settings.mcpServers | Add-Member -MemberType NoteProperty -Name "agent-hub" -Value $agentHubConfig -Force
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding utf8
Write-Host "   Done." -ForegroundColor DarkGray

# 6. Write install manifest
Write-Host "6. Writing install manifest..." -ForegroundColor Yellow
$manifest = [PSCustomObject]@{
    version        = "1.0"
    installedAt    = (Get-Date -Format "o")
    repoRoot       = $RepoRoot
    installedFiles = $installedFiles.ToArray()
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content "$claudeHome\claude-agents-install.json" -Encoding utf8
Write-Host "   Manifest: $claudeHome\claude-agents-install.json" -ForegroundColor DarkGray

# 7. Health check
Write-Host "7. Running health check..." -ForegroundColor Yellow
Write-Host ""
& "$RepoRoot\system\health-check.ps1"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Install complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT: Restart Claude Code to load the new MCP." -ForegroundColor Yellow
Write-Host "  AGENTS_ROOT is now: $RepoRoot\agents" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""