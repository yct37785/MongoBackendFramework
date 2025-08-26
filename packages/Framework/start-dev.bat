@echo off
setlocal enabledelayedexpansion

echo [1/2] Checking if port 4000 is in use...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do (
    set PID=%%a
    echo Port 4000 is in use by PID !PID!, killing it...
    taskkill /F /PID !PID! >nul 2>&1
)

echo [2/2] Launching development server...
call npm run dev

echo.
pause
