# Screenshot Tool for Browser Testing - Universe MapMaker
# Usage: .\screenshot.ps1 [url] [output-file]
# Example: .\screenshot.ps1 http://localhost:3000/dashboard screenshot.png

param(
    [string]$Url = "http://localhost:3000",
    [string]$OutputFile = "screenshots/test-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').png"
)

# Ensure screenshots directory exists
$screenshotDir = "screenshots"
if (!(Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Path $screenshotDir | Out-Null
    Write-Host "✅ Created screenshots directory" -ForegroundColor Green
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Playwright is installed
$playwrightCheck = npm list playwright 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Installing Playwright..." -ForegroundColor Yellow
    npm install --save-dev playwright
    Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install chromium
}

# Create temporary screenshot script
$tempScript = @"
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('🌐 Navigating to: $Url');
  await page.goto('$Url', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: '$OutputFile', fullPage: true });

  await browser.close();
  console.log('✅ Screenshot saved to: $OutputFile');
})();
"@

$tempScriptPath = "temp-screenshot.js"
$tempScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

# Run the screenshot script
Write-Host "📸 Taking screenshot of $Url..." -ForegroundColor Cyan
node $tempScriptPath

# Clean up
Remove-Item $tempScriptPath

if (Test-Path $OutputFile) {
    Write-Host "✅ Success! Screenshot saved to: $OutputFile" -ForegroundColor Green

    # Open the screenshot
    $openChoice = Read-Host "Open screenshot? (y/n)"
    if ($openChoice -eq 'y') {
        Start-Process $OutputFile
    }
} else {
    Write-Host "❌ Failed to create screenshot" -ForegroundColor Red
    exit 1
}
