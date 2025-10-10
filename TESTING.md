# E2E TESTING GUIDE

Comprehensive guide for End-to-End testing with Playwright in Universe-MapMaker.online.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

**Why Playwright?**

- ✅ **Cross-browser** - Chrome, Firefox, Safari, Edge
- ✅ **Mobile testing** - iPhone, iPad, Pixel, Samsung
- ✅ **Auto-wait** - No manual timeouts needed
- ✅ **Video recording** - Debug failures easily
- ✅ **Parallel execution** - Fast test runs
- ✅ **TypeScript support** - Type-safe tests

**Test Coverage:**

- Authentication flows (login, logout, registration)
- Dashboard functionality (projects, settings)
- Map interactions (zoom, pan, layers, drawing)
- Mobile responsiveness
- 3D features

---

## Setup

### 1. Install Playwright

```bash
npm install -D @playwright/test
```

### 2. Install Browsers

```bash
npx playwright install
```

This installs Chromium, Firefox, and WebKit.

### 3. Configure Test Credentials

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with actual test user credentials:

```env
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

**⚠️ Important:** `.env.test` is gitignored - never commit credentials!

---

## Running Tests

### Basic Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI (best for development)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### Advanced Usage

```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Run on specific browser
npx playwright test --project=chromium

# Run on mobile
npx playwright test --project="Mobile Chrome"

# Update snapshots
npx playwright test --update-snapshots
```

---

## Test Structure

### Directory Layout

```
tests/
└── e2e/
    ├── auth.spec.ts        # Authentication tests
    ├── dashboard.spec.ts   # Dashboard tests
    └── map.spec.ts         # Map interaction tests

playwright.config.ts        # Playwright configuration
playwright-report/          # HTML test reports (gitignored)
test-results/              # Test artifacts (gitignored)
```

### Test File Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /click me/i });

    // Act
    await button.click();

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## Writing Tests

### Locator Best Practices

**Priority order (most to least reliable):**

1. **Role-based** (best for accessibility)
   ```typescript
   page.getByRole('button', { name: /submit/i })
   ```

2. **Label-based**
   ```typescript
   page.getByLabel(/email/i)
   ```

3. **Placeholder**
   ```typescript
   page.getByPlaceholder(/search/i)
   ```

4. **Test ID** (when semantic locators fail)
   ```typescript
   page.locator('[data-testid="project-card"]')
   ```

5. **Text content** (least reliable, translations break it)
   ```typescript
   page.locator('text=Zaloguj się')
   ```

### Common Patterns

**Login helper function:**

```typescript
async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
```

**Waiting for elements:**

```typescript
// Wait for visibility
await expect(page.locator('.loader')).toBeVisible();

// Wait for disappearance
await expect(page.locator('.loader')).not.toBeVisible();

// Custom timeout
await expect(element).toBeVisible({ timeout: 10000 });

// Wait for navigation
await page.waitForURL('/dashboard');
```

**Handling dialogs:**

```typescript
// Open dialog
await page.getByRole('button', { name: /create/i }).click();
await expect(page.getByRole('dialog')).toBeVisible();

// Fill form in dialog
await page.getByLabel(/name/i).fill('Test Project');

// Submit
await page.getByRole('button', { name: /submit/i }).click();

// Wait for close
await expect(page.getByRole('dialog')).not.toBeVisible();
```

**Mobile testing:**

```typescript
test('should work on mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Test mobile-specific UI
  await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
});
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

**Add secrets to GitHub:**

1. Go to Settings → Secrets → Actions
2. Add `TEST_USER_EMAIL`
3. Add `TEST_USER_PASSWORD`

---

## Best Practices

### 1. Use Semantic Locators

```typescript
// ❌ Bad - fragile
page.locator('#submit-btn-123')

// ✅ Good - semantic
page.getByRole('button', { name: /submit/i })
```

### 2. Avoid Hard Timeouts

```typescript
// ❌ Bad - flaky
await page.waitForTimeout(5000);

// ✅ Good - wait for condition
await expect(element).toBeVisible();
```

### 3. Use Auto-Waiting

Playwright auto-waits for elements to be:
- Visible
- Enabled
- Stable (not animating)

```typescript
// No need for manual waits!
await page.click('button'); // Auto-waits for button to be ready
```

### 4. Test User Flows, Not Implementation

```typescript
// ❌ Bad - implementation detail
await page.locator('.form-component-v2 input[name="email"]').fill('...');

// ✅ Good - user behavior
await page.getByLabel(/email/i).fill('...');
```

### 5. Clean Up Test Data

```typescript
test.afterEach(async ({ page }) => {
  // Delete created projects
  // Reset user state
  // Clear test data
});
```

### 6. Use Test Isolation

```typescript
// Each test should be independent
test('test 1', async ({ page }) => {
  // Don't rely on test 2 running first
});

test('test 2', async ({ page }) => {
  // Don't rely on test 1's state
});
```

---

## Troubleshooting

### Common Issues

**1. Test fails locally but passes in CI**

- Check viewport size differences
- Verify browser versions
- Review screenshot diffs

**2. Flaky tests (pass/fail randomly)**

- Remove `waitForTimeout()` calls
- Use `expect()` with proper timeouts
- Check for race conditions

**3. Element not found**

```typescript
// Debug: Print page content
console.log(await page.content());

// Debug: Take screenshot
await page.screenshot({ path: 'debug.png' });

// Debug: Pause execution
await page.pause();
```

**4. Tests timeout**

- Increase timeout in config:
  ```typescript
  test.setTimeout(60000); // 60 seconds
  ```
- Check if app is running on correct port
- Verify network connectivity

**5. Authentication fails**

- Verify `.env.test` exists and has correct credentials
- Check if test user exists in database
- Review auth token expiration

### Debug Mode

```bash
# Run single test in debug mode
npx playwright test tests/e2e/auth.spec.ts:10 --debug

# Open Playwright Inspector
PWDEBUG=1 npx playwright test
```

### View Trace

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

---

## Test Coverage

### Current Tests

**Authentication (auth.spec.ts):**
- ✅ Display login page
- ✅ Form validation
- ✅ Invalid credentials error
- ✅ Successful login
- ✅ Navigation to registration
- ✅ Forgot password flow
- ✅ Protected route redirects

**Dashboard (dashboard.spec.ts):**
- ✅ Display dashboard
- ✅ Project list rendering
- ✅ Create project dialog
- ✅ Project creation
- ✅ Project search
- ✅ Navigate to map
- ✅ Public projects tab
- ✅ Mobile responsiveness
- ✅ User settings
- ✅ Logout

**Map (map.spec.ts):**
- ✅ Map canvas rendering
- ✅ Left panel and layer tree
- ✅ Right toolbar
- ✅ Zoom in/out
- ✅ Pan by dragging
- ✅ Basemap switching
- ✅ 3D buildings toggle
- ✅ Layer visibility
- ✅ Layer properties
- ✅ Drawing tools (point, line, polygon)
- ✅ Mobile touch interactions
- ✅ Mobile FAB
- ✅ Search modal
- ✅ Identify tool

**Total Tests:** 40+

---

## Next Steps

1. **Add visual regression tests** - Screenshot comparisons
2. **Add API mocking** - Test without backend dependency
3. **Add performance tests** - Lighthouse integration
4. **Add accessibility tests** - Axe-core integration
5. **Expand mobile coverage** - More device types

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Locator Guide](https://playwright.dev/docs/locators)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Generated on:** 2025-10-09
**Test Files:** 3
**Test Cases:** 40+
**Browsers:** Chrome, Firefox, Safari, Mobile
