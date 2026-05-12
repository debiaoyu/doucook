@echo off
chcp 65001 >nul
title doucook

setlocal enabledelayedexpansion

:: Kill existing processes on our ports
echo [doucook] Killing existing processes ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8899 :8900 :3001" ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: --- Backend port detection (8899 default) ---
if defined DOUCOOK_BACKEND_PORT (
    set BEPORT=%DOUCOOK_BACKEND_PORT%
) else (
    set BEPORT=8899
)

:: --- Start backend (background) ---
echo [doucook] Starting backend on port %BEPORT% ...
cd /d "%~dp0backend"
start /B uvicorn app.main:app --reload --port %BEPORT% --host 127.0.0.1 > backend.log 2>&1

:: --- Start frontend (foreground) ---
echo [doucook] Starting frontend on port 3001 ...
echo.
echo   Backend: http://localhost:%BEPORT%
echo   Frontend: http://localhost:3001
echo   Press Ctrl+C to stop all services
echo.
cd /d "%~dp0frontend"
set DOUCOOK_BACKEND_PORT=%BEPORT%
npm run dev -- --port 3001

:: --- Cleanup on exit ---
echo [doucook] Stopping backend ...
taskkill /f /im "uvicorn.exe" >nul 2>&1
