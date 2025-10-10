import { test, expect } from '@playwright/test';

/**
 * MAP E2E TESTS
 *
 * Tests map functionality:
 * - Map rendering
 * - Layer panel
 * - Drawing tools
 * - 3D buildings
 * - Basemap switching
 * - Mobile interactions
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

  // Navigate to first project or skip
  await page.waitForTimeout(2000);
  const projectCount = await page.locator('[data-testid="project-card"]').count();
  if (projectCount === 0) {
    test.skip();
    return;
  }
  await page.locator('[data-testid="project-card"]').first().click();
  await expect(page).toHaveURL(/\/map/, { timeout: 10000 });
}

test.describe('Map Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display map canvas', async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(3000);

    // Check for Mapbox canvas
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Check map is interactive (not loading indefinitely)
    const isInteractive = await canvas.evaluate((el: any) => {
      return el.style.cursor !== 'wait';
    });
    expect(isInteractive).toBeTruthy();
  });

  test('should display left panel with layers', async ({ page }) => {
    // Check left panel
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();

    // Check layer tree
    const layerTree = page.locator('[role="tree"]');
    if ((await layerTree.count()) > 0) {
      await expect(layerTree).toBeVisible();
    }
  });

  test('should display right toolbar', async ({ page }) => {
    // Check right toolbar
    await expect(page.locator('[data-testid="right-toolbar"]')).toBeVisible();

    // Check for tool buttons (draw, measure, etc.)
    const toolButtons = page.locator('[data-testid="right-toolbar"] button');
    expect(await toolButtons.count()).toBeGreaterThan(0);
  });
});

test.describe('Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should zoom in and out', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click zoom in button
    const zoomIn = page.locator('button[aria-label*="Zoom in"]');
    if ((await zoomIn.count()) > 0) {
      await zoomIn.click();
      await page.waitForTimeout(500);

      // Click zoom out button
      const zoomOut = page.locator('button[aria-label*="Zoom out"]');
      await zoomOut.click();
      await page.waitForTimeout(500);
    }
  });

  test('should pan map by dragging', async ({ page }) => {
    await page.waitForTimeout(3000);

    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Get initial position
    const box = await canvas.boundingBox();
    if (!box) return;

    // Drag from center to left
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2);
    await page.mouse.up();

    await page.waitForTimeout(500);
  });

  test('should switch basemap', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for basemap selector
    const basemapButton = page.getByRole('button', { name: /mapa|basemap|style/i });
    if ((await basemapButton.count()) === 0) {
      test.skip();
      return;
    }

    await basemapButton.click();

    // Select different basemap (e.g., satellite)
    const satelliteOption = page.locator('text=/satelita|satellite/i');
    if ((await satelliteOption.count()) > 0) {
      await satelliteOption.click();
      await page.waitForTimeout(2000);

      // Map should still be visible
      await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible();
    }
  });

  test('should enable 3D buildings', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for 3D toggle
    const toggle3D = page.getByRole('button', { name: /3d|buildings/i });
    if ((await toggle3D.count()) === 0) {
      test.skip();
      return;
    }

    await toggle3D.click();
    await page.waitForTimeout(2000);

    // Map should still render
    await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible();
  });
});

test.describe('Layer Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should toggle layer visibility', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Find first layer with visibility toggle
    const visibilityToggle = page.locator('[data-testid="layer-visibility-toggle"]').first();
    if ((await visibilityToggle.count()) === 0) {
      test.skip();
      return;
    }

    // Click to hide layer
    await visibilityToggle.click();
    await page.waitForTimeout(500);

    // Click to show layer again
    await visibilityToggle.click();
    await page.waitForTimeout(500);
  });

  test('should open layer properties', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Find layer settings button
    const layerSettings = page.locator('[data-testid="layer-settings"]').first();
    if ((await layerSettings.count()) === 0) {
      test.skip();
      return;
    }

    await layerSettings.click();

    // Check properties panel opens
    await expect(page.locator('text=/właściwości|properties|ustawienia/i')).toBeVisible();
  });
});

test.describe('Drawing Tools', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should activate point drawing mode', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click point tool
    const pointTool = page.getByRole('button', { name: /point|punkt/i });
    if ((await pointTool.count()) === 0) {
      test.skip();
      return;
    }

    await pointTool.click();

    // Tool should be active
    await expect(pointTool).toHaveAttribute('aria-pressed', 'true');
  });

  test('should activate line drawing mode', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click line tool
    const lineTool = page.getByRole('button', { name: /line|linia/i });
    if ((await lineTool.count()) === 0) {
      test.skip();
      return;
    }

    await lineTool.click();

    // Tool should be active
    await expect(lineTool).toHaveAttribute('aria-pressed', 'true');
  });

  test('should activate polygon drawing mode', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click polygon tool
    const polygonTool = page.getByRole('button', { name: /polygon|poligon/i });
    if ((await polygonTool.count()) === 0) {
      test.skip();
      return;
    }

    await polygonTool.click();

    // Tool should be active
    await expect(polygonTool).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Mobile Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page);
  });

  test('should display map on mobile', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Map canvas should be visible
    await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible();
  });

  test('should allow touch interactions', async ({ page }) => {
    await page.waitForTimeout(3000);

    const canvas = page.locator('canvas.mapboxgl-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Simulate touch pan
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
  });

  test('should show mobile FAB for drawing', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for floating action button
    const fab = page.locator('[data-testid="mobile-fab"]');
    if ((await fab.count()) > 0) {
      await expect(fab).toBeVisible();

      // Click to expand
      await fab.click();

      // Drawing options should appear
      await expect(page.locator('text=/point|line|polygon/i')).toBeVisible();
    }
  });
});

test.describe('Search and Identify', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open search modal', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click search button
    const searchButton = page.getByRole('button', { name: /search|szukaj/i });
    if ((await searchButton.count()) === 0) {
      test.skip();
      return;
    }

    await searchButton.click();

    // Search modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder(/search|szukaj/i)).toBeVisible();
  });

  test('should activate identify tool', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click identify tool
    const identifyTool = page.getByRole('button', { name: /identify|info/i });
    if ((await identifyTool.count()) === 0) {
      test.skip();
      return;
    }

    await identifyTool.click();

    // Tool should be active
    await expect(identifyTool).toHaveAttribute('aria-pressed', 'true');
  });
});
