@echo off
REM AgriRent AI Auto-Sync Launcher
REM This script provides an easy way to control the auto-sync service

echo AgriRent AI Auto-Sync Service
echo ==============================
echo.

if "%1"=="" goto :menu
if "%1"=="-start" goto :start
if "%1"=="-stop" goto :stop
if "%1"=="-status" goto :status
goto :menu

:start
echo Starting auto-sync service...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1" -Start
goto :end

:stop
echo Stopping auto-sync service...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1" -Stop
goto :end

:status
echo Checking auto-sync service status...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1" -Status
goto :end

:menu
echo Usage: auto-sync.bat [option]
echo.
echo Options:
echo   -start   Start the auto-sync service
echo   -stop    Stop the auto-sync service
echo   -status  Show service status
echo.
echo The auto-sync service monitors file changes and automatically
echo commits and pushes them to GitHub.
echo.
pause
goto :end

:end