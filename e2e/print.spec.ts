// Phase 16-2: a library item on paper. Two steps a row on A4, every text at
// least 12 pt, a step never split over two pages, and nothing that only works
// on a screen.
import { t } from "../src/i18n/ui";
import { expect, test } from "./helpers";

// A4 less the margins of 12 mm, at 96 px an inch: 186 mm.
const PAGE_WIDTH = 703;
const MM = 96 / 25.4;
const items = ["6-0-defense-basics", "fast-break-second-wave"];

for (const lang of ["en", "nl"]) {
  for (const slug of items) {
    test(`${lang}/${slug} prints two steps a row, with text of at least 12 pt`, async ({ page }) => {
      await page.setViewportSize({ width: PAGE_WIDTH, height: 1000 });
      await page.goto(`/${lang}/tactics/${slug}/`);
      await page.emulateMedia({ media: "print" });

      for (const hidden of [".site-header", ".site-footer", ".crumbs", ".skip-link", ".related"]) {
        await expect(page.locator(hidden)).toBeHidden();
      }
      await expect(page.getByRole("link", { name: t(lang, "tactic.open") })).toBeHidden();
      await expect(page.locator("h1")).toBeVisible();

      const drawings = await page.locator(".strip svg").evaluateAll((svgs) =>
        svgs.map((svg) => {
          const box = svg.getBoundingClientRect();
          return { top: Math.round(box.top), width: box.width };
        }),
      );
      expect(drawings[1]!.top).toBe(drawings[0]!.top);
      for (const { width } of drawings) expect(width).toBeGreaterThanOrEqual(85 * MM);

      // Every text outside the drawings: at least 16 px, which is 12 pt.
      const small = await page.evaluate(() =>
        [...document.body.querySelectorAll("*")]
          .filter((el) => !el.closest("svg") && el.checkVisibility())
          .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()))
          .map((el) => ({ text: el.textContent!.trim().slice(0, 40), size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter(({ size }) => size < 16),
      );
      expect(small).toEqual([]);

      const breaks = await page.locator(".strip figure").evaluateAll((figures) => figures.map((f) => getComputedStyle(f).breakInside));
      expect(new Set(breaks)).toEqual(new Set(["avoid"]));
    });
  }
}

test("the PDF is portrait A4, each tactic on at most two pages", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium makes a PDF");
  for (const [slug, most] of [
    ["6-0-defense-basics", 2],
    ["fast-break-second-wave", 2],
  ] as const) {
    await page.goto(`/nl/tactics/${slug}/`);
    const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
    const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Math.round(+m[1]!), Math.round(+m[2]!)]);
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.length).toBeLessThanOrEqual(most);
    for (const box of boxes) expect(box).toEqual([595, 842]);
  }
});
