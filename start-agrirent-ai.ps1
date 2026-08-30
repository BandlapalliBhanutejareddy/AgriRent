$ErrorActionPreference = "Stop"

$OllamaLog = "D:\AgriRent_AI\ollama.log"
$CloudflareLog = "D:\AgriRent_AI\cloudflared.log"
$UrlFile = "D:\AgriRent_AI\cloudflare_url.txt"

# Ensure OLLAMA_MODELS and OLLAMA_ORIGINS are set
[Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "D:\OllamaModels", "Process")
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "Process")
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "Process")

function Start-Ollama {
    Write-Host "Starting Ollama..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow -RedirectStandardOutput $OllamaLog -RedirectStandardError $OllamaLog
    Start-Sleep -Seconds 5
}

function Check-Ollama {
    $process = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $process) {
        return $false
    }
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
        if ($response.models -and $response.models.name -contains "qwen:0.5b") {
            return $true
        } else {
            Write-Host "Ollama is running but qwen:0.5b is not loaded!"
            return $false
        }
    } catch {
        return $false
    }
}

function Start-Cloudflare {
    Write-Host "Starting Cloudflare Tunnel..."
    if (Test-Path $CloudflareLog) { Remove-Item $CloudflareLog -Force }
    Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:11434","--http-host-header","localhost" -NoNewWindow -RedirectStandardOutput $CloudflareLog -RedirectStandardError $CloudflareLog
    Start-Sleep -Seconds 5
    
    # Extract URL
    $retries = 10
    while ($retries -gt 0) {
        if (Test-Path $CloudflareLog) {
            $match = Select-String -Path $CloudflareLog -Pattern "https://[a-zA-Z0-9-]+\.trycloudflare\.com"
            if ($match) {
                $url = $match.Matches[0].Value
                Write-Host "Cloudflare URL: $url"
                Set-Content -Path $UrlFile -Value $url
                return
            }
        }
        Start-Sleep -Seconds 2
        $retries--
    }
    Write-Host "Failed to extract Cloudflare URL."
}

function Check-Cloudflare {
    $process = Get-Process cloudflared -ErrorAction SilentlyContinue
    if (-not $process) {
        return $false
    }
    
    # Optional: could test the URL directly, but if process is running it's likely fine.
    return $true
}

Write-Host "AgroRent AI Startup & Auto-Recovery Supervisor"
Write-Host "----------------------------------------------"

while ($true) {
    if (-not (Check-Ollama)) {
        Write-Host "Ollama is down or unresponsive. Restarting..."
        $oldOllama = Get-Process ollama -ErrorAction SilentlyContinue
        if ($oldOllama) { Stop-Process -Id $oldOllama.Id -Force }
        Start-Ollama
    }
    
    if (-not (Check-Cloudflare)) {
        Write-Host "Cloudflare is down. Restarting..."
        $oldCf = Get-Process cloudflared -ErrorAction SilentlyContinue
        if ($oldCf) { Stop-Process -Id $oldCf.Id -Force }
        Start-Cloudflare
    }
    
    Start-Sleep -Seconds 30
}
