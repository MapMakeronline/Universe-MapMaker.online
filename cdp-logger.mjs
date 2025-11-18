/**
 * Chrome DevTools Protocol Logger
 *
 * Connects to Chrome via CDP and logs:
 * - Console messages (log, warn, error)
 * - Network requests/responses
 * - JavaScript errors
 * - Performance warnings
 *
 * Usage:
 * 1. Start Chrome with CDP: .\start-cdp.ps1
 * 2. Start logger: node cdp-logger.mjs
 * 3. Monitor logs: tail -f devtools.log (or monitor-devtools.bat)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'devtools.log';
const CDP_PORT = 9222;
const CDP_URL = `http://localhost:${CDP_PORT}`;

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
};

// Create log stream
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  // Console with color
  console.log(`${color}${logMessage}${colors.reset}`);

  // File without color
  logStream.write(logMessage + '\n');
}

async function connectToCDP() {
  try {
    log('🚀 Launching Chrome with DevTools Protocol...', colors.cyan);

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
    });

    log('✅ Chrome launched successfully!', colors.green);

    const pages = await browser.pages();

    // Navigate to localhost:3000
    const page = pages[0];
    log('📄 Navigating to http://localhost:3000...', colors.blue);
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    const url = page.url();
    log(`✅ Monitoring page: ${url}`, colors.green);

    // Console messages
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();

      // Get args for better formatting
      const args = await Promise.all(
        msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
      );

      const formattedText = args.length > 0 ? args.join(' ') : text;

      let color = colors.reset;
      let prefix = 'LOG';

      switch (type) {
        case 'error':
          color = colors.red;
          prefix = 'ERROR';
          break;
        case 'warning':
          color = colors.yellow;
          prefix = 'WARN';
          break;
        case 'info':
          color = colors.blue;
          prefix = 'INFO';
          break;
        case 'debug':
          color = colors.magenta;
          prefix = 'DEBUG';
          break;
        default:
          color = colors.reset;
          prefix = type.toUpperCase();
      }

      log(`[CONSOLE ${prefix}] ${formattedText}`, color);
    });

    // Network requests
    page.on('request', request => {
      const method = request.method();
      const url = request.url();

      // Skip data URLs and chrome extensions
      if (url.startsWith('data:') || url.startsWith('chrome-extension:')) {
        return;
      }

      log(`[NETWORK →] ${method} ${url}`, colors.cyan);
    });

    // Network responses
    page.on('response', async response => {
      const request = response.request();
      const method = request.method();
      const url = response.url();
      const status = response.status();

      // Skip data URLs and chrome extensions
      if (url.startsWith('data:') || url.startsWith('chrome-extension:')) {
        return;
      }

      let color = colors.green;
      if (status >= 400) {
        color = colors.red;
      } else if (status >= 300) {
        color = colors.yellow;
      }

      log(`[NETWORK ←] ${method} ${url} → ${status}`, color);

      // Log failed requests with response body
      if (status >= 400) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const body = await response.json();
            log(`[RESPONSE BODY] ${JSON.stringify(body, null, 2)}`, colors.red);
          } else {
            const text = await response.text();
            if (text.length < 500) {
              log(`[RESPONSE BODY] ${text}`, colors.red);
            }
          }
        } catch (error) {
          // Ignore body parsing errors
        }
      }
    });

    // JavaScript errors
    page.on('pageerror', error => {
      log(`[JS ERROR] ${error.message}`, colors.red);
      if (error.stack) {
        log(`[STACK] ${error.stack}`, colors.red);
      }
    });

    // Request failures
    page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      log(`[REQUEST FAILED] ${url} - ${failure?.errorText || 'Unknown error'}`, colors.red);
    });

    log('✅ CDP Logger is now monitoring DevTools...', colors.green);
    log('📝 Logs are being written to: devtools.log', colors.green);
    log('🛑 Press Ctrl+C to stop monitoring', colors.yellow);

  } catch (error) {
    log(`❌ Failed to launch Chrome: ${error.message}`, colors.red);
    log('', colors.reset);
    log('Troubleshooting:', colors.yellow);
    log('1. Is localhost:3000 running? Run: npm run dev', colors.yellow);
    log('2. Is Puppeteer installed? Run: npm install', colors.yellow);
    log('3. Error details: ' + error.stack, colors.yellow);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Stopping CDP Logger...', colors.yellow);
  logStream.end();
  process.exit(0);
});

// Start monitoring
connectToCDP();
