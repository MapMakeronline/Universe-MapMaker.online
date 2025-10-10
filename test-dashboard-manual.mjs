import { chromium } from 'playwright';

async function testDashboard() {
  console.log('🚀 Rozpoczynam testowanie dashboardu...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Strona główna
    console.log('📄 Test 1: Strona główna (/)');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/test-homepage.png', fullPage: true });
    console.log('   ✅ Screenshot: screenshots/test-homepage.png');

    // Sprawdzenie tytułu
    const title = await page.title();
    console.log(`   📝 Tytuł: ${title}`);

    // Sprawdzenie logo
    const logo = await page.locator('img[alt*="logo"], svg').first();
    if (await logo.count() > 0) {
      console.log('   ✅ Logo znalezione');
    }

    // Test 2: Strona logowania
    console.log('\n📄 Test 2: Strona logowania (/login)');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/test-login.png', fullPage: true });
    console.log('   ✅ Screenshot: screenshots/test-login.png');

    // Sprawdzenie formularza
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();

    console.log(`   📝 Email input: ${await emailInput.count() > 0 ? '✅' : '❌'}`);
    console.log(`   📝 Password input: ${await passwordInput.count() > 0 ? '✅' : '❌'}`);
    console.log(`   📝 Submit button: ${await submitButton.count() > 0 ? '✅' : '❌'}`);

    // Test 3: Strona rejestracji
    console.log('\n📄 Test 3: Strona rejestracji (/register)');
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/test-register.png', fullPage: true });
    console.log('   ✅ Screenshot: screenshots/test-register.png');

    // Test 4: Dashboard (wymaga autoryzacji - sprawdzimy przekierowanie)
    console.log('\n📄 Test 4: Dashboard (/dashboard) - przekierowanie jeśli nie zalogowany');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/test-dashboard-redirect.png', fullPage: true });
    console.log('   ✅ Screenshot: screenshots/test-dashboard-redirect.png');

    const currentUrl = page.url();
    console.log(`   📝 Current URL: ${currentUrl}`);
    if (currentUrl.includes('/login')) {
      console.log('   ✅ Przekierowanie na /login działa poprawnie (wymaga autoryzacji)');
    } else {
      console.log('   ⚠️  Brak przekierowania - możliwy mock user lub problem z AuthGuard');
    }

    // Test 5: Strona mapy
    console.log('\n📄 Test 5: Strona mapy (/map)');
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Czekaj na załadowanie mapy
    await page.screenshot({ path: 'screenshots/test-map.png', fullPage: false });
    console.log('   ✅ Screenshot: screenshots/test-map.png');

    // Sprawdzenie canvas Mapbox
    const mapCanvas = await page.locator('.mapboxgl-canvas').first();
    console.log(`   📝 Mapbox canvas: ${await mapCanvas.count() > 0 ? '✅' : '❌'}`);

    console.log('\n✅ Wszystkie testy zakończone!');
    console.log('\n�� Screenshoty zapisane w folderze screenshots/');

  } catch (error) {
    console.error('\n❌ Błąd podczas testowania:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testDashboard().catch(console.error);
