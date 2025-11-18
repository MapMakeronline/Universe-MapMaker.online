/**
 * Test: Login → Wyszki → Open Wypis Config
 * Full authenticated flow with layer tree interaction
 */

import puppeteer from 'puppeteer';

console.log('🧪 Starting Wypis Config Test (with login)...\n');

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
  slowMo: 150,
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

  if (url.includes('analytics') || url.includes('gstatic') || url.includes('gtag')) {
    return;
  }

  let color = '\x1b[32m';
  if (status >= 400) color = '\x1b[31m';
  else if (status >= 300) color = '\x1b[33m';

  const logEntry = `[NETWORK] ${method} ${url} → ${status}`;
  console.log(`${color}${logEntry}\x1b[0m`);
  allLogs.push(logEntry);

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
      // Ignore
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
  // Step 1: Login
  console.log('📍 Step 1: Logging in as admin...\n');
  await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const inputs = await page.$$('input');
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
    console.log('✅ Credentials entered\n');

    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Zaloguj')) {
        console.log('📍 Clicking login button...\n');
        await button.click();
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token) {
      console.log(`✅ Logged in! Token: ${token.substring(0, 30)}...\n`);
    } else {
      console.log('⚠️  No token found\n');
    }
  }

  // Step 2: Navigate to Wyszki project
  console.log('📍 Step 2: Navigating to Wyszki map...\n');
  await page.goto('http://localhost:3000/map?project=Wyszki', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('✅ Wyszki map loaded\n');

  // Step 3: Open layer tree
  console.log('📍 Step 3: Opening layer tree...\n');

  // Wait for layer tree button to be available
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find and click layer tree button directly in the page context
  const layerTreeClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const layerTreeBtn = buttons.find(btn => {
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();
      return ariaLabel.includes('warst') ||
             ariaLabel.includes('layer') ||
             title.includes('warst') ||
             title.includes('layer');
    });

    if (layerTreeBtn) {
      const rect = layerTreeBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const buttonText = layerTreeBtn.getAttribute('aria-label') || layerTreeBtn.getAttribute('title') || layerTreeBtn.textContent;
        layerTreeBtn.click();
        return { success: true, text: buttonText };
      }
    }
    return { success: false, text: null };
  });

  if (layerTreeClicked.success) {
    console.log(`✅ Found layer tree button: "${layerTreeClicked.text}", clicked successfully!\n`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Layer tree should be open\n');
  } else {
    console.log('⚠️  Layer tree button not found or not visible\n');
  }

  // Step 4: Find Wypis config button INSIDE layer tree
  console.log('📍 Step 4: Looking for Wypis config button in layer tree toolbar...\n');

  // Wait for layer tree panel to be visible
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Search for all visible buttons and list them
  const buttons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    return allButtons
      .filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map(btn => ({
        text: (btn.textContent || '').trim(),
        ariaLabel: btn.getAttribute('aria-label') || '',
        title: btn.getAttribute('title') || '',
        className: btn.className || ''
      }))
      .filter(info => info.text || info.ariaLabel || info.title);
  });

  console.log(`Found ${buttons.length} visible buttons:\n`);
  buttons.forEach((info, idx) => {
    console.log(`  ${idx + 1}. text="${info.text}" aria-label="${info.ariaLabel}" title="${info.title}"`);
  });

  // Try to find and click vypis button
  const wypisClicked = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const wypisBtn = allButtons.find(btn => {
      const text = (btn.textContent || '').toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();

      return text.includes('wypis') ||
             text.includes('konfigur') ||
             ariaLabel.includes('wypis') ||
             ariaLabel.includes('konfigur') ||
             title.includes('wypis') ||
             title.includes('konfigur');
    });

    if (wypisBtn) {
      const rect = wypisBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const buttonText = wypisBtn.textContent || wypisBtn.getAttribute('aria-label') || wypisBtn.getAttribute('title');
        wypisBtn.click();
        return { success: true, text: buttonText };
      }
    }
    return { success: false, text: null };
  });

  if (wypisClicked.success) {
    console.log(`\n✅ Found and clicked Wypis button: "${wypisClicked.text}"\n`);
  } else {
    console.log('\n⚠️  Could not find Wypis config button\n');
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Current URL: ${page.url()}`);
  console.log(`Total Logs: ${allLogs.length}`);

  const errors = allLogs.filter(log => log.includes('ERROR') || log.includes('FAILED'));
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors found: ${errors.length}`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✅ Test completed! Browser will stay open for inspection.');
  console.log('You can now interact with the layer tree and wypis config.\n');
  console.log('Press Ctrl+C to exit.\n');

  // Keep browser open
  await new Promise(() => {});

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
