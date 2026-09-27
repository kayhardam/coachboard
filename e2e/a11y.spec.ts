import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every page in the build; the webServer builds before the tests run.
const dist = new URL("../dist/", import.meta.url).pathname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const pages = walk(dist)
  .filter((f) => f.endsWith("index.html"))
  .map((f) => "/" + relative(dist, f).replace(/index\.html$/, ""))
  .concat("/en/does-not-exist/")
  .sort();

for (const path of pages) {
  test(`axe finds nothing serious on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path.endsWith("/board/")) await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  });
}
