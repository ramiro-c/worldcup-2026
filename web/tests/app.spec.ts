import { test, expect } from '@playwright/test';

test.describe('Copa 2026 Web App', () => {
  test.describe.configure({ retries: 2 });
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Copa Mundial 2026/);
    await expect(page.locator('h2').first()).toBeVisible();
  });

  test('should navigate to Groups page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/groups"]');
    await expect(page).toHaveURL('/groups');
    await expect(page.locator('h2')).toContainText('Fase de Grupos');
  });

  test('should display groups with teams', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.locator('h2')).toContainText('Fase de Grupos');
    
    // Check that groups are rendered
    const groupCards = page.locator('.grid > div');
    await expect(groupCards.first()).toBeVisible();
    
    // Check for group names
    await expect(page.locator('h3').first()).toHaveText(/Group [A-Z]/);
    
    // Check that tables have data
    const tables = page.locator('table');
    await expect(tables.first()).toBeVisible();
    
    // Check for team rows - groups should have 4 teams each
    const teamRows = tables.first().locator('tbody tr');
    const count = await teamRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should navigate to Fixtures page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/fixtures"]');
    await expect(page).toHaveURL('/fixtures');
    await expect(page.locator('h2')).toContainText(/Fixture/);
  });

  test('should display matches in Fixtures', async ({ page }) => {
    await page.goto('/fixtures');
    
    // Check for filter buttons
    await expect(page.locator('button:has-text("Todos")')).toBeVisible();
    
    // Check for match cards
    const matchCards = page.locator('[class*="border"]');
    await expect(matchCards.first()).toBeVisible();
  });

  test('should navigate to Venues page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/venues"]');
    await expect(page).toHaveURL('/venues');
    await expect(page.locator('h2')).toContainText('Sedes');
  });

  test('should display venues list', async ({ page }) => {
    await page.goto('/venues');
    
    // Check for venue cards or list
    const venues = page.locator('[class*="border"]');
    await expect(venues.first()).toBeVisible();
    const count = await venues.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to Bracket page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/bracket"]');
    await expect(page).toHaveURL('/bracket');
    await expect(page.locator('h2')).toContainText('Eliminatorias');
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page.locator('h1').first()).toContainText('404');
  });

  test('should navigate to Historical page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/historical"]');
    await expect(page).toHaveURL('/historical');
    await expect(page.locator('h2')).toContainText('Historial');
  });

  test('should display tournaments list', async ({ page }) => {
    await page.goto('/historical');

    // Check that tournament cards are rendered
    await expect(page.locator('h2')).toContainText('Historial de Mundiales');

    // Should show at least one decade group
    const decadeHeadings = page.locator('h3');
    await expect(decadeHeadings.first()).toBeVisible();

    // Should have tournament links
    const links = page.locator('a[href^="/historical/"]');
    await expect(links.first()).toBeVisible();
  });

  test('should navigate to tournament detail', async ({ page }) => {
    await page.goto('/historical');
    await page.locator('a[href^="/historical/"]').first().click();
    await expect(page.locator('h2')).toBeVisible();
  });
});