param(
    [string]$CommitMessage = "chore: automated validated update",
    [switch]$WithDocker,
    [string]$DockerRegistry = ""
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

# 8. Optional Docker Build
if ($WithDocker) {
    Write-Host "`nBuilding Docker images..." -ForegroundColor Cyan
    docker compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed."
        exit 1
    }
    Write-Host "✅ Docker build succeeded!" -ForegroundColor Green

    if ($DockerRegistry) {
        Write-Host "Tagging and pushing images to $DockerRegistry..." -ForegroundColor Cyan
        $gitSha = (git rev-parse --short HEAD).Trim()
        docker tag agrirent-backend:latest "$DockerRegistry/agrirent-backend:$gitSha"
        docker tag agrirent-web:latest "$DockerRegistry/agrirent-web:$gitSha"
        docker push "$DockerRegistry/agrirent-backend:$gitSha"
        docker push "$DockerRegistry/agrirent-web:$gitSha"
        Write-Host "✅ Docker images pushed successfully!" -ForegroundColor Green
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " Pipeline Completed Successfully!         " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
