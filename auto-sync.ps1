# Auto-sync script for AgriRent AI project
# This script monitors file changes and automatically commits/pushes to GitHub

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status
)

$scriptPath = $PSScriptRoot
$logFile = Join-Path $scriptPath "auto-sync.log"
$watcherJobName = "AgriRentAI_AutoSync"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "$timestamp - $Message"
}

function Start-FileWatcher {
    Write-Log "Starting AgriRent AI auto-sync service..."

    # Create a file system watcher
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $scriptPath
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    # Exclude certain directories and files
    $watcher.Filter = "*.*"
    $excludePaths = @(".git", "node_modules", ".vscode", "*.log", "*.tmp")

    # Define the action to take when a file changes
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType

        # Skip excluded paths
        foreach ($exclude in $excludePaths) {
            if ($path -like "*$exclude*") { return }
        }

        Write-Log "File $changeType detected: $path"

        # Wait a bit to avoid multiple triggers for the same change
        Start-Sleep -Seconds 2

        # Check git status
        $gitStatus = & 'C:\Program Files\Git\bin\git.exe' status --porcelain
        if ($gitStatus) {
            Write-Log "Changes detected, committing and pushing..."

            # Add all changes
            & 'C:\Program Files\Git\bin\git.exe' add .

            # Commit with timestamp
            $commitMessage = "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            & 'C:\Program Files\Git\bin\git.exe' commit -m $commitMessage

            if ($LASTEXITCODE -eq 0) {
                # Push to GitHub
                & 'C:\Program Files\Git\bin\git.exe' push origin main
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ Successfully pushed to GitHub!"
                } else {
                    Write-Log "❌ Failed to push to GitHub"
                }
            } else {
                Write-Log "❌ Failed to commit changes"
            }
        }
    }

    # Register the event handlers
    Register-ObjectEvent $watcher "Created" -Action $action
    Register-ObjectEvent $watcher "Changed" -Action $action
    Register-ObjectEvent $watcher "Deleted" -Action $action
    Register-ObjectEvent $watcher "Renamed" -Action $action

    # Start the watcher as a background job
    $job = Start-Job -ScriptBlock {
        param($watcher)
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } -ArgumentList $watcher -Name $watcherJobName

    Write-Log "Auto-sync service started. Job ID: $($job.Id)"
    Write-Log "Monitoring directory: $scriptPath"
    Write-Log "To stop: .\auto-sync.ps1 -Stop"
}

function Stop-FileWatcher {
    Write-Log "Stopping AgriRent AI auto-sync service..."

    $job = Get-Job -Name $watcherJobName -ErrorAction SilentlyContinue
    if ($job) {
        Stop-Job $job
        Remove-Job $job
        Write-Log "Auto-sync service stopped."
    } else {
        Write-Log "No auto-sync service found running."
    }
}

function Show-Status {
    $job = Get-Job -Name $watcherJobName -ErrorAction SilentlyContinue
    if ($job) {
        Write-Host "✅ Auto-sync service is RUNNING" -ForegroundColor Green
        Write-Host "Job ID: $($job.Id)" -ForegroundColor Gray
        Write-Host "Job State: $($job.State)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Auto-sync service is NOT RUNNING" -ForegroundColor Red
    }

    if (Test-Path $logFile) {
        Write-Host "`nRecent log entries:" -ForegroundColor Yellow
        Get-Content $logFile -Tail 5
    }
}

# Main script logic
switch {
    $Start {
        Start-FileWatcher
    }
    $Stop {
        Stop-FileWatcher
    }
    $Status {
        Show-Status
    }
    default {
        Write-Host "AgriRent AI Auto-Sync Script" -ForegroundColor Cyan
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\auto-sync.ps1 -Start    # Start auto-sync service"
        Write-Host "  .\auto-sync.ps1 -Stop     # Stop auto-sync service"
        Write-Host "  .\auto-sync.ps1 -Status   # Show service status"
        Write-Host ""
        Write-Host "The service monitors file changes and automatically commits/pushes to GitHub."
    }
}