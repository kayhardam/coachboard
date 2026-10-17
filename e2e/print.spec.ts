// Phase 16-2: a library item on paper. Two steps a row on A4, every text at
// least 12 pt, four steps on page 1 and the rest with the coaching points on
// page 2, also with the wider font of Linux or Windows, and nothing that only
// works on a screen.
import { t } from "../src/i18n/ui";
import { expect, test } from "./helpers";

// A4 less the margins of 12 mm, at 96 px an inch: 186 by 273 mm.
const PAGE_WIDTH = 703;
const MM = 96 / 25.4;
const PAGE_HEIGHT = 273 * MM;
const items = ["6-0-defense-basics", "fast-break-second-wave"];
// Verdana on a Mac, DejaVu Sans on Linux: wider than the system font of a Mac,
// an iPhone or Windows, so a run on a Mac checks the page as CI prints it.
const WIDE = `:root { --font-sans: Verdana, "DejaVu Sans", sans-serif; }`;

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
      for (const { width } of drawings) expect(width).toBeGreaterThanOrEqual(80 * MM);

      // Every text outside the drawings: at least 16 px, which is 12 pt.
      const small = await page.evaluate(() =>
        [...document.body.querySelectorAll("*")]
          .filter((el) => !el.closest("svg") && el.checkVisibility())
          .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()))
          .map((el) => ({ text: el.textContent!.trim().slice(0, 40), size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter(({ size }) => size < 16),
      );
      expect(small).toEqual([]);

      const breaks = await page.locator(".strip > li").evaluateAll((steps) => steps.map((li) => getComputedStyle(li).breakInside));
      expect(new Set(breaks)).toEqual(new Set(["avoid"]));
      await expect(page.locator(".points")).toHaveCSS("break-inside", "avoid");
    });
  }
}

// Page 1 holds the title and the first four steps, page 2 the rest and the
// coaching points, with the page's own font and with a wide one. Nothing
// before step 4 can break, so step 4 is on page 1 when it ends within the
// page's height on the screen too.
test("the PDF is portrait A4: two pages, the first four steps on page 1", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium makes a PDF");
  await page.setViewportSize({ width: PAGE_WIDTH, height: 1000 });
  for (const lang of ["en", "nl"]) {
    for (const slug of items) {
      for (const font of ["own", "wide"]) {
        await page.goto(`/${lang}/tactics/${slug}/`);
        if (font === "wide") await page.addStyleTag({ content: WIDE });
        await page.emulateMedia({ media: "print" });
        const fourth = await page.locator(".strip figure").nth(3).evaluate((f) => f.getBoundingClientRect().bottom + scrollY);
        expect(fourth, `${lang}/${slug}, ${font} font: step 4 on page 1`).toBeLessThanOrEqual(PAGE_HEIGHT);

        const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
        const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Math.round(+m[1]!), Math.round(+m[2]!)]);
        expect(boxes, `${lang}/${slug}, ${font} font: two pages`).toHaveLength(2);
        for (const box of boxes) expect(box).toEqual([595, 842]);
      }
    }
  }
});
