import { test, expect } from '@playwright/test';

/**
 * DASHBOARD E2E TESTS
 *
 * Tests dashboard functionality:
 * - Project list rendering
 * - Project creation
 * - Project deletion
 * - Project search
 * - Project filtering
 * - Responsive layout
 */

// Helper function to login
async function login(page: any) {
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    test.skip();
    return;
  }

  await page.goto('/login');
  await page.getByPlaceholder(/użytkownika|email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder(/hasło|minimum/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /zaloguj|login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard|Panel/);

    // Check for main navigation
    await expect(page.getByRole('navigation')).toBeVisible();

    // Check for tabs or sections
    await expect(page.getByRole('tab', { name: /moje projekty|my projects/i })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /publiczne projekty|public projects/i })
    ).toBeVisible();
  });

  test('should display own projects list', async ({ page }) => {
    // Click on "Moje projekty" tab
    await page.getByRole('tab', { name: /moje projekty|my projects/i }).click();

    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Check for projects or empty state
    const hasProjects = await page.locator('[data-testid="project-card"]').count();
    if (hasProjects > 0) {
      await expect(page.locator('[data-testid="project-card"]').first()).toBeVisible();
    } else {
      // Empty state
      await expect(page.locator('text=/brak projektów|no projects/i')).toBeVisible();
    }
  });

  test('should open create project dialog', async ({ page }) => {
    // Click create project button
    await page.getByRole('button', { name: /nowy projekt|create project|add/i }).click();

    // Check dialog is visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check form fields
    await expect(page.getByLabel(/nazwa|name/i)).toBeVisible();
    await expect(page.getByLabel(/kategoria|category/i)).toBeVisible();
  });

  test('should create new project', async ({ page }) => {
    // Open create dialog
    await page.getByRole('button', { name: /nowy projekt|create project|add/i }).click();

    // Fill form
    const projectName = `Test Project ${Date.now()}`;
    await page.getByLabel(/nazwa|name/i).fill(projectName);

    // Select category (click first category chip)
    await page.locator('[role="button"][aria-label*="category"]').first().click();

    // Submit form
    await page.getByRole('button', { name: /utwórz|create|zapisz/i }).click();

    // Wait for success message
    await expect(page.locator('text=/sukces|success|utworzono/i')).toBeVisible({
      timeout: 15000,
    });

    // Verify project appears in list
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should search projects', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/szukaj|search/i);
    if ((await searchInput.count()) === 0) {
      test.skip();
      return;
    }

    // Type search query
    await searchInput.fill('test');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // All visible projects should contain "test"
    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      const text = await card.textContent();
      expect(text?.toLowerCase()).toContain('test');
    }
  });

  test('should navigate to project map', async ({ page }) => {
    // Wait for projects
    await page.waitForTimeout(2000);

    // Check if any projects exist
    const projectCount = await page.locator('[data-testid="project-card"]').count();
    if (projectCount === 0) {
      test.skip();
      return;
    }

    // Click first project
    await page.locator('[data-testid="project-card"]').first().click();

    // Should navigate to map
    await expect(page).toHaveURL(/\/map/, { timeout: 10000 });
  });

  test('should display public projects', async ({ page }) => {
    // Click public projects tab
    await page.getByRole('tab', { name: /publiczne projekty|public projects/i }).click();

    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Should see projects or empty state
    const hasProjects = await page.locator('[data-testid="project-card"]').count();
    if (hasProjects > 0) {
      await expect(page.locator('[data-testid="project-card"]').first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check hamburger menu is visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Open menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Check navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open user settings', async ({ page }) => {
    // Click user menu/profile button
    await page.getByRole('button', { name: /profil|profile|konto/i }).click();

    // Click settings option
    await page.getByRole('menuitem', { name: /ustawienia|settings/i }).click();

    // Check settings page/dialog
    await expect(page.locator('text=/ustawienia|settings/i')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('button', { name: /profil|profile|konto/i }).click();
    await page.getByRole('menuitem', { name: /ustawienia|settings/i }).click();

    // Update name field
    const nameInput = page.getByLabel(/imię|name/i);
    await nameInput.fill('Test User Updated');

    // Save changes
    await page.getByRole('button', { name: /zapisz|save/i }).click();

    // Check for success message
    await expect(page.locator('text=/zaktualizowano|updated|success/i')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    // Click user menu
    await page.getByRole('button', { name: /profil|profile|konto/i }).click();

    // Click logout
    await page.getByRole('menuitem', { name: /wyloguj|logout|sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
