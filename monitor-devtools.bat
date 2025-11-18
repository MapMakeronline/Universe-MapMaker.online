@echo off
REM Monitor DevTools logs in real-time
REM Uses PowerShell Get-Content -Wait (like tail -f)

echo ======================================
echo   Chrome DevTools Logger Monitor
echo ======================================
echo.
echo Monitoring: devtools.log
echo Press Ctrl+C to stop
echo.
echo ======================================
echo.

REM Check if log file exists
if not exist "devtools.log" (
    echo WARNING: devtools.log does not exist yet
    echo.
    echo Make sure cdp-logger.mjs is running:
    echo   node cdp-logger.mjs
    echo.
    pause
    exit /b 1
)

REM Monitor log file (PowerShell equivalent of tail -f)
powershell -Command "Get-Content devtools.log -Wait -Tail 50"
