import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../../scripts/lib/cache";

describe("annual runbook", () => {
  const readme = readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  const workflow = readFileSync(
    path.join(REPO_ROOT, ".github/workflows/ci.yml"),
    "utf8",
  );

  it("documents CEREMONY_DATES and npm run images", () => {
    expect(readme).toMatch(/CEREMONY_DATES/);
    expect(readme).toMatch(/npm run images/);
    expect(readme).toMatch(/npm run sync:oscars/);
    expect(readme).toMatch(/people\.json/);
    expect(readme).toMatch(/tmdb_id/);
  });

  it("verifies the public/images budget in CI", () => {
    expect(workflow).toMatch(/data:check/);
    expect(workflow).toMatch(/npm test/);
    expect(workflow).toMatch(/test:e2e/);
  });
});
