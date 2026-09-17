import { test, expect } from "@playwright/test";
import { ceremonyCard, isFullyInOverlayPanel, overlay } from "./helpers";

/** Visible duration of each headline winner while hovering, spec.md 6.1. */
const HEADLINE_ROTATION_MS = 1600;

test.describe("spec.md 11.5 journeys", () => {
  test("E1: hover on a year card rotates headline winners", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const card = ceremonyCard(page, "2026");
    await card.hover();
    await expect(card.getByText("Best Picture")).toBeVisible();
    await expect(card.getByText("One Battle after Another")).toBeVisible();
    await expect(card.getByText("Paul Thomas Anderson")).toBeVisible({
      timeout: HEADLINE_ROTATION_MS + 1200,
    });
  });

  test("E2: click opens the overlay at /{slug}", async ({ page }) => {
    await page.goto("/");
    await ceremonyCard(page, "2026").click();
    await expect(page).toHaveURL(/\/2026$/);
    await expect(overlay(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "2026" })).toBeVisible();
  });

  test("E3: arrows navigate editions and the URL follows", async ({ page }) => {
    await page.goto("/2026");
    await expect(overlay(page)).toBeVisible();
    await page.getByRole("button", { name: "Previous ceremony" }).click();
    await expect(page).toHaveURL(/\/2025$/);
    await expect(page.getByRole("heading", { level: 1, name: "2025" })).toBeVisible();
    await page.getByRole("button", { name: "Next ceremony" }).click();
    await expect(page).toHaveURL(/\/2026$/);
    await expect(page.getByRole("heading", { level: 1, name: "2026" })).toBeVisible();
  });

  test("E4: Escape closes the overlay and returns to /", async ({ page }) => {
    await page.goto("/2026");
    await expect(overlay(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    await expect(overlay(page)).toHaveCount(0);
  });

  test("E5: the browser back button walks the whole sequence", async ({ page }) => {
    await page.goto("/");
    await ceremonyCard(page, "2026").click();
    await expect(page).toHaveURL(/\/2026$/);
    await page.getByRole("button", { name: "Previous ceremony" }).click();
    await expect(page).toHaveURL(/\/2025$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/2026$/);
    await expect(overlay(page)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(overlay(page)).toHaveCount(0);
  });

  test("E6: a direct visit to /1994 renders the full page", async ({ page }) => {
    await page.goto("/1994");
    await expect(overlay(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "1994" })).toBeVisible();
    await expect(
      overlay(page).getByText("66th Ceremony", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Schindler's List").first()).toBeVisible();
    await expect(ceremonyCard(page, "1994")).toBeVisible();
  });

  test("E7: an invalid slug shows the not-found page", async ({ page }) => {
    const response = await page.goto("/not-a-ceremony");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /not in the record/i }),
    ).toBeVisible();
  });

  test("E8: jumping by decade scrolls to that section", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Decades" })
      .getByRole("link", { name: "1920s" })
      .click();
    await expect(page).toHaveURL(/#decade-1920s/);
    await expect(
      page.locator("#decade-1920s").getByRole("heading", { name: "1920s" }),
    ).toBeInViewport();
    await expect(ceremonyCard(page, "1929")).toBeVisible();
  });

  test("E9: searching Parasite goes to the right edition", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("/");
    const search = page.getByRole("combobox", { name: /search/i });
    await expect(search).toBeFocused();
    await search.fill("Parasite");
    await expect(page.getByRole("option", { name: /Parasite/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/2020$/);
    await expect(page.getByRole("heading", { level: 1, name: "2020" })).toBeVisible();
    await expect(overlay(page)).toBeVisible();
  });

  test("E11: grid and overlay are usable with the keyboard only", async ({
    page,
  }) => {
    await page.goto("/");
    const card = ceremonyCard(page, "2026");
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/2026$/);
    await expect(overlay(page)).toBeVisible();
    await expect(overlay(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(overlay(page).locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    await expect(card).toBeFocused();
  });

  test("E13: 1440×900 shows header, headline block, and first acting category without scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/2026");
    const dialog = overlay(page);
    await expect(dialog).toBeVisible();
    const header = dialog.locator("header");
    const headline = dialog.locator("#group-headline");
    const firstActingHeading = dialog.locator("#category-best-actor");
    const firstActingWinner = dialog
      .locator('[aria-labelledby="category-best-actor"]')
      .locator('[data-entry-role="winner"]');
    await expect(header).toBeVisible();
    await expect(headline).toBeVisible();
    await expect(firstActingHeading).toBeVisible();
    expect(await isFullyInOverlayPanel(header)).toBe(true);
    expect(await isFullyInOverlayPanel(headline)).toBe(true);
    expect(await isFullyInOverlayPanel(firstActingHeading)).toBe(true);
    expect(await isFullyInOverlayPanel(firstActingWinner)).toBe(true);

    const picture = dialog.locator('[aria-labelledby="category-best-picture"]');
    const director = dialog.locator('[aria-labelledby="category-best-director"]');
    const pictureBox = await picture.boundingBox();
    const directorBox = await director.boundingBox();
    expect(pictureBox).toBeTruthy();
    expect(directorBox).toBeTruthy();
    expect(pictureBox!.x + pictureBox!.width / 2).toBeLessThan(
      directorBox!.x + directorBox!.width / 2,
    );
    expect(Math.abs(pictureBox!.y - directorBox!.y)).toBeLessThan(48);
  });

  test("E14: previous arrow is left of the panel, next is right, and neither moves with scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/2026");
    const dialog = overlay(page);
    await expect(dialog).toBeVisible();
    const panel = dialog.locator("[data-overlay-panel]");
    const previous = page.getByRole("button", { name: "Previous ceremony" });
    const next = page.getByRole("button", { name: "Next ceremony" });
    const panelBox = await panel.boundingBox();
    const previousBox = await previous.boundingBox();
    const nextBox = await next.boundingBox();
    expect(panelBox).toBeTruthy();
    expect(previousBox).toBeTruthy();
    expect(nextBox).toBeTruthy();
    expect(previousBox!.x + previousBox!.width / 2).toBeLessThan(
      panelBox!.x + panelBox!.width / 2,
    );
    expect(nextBox!.x + nextBox!.width / 2).toBeGreaterThan(
      panelBox!.x + panelBox!.width / 2,
    );
    expect(previousBox!.x + previousBox!.width).toBeLessThanOrEqual(
      panelBox!.x + previousBox!.width / 2,
    );
    expect(nextBox!.x).toBeGreaterThanOrEqual(
      panelBox!.x + panelBox!.width - nextBox!.width / 2,
    );

    const previousY = previousBox!.y;
    const nextY = nextBox!.y;
    await panel.evaluate((node) => {
      node.scrollTop = 480;
    });
    const previousAfter = await previous.boundingBox();
    const nextAfter = await next.boundingBox();
    expect(previousAfter?.y).toBe(previousY);
    expect(nextAfter?.y).toBe(nextY);
  });
});
