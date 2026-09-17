import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { ceremonyCard, overlay } from "./helpers";

function formatViolations(
  violations: { id: string; help: string; nodes: { html: string }[] }[],
) {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.html}`)
          .join("\n")}`,
    )
    .join("\n");
}

test("axe: the year grid has no serious or critical violations", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .exclude("[role='dialog']")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, formatViolations(blocking)).toEqual([]);
});

test("axe: year-card text keeps contrast while the hover curtain is active", async ({
  page,
}) => {
  await page.goto("/");
  const card = ceremonyCard(page, "2026");
  await card.hover();
  const results = await new AxeBuilder({ page })
    .include("#year-card-2026")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const contrast = results.violations.filter(
    (violation) => violation.id === "color-contrast",
  );
  expect(contrast, formatViolations(contrast)).toEqual([]);
});

test("axe: muted nominees on the dark overlay pass WCAG AA contrast", async ({
  page,
}) => {
  await page.goto("/2024");
  await expect(overlay(page)).toBeVisible();
  await expect(
    overlay(page).locator('[data-entry-role="nominee"]').first(),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include("[role='dialog']")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const contrast = results.violations.filter(
    (violation) => violation.id === "color-contrast",
  );
  expect(contrast, formatViolations(contrast)).toEqual([]);

  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, formatViolations(blocking)).toEqual([]);
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
});
