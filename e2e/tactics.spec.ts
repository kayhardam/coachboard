import { expect, test } from "@playwright/test";
import { dragPlayer, pieces, saved, saveOwnBoard } from "./helpers";

const tactic = "/en/tactics/defense/6-0-defense-basics/";

test('"Open in the board" shows the tactic and keeps the saved board until the first edit', async ({ page }) => {
  // Save a board of your own first.
  const own = await saveOwnBoard(page);

  await page.goto(tactic);
  const diagram = await page.locator("main svg").first().evaluate((svg) =>
    [...svg.querySelectorAll("[data-kind]")].map((g) => {
      const kind = g.getAttribute("data-kind");
      const where = kind === "arrow" ? g.querySelectorAll("path")[1]?.getAttribute("d") : g.getAttribute("transform");
      return `${kind}:${g.getAttribute("data-index")}:${where}`;
    }),
  );

  await page.getByRole("link", { name: "Open in the board" }).click();
  await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
  await expect.poll(() => pieces(page)).toEqual(diagram);

  await page.waitForTimeout(600);
  expect(await saved(page)).toBe(own);

  await dragPlayer(page, 0, 20, 20);
  await expect.poll(() => saved(page)).not.toBe(own);
});
