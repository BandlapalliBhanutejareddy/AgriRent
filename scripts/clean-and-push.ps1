param(
    [string]$CommitMessage = "chore: automated validated update",
    [switch]$WithDocker,
    [string]$DockerUsername = ($env:DOCKER_USERNAME ? $env:DOCKER_USERNAME : "teja3"),
    [string]$DockerRegistry = ($env:DOCKER_REGISTRY ? $env:DOCKER_REGISTRY : "docker.io"),
    [string]$BackendRepo = ($env:AGRORENT_BACKEND_REPO ? $env:AGRORENT_BACKEND_REPO : "agrirent-backend"),
    [string]$WebRepo = ($env:AGRORENT_WEB_REPO ? $env:AGRORENT_WEB_REPO : "agrirent-web")
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " AgroRent AI Safe Git & Deploy Pipeline  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify Git Repository
if (-not (Test-Path ".git")) {
    Write-Error "Not a git repository."
    exit 1
}

# 2. Check Current Branch
$branch = (git branch --show-current).Trim()
Write-Host "Current Git Branch: $branch" -ForegroundColor Yellow

# 3. Check Remote URL
$remoteUrl = (git remote get-url origin).Trim()
Write-Host "Remote Origin: $remoteUrl" -ForegroundColor Yellow
if ($remoteUrl -notmatch "BandlapalliBhanutejareddy/AgriRent") {
    Write-Warning "Target remote does not match expected AgriRent repository URL: $remoteUrl"
}

# 4. Check Diff Formatting
Write-Host "Checking for whitespace and conflict markers..." -ForegroundColor Gray
git diff --check
if ($LASTEXITCODE -ne 0) {
    Write-Error "git diff --check failed. Resolve syntax or merge conflict markers."
    exit 1
}

# 5. Run Quality Validations
Write-Host "`nRunning Backend TypeScript build..." -ForegroundColor Gray
Push-Location backend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed."
    }
} finally {
    Pop-Location
}

Write-Host "`nRunning Web build..." -ForegroundColor Gray
Push-Location web
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Web build failed."
    }
} finally {
    Pop-Location
}

# 6. Stage intended changes
Write-Host "`nStaging changes..." -ForegroundColor Gray
git add -A

$status = (git status --porcelain).Trim()
if (-not $status) {
    Write-Host "Working tree is clean. Nothing to commit." -ForegroundColor Green
} else {
    Write-Host "`nCreating commit: '$CommitMessage'" -ForegroundColor Yellow
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git commit failed."
        exit 1
    }
}

# 7. Push to GitHub
Write-Host "`nPushing to GitHub origin $branch..." -ForegroundColor Cyan
git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed."
    exit 1
}
Write-Host "✅ Git push succeeded!" -ForegroundColor Green

# 8. Optional Docker Build & Registry Push
if ($WithDocker) {
    Write-Host "`nBuilding Docker images..." -ForegroundColor Cyan
    docker compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed."
        exit 1
    }
    Write-Host "✅ Docker build succeeded!" -ForegroundColor Green

    if ($DockerUsername) {
        $gitSha = (git rev-parse --short HEAD).Trim()
        $backendTarget = if ($DockerRegistry -eq "docker.io") { "$DockerUsername/$BackendRepo" } else { "$DockerRegistry/$DockerUsername/$BackendRepo" }
        $webTarget = if ($DockerRegistry -eq "docker.io") { "$DockerUsername/$WebRepo" } else { "$DockerRegistry/$DockerUsername/$WebRepo" }

        Write-Host "Tagging and pushing images to $backendTarget and $webTarget (tag: $gitSha and latest)..." -ForegroundColor Cyan

        docker tag agrirent-backend:latest "$backendTarget`:$gitSha"
        docker tag agrirent-backend:latest "$backendTarget`:latest"
        docker tag agrirent-web:latest "$webTarget`:$gitSha"
        docker tag agrirent-web:latest "$webTarget`:latest"

        docker push "$backendTarget`:$gitSha"
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $backendTarget`:$gitSha" }

        docker push "$backendTarget`:latest"
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $backendTarget`:latest" }

        docker push "$webTarget`:$gitSha"
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $webTarget`:$gitSha" }

        docker push "$webTarget`:latest"
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $webTarget`:latest" }

        Write-Host "✅ Docker images pushed successfully to registry!" -ForegroundColor Green
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " Pipeline Completed Successfully!         " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
