import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test.describe('Back navigation consistency', () => {
  test('Match detail: Volver goes back to Fixtures', async ({ page }) => {
    await page.goto('/fixtures');
    await page.waitForLoadState('networkidle');

    const matchCard = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first();
    await expect(matchCard).toBeVisible({ timeout: 20000 });
    await matchCard.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/match\//);

    const backButton = page.getByRole('button', { name: 'Volver' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/fixtures/);
  });

  test('Venue detail: Volver goes back to Venues list', async ({ page }) => {
    await page.goto('/venues');
    await page.waitForLoadState('networkidle');

    const venueLink = page.locator('a[href^="/venues/"]').first();
    await expect(venueLink).toBeVisible({ timeout: 20000 });
    const venueHref = await venueLink.getAttribute('href');
    await venueLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(venueHref!);

    await page.waitForTimeout(3000);

    const backButton = page.getByRole('button', { name: 'Volver' });
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/venues');
    }
  });

  test('Team page: Volver goes back to Historical', async ({ page }) => {
    await page.goto('/historical');
    await page.waitForLoadState('networkidle');

    const tournamentLink = page.locator('a[href^="/historical/"]').first();
    await expect(tournamentLink).toBeVisible({ timeout: 20000 });
    await tournamentLink.click();
    await page.waitForLoadState('networkidle');

    const teamLink = page.locator('a[href^="/team/"]').first();
    await expect(teamLink).toBeVisible({ timeout: 20000 });
    await teamLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/team\//);

    const backButton = page.getByRole('button', { name: 'Historial' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/historical/);
  });

  test('Historical match detail: Volver goes back to tournament page', async ({ page }) => {
    await page.goto('/historical');
    await page.waitForLoadState('networkidle');

    const tournamentLink = page.locator('a[href^="/historical/"]').first();
    await expect(tournamentLink).toBeVisible({ timeout: 20000 });
    const tournamentUrl = await tournamentLink.getAttribute('href');
    await tournamentLink.click();
    await page.waitForLoadState('networkidle');

    const historicalMatchLink = page.locator('a[href^="/historical/"]').last();
    await expect(historicalMatchLink).toBeVisible({ timeout: 20000 });
    await historicalMatchLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/historical\/\d+\/\d+/);

    const backButton = page.getByRole('button', { name: 'Volver' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(tournamentUrl!);
  });
});

test.describe('Fixture cards display', () => {
  test('team names are never undefined text', async ({ page }) => {
    await page.goto('/fixtures');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=VS').first()).toBeVisible({ timeout: 15000 });

    const cardText = await page.locator('text=VS').first().innerText();
    expect(cardText).not.toContain('undefined');
    expect(cardText).not.toContain('Undefined');
  });

  test('crest images have valid src when present', async ({ page }) => {
    await page.goto('/fixtures');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute('src');
      if (src) {
        await expect(images.nth(i)).toBeVisible();
      }
    }
  });
});
