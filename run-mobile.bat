@echo off
title AgroRent Mobile Expo Launcher
cls
color 0D

echo ===================================================
echo   AgroRent AI - Mobile Expo App Launcher
echo ===================================================
echo.
echo  Starting Expo Development Server...
echo.
cd mobile
start "AgroRent Mobile App" cmd /k "title Expo Mobile Server && color 0D && npx expo start"
echo.
echo ===================================================
echo   Expo server initiated!
echo   Scan the QR code in the terminal with Expo Go app.
echo ===================================================
pause
