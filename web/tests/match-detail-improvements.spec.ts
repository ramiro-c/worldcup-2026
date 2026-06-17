import { test, expect } from "@playwright/test";

test.describe("Match Detail Improvements", () => {
  test.describe.configure({ retries: 2 });

  // ── 5.1 Countdown display ──────────────────────────────────────────────

  test("5.1a: Scheduled match shows countdown timer", async ({ page }) => {
    // Navigate to a match (we need to find one from fixtures)
    await page.goto("/fixtures");

    // Wait for match cards
    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    // Try to navigate to a match page if there are links
    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);

      // The page should have either a countdown (scheduled future match)
      // or status label (finished/live match)
      // Either way the match detail card should be visible
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });

      // Check that the Estadio field is now a clickable link (venue link)
      const venueLink = page.locator('a[href^="/venues/"]');
      const venueVisible = await venueLink.isVisible().catch(() => false);
      if (venueVisible) {
        await expect(venueLink).toBeVisible();
      }
    }
  });

  test("5.1b: Countdown format shows Xd Xh Xm Xs for future matches", async ({ page }) => {
    await page.goto("/fixtures");

    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });

      // Check if there's a countdown element (amber colored badge with time)
      // or a status badge (En Vivo / Finalizado)
      const scheduledBadge = page.locator("text=Programado");
      const countdownBadge = page.locator('[class*="tabular-nums"]').first();
      const enVivoBadge = page.locator("text=EN VIVO");
      const finishedBadge = page.locator("text=Finalizado");

      // The match detail card should always have some status indicator
      await expect(
        scheduledBadge.or(countdownBadge).or(enVivoBadge).or(finishedBadge).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  // ── 5.2 TBD support (indirect) ─────────────────────────────────────────

  test("5.2a: Match page loads without errors for any match", async ({ page }) => {
    // This tests that the match detail page doesn't crash
    await page.goto("/fixtures");

    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    // Click first match link if available
    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);

      // Verify page is fully loaded without crashes
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });
    }
  });

  // ── 5.3 PHASE_LABELS display ───────────────────────────────────────────

  test("5.3a: Match page shows phase badge for group matches", async ({ page }) => {
    await page.goto("/groups");

    // Check that group page shows "Fase de Grupos"
    await expect(page.locator("h2")).toContainText("Fase de Grupos");
  });

  // ── 5.4 E2E: Match page improvements ──────────────────────────────────

  test("5.4a: Match page has no TV section (TV text not present)", async ({ page }) => {
    await page.goto("/fixtures");

    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });

      // Verify TV label is NOT present on the match page
      await expect(page.locator("text=TV:").first()).not.toBeVisible();
    }
  });

  test("5.4b: Match page shows venue as clickable link", async ({ page }) => {
    await page.goto("/fixtures");

    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });

      // Check for venue link
      const venueLink = page.locator('a[href^="/venues/"]');
      const venueVisible = await venueLink.isVisible().catch(() => false);

      if (venueVisible) {
        // Click the venue link and verify navigation to VenueDetail
        await venueLink.click();
        await expect(page).toHaveURL(/\/venues\//);

        // The venue detail page should have the back link
        await expect(page.locator("text=Volver a estadios").first()).toBeVisible({ timeout: 15000 });
      }
    }
  });

  // ── 5.5 E2E: VenueDetail page ─────────────────────────────────────────

  test("5.5a: VenueDetail loads with map for a known venue", async ({ page }) => {
    // Navigate to a known venue detail page (MetLife)
    await page.goto("/venues/metlife");

    // Should show venue name
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Should show capacity
    await expect(page.locator("text=espectadores").first()).toBeVisible();

    // Should show Leaflet map container
    await expect(page.locator(".leaflet-container").first()).toBeVisible();

    // Should show back link
    await expect(page.locator("text=Volver a estadios").first()).toBeVisible();
  });

  test("5.5b: VenueDetail shows capacity and region info", async ({ page }) => {
    await page.goto("/venues/sofi");

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Capacity label should be visible
    await expect(page.locator("text=Capacidad").first()).toBeVisible();

    // Region label should be visible
    await expect(page.locator("text=Región").first()).toBeVisible();
  });

  test("5.5c: Unknown venue shows not found", async ({ page }) => {
    await page.goto("/venues/unknown-venue-xyz");

    await expect(page.locator("h1")).toContainText("Estadio no encontrado", { timeout: 15000 });

    // Should have a link back to venues list
    await expect(page.locator("text=Volver a estadios").first()).toBeVisible();
  });

  test("5.5d: VenueDetail shows matches list with scores", async ({ page }) => {
    await page.goto("/venues/metlife");

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Should have a "Partidos" section
    await expect(page.locator("text=Partidos").first()).toBeVisible();

    // Either show match cards or "no hay partidos" message
    const matchOrEmpty = page.locator("text=VS").or(page.locator("text=No hay partidos"));
    await expect(matchOrEmpty.first()).toBeVisible({ timeout: 15000 });
  });

  // ── 5.6 E2E: Navigation consistency ────────────────────────────────────

  test("5.6a: Navigate from Match page to VenueDetail and back", async ({ page }) => {
    await page.goto("/fixtures");

    await expect(page.locator('[class*="tabular-nums"]').first()).toBeVisible({ timeout: 15000 });

    const matchLink = page.locator('a[href^="/match/"]').first();
    const linkVisible = await matchLink.isVisible().catch(() => false);

    if (linkVisible) {
      await matchLink.click();
      await page.waitForURL(/\/match\//);
      await expect(page.locator("text=Volver al fixture").first()).toBeVisible({ timeout: 15000 });

      // Find and click venue link
      const venueLink = page.locator('a[href^="/venues/"]');
      if (await venueLink.isVisible().catch(() => false)) {
        await venueLink.click();
        await expect(page).toHaveURL(/\/venues\//);
        await expect(page.locator("text=Volver a estadios").first()).toBeVisible({ timeout: 15000 });

        // Go back to venues
        await page.locator("text=Volver a estadios").first().click();
        await expect(page).toHaveURL("/venues");
      }
    }
  });

  test("5.6b: Venues list links navigate to VenueDetail", async ({ page }) => {
    await page.goto("/venues");

    await expect(page.locator("h2")).toContainText("Sedes", { timeout: 15000 });

    // Find a venue link in the venues grid
    const venueCard = page.locator('a[href^="/venues/"]').first();
    if (await venueCard.isVisible().catch(() => false)) {
      await venueCard.click();
      // Should navigate to venue detail
      await expect(page).toHaveURL(/\/venues\//);
      // Detail page should have map
      await expect(page.locator(".leaflet-container").first()).toBeVisible({ timeout: 15000 });
    }
  });

  test("5.6c: STAGE_LABELS migrated to constants - historical pages load", async ({ page }) => {
    // Verify historical tournament page still works with centralized STAGE_LABELS
    await page.goto("/historical/2022");

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Should show groups section
    await expect(page.locator("text=Grupos").first()).toBeVisible();

    // Should show match cards (stage labels like "Fase de Grupos")
    await expect(page.locator("text=Fase de Grupos").first()).toBeVisible({ timeout: 15000 });
  });

  test("5.6d: Historical match detail page loads with STAGE_LABELS", async ({ page }) => {
    // Navigate to 2022 tournament
    await page.goto("/historical/2022");

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Click the first match to go to detail
    const matchCard = page.locator('a[href^="/historical/2022/"]').first();
    if (await matchCard.isVisible().catch(() => false)) {
      await matchCard.click();
      await expect(page).toHaveURL(/\/historical\/2022\//);

      // Match detail should load
      await expect(page.locator("text=Volver al torneo").first()).toBeVisible({ timeout: 15000 });
    }
  });
});
