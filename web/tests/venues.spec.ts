import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://worldcup-2026.rami992009.workers.dev' });

test.describe('Venue card navigation', () => {
  test('venue cards are clickable links', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Venue cards are <a> tags with href="/venues/:id"
    const venueCards = page.locator('a[href^="/venues/"]');

    await expect(venueCards.first()).toBeVisible();
    const count = await venueCards.count();
    expect(count).toBeGreaterThanOrEqual(16); // 16 venues expected
  });

  test('clicking a venue card navigates to /venues/:venueId', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Click the first venue card
    const firstCard = page.locator('a[href^="/venues/"]').first();
    const href = await firstCard.getAttribute('href');

    await firstCard.click();
    await page.waitForLoadState('networkidle');

    // Should be on the venue detail page
    await expect(page).toHaveURL(href!);
  });

  test('venue detail page shows venue information', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Click the first venue card
    const firstCard = page.locator('a[href^="/venues/"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');

    // Detail page should show venue name (h2)
    await expect(page.locator('h2')).toBeVisible();
    const venueName = await page.locator('h2').textContent();
    expect(venueName?.trim().length).toBeGreaterThan(0);

    // Should show city and country
    const subtitle = page.locator('p').filter({ hasText: /,\s*(México|Estados Unidos|Canadá|USA|Mexico|Canada)/ });
    await expect(subtitle.first()).toBeVisible();
  });

  test('venue detail page shows capacity and region', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Click first venue card
    await page.locator('a[href^="/venues/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Capacity label should be visible
    await expect(page.locator('dt:has-text("Capacidad")').first()).toBeVisible();
    await expect(page.locator('dt:has-text("Región")').first()).toBeVisible();

    // Capacity should have a number
    const capacityDd = page.locator('dd').first();
    await expect(capacityDd).toContainText(/[\d.]+/);
  });

  test('venue detail page has back link to /venues', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Click first venue card
    await page.locator('a[href^="/venues/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Should have a "Volver a estadios" link
    const backLink = page.getByRole('link', { name: /Volver a estadios/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/venues');
  });

  test('venue detail shows matches section', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    // Click first venue card
    await page.locator('a[href^="/venues/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Should have a "Partidos" section
    const matchesHeading = page.locator('h3:has-text("Partidos")');
    await expect(matchesHeading).toBeVisible();
  });
});
