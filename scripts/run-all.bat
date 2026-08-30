@echo off
title AgroRent Platform Launcher
cls
color 0A

echo ===================================================
echo   AgroRent - Unified Platform Launcher
echo ===================================================
echo.
echo  This script will spin up all the core services
echo  for the AgroRent platform in separate windows.
echo.

echo  [1] Starting Backend API Server (Port 4000)...
start "AgroRent Backend API (Port 4000)" cmd /k "cd backend && title Backend API && color 0C && echo Starting Backend Server... && npm run dev"
ping -n 3 127.0.0.1 > nul

echo  [2] Starting Next.js Web Dashboard (Port 3000)...
start "AgroRent Web Dashboard (Port 3000)" cmd /k "cd web && title Web Dashboard && color 0E && echo Starting Next.js Web Server... && npm run dev"
ping -n 3 127.0.0.1 > nul

echo.
echo ===================================================
echo   All systems launched successfully!
echo ===================================================
echo   - Backend API:   http://localhost:4000/api/health
echo   - Web Dashboard: http://localhost:3000
echo.
echo   Launcher will automatically close in 5 seconds...
ping -n 6 127.0.0.1 > nul
