@echo off
REM Screenshot Tool for Browser Testing - Universe MapMaker
REM Usage: screenshot.bat [url] [output-file]
REM Example: screenshot.bat http://localhost:3000/dashboard

setlocal enabledelayedexpansion

REM Default values
set "URL=%~1"
if "%URL%"=="" set "URL=http://localhost:3000"

set "OUTPUT=%~2"
if "%OUTPUT%"=="" (
    for /f "tokens=1-6 delims=/: " %%a in ("%date% %time%") do (
        set "OUTPUT=screenshots\test-%%c-%%b-%%a-%%d%%e%%f.png"
    )
)

echo.
echo ========================================
echo   Universe MapMaker - Screenshot Tool
echo ========================================
echo URL: %URL%
echo Output: %OUTPUT%
echo.

REM Create screenshots directory
if not exist "screenshots" (
    mkdir screenshots
    echo [+] Created screenshots directory
)

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [!] Node.js not found. Please install Node.js first.
    exit /b 1
)

REM Check Playwright
npm list playwright >nul 2>&1
if errorlevel 1 (
    echo [+] Installing Playwright...
    call npm install --save-dev playwright
    echo [+] Installing Playwright browsers...
    call npx playwright install chromium
)

REM Create temporary screenshot script
echo const { chromium } = require('playwright'); > temp-screenshot.js
echo. >> temp-screenshot.js
echo (async () =^> { >> temp-screenshot.js
echo   console.log('🚀 Launching browser...'); >> temp-screenshot.js
echo   const browser = await chromium.launch({ headless: true }); >> temp-screenshot.js
echo   const context = await browser.newContext({ >> temp-screenshot.js
echo     viewport: { width: 1920, height: 1080 }, >> temp-screenshot.js
echo     deviceScaleFactor: 1, >> temp-screenshot.js
echo   }); >> temp-screenshot.js
echo   const page = await context.newPage(); >> temp-screenshot.js
echo. >> temp-screenshot.js
echo   console.log('🌐 Navigating to: %URL%'); >> temp-screenshot.js
echo   await page.goto('%URL%', { waitUntil: 'networkidle', timeout: 30000 }); >> temp-screenshot.js
echo. >> temp-screenshot.js
echo   console.log('📸 Taking screenshot...'); >> temp-screenshot.js
echo   await page.screenshot({ path: '%OUTPUT%', fullPage: true }); >> temp-screenshot.js
echo. >> temp-screenshot.js
echo   await browser.close(); >> temp-screenshot.js
echo   console.log('✅ Screenshot saved to: %OUTPUT%'); >> temp-screenshot.js
echo })(); >> temp-screenshot.js

REM Run the screenshot script
echo [+] Taking screenshot...
node temp-screenshot.js

REM Clean up
del temp-screenshot.js

REM Check if screenshot was created
if exist "%OUTPUT%" (
    echo.
    echo [+] Success! Screenshot saved to: %OUTPUT%
    echo.
    set /p OPEN="Open screenshot? (y/n): "
    if /i "!OPEN!"=="y" start "" "%OUTPUT%"
) else (
    echo.
    echo [!] Failed to create screenshot
    exit /b 1
)

endlocal
