import { test, expect } from "@playwright/test";
import { ceremonyCard, overlay } from "./helpers";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
});

test("E10: tap opens a viewport-filling overlay with collapsed groups", async ({
  page,
}) => {
  await page.goto("/");
  await ceremonyCard(page, "2026").click();
  await expect(page).toHaveURL(/\/2026$/);
  const dialog = overlay(page);
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();
  expect(viewport).toBeTruthy();
  expect(box).toBeTruthy();
  expect(box?.x).toBe(0);
  expect(box?.y).toBe(0);
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  const groups = dialog.locator("details");
  await expect(groups).toBeVisible();
  await expect(groups).not.toHaveAttribute("open");
});
