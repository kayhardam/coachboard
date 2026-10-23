// Phase 16-1: a library item shows every step as a static drawing with its
// sentence, and "Open in the board" carries the same steps, sentences and title.
// Phase 16-3: drills too, with their goal, setup and lists, and an overview.
import { categorySlugs } from "../src/data/categories";
import { decode } from "../src/lib/board/format";
import { t, type UiKey } from "../src/i18n/ui";
import { expect, libraryItems, test } from "./helpers";

const all = libraryItems();
const drills = all.filter((item) => item.type === "drill");

for (const { lang, path } of all) {
  test(`${path}: the strip draws each step with the sentence the board opens with`, async ({ page }) => {
    await page.goto(path);
    const href = await page.getByRole("link", { name: t(lang, "tactic.open") }).getAttribute("href");
    const board = (await decode(href!.split("#t=")[1]!))!;
    expect(board.frames.length).toBeGreaterThan(1);

    await expect(page.locator("h1")).toHaveText(board.title!);
    const steps = page.locator(".strip > li");
    await expect(steps).toHaveCount(board.frames.length);
    for (const [i, frame] of board.frames.entries()) {
      const step = steps.nth(i);
      await expect(step.locator("figcaption > span:not(.n)")).toHaveText(frame.text!);
      await expect(step.getByRole("img", { name: t(lang, "tactic.diagram", { n: String(i + 1) }) })).toBeVisible();
      // The drawing of this step: its players where they stand, its arrows.
      const drawn = await step.locator("svg").evaluate((svg) => ({
        players: [...svg.querySelectorAll("[data-kind=player]")].map((g) => g.getAttribute("transform")),
        arrows: svg.querySelectorAll("[data-kind=arrow]").length,
      }));
      expect(drawn).toEqual({
        players: frame.players.map((p) => `translate(${p.at[0]} ${p.at[1]})`),
        arrows: frame.arrows.length,
      });
    }
  });
}

test("on a phone the steps stand one under the other; wider, side by side and level", async ({ page }) => {
  await page.goto("/nl/tactics/fast-break-second-wave/");
  const tops = () => page.locator(".strip svg").evaluateAll((svgs) => svgs.map((s) => Math.round(s.getBoundingClientRect().top)));
  const lefts = () => page.locator(".strip svg").evaluateAll((svgs) => svgs.map((s) => Math.round(s.getBoundingClientRect().left)));

  await page.setViewportSize({ width: 360, height: 740 });
  expect(new Set(await lefts()).size).toBe(1);

  // Two a row: a sentence of two lines beside one of one line leaves the drawings level.
  await page.setViewportSize({ width: 700, height: 900 });
  const two = await tops();
  for (let i = 0; i + 1 < two.length; i += 2) expect(two[i + 1]).toBe(two[i]);

  await page.setViewportSize({ width: 1280, height: 900 });
  const four = await tops();
  expect(four.slice(1, 4)).toEqual([four[0], four[0], four[0]]);
});

for (const [width, height] of [
  [844, 390],
  [740, 360],
]) {
  test(`in landscape (${width} × ${height}) each step fits on the screen with its sentence, below the header`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const { path } of all.filter((item) => item.lang === "nl")) {
      await page.goto(path);
      const header = await page.locator(".site-header").evaluate((h) => h.getBoundingClientRect().height);
      const steps = await page.locator(".strip figure").evaluateAll((figures) => figures.map((f) => f.getBoundingClientRect().height));
      for (const step of steps) expect(step + header).toBeLessThanOrEqual(height);
    }
  });
}

test("in portrait the drawing keeps the full width of the column", async ({ page }) => {
  for (const [width, height] of [
    [320, 568],
    [360, 740],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/nl/tactics/fast-break-second-wave/");
    const boxes = await page.locator(".strip > li").evaluateAll((steps) =>
      steps.map((li) => [li.getBoundingClientRect().width, li.querySelector(".court")!.getBoundingClientRect().width]),
    );
    for (const [column, court] of boxes) expect(court).toBe(column);
  }
});

const listHeading: Record<string, UiKey> = {
  rules: "drill.rules",
  coachingPoints: "tactic.coachingPoints",
  mistakes: "drill.mistakes",
  easier: "drill.easier",
  harder: "drill.harder",
};

for (const { lang, path, lists } of drills) {
  test(`${path}: goal, setup, steps and only the lists with points, in order, under Drills`, async ({ page }) => {
    await page.goto(path);
    const crumbs = page.getByRole("navigation", { name: t(lang, "tactic.breadcrumb") }).getByRole("link");
    await expect(crumbs.first()).toHaveText(t(lang, "drills.heading"));
    await expect(crumbs.first()).toHaveAttribute("href", `/${lang}/drills/`);

    const headings = ["drill.goal", "drill.steps", ...lists.map((key) => listHeading[key]!)].map((key) => t(lang, key as UiKey));
    const related = page.locator(".related h2");
    if (await related.count()) headings.push(t(lang, "tactic.related"));
    await expect(page.locator("article h2")).toHaveText(headings);
    await expect(page.locator(".setup dt")).toHaveText(["drill.players", "drill.equipment", "drill.space"].map((key) => t(lang, key as UiKey)));
  });
}

for (const lang of ["en", "nl"]) {
  test(`/${lang}/drills/ has a card for every drill in the content, and a page for each category with one`, async ({ page }) => {
    const mine = drills.filter((d) => d.lang === lang);
    await page.goto(`/${lang}/drills/`);
    await expect(page.locator("h1")).toHaveText(t(lang, "drills.heading"));
    const cards = page.locator("section").filter({ has: page.getByRole("heading", { name: t(lang, "drills.all") }) }).locator(".card");
    await expect(cards).toHaveCount(mine.length);
    for (const { path } of mine) await expect(page.locator(`a.card[href="${path}"]`)).toHaveCount(1);

    for (const category of categorySlugs) {
      const used = await page.locator(`a.card[href="/${lang}/drills/${category}/"]`).count();
      const response = await page.request.get(`/${lang}/drills/${category}/`);
      expect(response.status(), `${category}: a page only with a drill in it`).toBe(used ? 200 : 404);
    }
  });
}
