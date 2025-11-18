# Chrome DevTools Protocol Launcher
# Starts Chrome/Edge with remote debugging enabled on port 9222

param(
    [string]$Url = "http://localhost:3000",
    [int]$Port = 9222,
    [switch]$Edge,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Chrome DevTools Protocol Launcher

Usage:
    .\start-cdp.ps1 [options]

Options:
    -Url <url>      URL to open (default: http://localhost:3000)
    -Port <port>    CDP port (default: 9222)
    -Edge           Use Microsoft Edge instead of Chrome
    -Help           Show this help message

Examples:
    .\start-cdp.ps1
    .\start-cdp.ps1 -Url http://localhost:3000/dashboard
    .\start-cdp.ps1 -Edge
    .\start-cdp.ps1 -Port 9223

After starting:
    1. Chrome will open with CDP enabled
    2. Run: node cdp-logger.mjs (in another terminal)
    3. Monitor: .\monitor-devtools.bat (in another terminal)
"@
    exit 0
}

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }

# Browser paths
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Select browser
if ($Edge) {
    $browserPath = $edgePath
    $browserName = "Microsoft Edge"
    $processName = "msedge"
} else {
    $browserPath = $chromePath
    $browserName = "Google Chrome"
    $processName = "chrome"
}

# Check if browser exists
if (-not (Test-Path $browserPath)) {
    Write-Error-Custom "❌ $browserName not found at: $browserPath"
    Write-Warning "Please install $browserName or specify correct path"
    exit 1
}

# User data directory (separate profile for CDP)
$userDataDir = "$env:TEMP\chrome-cdp-profile"

# Create user data directory if it doesn't exist
if (-not (Test-Path $userDataDir)) {
    New-Item -ItemType Directory -Path $userDataDir -Force | Out-Null
    Write-Info "📁 Created user data directory: $userDataDir"
}

# Kill existing browser processes (optional - prevents conflicts)
Write-Warning "⚠️  Checking for existing $browserName processes..."
$existingProcesses = Get-Process -Name $processName -ErrorAction SilentlyContinue

if ($existingProcesses) {
    Write-Warning "Found $($existingProcesses.Count) running $browserName process(es)"
    $response = Read-Host "Kill existing processes? (y/N)"

    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "🔪 Killing existing $browserName processes..."
        Stop-Process -Name $processName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Success "✅ Processes killed"
    }
}

# Launch browser with CDP
Write-Info "🚀 Starting $browserName with CDP on port $Port..."
Write-Info "📄 Opening URL: $Url"

$arguments = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$userDataDir",
    "--disable-background-networking",
    "--disable-client-side-phishing-detection",
    "--disable-default-apps",
    "--disable-hang-monitor",
    "--disable-popup-blocking",
    "--disable-prompt-on-repost",
    "--disable-sync",
    "--enable-automation",
    "--no-first-run",
    "--no-service-autorun",
    "--password-store=basic",
    $Url
)

try {
    Start-Process -FilePath $browserPath -ArgumentList $arguments
    Start-Sleep -Seconds 3

    # Verify CDP is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/json" -UseBasicParsing -TimeoutSec 5

        if ($response.StatusCode -eq 200) {
            Write-Success "`n✅ $browserName started successfully with CDP!"
            Write-Success "✅ CDP endpoint: http://localhost:$Port"

            # Parse tabs
            $tabs = $response.Content | ConvertFrom-Json
            Write-Info "`n📋 Open tabs ($($tabs.Count)):"
            foreach ($tab in $tabs) {
                Write-Info "   - $($tab.title) ($($tab.url))"
            }

            Write-Info "`n📝 Next steps:"
            Write-Host "   1. Run CDP logger:  " -NoNewline; Write-Success "node cdp-logger.mjs"
            Write-Host "   2. Monitor logs:    " -NoNewline; Write-Success ".\monitor-devtools.bat"
            Write-Host "   3. Or tail logs:    " -NoNewline; Write-Success "Get-Content devtools.log -Wait"

        } else {
            Write-Error-Custom "❌ CDP endpoint returned status: $($response.StatusCode)"
        }

    } catch {
        Write-Error-Custom "❌ Failed to verify CDP endpoint: $_"
        Write-Warning "Browser may still be starting. Wait a few seconds and check:"
        Write-Info "   curl http://localhost:$Port/json"
    }

} catch {
    Write-Error-Custom "❌ Failed to start browser: $_"
    exit 1
}
