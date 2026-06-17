import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://worldcup-2026.rami992009.workers.dev' });

test.describe('Navigation active state', () => {
  test('Home link is NOT active when on /groups', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Desktop nav Inicio link — uses end={true}, so aria-current only on exact /
    const homeLink = page.getByRole('navigation').getByRole('link', { name: 'Inicio' });

    await expect(homeLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('Home link IS active when on /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const homeLink = page.getByRole('navigation').getByRole('link', { name: 'Inicio' });

    await expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  test('Groups link is active when on /groups', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    const groupsLink = page.getByRole('navigation').getByRole('link', { name: 'Grupos' });

    await expect(groupsLink).toHaveAttribute('aria-current', 'page');
  });

  test('Home link uses emerald active style on /', async ({ page }) => {
    // Verify the CSS class presence as a secondary check
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const homeLink = page.getByRole('navigation').getByRole('link', { name: 'Inicio' });

    // NavLink applies bg-emerald-500/20 and text-emerald-400 when active
    await expect(homeLink).toHaveClass(/bg-emerald-500\/20/);
    await expect(homeLink).toHaveClass(/text-emerald-400/);
  });

  test('Groups link has default style when on /', async ({ page }) => {
    // When on Home, the Groups link should NOT have active styles
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const groupsLink = page.getByRole('navigation').getByRole('link', { name: 'Grupos' });

    await expect(groupsLink).not.toHaveAttribute('aria-current', 'page');
    await expect(groupsLink).toHaveClass(/text-zinc-400/);
  });
});
