@echo off
setlocal enabledelayedexpansion

echo =============================================
echo  mongoBackendFramework - DEV Launcher
echo =============================================

echo [1/2] Checking if port 3000 is in use...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set PID=%%a
    echo Port 3000 is in use by PID !PID!, killing it...
    taskkill /F /PID !PID! >nul 2>&1
)

echo [2/2] Launching development server...
call npm run dev

echo.
pause
