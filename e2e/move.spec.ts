import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type { Board } from "../src/lib/board/format";
import { dragPlayer, expectBoard, pieces, saved, STORAGE_KEY } from "./helpers";

// The board on the old production host sends you to handballcoachboard.com
// (the script in board.astro). These hosts are served from wrangler dev, so
// each keeps its own localStorage, as in production.

const OLD = "https://coachboard.hardamkay.workers.dev";
const NEW = "https://handballcoachboard.com";
const PREVIEW = "https://fase-7b-doorsturen-coachboard.hardamkay.workers.dev";

const fixture = JSON.parse(
  readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
) as { link: string; board: Board };

test.beforeEach(async ({ context, baseURL }) => {
  for (const host of [OLD, NEW, PREVIEW]) {
    await context.route(`${host}/**`, async (route) => {
      const { pathname, search } = new URL(route.request().url());
      const response = await route.fetch({ url: new URL(pathname + search, baseURL).href });
      await route.fulfill({ response });
    });
  }
});

/** Opens the board at `url` and waits for the editor, wherever it ends up. */
async function openAt(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
}

/** Saves a board in the old host's storage, from a content page (no redirect). */
async function saveOnOldHost(page: Page, board: Board) {
  await page.goto(`${OLD}/en/`);
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(board)]);
}

test("a workers.dev link opens on handballcoachboard.com with the same board", async ({ page }) => {
  await openAt(page, `${OLD}/en/board/#t=${fixture.link}`);
  await expect(page).toHaveURL(`${NEW}/en/board/#t=${fixture.link}`);
  await expectBoard(page, fixture.board);
});

test("your own board on workers.dev comes along and is saved on the new domain", async ({ page }) => {
  await saveOnOldHost(page, fixture.board);

  await openAt(page, `${OLD}/en/board/`);
  await expect(page).toHaveURL(new RegExp(`^${NEW}/en/board/`));
  await expectBoard(page, fixture.board);
  await expect.poll(async () => JSON.parse((await saved(page)) ?? "null")).toEqual(fixture.board);
  // #own= gives way to the usual link.
  await expect(page).toHaveURL(/#t=1\./);
});

test("a board already saved on the new domain wins over the one from workers.dev", async ({ page }) => {
  await openAt(page, `${NEW}/en/board/`);
  await expect.poll(() => saved(page)).not.toBeNull();
  const before = await saved(page);
  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => saved(page)).not.toBe(before);
  const own = (await saved(page))!;
  const drawn = await pieces(page);

  await saveOnOldHost(page, fixture.board);
  await openAt(page, `${OLD}/en/board/`);
  await expect(page).toHaveURL(new RegExp(`^${NEW}/en/board/`));
  await expect(page).toHaveURL(/#t=1\./);
  expect(await pieces(page)).toEqual(drawn);
  expect(await saved(page)).toBe(own);
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a preview URL doesn't redirect", async ({ page }) => {
  await openAt(page, `${PREVIEW}/en/board/#t=${fixture.link}`);
  await expect(page).toHaveURL(new RegExp(`^${PREVIEW}/en/board/#t=1\\.`));
  await expectBoard(page, fixture.board);
});

test("content pages on workers.dev don't redirect", async ({ page }) => {
  await page.goto(`${OLD}/en/`);
  await expect(page.locator("h1")).toBeVisible();
  expect(new URL(page.url()).origin).toBe(OLD);
});
