/**
 * Test: Login and Open Wyszki Project
 * Monitors all Console logs and Network requests
 */

import puppeteer from 'puppeteer';

console.log('🧪 Starting Wyszki Project Test...\n');

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
  slowMo: 200,
});

const page = (await browser.pages())[0];

// Enhanced monitoring
const allLogs = [];

page.on('console', async msg => {
  const type = msg.type();
  const text = msg.text();
  const args = await Promise.all(
    msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
  );
  const formattedText = args.length > 0 ? args.join(' ') : text;

  const logEntry = `[CONSOLE ${type.toUpperCase()}] ${formattedText}`;
  console.log(logEntry);
  allLogs.push(logEntry);
});

page.on('response', async response => {
  const url = response.url();
  const status = response.status();
  const method = response.request().method();

  // Filter out noise (analytics, fonts, etc.)
  if (url.includes('analytics') || url.includes('gstatic') || url.includes('gtag')) {
    return;
  }

  let color = '\x1b[32m'; // green
  if (status >= 400) color = '\x1b[31m'; // red
  else if (status >= 300) color = '\x1b[33m'; // yellow

  const logEntry = `[NETWORK] ${method} ${url} → ${status}`;
  console.log(`${color}${logEntry}\x1b[0m`);
  allLogs.push(logEntry);

  // Log response body for API calls
  if ((url.includes('/api/') || url.includes('/dashboard/')) && !url.includes('_next')) {
    try {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        const bodyLog = `[RESPONSE] ${JSON.stringify(body, null, 2)}`;
        console.log(bodyLog);
        allLogs.push(bodyLog);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
});

page.on('pageerror', error => {
  const logEntry = `[JS ERROR] ${error.message}`;
  console.error(`\x1b[31m${logEntry}\x1b[0m`);
  allLogs.push(logEntry);
});

page.on('requestfailed', request => {
  const failure = request.failure();
  const logEntry = `[REQUEST FAILED] ${request.url()} - ${failure?.errorText}`;
  console.error(`\x1b[31m${logEntry}\x1b[0m`);
  allLogs.push(logEntry);
});

try {
  // Step 1: Go to auth page
  console.log('📍 Step 1: Navigating to /auth...\n');
  await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Fill login form
  console.log('📍 Step 2: Filling login form...\n');

  const inputs = await page.$$('input');
  const usernameInput = inputs.find(async input => {
    const type = await input.evaluate(el => el.getAttribute('type'));
    return type === 'text';
  });

  const passwordInput = inputs.find(async input => {
    const type = await input.evaluate(el => el.getAttribute('type'));
    return type === 'password';
  });

  // Since find() with async doesn't work, let's use a simpler approach
  let username = null;
  let password = null;

  for (const input of inputs) {
    const type = await input.evaluate(el => el.getAttribute('type'));
    if (type === 'text' && !username) username = input;
    if (type === 'password' && !password) password = input;
  }

  if (username && password) {
    await username.type('admin', { delay: 50 });
    await password.type('Kaktus,1', { delay: 50 });
    console.log('✅ Form filled: admin / ********\n');

    // Click submit button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Zaloguj')) {
        console.log('📍 Step 3: Clicking login button...\n');
        await button.click();
        break;
      }
    }

    // Wait for navigation or response
    await new Promise(resolve => setTimeout(resolve, 5000));

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}\n`);

    // Check if logged in
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token) {
      console.log(`✅ Logged in! Token: ${token.substring(0, 30)}...\n`);
    } else {
      console.log('⚠️  No token found, trying manual navigation to dashboard...\n');
    }

    // Step 3: Navigate to dashboard
    console.log('📍 Step 4: Navigating to /dashboard...\n');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Look for Wyszki project
    console.log('📍 Step 5: Looking for Wyszki project...\n');

    // Try to find project card with "Wyszki" text
    const projectCards = await page.$$('[class*="Card"], [class*="card"]');
    console.log(`Found ${projectCards.length} potential project cards\n`);

    let wyszkiCard = null;
    for (const card of projectCards) {
      const text = await card.evaluate(el => el.textContent);
      if (text.includes('Wyszki')) {
        wyszkiCard = card;
        console.log(`✅ Found Wyszki project card!\n`);
        break;
      }
    }

    if (wyszkiCard) {
      // Try to find "Otwórz" button or link
      const links = await wyszkiCard.$$('a, button');
      for (const link of links) {
        const text = await link.evaluate(el => el.textContent);
        if (text.includes('Otwórz') || text.includes('Open')) {
          console.log('📍 Step 6: Opening Wyszki project...\n');
          await link.click();
          break;
        }
      }

      // Wait for map to load
      await new Promise(resolve => setTimeout(resolve, 8000));

      const mapUrl = page.url();
      console.log(`Map URL: ${mapUrl}\n`);

      if (mapUrl.includes('/map') && mapUrl.includes('Wyszki')) {
        console.log('✅ ✅ ✅ Wyszki project opened successfully!\n');
      } else {
        console.log('⚠️  URL does not contain expected /map?project=Wyszki\n');
      }

    } else {
      console.log('❌ Could not find Wyszki project card\n');
      console.log('Trying direct navigation to map...\n');

      await page.goto('http://localhost:3000/map?project=Wyszki', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 8000));

      console.log('✅ Navigated directly to Wyszki map\n');
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Logs: ${allLogs.length}`);
    console.log(`Current URL: ${page.url()}`);

    // Count errors
    const errors = allLogs.filter(log => log.includes('ERROR') || log.includes('FAILED'));
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors found: ${errors.length}`);
      errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✅ Test completed! Browser will stay open for inspection.');
    console.log('You can now interact with the map and I will see all logs.\n');
    console.log('Press Ctrl+C to exit.\n');

    // Keep browser open
    await new Promise(() => {});

  } else {
    throw new Error('Could not find login inputs');
  }

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
