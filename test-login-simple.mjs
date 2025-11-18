/**
 * Simplified Login Test
 * Works with inputs without name attributes
 */

import puppeteer from 'puppeteer';

console.log('🧪 Starting simplified login test...\n');

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
  slowMo: 150,
});

const page = (await browser.pages())[0];

// Setup monitoring
page.on('console', msg => {
  console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
});

page.on('response', async response => {
  const url = response.url();
  const status = response.status();

  if (url.includes('/auth/') || url.includes('/login') || url.includes('/api/')) {
    console.log(`[NETWORK] ${response.request().method()} ${url} → ${status}`);

    if (status >= 200 && status < 300) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const body = await response.json();
          console.log(`[RESPONSE] ${JSON.stringify(body, null, 2)}`);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
});

try {
  // Step 1: Navigate to auth page
  console.log('Step 1: Navigating to /auth...');
  await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
  console.log('✅ Auth page loaded\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Find inputs by type only
  console.log('Step 2: Finding form inputs...');

  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} input elements`);

  let usernameInput = null;
  let passwordInput = null;

  for (const input of inputs) {
    const type = await input.evaluate(el => el.getAttribute('type'));
    if (type === 'text' && !usernameInput) {
      usernameInput = input;
      console.log('✅ Found username input (type="text")');
    }
    if (type === 'password' && !passwordInput) {
      passwordInput = input;
      console.log('✅ Found password input (type="password")');
    }
  }

  if (!usernameInput || !passwordInput) {
    throw new Error('Could not find login inputs');
  }

  // Step 3: Fill form
  console.log('\nStep 3: Filling form...');
  await usernameInput.click();
  await usernameInput.type('admin', { delay: 100 });
  console.log('✅ Entered username: admin');

  await passwordInput.click();
  await passwordInput.type('Kaktus,1', { delay: 100 });
  console.log('✅ Entered password: ********\n');

  // Step 4: Find submit button
  console.log('Step 4: Finding submit button...');

  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);

  let submitButton = null;
  for (const button of buttons) {
    const type = await button.evaluate(el => el.getAttribute('type'));
    const text = await button.evaluate(el => el.textContent);

    console.log(`  - type="${type}" text="${text.trim()}"`);

    if (type === 'submit' ||
        text.toLowerCase().includes('zaloguj') ||
        text.toLowerCase().includes('login') ||
        text.toLowerCase().includes('sign in')) {
      submitButton = button;
      console.log(`✅ Found submit button: "${text.trim()}"`);
      break;
    }
  }

  if (!submitButton) {
    console.log('⚠️  No submit button found, trying first button...');
    submitButton = buttons[0];
  }

  // Step 5: Submit and monitor
  console.log('\nStep 5: Submitting form...\n');

  await submitButton.click();
  console.log('✅ Form submitted, waiting for response...\n');

  // Wait for navigation or API response
  await new Promise(resolve => setTimeout(resolve, 5000));

  const currentUrl = page.url();
  console.log(`\nCurrent URL: ${currentUrl}`);

  // Check localStorage for token
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  if (token) {
    console.log(`✅ Auth token found: ${token.substring(0, 30)}...`);
  } else {
    console.log('⚠️  No auth token in localStorage');
  }

  // Check if redirected
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ ✅ ✅  LOGIN SUCCESSFUL - Redirected to dashboard!');
  } else if (currentUrl.includes('/auth')) {
    console.log('⚠️  Still on auth page - check for error messages');
  }

  console.log('\n✅ Test completed! Browser will stay open for inspection.');
  console.log('Press Ctrl+C to exit.\n');

  // Keep browser open
  await new Promise(() => {});

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
