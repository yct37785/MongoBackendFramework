@echo off

REM Delete the /dist folder if it exists
IF EXIST dist (
    rmdir /s /q dist
)

REM Run the build command
call npm run build

echo.
pause