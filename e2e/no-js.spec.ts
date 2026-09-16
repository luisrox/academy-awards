import { test, expect } from "@playwright/test";
import { ceremonyCard } from "./helpers";

test.use({ javaScriptEnabled: false });

test("E12: grid and detail pages stay navigable without JavaScript", async ({
  page,
}) => {
  await page.goto("/");
  const card = ceremonyCard(page, "2026");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", "/2026");
  await card.click();
  await expect(page).toHaveURL(/\/2026$/);
  await expect(page.getByRole("heading", { level: 1, name: "2026" })).toBeVisible();
  await expect(page.getByText("One Battle after Another").first()).toBeVisible();
  await expect(card).toHaveAttribute("href", "/2026");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await ceremonyCard(page, "2025").click();
  await expect(page).toHaveURL(/\/2025$/);
  await expect(page.getByRole("heading", { level: 1, name: "2025" })).toBeVisible();
  await expect(page.getByText("Anora").first()).toBeVisible();
});
