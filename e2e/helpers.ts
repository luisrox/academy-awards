import type { Page } from "@playwright/test";

/** Year tile in the grid. */
export function ceremonyCard(page: Page, year: string) {
  return page.locator(`#year-card-${year}`);
}

export function overlay(page: Page) {
  return page.getByRole("dialog");
}
