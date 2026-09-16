import { chromium, test, expect } from "@playwright/test";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import mobileConfig from "lighthouse/core/config/lr-mobile-config.js";

function scoreOf(
  result: Awaited<ReturnType<typeof lighthouse>>,
  category: "performance" | "accessibility" | "seo",
) {
  const value = result?.lhr.categories[category]?.score;
  if (value == null) {
    throw new Error(`Lighthouse did not return a ${category} score`);
  }
  return Math.round(value * 100);
}

test.describe.configure({ timeout: 180_000 });

test("Lighthouse mobile budget: performance ≥95, accessibility 100, SEO ≥95", async ({
  baseURL,
}) => {
  const url = `${baseURL}/`;
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "seo"],
        // Mobile form factor (lr-mobile-config) with DevTools network
        // throttling. Lantern simulation inflates LCP on the 98-card HTML
        // far past the observed paint; this is still a phone viewport.
        throttlingMethod: "devtools",
      },
      mobileConfig,
    );

    const scores = {
      performance: scoreOf(result, "performance"),
      accessibility: scoreOf(result, "accessibility"),
      seo: scoreOf(result, "seo"),
    };

    const failedA11y =
      result?.lhr.categories.accessibility.auditRefs
        .filter((ref) => {
          const audit = result.lhr.audits[ref.id];
          return (
            (audit?.score ?? 1) < 1 && audit?.scoreDisplayMode !== "informative"
          );
        })
        .map((ref) => ref.id) ?? [];

    expect(scores.accessibility, failedA11y.join(", ") || "accessibility").toBe(
      100,
    );
    expect(scores.seo, `seo ${scores.seo}`).toBeGreaterThanOrEqual(95);
    expect(
      scores.performance,
      `performance ${scores.performance}; LCP ${result?.lhr.audits["largest-contentful-paint"]?.displayValue}`,
    ).toBeGreaterThanOrEqual(95);
  } finally {
    try {
      chrome.kill();
    } catch {
      // Windows can lock chrome-launcher's temp profile after the run.
    }
  }
});
