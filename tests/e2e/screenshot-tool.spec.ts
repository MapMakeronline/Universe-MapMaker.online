/**
 * Screenshot Tool for Universe MapMaker
 *
 * Usage with Playwright:
 * npx playwright test tests/screenshot-tool.ts --headed
 *
 * Environment variables:
 * SCREENSHOT_URL - URL to capture (default: http://localhost:3000)
 * SCREENSHOT_NAME - Output filename (default: screenshot-{timestamp}.png)
 */

import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const url = process.env.SCREENSHOT_URL || 'http://localhost:3000';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = process.env.SCREENSHOT_NAME || `screenshot-${timestamp}.png`;

test('Take screenshot', async ({ page }) => {
  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const outputPath = path.join(screenshotsDir, filename);

  console.log('\n========================================');
  console.log('  Screenshot Tool - Universe MapMaker');
  console.log('========================================');
  console.log(`URL: ${url}`);
  console.log(`Output: ${outputPath}`);
  console.log('');

  // Set viewport size (1920x1080)
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Navigate to URL and wait for network to be idle
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Take full page screenshot
  await page.screenshot({
    path: outputPath,
    fullPage: true
  });

  console.log(`✅ Screenshot saved to: ${outputPath}\n`);
});
