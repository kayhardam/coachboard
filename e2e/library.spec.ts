// Phase 16-1: a library item shows every step as a static drawing with its
// sentence, and "Open in the board" carries the same steps, sentences and title.
import { decode } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import { expect, test } from "./helpers";

const items = ["6-0-defense-basics", "fast-break-second-wave"];

for (const lang of ["en", "nl"]) {
  for (const slug of items) {
    test(`${lang}/${slug}: the strip draws each step with the sentence the board opens with`, async ({ page }) => {
      await page.goto(`/${lang}/tactics/${slug}/`);
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
