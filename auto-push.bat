@echo off
REM Auto-push script for AgriRent AI project
REM Run this after making commits to automatically push to GitHub

echo.
echo 🔄 Auto-pushing changes to GitHub...
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Error: Not in a git repository!
    pause
    exit /b 1
)

REM Push to origin main branch
echo Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Successfully pushed to GitHub!
    echo Repository: https://github.com/BandlapalliBhanutejareddy/AgroRenetAi.git
) else (
    echo.
    echo ❌ Failed to push to GitHub.
    echo You may need to push manually or check your authentication.
)

echo.
pause