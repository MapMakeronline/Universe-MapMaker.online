import { test, expect } from '@playwright/test';

/**
 * AUTHENTICATION E2E TESTS
 *
 * Tests user authentication flows:
 * - Login page rendering
 * - Login form validation
 * - Successful login
 * - Logout
 * - Registration
 * - Password reset
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/MapMaker|Login/);

    // Check login form elements (using placeholder since form doesn't have proper labels)
    await expect(page.getByPlaceholder(/użytkownika|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/hasło|minimum/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click login without filling form
    await page.getByRole('button', { name: /zaloguj|login/i }).click();

    // Check for validation errors
    // Note: Adjust selectors based on actual error message implementation
    await expect(page.locator('text=/wymagane|required/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByPlaceholder(/użytkownika|email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/hasło|minimum/i).fill('wrongpassword');
    await page.getByRole('button', { name: /zaloguj|login/i }).click();

    // Check for error message
    await expect(page.locator('text=/nieprawidłowe|invalid|błąd/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Skip if no test credentials available
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip();
    }

    // Fill login form
    await page.getByPlaceholder(/użytkownika|email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder(/hasło|minimum/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /zaloguj|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Check for user menu or profile indicator
    await expect(page.getByRole('button', { name: /profil|profile|konto/i })).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on registration link
    await page.getByRole('link', { name: /zarejestruj|register|sign up/i }).click();

    // Check registration page URL
    await expect(page).toHaveURL(/\/register/);

    // Check registration form
    await expect(page.getByPlaceholder(/użytkownika|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/hasło|minimum/i)).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click on forgot password link
    await page.getByRole('link', { name: /zapomniałeś|forgot|reset/i }).click();

    // Check forgot password page URL
    await expect(page).toHaveURL(/\/forgot-password/);

    // Check email input
    await expect(page.getByPlaceholder(/użytkownika|email/i)).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing map without auth', async ({ page }) => {
    // Try to access map
    await page.goto('/map');

    // Should redirect to login or show auth prompt
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
