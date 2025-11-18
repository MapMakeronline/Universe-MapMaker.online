/**
 * Login Test Script with CDP Monitoring
 *
 * Tests:
 * - Navigation to login page
 * - Form filling and submission
 * - Network request monitoring
 * - Console log capture
 * - Redirect after successful login
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const LOG_FILE = 'test-login.log';
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${color}${logMessage}${colors.reset}`);
  logStream.write(logMessage + '\n');
}

async function testLogin() {
  let browser;

  try {
    log('🧪 Starting Login Test...', colors.cyan);
    log('═'.repeat(80), colors.cyan);

    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100, // Slow down by 100ms for visibility
    });

    const page = (await browser.pages())[0];

    // Setup monitoring
    const networkRequests = [];
    const consoleLogs = [];
    const errors = [];

    // Console monitoring
    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();
      const args = await Promise.all(
        msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
      );
      const formattedText = args.length > 0 ? args.join(' ') : text;

      consoleLogs.push({ type, text: formattedText, timestamp: new Date().toISOString() });

      let color = colors.reset;
      if (type === 'error') color = colors.red;
      else if (type === 'warning') color = colors.yellow;
      else if (type === 'info') color = colors.blue;

      log(`[CONSOLE ${type.toUpperCase()}] ${formattedText}`, color);
    });

    // Network monitoring
    page.on('request', request => {
      const url = request.url();
      if (!url.startsWith('data:') && !url.startsWith('chrome-extension:')) {
        networkRequests.push({
          method: request.method(),
          url,
          timestamp: new Date().toISOString(),
          type: 'request'
        });
        log(`[NETWORK →] ${request.method()} ${url}`, colors.cyan);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      const status = response.status();

      if (!url.startsWith('data:') && !url.startsWith('chrome-extension:')) {
        let color = colors.green;
        if (status >= 400) color = colors.red;
        else if (status >= 300) color = colors.yellow;

        log(`[NETWORK ←] ${response.request().method()} ${url} → ${status}`, color);

        // Log response body for API calls
        if (url.includes('/auth/') || url.includes('/api/')) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const body = await response.json();
              log(`[RESPONSE BODY] ${JSON.stringify(body, null, 2)}`, status >= 400 ? colors.red : colors.green);
            }
          } catch (error) {
            // Ignore body parsing errors
          }
        }

        networkRequests.push({
          method: response.request().method(),
          url,
          status,
          timestamp: new Date().toISOString(),
          type: 'response'
        });
      }
    });

    // Error monitoring
    page.on('pageerror', error => {
      errors.push({ message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
      log(`[JS ERROR] ${error.message}`, colors.red);
      if (error.stack) log(`[STACK] ${error.stack}`, colors.red);
    });

    page.on('requestfailed', request => {
      const failure = request.failure();
      errors.push({ url: request.url(), error: failure?.errorText, timestamp: new Date().toISOString() });
      log(`[REQUEST FAILED] ${request.url()} - ${failure?.errorText || 'Unknown error'}`, colors.red);
    });

    // Step 1: Navigate to home page
    log('', colors.reset);
    log('Step 1: Navigating to http://localhost:3000/', colors.blue);
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    log('✅ Home page loaded', colors.green);

    // Step 2: Navigate to auth page
    log('', colors.reset);
    log('Step 2: Navigating to /auth (login page)', colors.blue);
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
    log('✅ Auth page loaded', colors.green);

    // Wait a bit to capture initial page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Find login form
    log('', colors.reset);
    log('Step 3: Looking for login form elements...', colors.blue);

    // Try to find email/username input
    const emailSelectors = [
      'input[name="email"]',
      'input[name="username"]',
      'input[type="email"]',
      'input[placeholder*="mail" i]',
      'input[placeholder*="login" i]',
      'input[id*="email" i]',
      'input[id*="username" i]',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) {
        log(`✅ Found email input: ${selector}`, colors.green);
        break;
      }
    }

    if (!emailInput) {
      log('❌ Could not find email input field', colors.red);
      log('Available input fields:', colors.yellow);
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const name = await input.evaluate(el => el.getAttribute('name'));
        const type = await input.evaluate(el => el.getAttribute('type'));
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder'));
        log(`  - name="${name}" type="${type}" placeholder="${placeholder}"`, colors.yellow);
      }
      throw new Error('Email input not found');
    }

    // Try to find password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="hasło" i]',
      'input[id*="password" i]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) {
        log(`✅ Found password input: ${selector}`, colors.green);
        break;
      }
    }

    if (!passwordInput) {
      log('❌ Could not find password input field', colors.red);
      throw new Error('Password input not found');
    }

    // Step 4: Fill form
    log('', colors.reset);
    log('Step 4: Filling login form...', colors.blue);

    await emailInput.click();
    await emailInput.type('admin', { delay: 100 });
    log('✅ Entered username: admin', colors.green);

    await passwordInput.click();
    await passwordInput.type('Kaktus,1', { delay: 100 });
    log('✅ Entered password: ********', colors.green);

    // Step 5: Find and click submit button
    log('', colors.reset);
    log('Step 5: Looking for submit button...', colors.blue);

    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Zaloguj")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      'button[form]',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          const text = await submitButton.evaluate(el => el.textContent);
          log(`✅ Found submit button: ${selector} ("${text}")`, colors.green);
          break;
        }
      } catch (e) {
        // Ignore selector errors
      }
    }

    if (!submitButton) {
      log('❌ Could not find submit button', colors.red);
      log('Available buttons:', colors.yellow);
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        const type = await button.evaluate(el => el.getAttribute('type'));
        log(`  - type="${type}" text="${text}"`, colors.yellow);
      }
      throw new Error('Submit button not found');
    }

    // Step 6: Submit form and wait for navigation
    log('', colors.reset);
    log('Step 6: Submitting login form...', colors.blue);

    // Wait for either navigation or network response
    const [response] = await Promise.all([
      page.waitForResponse(
        response => response.url().includes('/auth/') || response.url().includes('/login'),
        { timeout: 10000 }
      ).catch(() => null),
      submitButton.click(),
    ]);

    log('✅ Form submitted', colors.green);

    // Wait for potential redirect
    await new Promise(resolve => setTimeout(resolve, 3000));

    const currentUrl = page.url();
    log(`Current URL after login: ${currentUrl}`, colors.blue);

    // Step 7: Check if logged in
    log('', colors.reset);
    log('Step 7: Checking login status...', colors.blue);

    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token) {
      log(`✅ Auth token found in localStorage: ${token.substring(0, 20)}...`, colors.green);
    } else {
      log('⚠️  No auth token in localStorage', colors.yellow);
    }

    // Check if redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      log('✅ Redirected to dashboard - LOGIN SUCCESSFUL!', colors.green);
    } else if (currentUrl.includes('/auth')) {
      log('⚠️  Still on auth page - login may have failed', colors.yellow);
    } else {
      log(`ℹ️  Current page: ${currentUrl}`, colors.blue);
    }

    // Wait a bit more to capture post-login requests
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Summary
    log('', colors.reset);
    log('═'.repeat(80), colors.cyan);
    log('📊 TEST SUMMARY', colors.cyan);
    log('═'.repeat(80), colors.cyan);
    log(`Total Network Requests: ${networkRequests.length}`, colors.blue);
    log(`Total Console Logs: ${consoleLogs.length}`, colors.blue);
    log(`Total Errors: ${errors.length}`, errors.length > 0 ? colors.red : colors.green);

    if (errors.length > 0) {
      log('', colors.reset);
      log('Errors encountered:', colors.red);
      errors.forEach(err => {
        log(`  - ${err.message || err.error || err.url}`, colors.red);
      });
    }

    log('', colors.reset);
    log('✅ Login test completed!', colors.green);
    log(`📝 Full log saved to: ${LOG_FILE}`, colors.green);
    log('🛑 Press Ctrl+C to close browser and exit', colors.yellow);

    // Keep browser open for inspection
    await new Promise(() => {}); // Wait indefinitely

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, colors.red);
    log(`Stack trace: ${error.stack}`, colors.red);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Stopping test...', colors.yellow);
  logStream.end();
  process.exit(0);
});

testLogin();
