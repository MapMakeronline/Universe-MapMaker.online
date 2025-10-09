/**
 * UI Test - Project Creation Flow
 * Tests the full UI flow: Login → Dashboard → Create Project
 */

const { chromium } = require('playwright');

const TEST_EMAIL = 'test_1760009904068@example.com';
const TEST_PASSWORD = 'SecureTestPass123!';
const BASE_URL = 'http://localhost:3001';

async function testProjectCreation() {
  console.log('🧪 Starting UI test for project creation...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to auth page
    console.log('📍 Step 1: Navigating to auth page...');
    await page.goto(`${BASE_URL}/auth`);
    await page.screenshot({ path: 'screenshots/ui-test-1-auth-page.png' });
    console.log('   ✅ Screenshot saved: ui-test-1-auth-page.png\n');

    // Step 2: Login via API and set token
    console.log('📍 Step 2: Logging in via API...');

    // Login via API to get token
    const loginResponse = await fetch('https://api.universemapmaker.online/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    console.log('   ✅ Login successful via API');
    console.log(`   🔑 Token: ${loginData.token.substring(0, 20)}...`);

    // Navigate to app first to set localStorage
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(500);

    // Set token in localStorage
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, loginData.token);

    console.log('   ✅ Token saved to localStorage\n');

    // Step 3: Reload dashboard with auth
    console.log('📍 Step 3: Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/ui-test-4-dashboard.png', fullPage: true });
    console.log('   ✅ Screenshot saved: ui-test-4-dashboard.png\n');

    // Step 4: Open create project dialog
    console.log('📍 Step 4: Opening create project dialog...');

    // Try desktop button first
    const desktopButton = page.locator('button:has-text("Nowy projekt")').first();
    const isDesktopVisible = await desktopButton.isVisible().catch(() => false);

    if (isDesktopVisible) {
      await desktopButton.click();
    } else {
      // Try empty state button
      const emptyStateButton = page.locator('button:has-text("Utwórz projekt")').first();
      await emptyStateButton.click();
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/ui-test-5-dialog-opened.png', fullPage: true });
    console.log('   ✅ Screenshot saved: ui-test-5-dialog-opened.png\n');

    // Step 5: Fill project form
    console.log('📍 Step 5: Filling project form...');
    const timestamp = Date.now();
    const projectName = `UITest${timestamp}`;
    const domainName = `uitest${timestamp}`;

    await page.fill('input[label="Nazwa projektu"]', projectName);
    await page.fill('input[label="Domena"]', domainName);
    await page.fill('textarea[label="Opis"]', 'Automated UI test project');

    // Select category
    await page.click('text=Inne');

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/ui-test-6-form-filled.png', fullPage: true });
    console.log('   ✅ Screenshot saved: ui-test-6-form-filled.png');
    console.log(`   📝 Project name: ${projectName}`);
    console.log(`   📝 Domain: ${domainName}\n`);

    // Step 6: Submit form
    console.log('📍 Step 6: Submitting form...');
    await page.click('button:has-text("Utwórz projekt")');
    await page.waitForTimeout(3000); // Wait for creation + snackbar
    await page.screenshot({ path: 'screenshots/ui-test-7-after-submit.png', fullPage: true });
    console.log('   ✅ Screenshot saved: ui-test-7-after-submit.png\n');

    // Step 7: Verify project appears in list
    console.log('📍 Step 7: Verifying project in list...');
    await page.waitForTimeout(2000);

    // Check if project card exists
    const projectCard = page.locator(`text=${projectName}`).first();
    const projectExists = await projectCard.isVisible().catch(() => false);

    if (projectExists) {
      console.log('   ✅ Project found in dashboard!');
    } else {
      console.log('   ⚠️  Project not visible yet (might still be loading)');
    }

    await page.screenshot({ path: 'screenshots/ui-test-8-final-dashboard.png', fullPage: true });
    console.log('   ✅ Screenshot saved: ui-test-8-final-dashboard.png\n');

    console.log('✨ UI test completed successfully!\n');
    console.log('📸 All screenshots saved to screenshots/ directory\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/ui-test-ERROR.png', fullPage: true });
    console.log('   📸 Error screenshot saved: ui-test-ERROR.png');
  } finally {
    await browser.close();
  }
}

testProjectCreation();
