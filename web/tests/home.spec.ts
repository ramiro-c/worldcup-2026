import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://worldcup-2026.rami992009.workers.dev' });

test.describe('Home page sections', () => {
  test('home page loads without errors', async ({ page }) => {
    const errors: { message: string; source: string }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ message: msg.text(), source: msg.location().url });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page loaded — title and main heading
    await expect(page).toHaveTitle(/Copa Mundial 2026/);
    await expect(page.locator('h2').first()).toBeVisible();

    // No console errors
    expect(errors).toHaveLength(0);
  });

  test('upcoming matches section appears when data loads', async ({ page }) => {
    const errors: { message: string; source: string }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ message: msg.text(), source: msg.location().url });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The "Próximos partidos" heading appears when there is data
    // OR the section may be null (hidden) if no upcoming matches
    const upcomingSection = page.locator('h2:has-text("Próximos partidos")');

    // If data loaded, the section should exist
    if (await upcomingSection.count() > 0) {
      await expect(upcomingSection).toBeVisible();
    }

    // No console errors whether the section shows or not
    expect(errors).toHaveLength(0);
  });

  test('featured venues section appears when data loads', async ({ page }) => {
    const errors: { message: string; source: string }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ message: msg.text(), source: msg.location().url });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The "Sedes destacadas" heading appears when there is venue data
    const venuesSection = page.locator('h2:has-text("Sedes destacadas")');

    if (await venuesSection.count() > 0) {
      await expect(venuesSection).toBeVisible();

      // Should have venue cards (links to /venues/:id)
      const venueCards = page.locator('a[href^="/venues/"]');
      const count = await venueCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }

    // No console errors
    expect(errors).toHaveLength(0);
  });

  test('TV channels section appears when data loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The "Canales de TV" heading appears when there is TV channel data
    const tvSection = page.locator('h2:has-text("Canales de TV")');

    if (await tvSection.count() > 0) {
      await expect(tvSection).toBeVisible();
    }
  });

  test('hero section displays tournament info', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero area: main heading and description
    await expect(page.locator('h2:has-text("Copa Mundial de la FIFA 2026")')).toBeVisible();
    await expect(page.locator('p:has-text("México")')).toBeVisible();
    await expect(page.locator('p:has-text("11 de junio")')).toBeVisible();
  });

  test('quick nav cards are visible on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigation cards for main sections
    await expect(page.getByRole('link', { name: /Grupos/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Fixture/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Eliminatorias/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sedes/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Historial/ }).first()).toBeVisible();
  });

  test('sections render without console errors', async ({ page }) => {
    const errors: { message: string; source: string }[] = [];
    const warnings: { message: string; source: string }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ message: msg.text(), source: msg.location().url });
      }
      if (msg.type() === 'warning') {
        warnings.push({ message: msg.text(), source: msg.location().url });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify sections rendered (or conditionally hidden) without errors
    expect(errors).toHaveLength(0);

    // Warnings are informational — capture for debugging but don't fail
    if (warnings.length > 0) {
        test.info().annotations.push({
            type: 'warning',
            description: `Console warnings: ${warnings.map(w => w.message).join('; ')}`,
        });
    }
  });
});
