// Phase 16-2: a library item on paper. Two steps a row on A4, every text at
// least 12 pt, four steps on page 1 and the rest with the coaching points on
// page 2, also with the wider font of Linux or Windows, and nothing that only
// works on a screen. Phase 16-3: a drill has its title, meta, summary, goal,
// setup and at least steps 1 and 2 on page 1, and at most its own number of
// pages, measured with the wide font.
import { t } from "../src/i18n/ui";
import { expect, libraryItems, test } from "./helpers";

// A4 less the margins of 12 mm, at 96 px an inch: 186 by 273 mm.
const PAGE_WIDTH = 703;
const MM = 96 / 25.4;
const PAGE_HEIGHT = 273 * MM;
/** The most pages each drill may take: what it takes with the wide font. */
const DRILL_PAGES: Record<string, number> = {
  "crossing-in-pairs": 2,
  "step-out-and-shift": 3,
  "goalkeeper-shots-from-three-spots": 3,
};
const tactics = libraryItems().filter((item) => item.type === "tactic");
const drills = libraryItems().filter((item) => item.type === "drill");
// Verdana on a Mac, DejaVu Sans on Linux: wider than the system font of a Mac,
// an iPhone or Windows, so a run on a Mac checks the page as CI prints it.
const WIDE = `:root { --font-sans: Verdana, "DejaVu Sans", sans-serif; }`;

for (const { lang, path } of libraryItems()) {
  test(`${path} prints two steps a row, with text of at least 12 pt`, async ({ page }) => {
    await page.setViewportSize({ width: PAGE_WIDTH, height: 1000 });
    await page.goto(path);
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
    const lists = await page.locator(".points").evaluateAll((lists) => lists.map((ul) => getComputedStyle(ul).breakInside));
    expect(lists.length).toBeGreaterThan(0);
    expect(new Set(lists)).toEqual(new Set(["avoid"]));
  });
}

// Page 1 holds the title and the first four steps, page 2 the rest and the
// coaching points, with the page's own font and with a wide one. Nothing
// before step 4 can break, so step 4 is on page 1 when it ends within the
// page's height on the screen too.
test("the PDF is portrait A4: two pages, the first four steps on page 1", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium makes a PDF");
  await page.setViewportSize({ width: PAGE_WIDTH, height: 1000 });
  for (const { path } of tactics) {
    for (const font of ["own", "wide"]) {
      await page.goto(path);
      if (font === "wide") await page.addStyleTag({ content: WIDE });
      await page.emulateMedia({ media: "print" });
      const fourth = await page.locator(".strip figure").nth(3).evaluate((f) => f.getBoundingClientRect().bottom + scrollY);
      expect(fourth, `${path}, ${font} font: step 4 on page 1`).toBeLessThanOrEqual(PAGE_HEIGHT);

      const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
      const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Math.round(+m[1]!), Math.round(+m[2]!)]);
      expect(boxes, `${path}, ${font} font: two pages`).toHaveLength(2);
      for (const box of boxes) expect(box).toEqual([595, 842]);
    }
  }
});

// A drill: page 1 holds the title, meta, summary, goal, setup and at least
// steps 1 and 2; the whole drill takes at most its number of pages, with the
// page's own font and with a wide one.
test("a drill's PDF is portrait A4: steps 1 and 2 on page 1, at most its pages", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium makes a PDF");
  await page.setViewportSize({ width: PAGE_WIDTH, height: 1000 });
  for (const { path, slug } of drills) {
    for (const font of ["own", "wide"]) {
      await page.goto(path);
      if (font === "wide") await page.addStyleTag({ content: WIDE });
      await page.emulateMedia({ media: "print" });
      const second = await page.locator(".strip figure").nth(1).evaluate((f) => f.getBoundingClientRect().bottom + scrollY);
      expect(second, `${path}, ${font} font: step 2 on page 1`).toBeLessThanOrEqual(PAGE_HEIGHT);

      const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
      const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Math.round(+m[1]!), Math.round(+m[2]!)]);
      expect(boxes.length, `${path}, ${font} font: pages`).toBeLessThanOrEqual(DRILL_PAGES[slug]!);
      for (const box of boxes) expect(box).toEqual([595, 842]);
    }
  }
});
