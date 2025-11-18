# Chrome DevTools Protocol (CDP) Setup

This guide explains how to use Chrome DevTools Protocol to give Claude Code full access to your browser's Console and Network tabs.

## What is CDP?

**Chrome DevTools Protocol** allows external tools to connect to Chrome/Edge and monitor:
- ✅ **Console logs** (log, warn, error, debug)
- ✅ **Network requests** (HTTP requests/responses, status codes, headers, body)
- ✅ **JavaScript errors** (exceptions, stack traces)
- ✅ **Performance metrics**

Claude Code can read these logs in real-time to help debug issues faster! 🚀

---

## Quick Start (3 Terminals)

### Terminal 1: Dev Server
```bash
npm run dev
```

### Terminal 2: Chrome with CDP
```bash
npm run cdp:start
# Or: .\start-cdp.ps1
```

This will:
1. Launch Chrome with remote debugging on port 9222
2. Open http://localhost:3000
3. Verify CDP endpoint is accessible

### Terminal 3: CDP Logger
```bash
npm install  # Install puppeteer (first time only)
npm run cdp:log
# Or: node cdp-logger.mjs
```

This will:
1. Connect to Chrome via CDP
2. Monitor Console + Network + Errors
3. Write logs to `devtools.log`

### Terminal 4 (Optional): Monitor Logs
```bash
npm run cdp:monitor
# Or: .\monitor-devtools.bat
# Or: Get-Content devtools.log -Wait
```

---

## Detailed Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs `puppeteer` (CDP client library).

### Step 2: Launch Chrome with CDP

**Option A: npm script**
```bash
npm run cdp:start
```

**Option B: PowerShell script**
```bash
.\start-cdp.ps1

# Custom URL
.\start-cdp.ps1 -Url http://localhost:3000/dashboard

# Use Microsoft Edge instead
.\start-cdp.ps1 -Edge

# Custom port
.\start-cdp.ps1 -Port 9223

# Help
.\start-cdp.ps1 -Help
```

**Option C: Manual**
```powershell
# Kill existing Chrome
Get-Process chrome | Stop-Process -Force

# Start Chrome with CDP
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $chromePath --remote-debugging-port=9222 --user-data-dir="$env:TEMP\chrome-cdp-profile" http://localhost:3000
```

### Step 3: Verify CDP Endpoint

```bash
# Check if CDP is running
curl http://localhost:9222/json

# Expected output:
# [
#   {
#     "description": "",
#     "devtoolsFrontendUrl": "/devtools/inspector.html?ws=localhost:9222/...",
#     "id": "...",
#     "title": "Universe MapMaker",
#     "type": "page",
#     "url": "http://localhost:3000/",
#     "webSocketDebuggerUrl": "ws://localhost:9222/..."
#   }
# ]
```

### Step 4: Start CDP Logger

```bash
npm run cdp:log
# Or: node cdp-logger.mjs
```

**Expected output:**
```
🔌 Connecting to Chrome DevTools Protocol...
   CDP URL: http://localhost:9222
✅ Connected to Chrome successfully!
📄 Monitoring page: http://localhost:3000/
✅ CDP Logger is now monitoring DevTools...
📝 Logs are being written to: devtools.log
🛑 Press Ctrl+C to stop monitoring
```

### Step 5: Monitor Logs (Optional)

**Option A: Real-time monitoring**
```bash
npm run cdp:monitor
# Or: .\monitor-devtools.bat
```

**Option B: PowerShell tail**
```powershell
Get-Content devtools.log -Wait -Tail 50
```

**Option C: Read file manually**
```bash
# Claude can read this file directly!
cat devtools.log
```

---

## What Gets Logged?

### Console Messages
```
[2025-11-15T10:30:15.123Z] [CONSOLE LOG] User logged in: admin@example.com
[2025-11-15T10:30:16.456Z] [CONSOLE WARN] Slow network detected
[2025-11-15T10:30:17.789Z] [CONSOLE ERROR] Failed to fetch: 401 Unauthorized
```

### Network Requests
```
[2025-11-15T10:30:15.123Z] [NETWORK →] GET https://api.universemapmaker.online/dashboard/projects/
[2025-11-15T10:30:15.456Z] [NETWORK ←] GET https://api.universemapmaker.online/dashboard/projects/ → 200
[2025-11-15T10:30:16.789Z] [NETWORK →] POST https://api.universemapmaker.online/api/layer/import/shp/
[2025-11-15T10:30:17.123Z] [NETWORK ←] POST https://api.universemapmaker.online/api/layer/import/shp/ → 400
[2025-11-15T10:30:17.456Z] [RESPONSE BODY] {
  "message": "Warstwa jest nieprawidłowa",
  "details": "Invalid SHP file"
}
```

### JavaScript Errors
```
[2025-11-15T10:30:18.123Z] [JS ERROR] Cannot read property 'data' of undefined
[2025-11-15T10:30:18.456Z] [STACK] TypeError: Cannot read property 'data' of undefined
    at ComponentName.tsx:42
    at useEffect (react-dom.development.js:1234)
```

### Request Failures
```
[2025-11-15T10:30:19.123Z] [REQUEST FAILED] https://api.universemapmaker.online/timeout - net::ERR_CONNECTION_TIMED_OUT
```

---

## How Claude Uses CDP Logs

### Before CDP (Manual Process):
```
User: "The dashboard isn't loading"
Claude: "Can you open DevTools (F12) and send me a screenshot?"
User: *sends screenshot*
Claude: "I see a 401 error. Can you copy-paste the response body?"
User: *copy-pastes JSON*
Claude: "Looks like auth token expired..."
```

### After CDP (Automated):
```
User: "The dashboard isn't loading"
Claude: *reads devtools.log automatically*
Claude: "I see a 401 Unauthorized error in the logs:
        [NETWORK ←] GET /dashboard/projects/ → 401
        [RESPONSE BODY] { "detail": "Invalid token" }

        Your auth token expired. Let me check the token refresh logic..."
```

**Result: 10x faster debugging!** ⚡

---

## Troubleshooting

### Error: "Failed to connect to CDP"

**Cause:** Chrome not running with CDP, or wrong port.

**Solution:**
```bash
# Check if CDP endpoint exists
curl http://localhost:9222/json

# If fails, restart Chrome with CDP
.\start-cdp.ps1
```

### Error: "No pages found. Open a tab in Chrome first."

**Cause:** Chrome running but no tabs open.

**Solution:**
```bash
# Open a new tab manually in Chrome
# Or restart with URL:
.\start-cdp.ps1 -Url http://localhost:3000
```

### CDP works but logs are empty

**Cause:** No activity in browser yet.

**Solution:**
1. Navigate to http://localhost:3000/dashboard
2. Click buttons, trigger API calls
3. Check `devtools.log` for new entries

### Browser crashes or freezes

**Cause:** CDP debugging overhead.

**Solution:**
```bash
# Use separate Chrome profile (already configured in start-cdp.ps1)
# Profile location: %TEMP%\chrome-cdp-profile

# Or reduce logging verbosity by editing cdp-logger.mjs
# Comment out network logging if too verbose
```

### Port 9222 already in use

**Cause:** Another Chrome instance using CDP port.

**Solution:**
```powershell
# Kill all Chrome processes
Get-Process chrome | Stop-Process -Force

# Or use different port
.\start-cdp.ps1 -Port 9223
node cdp-logger.mjs  # Update CDP_PORT in script to 9223
```

---

## Advanced Usage

### Custom CDP Port

**start-cdp.ps1:**
```bash
.\start-cdp.ps1 -Port 9223
```

**cdp-logger.mjs:**
```javascript
// Edit line 8
const CDP_PORT = 9223;
```

### Filter Logs (Reduce Noise)

**Edit cdp-logger.mjs** to skip unwanted requests:

```javascript
// Line 90: Skip specific URLs
page.on('request', request => {
  const url = request.url();

  // Skip data URLs, extensions, and analytics
  if (url.startsWith('data:') ||
      url.startsWith('chrome-extension:') ||
      url.includes('google-analytics') ||
      url.includes('cdn.jsdelivr.net')) {
    return;
  }

  // Log only API calls
  if (url.includes('/api/') || url.includes('/dashboard/')) {
    log(`[NETWORK →] ${request.method()} ${url}`, colors.cyan);
  }
});
```

### Monitor Multiple Tabs

**cdp-logger.mjs** currently monitors **first tab only**. To monitor all tabs:

```javascript
// Replace line 52-90 with:
const pages = await browser.pages();

for (const page of pages) {
  const url = page.url();
  log(`📄 Monitoring: ${url}`, colors.blue);

  // Add event listeners for each page
  page.on('console', msg => { /* ... */ });
  page.on('request', request => { /* ... */ });
  // etc.
}
```

### Export Logs to JSON

Modify `cdp-logger.mjs` to write JSON instead of text:

```javascript
const logs = [];

function log(message, color) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: message,
  };

  logs.push(logEntry);
  console.log(`${color}${message}${colors.reset}`);
}

// On exit, write JSON
process.on('SIGINT', () => {
  fs.writeFileSync('devtools.json', JSON.stringify(logs, null, 2));
  process.exit(0);
});
```

---

## Claude's CDP Workflow

When you report an issue, Claude can now:

1. **Read logs automatically:**
   ```bash
   # Claude reads devtools.log
   cat devtools.log | grep ERROR
   ```

2. **Identify root cause:**
   ```
   [CONSOLE ERROR] Failed to fetch: 401 Unauthorized
   [NETWORK ←] GET /dashboard/projects/ → 401
   [RESPONSE BODY] { "detail": "Invalid token" }
   ```

3. **Propose fix:**
   ```typescript
   // Fix: Add token refresh logic
   if (error.status === 401) {
     await dispatch(refreshToken());
     retry();
   }
   ```

4. **Verify fix:**
   ```bash
   # After code change, check logs again
   tail -20 devtools.log
   # Expect: 200 OK instead of 401
   ```

---

## Files Created

| File | Description |
|------|-------------|
| `cdp-logger.mjs` | Node.js script that connects to Chrome via CDP and logs Console/Network |
| `start-cdp.ps1` | PowerShell script to launch Chrome with remote debugging enabled |
| `monitor-devtools.bat` | Batch file to monitor `devtools.log` in real-time (like `tail -f`) |
| `devtools.log` | Output file containing all Console/Network/Error logs (gitignored) |
| `CDP-SETUP.md` | This documentation file |

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run cdp:start` | Launch Chrome with CDP on port 9222 |
| `npm run cdp:log` | Start CDP logger (writes to devtools.log) |
| `npm run cdp:monitor` | Monitor devtools.log in real-time |

---

## Security Notes

**CDP exposes full browser control!** Only use on localhost development.

**DO NOT:**
- ❌ Expose port 9222 to public internet
- ❌ Use CDP in production
- ❌ Run CDP on untrusted websites

**Safe usage:**
- ✅ localhost:3000 only
- ✅ Local development environment
- ✅ Separate Chrome profile (auto-configured by start-cdp.ps1)

---

## References

- [Chrome DevTools Protocol Docs](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer API](https://pptr.dev/)
- [CDP Viewer](https://chromedevtools.github.io/devtools-protocol/tot/)

---

**Last Updated:** 2025-11-15
**Status:** ✅ Fully functional
**Tested:** Windows 10/11, Chrome 120+, Edge 120+
