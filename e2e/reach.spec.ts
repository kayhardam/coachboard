import type { Page } from "@playwright/test";
import { expect, fromMenu, openBoard, test } from "./helpers";

// On the full court a piece's drawn touch area is under 44 px on a phone:
// 33 px across at 393×659 (an iPhone 15), where these tests run in both
// browsers; a press within 22 px of a piece still takes it
// (src/lib/board/hit.ts). 21 px is outside the drawn area there. On a taller
// phone (a Pixel 7) the full court is larger, and the drawn area is about 44 px.
const BESIDE = 21;
test.use({ viewport: { width: 393, height: 659 } });

async function fullCourt(page: Page) {
  await openBoard(page);
  await fromMenu(page, "board.fullCourt");
}

/** Screen centre of a player. */
async function centre(page: Page, index: number) {
  const box = (await page.locator(`.stage [data-kind="player"][data-index="${index}"]`).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 });
  await page.mouse.up();
}

const transform = (page: Page, index: number) =>
  page.locator(`.stage [data-kind="player"][data-index="${index}"]`).getAttribute("transform");

test("a press 21 px beside a player on the full court drags that player", async ({ page }) => {
  await fullCourt(page);
  const before = await transform(page, 1); // LB: no other piece near
  const lb = await centre(page, 1);
  await drag(page, { x: lb.x - BESIDE, y: lb.y }, 30, 30);
  await expect.poll(() => transform(page, 1)).not.toBe(before);
});

test("between two players, the nearer one moves", async ({ page }) => {
  await fullCourt(page);
  // The pivot (5) and the defender left of it (9) are 20 dm apart.
  const pivot = await centre(page, 5);
  const defender = await centre(page, 9);
  const before = { pivot: await transform(page, 5), defender: await transform(page, 9) };
  const nearPivot = { x: pivot.x + (defender.x - pivot.x) * 0.4, y: pivot.y + (defender.y - pivot.y) * 0.4 };
  await drag(page, nearPivot, 0, 40);
  await expect.poll(() => transform(page, 5)).not.toBe(before.pivot);
  expect(await transform(page, 9)).toBe(before.defender);
});

test("an arrow next to a player can still be picked", async ({ page }) => {
  await fullCourt(page);
  const lb = await centre(page, 1);
  await page.getByRole("button", { name: "Run" }).click();
  await drag(page, lb, 0, 80);
  await page.getByRole("button", { name: "Move" }).click();
  // Tap elsewhere, so the new arrow is no longer selected.
  await page.mouse.click(lb.x + 100, lb.y);
  await expect(page.locator('.stage [data-kind="handle"]')).toHaveCount(0);

  // Down the arrow: past the player's drawn touch area, within the reach. It
  // is LB's arrow, so it shows its bend and end handles (no start handle).
  await page.mouse.click(lb.x, lb.y + BESIDE);
  await expect(page.locator('.stage [data-kind="handle"]')).toHaveCount(2);
});
