@echo off
title AgroRent AI Control Center
cls
color 0A

echo ===================================================
echo   AgroRent AI - Unified Platform Launcher
echo ===================================================
echo.
echo  This script will spin up all the core services
echo  for the AgroRent AI platform in separate windows.
echo.
echo  [1] Starting Python AI Service (Port 8000)...
start "AgroRent AI Service (Port 8000)" cmd /k "cd ai_service && title AI Service && color 0B && echo Starting AI Service... && .\venv\Scripts\activate && uvicorn main:app --port 8000 --reload"
ping -n 3 127.0.0.1 > nul

echo  [2] Starting Backend API Server (Port 4000)...
start "AgroRent Backend API (Port 4000)" cmd /k "cd backend && title Backend API && color 0C && echo Starting Backend Server... && npm run dev"
ping -n 3 127.0.0.1 > nul

echo  [3] Starting Next.js Web Dashboard (Port 3000)...
start "AgroRent Web Dashboard (Port 3000)" cmd /k "cd web && title Web Dashboard && color 0E && echo Starting Next.js Web Server... && npm run dev"
ping -n 3 127.0.0.1 > nul

echo.
echo ===================================================
echo   All systems launched successfully!
echo ===================================================
echo   - AI Service:    http://localhost:8000
echo   - Backend API:   http://localhost:4000/api/health
echo   - Web Dashboard: http://localhost:3000
echo.
echo   Launcher will automatically close in 5 seconds...
ping -n 6 127.0.0.1 > nul
