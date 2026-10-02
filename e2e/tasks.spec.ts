import type { Locator, Page } from "@playwright/test";
import { defaultBoard } from "../src/lib/board/defaults";
import { decode } from "../src/lib/board/format";
import { expect, openBoard, saveOwnBoard, test } from "./helpers";

// The tap budget: the shortest route for each measured task, counted in
// actions (every tap, drag and key press is one). The count must equal the
// budget exactly: a route that needs one more action fails until the budget
// goes up on purpose, and a shorter route fails until it goes down, so every
// gain stays recorded. Change a budget only with the reason in the PR and the
// new measurement in docs/metingen.md ("UX-metingen").
// Opening the board doesn't count, nor does the phone's own share sheet.
const TAP_BUDGET = {
  // T1: an attack against a 6-0, three arrows (run, run, pass), shared.
  T1: 6,
  // T1 for a returning coach: their own board is on the court first.
  "T1 with your own board": 8,
};

/** Counts the actions of a route. Every tap is on a button that's already on screen. */
function route(page: Page) {
  let count = 0;
  const centre = async (index: number) => {
    const box = (await page.locator(`.stage [data-kind="player"][data-index="${index}"]`).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const drag = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
    count++;
  };
  return {
    get count() {
      return count;
    },
    async tap(target: Locator) {
      // Not click() alone: it scrolls first, and a route can't ask that of a thumb.
      await expect(target).toBeInViewport();
      await target.click();
      count++;
    },
    /** Drags from a player's centre by (dx, dy) screen pixels. */
    async drag(from: number, dx: number, dy: number) {
      const at = await centre(from);
      await drag(at, { x: at.x + dx, y: at.y + dy });
    },
    /** Drags from one player's centre to another's. */
    async dragTo(from: number, to: number) {
      await drag(await centre(from), await centre(to));
    },
  };
}

/** Records what Share hands to the phone's share sheet. */
async function stubShareSheet(page: Page) {
  await page.addInitScript(() => {
    const shared: string[] = [];
    (window as unknown as { shared: string[] }).shared = shared;
    Object.defineProperty(navigator, "share", {
      value: async ({ url }: { url: string }) => void shared.push(url),
      configurable: true,
    });
  });
  return () => page.evaluate(() => (window as unknown as { shared: string[] }).shared);
}

// Players in the default lineup: 0 LW, 1 LB, 2 CB, 3 RB, 4 RW, 5 P.
const [LB, CB, RB] = [1, 2, 3];

/** T1 from the default lineup: two runs and a pass, then Share. */
async function drawAndShare(page: Page, steps: ReturnType<typeof route>) {
  const tool = (name: string) => page.getByRole("toolbar", { name: "Tools" }).getByRole("button", { name });
  await steps.tap(tool("Run"));
  await steps.drag(LB, 10, -40);
  await steps.drag(RB, -10, -40);
  await steps.tap(tool("Pass"));
  await steps.dragTo(CB, RB);
  await steps.tap(page.getByRole("button", { name: "Share" }));
}

async function expectSharedT1(shared: () => Promise<string[]>) {
  await expect.poll(shared).toHaveLength(1);
  const url = new URL((await shared())[0]!);
  expect(url.pathname).toBe("/en/board/link/");
  const frame = (await decode(url.hash.replace(/^#t=/, "")))?.frames[0];
  // The attack against a 6-0 is the default lineup, untouched.
  expect(frame?.players).toEqual(defaultBoard.frames[0]!.players);
  expect(frame?.arrows.map((a) => a.kind).sort()).toEqual(["pass", "run", "run"]);
}

test("T1: the shortest route takes exactly its tap budget", async ({ page }) => {
  const shared = await stubShareSheet(page);
  await openBoard(page);
  const steps = route(page);

  await drawAndShare(page, steps);

  await expectSharedT1(shared);
  expect(steps.count).toBe(TAP_BUDGET.T1);
});

test("T1 with your own board: back to the default lineup first", async ({ page }) => {
  const shared = await stubShareSheet(page);
  await saveOwnBoard(page);
  await openBoard(page);
  const steps = route(page);

  await steps.tap(page.getByTitle("Clear"));
  await steps.tap(page.getByRole("button", { name: "Default lineup" }));
  await drawAndShare(page, steps);

  await expectSharedT1(shared);
  expect(steps.count).toBe(TAP_BUDGET["T1 with your own board"]);
});
