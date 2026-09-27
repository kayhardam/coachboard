import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultBoard } from "../src/lib/board/defaults";
import type { Board } from "../src/lib/board/format";
import { dragPlayer, expectBoard, openBoard, pieces, saved, saveOwnBoard } from "./helpers";

test("the board loads with the default lineup", async ({ page }) => {
  await openBoard(page);
  await expectBoard(page, defaultBoard);
});

test("dragging a player puts the new board in the address bar within a second", async ({ page }) => {
  await openBoard(page);
  await expect(page).toHaveURL(/#t=1\./);
  const before = page.url();

  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => page.url(), { timeout: 1000 }).not.toBe(before);
  expect(page.url()).toMatch(/#t=1\./);
});

test("a shared link opens the same board in a clean browser", async ({ page, browser }) => {
  await openBoard(page);
  await expect(page).toHaveURL(/#t=1\./);
  const before = page.url();
  await dragPlayer(page, 5, 30, 30);
  await dragPlayer(page, 0, 20, 20);
  const drawn = await pieces(page);
  // Wait for the debounced write of the last drag.
  await expect.poll(() => page.url()).not.toBe(before);
  const link = page.url();

  const clean = await browser.newContext({ ...test.info().project.use });
  const other = await clean.newPage();
  await openBoard(other, new URL(link).hash);
  await expect.poll(() => pieces(other)).toEqual(drawn);
  await clean.close();
});

const fixtures = readdirSync(new URL("../src/lib/board/fixtures/", import.meta.url)).filter((f) => f.endsWith(".json"));

for (const file of fixtures) {
  test(`fixture ${file} opens as a link`, async ({ page }) => {
    const { link, board } = JSON.parse(
      readFileSync(new URL(`../src/lib/board/fixtures/${file}`, import.meta.url), "utf8"),
    ) as { link: string; board: Board };
    await openBoard(page, `#t=${link}`);
    await expectBoard(page, board);
    await expect(page.getByRole("status")).toHaveCount(0);
  });
}

test("opening a link doesn't touch the saved board", async ({ page, context }) => {
  const own = await saveOwnBoard(page);

  const fixture = JSON.parse(
    readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
  ) as { link: string; board: Board };
  const other = await context.newPage();
  await openBoard(other, `#t=${fixture.link}`);
  await expectBoard(other, fixture.board);
  await other.waitForTimeout(600);
  expect(await saved(other)).toBe(own);
});

test("a broken link shows the error and keeps your own board", async ({ page, context }) => {
  const own = await saveOwnBoard(page);
  const drawn = await pieces(page);

  const other = await context.newPage();
  await openBoard(other, "#t=1.this-is-not-a-board");
  await expect(other.getByRole("status")).toContainText("This link couldn't be opened.");
  await expect.poll(() => pieces(other)).toEqual(drawn);
  await other.waitForTimeout(600);
  expect(await saved(other)).toBe(own);
});
