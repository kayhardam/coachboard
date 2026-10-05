import { readdirSync, readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { defaultBoard } from "../src/lib/board/defaults";
import type { Board, BoardV1 } from "../src/lib/board/format";
import { dragPlayer, expect, expectBoard, openBoard, pieces, saved, saveOwnBoard, test } from "./helpers";

test("the board loads with the default lineup", async ({ page }) => {
  await openBoard(page);
  await expectBoard(page, defaultBoard);
});

test("dragging a player puts the new board in the address bar within a second", async ({ page }) => {
  await openBoard(page);
  await expect(page).toHaveURL(/#t=2\./);
  const before = page.url();

  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => page.url(), { timeout: 1000 }).not.toBe(before);
  expect(page.url()).toMatch(/#t=2\./);
});

test("a shared link opens the same board in a clean browser", async ({ page, browser }) => {
  await openBoard(page);
  await expect(page).toHaveURL(/#t=2\./);
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
    ) as { link: string; board: Board | BoardV1 };
    await openBoard(page, `#t=${link}`);
    await expectBoard(page, board);
    await expect(page.getByRole("status")).toHaveCount(0);
  });
}

test("opening a link doesn't touch the saved board", async ({ page, context }) => {
  const own = await saveOwnBoard(page);

  const fixture = JSON.parse(
    readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
  ) as { link: string; board: Board | BoardV1 };
  const other = await context.newPage();
  await openBoard(other, `#t=${fixture.link}`);
  await expectBoard(other, fixture.board);
  await other.waitForTimeout(600);
  expect(await saved(other)).toBe(own);
});

const brokenLink = "#t=1.this-is-not-a-board";

/**
 * Counts the documents the page loads: a reload is one more. By load event,
 * not by request: WebKit reports the first request for a page twice.
 */
function countLoads(page: Page) {
  const loads = { count: 0 };
  page.on("load", () => loads.count++);
  return loads;
}

test("a broken link keeps your own board, and says so until you edit", async ({ page, context }) => {
  const own = await saveOwnBoard(page);
  const drawn = await pieces(page);

  const other = await context.newPage();
  const loads = countLoads(other);
  await other.clock.install();
  await openBoard(other, brokenLink);
  const notice = other.getByRole("status");
  await expect(notice).toContainText(
    "This link doesn't work; ask for a new one. You're seeing your own board.",
  );
  await expect.poll(() => pieces(other)).toEqual(drawn);
  await other.waitForTimeout(600);
  expect(await saved(other)).toBe(own);
  // A version this code knows: reloading wouldn't help.
  expect(loads.count).toBe(1);

  // Other notices go after six seconds; this one stays.
  await other.clock.fastForward(10_000);
  await expect(notice).toBeVisible();

  await dragPlayer(other, 0, 20, 20);
  await expect(notice).toBeHidden();
});

test("a broken link without a saved board shows the default lineup, until you dismiss the notice", async ({ page }) => {
  await page.clock.install();
  await openBoard(page, brokenLink);
  const notice = page.getByRole("status");
  await expect(notice).toContainText(
    "This link doesn't work; ask for a new one. You're seeing the default lineup.",
  );
  await expectBoard(page, defaultBoard);

  await page.clock.fastForward(10_000);
  await expect(notice).toBeVisible();

  await notice.getByRole("button", { name: "Dismiss" }).click();
  await expect(notice).toBeHidden();
});

// No code reads version 3 yet, so after its one reload this link still fails:
// the reload has to stop there and show the notice for a broken link.
const newerLink = "#t=3.from-newer-code";

test("a link from a newer version reloads the page once, then says it doesn't work", async ({ page, context }) => {
  const own = await saveOwnBoard(page);
  const drawn = await pieces(page);

  const other = await context.newPage();
  const loads = countLoads(other);
  await openBoard(other, newerLink);
  await expect(other.getByRole("status")).toContainText(
    "This link doesn't work; ask for a new one. You're seeing your own board.",
  );
  await expect.poll(() => pieces(other)).toEqual(drawn);
  await other.waitForTimeout(600);
  expect(await saved(other)).toBe(own);
  expect(loads.count).toBe(2);
});

test("a tab opened before a deploy reloads for a link from a newer version", async ({ page }) => {
  const loads = countLoads(page);
  await openBoard(page);
  await expect.poll(() => saved(page)).not.toBeNull();
  const own = await saved(page);

  // A link pasted into the address bar of an open tab only changes the fragment.
  await page.evaluate((hash) => (location.hash = hash), newerLink);
  await expect(page.getByRole("status")).toContainText(
    "This link doesn't work; ask for a new one. You're seeing your own board.",
  );
  await page.waitForTimeout(600);
  expect(await saved(page)).toBe(own);
  expect(loads.count).toBe(2);
});
