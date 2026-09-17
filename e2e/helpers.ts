import type { Locator, Page } from "@playwright/test";

/** Year tile in the grid. */
export function ceremonyCard(page: Page, year: string) {
  return page.locator(`#year-card-${year}`);
}

export function overlay(page: Page) {
  return page.getByRole("dialog");
}

/** True when the element sits fully inside the overlay panel's visible box. */
export async function isFullyInOverlayPanel(target: Locator) {
  return target.evaluate((el) => {
    const panel = el.closest("[data-overlay-panel]");
    if (!(panel instanceof HTMLElement)) return false;
    const box = el.getBoundingClientRect();
    const view = panel.getBoundingClientRect();
    return (
      box.top >= view.top - 1 &&
      box.bottom <= view.bottom + 1 &&
      box.left >= view.left - 1 &&
      box.right <= view.right + 1
    );
  });
}
