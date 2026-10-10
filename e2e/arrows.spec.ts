import type { Locator, Page } from "@playwright/test";
import { decode } from "../src/lib/board/format";
import { dragPlayer, expect, linkInAddressBar, openBoard, pieces, test } from "./helpers";

// An arrow drawn from a player belongs to them (format version 2): it starts
// where that player is by then, and follows them when they move.

const [LB, RB] = [1, 3];

const tool = (page: Page, name: string) =>
  page.getByRole("toolbar", { name: "Tools" }).getByRole("button", { name }).click();

/** Where players are drawn, and where each arrow starts and ends, from the drawn SVG. */
async function drawn(page: Page) {
  const all = await pieces(page);
  const at = (index: number) => all.find((p) => p.startsWith(`player:${index}:`))!.match(/translate\((.+)\)/)![1]!;
  const arrows = all
    .filter((p) => p.startsWith("arrow:"))
    .map((p) => {
      const xy = p.split(":")[2]!.match(/-?[\d.]+ -?[\d.]+/g)!;
      return { start: xy[0]!, end: xy.at(-1)! };
    });
  return { at, arrows };
}

/** Drags from the centre of `from` to the centre of `to`, or by (dx, dy) screen pixels. */
async function drag(page: Page, from: Locator, to: Locator | [number, number]) {
  const centre = async (l: Locator) => {
    const box = (await l.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const a = await centre(from);
  const b = Array.isArray(to) ? { x: a.x + to[0], y: a.y + to[1] } : await centre(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}

const player = (page: Page, index: number) => page.locator(`.stage [data-kind="player"][data-index="${index}"]`);

test("an arrow from a player follows them, and their next arrow starts where the first ends", async ({ page }) => {
  await openBoard(page);
  // Arrow is the tool on opening: a drag from a player is their run.
  await dragPlayer(page, LB, 10, -60);
  let board = await drawn(page);
  expect(board.arrows).toHaveLength(1);
  expect(board.arrows[0]!.start).toBe(board.at(LB));

  // The new arrow is selected; the player is still the one to grab.
  await tool(page, "Move");
  await dragPlayer(page, LB, 30, 10);
  const moved = await drawn(page);
  expect(moved.at(LB)).not.toBe(board.at(LB));
  expect(moved.arrows[0]).toEqual({ start: moved.at(LB), end: board.arrows[0]!.end });

  await tool(page, "Arrow");
  await dragPlayer(page, LB, 80, 0);
  await page.getByRole("toolbar", { name: "Arrow type" }).getByRole("button", { name: "Pass" }).click();
  board = await drawn(page);
  expect(board.arrows[1]!.start).toBe(board.arrows[0]!.end);

  // The link keeps the player instead of the start point.
  await page.waitForTimeout(400);
  const link = new URL(await linkInAddressBar(page)).hash.slice(3);
  const arrows = (await decode(link))!.frames[0]!.arrows;
  expect(arrows.map((a) => [a.kind, a.from])).toEqual([
    ["run", LB],
    ["pass", LB],
  ]);
});

test("dragging an arrow lets go of its player; its start let go on a player gives it to them", async ({ page }) => {
  await openBoard(page);
  await dragPlayer(page, LB, 0, -80);

  // Nothing selected (Escape), so no handle covers the arrow; then drag the arrow by its middle.
  await tool(page, "Move");
  await page.keyboard.press("Escape");
  await drag(page, page.locator('.stage [data-kind="arrow"][data-index="0"] path').nth(1), [40, 0]);
  const loose = await drawn(page);
  expect(loose.arrows[0]!.start).not.toBe(loose.at(LB));

  // Its start, let go on RB, gives it to RB.
  await drag(page, page.locator('.stage [data-kind="handle"][data-index="0"]'), player(page, RB));
  const given = await drawn(page);
  expect(given.arrows[0]).toEqual({ start: given.at(RB), end: loose.arrows[0]!.end });

  // LB moves without it; RB takes it along.
  await dragPlayer(page, LB, -20, 0);
  expect((await drawn(page)).arrows[0]).toEqual(given.arrows[0]);
  await dragPlayer(page, RB, 0, 20);
  const after = await drawn(page);
  expect(after.arrows[0]!.start).toBe(after.at(RB));
});
