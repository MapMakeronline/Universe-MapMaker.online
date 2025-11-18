/**
 * Test: Interact with Wyszki Map
 * Enables layer tree and opens configuration modal
 */

import puppeteer from 'puppeteer';

console.log('🧪 Starting Wyszki Map Interaction Test...\n');

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

  // Filter out noise
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
  // Step 1: Navigate to Wyszki map (if not already there)
  console.log('📍 Step 1: Navigating to Wyszki map...\n');
  await page.goto('http://localhost:3000/map?project=Wyszki', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Map loaded\n');

  // Step 2: Find and click layer tree toggle
  console.log('📍 Step 2: Looking for layer tree toggle button...\n');

  // Try common selectors for layer tree toggle
  const layerTreeSelectors = [
    'button[aria-label*="layer" i]',
    'button[aria-label*="warst" i]',
    'button[title*="layer" i]',
    'button[title*="warst" i]',
    '[data-testid*="layer"]',
    '[data-testid*="tree"]',
    'button:has-text("Warstwy")',
    'button:has-text("Layers")',
    '.MuiFab-root', // Material-UI FAB buttons
    'button[class*="layer" i]',
    'button[class*="tree" i]',
  ];

  let layerTreeButton = null;
  for (const selector of layerTreeSelectors) {
    try {
      layerTreeButton = await page.$(selector);
      if (layerTreeButton) {
        const text = await layerTreeButton.evaluate(el => el.textContent || el.getAttribute('aria-label') || el.getAttribute('title'));
        console.log(`✅ Found potential layer tree button: ${selector} - "${text}"\n`);

        // Check if it's visible
        const isVisible = await layerTreeButton.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        if (isVisible) {
          console.log(`✅ Button is visible, clicking...\n`);
          await layerTreeButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        } else {
          console.log(`⚠️  Button found but not visible, trying next selector...\n`);
          layerTreeButton = null;
        }
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!layerTreeButton) {
    console.log('⚠️  Could not find layer tree toggle button with known selectors\n');
    console.log('Looking for all buttons on page...\n');

    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons total\n`);

    for (const button of buttons) {
      const text = await button.evaluate(el => {
        return {
          text: el.textContent,
          ariaLabel: el.getAttribute('aria-label'),
          title: el.getAttribute('title'),
          className: el.className
        };
      });
      console.log(`  - Button: text="${text.text?.trim()}" aria-label="${text.ariaLabel}" title="${text.title}" class="${text.className}"`);
    }
  }

  // Step 3: Find and click configuration modal button
  console.log('\n📍 Step 3: Looking for configuration modal button...\n');

  const configModalSelectors = [
    'button[aria-label*="config" i]',
    'button[aria-label*="konfigur" i]',
    'button[title*="config" i]',
    'button[title*="konfigur" i]',
    '[data-testid*="config"]',
    'button:has-text("Konfiguracja")',
    'button:has-text("Configuration")',
    'button:has-text("Ustawienia")',
    'button:has-text("Settings")',
    'button[class*="config" i]',
  ];

  let configButton = null;
  for (const selector of configModalSelectors) {
    try {
      configButton = await page.$(selector);
      if (configButton) {
        const text = await configButton.evaluate(el => el.textContent || el.getAttribute('aria-label') || el.getAttribute('title'));
        console.log(`✅ Found potential config button: ${selector} - "${text}"\n`);

        const isVisible = await configButton.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        if (isVisible) {
          console.log(`✅ Button is visible, clicking...\n`);
          await configButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        } else {
          console.log(`⚠️  Button found but not visible, trying next selector...\n`);
          configButton = null;
        }
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!configButton) {
    console.log('⚠️  Could not find configuration modal button with known selectors\n');
  }

  // Wait for any animations/loading
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 INTERACTION TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Current URL: ${page.url()}`);
  console.log(`Total Logs: ${allLogs.length}`);

  // Count errors
  const errors = allLogs.filter(log => log.includes('ERROR') || log.includes('FAILED'));
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors found: ${errors.length}`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✅ Interaction test completed! Browser will stay open for inspection.');
  console.log('You can now interact with the layer tree and configuration modal.\\n');
  console.log('Press Ctrl+C to exit.\n');

  // Keep browser open
  await new Promise(() => {});

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
