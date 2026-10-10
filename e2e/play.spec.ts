import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { decode, type Board } from "../src/lib/board/format";
import { expect, openBoard, pieces, STORE_KEY, test } from "./helpers";

// Phase 14-3: Play (decision D4). Each step shows still for 1.2 s, then its
// players move along their arrows for 1 s to where the next step starts. Only
// to watch: the link, My boards and Undo stay as they were. The clock is
// Playwright's, paused, so the test moves time on itself.

const play = JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as {
  link: string;
  board: Board;
};
const STILL = 1200;
const MOVE = 1000;

const playButton = (page: Page) => page.getByRole("toolbar", { name: "Steps" }).locator(".play");
const current = async (page: Page) =>
  Number(await page.getByRole("toolbar", { name: "Steps" }).locator('.chip[aria-pressed="true"]').textContent());
/** Where a player is drawn: their transform's x and y. */
const placeOf = async (page: Page, index: number) => {
  const t = await page.locator(`.stage [data-kind="player"][data-index="${index}"]`).getAttribute("transform");
  return t!.match(/translate\(([\d.]+) ([\d.]+)\)/)!.slice(1).map(Number);
};
const players = async (page: Page) => (await pieces(page)).filter((p) => p.startsWith("player:"));
/** The board in the address bar: compared as a board, not as text (compression can give other bytes). */
const inLink = async (page: Page) => decode(new URL(page.url()).hash.slice(3));
const drawn = (board: Board, step: number) =>
  board.frames[step]!.players.map((p, i) => `player:${i}:translate(${p.at[0]} ${p.at[1]})`);

/** Opens the four steps of the fixture with the clock paused. */
async function openPaused(page: Page) {
  await page.clock.install();
  await openBoard(page, `#t=${play.link}`);
  await expect(page).toHaveURL(/#t=2\./);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
}

// MO (2) dribbles in step 1, from (100, 130) to (70, 112).
const MO = 2;

test("Play: each step still, then its players move to where the next starts", async ({ page }) => {
  await openPaused(page);
  const link = await inLink(page);
  const saved = await page.evaluate((key) => localStorage.getItem(key), STORE_KEY);
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await playButton(page).click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Stop");
  expect(await current(page)).toBe(1);

  // Halfway through step 1's move: MO between where he stood and where his dribble ends.
  await page.clock.runFor(STILL + MOVE / 2);
  const [x, y] = await placeOf(page, MO);
  expect(x).toBeGreaterThan(70);
  expect(x).toBeLessThan(100);
  expect(y).toBeGreaterThanOrEqual(112);
  expect(y).toBeLessThan(130);
  // Only to watch: the link, My boards and Undo are as they were.
  expect(await inLink(page)).toEqual(link);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORE_KEY)).toBe(saved);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  // The move ends exactly where step 2 starts.
  await page.clock.runFor(MOVE / 2 + 50);
  expect(await current(page)).toBe(2);
  expect(await players(page)).toEqual(drawn(play.board, 1));

  // Through steps 2 to 4; the last one stays a moment where its arrows end, then playing stops on it.
  await page.clock.runFor(3 * (STILL + MOVE) + STILL + 100);
  expect(await current(page)).toBe(4);
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  expect(await players(page)).toEqual(drawn(play.board, 3));
  expect(await inLink(page)).toEqual(link);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORE_KEY)).toBe(saved);
});

test("a tap on the court, another step, New step or Stop stops playing first", async ({ page }) => {
  await openPaused(page);
  const halfway = async () => {
    await playButton(page).click();
    await page.clock.runFor(STILL + MOVE / 2);
    await expect(playButton(page)).toHaveAttribute("aria-label", "Stop");
  };

  // A tap on the court only stops: nothing is picked, and step 1 shows as it is.
  await halfway();
  await page.locator(`.stage [data-kind="player"][data-index="${MO}"]`).click({ force: true });
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  expect(await players(page)).toEqual(drawn(play.board, 0));

  // Another step.
  await halfway();
  await page.getByRole("toolbar", { name: "Steps" }).getByRole("button", { name: "3", exact: true }).click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  expect(await current(page)).toBe(3);
  await page.clock.runFor(STILL + MOVE);
  expect(await current(page)).toBe(3);

  // New step: after the step on the court, as always.
  await halfway();
  await page.getByRole("button", { name: "New step", exact: true }).click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  expect(await current(page)).toBe(2);
  await expect(page.getByRole("toolbar", { name: "Steps" }).locator(".chip")).toHaveCount(5);

  // Stop.
  await halfway();
  await playButton(page).click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  expect(await players(page)).toEqual(drawn(play.board, 0));
});

test("with reduced motion the board goes from step to step without moving", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPaused(page);
  await playButton(page).click();
  await page.clock.runFor(STILL + MOVE / 2);
  expect(await players(page)).toEqual(drawn(play.board, 0));
  await page.clock.runFor(MOVE / 2 + 50);
  expect(await current(page)).toBe(2);
  expect(await players(page)).toEqual(drawn(play.board, 1));
});

test("Play needs two steps", async ({ page }) => {
  await openBoard(page);
  await expect(playButton(page)).toBeDisabled();
  await expect(playButton(page)).toHaveAttribute("title", "Play");
});

test("playing a board of yours changes nothing in My boards", async ({ page }) => {
  const store = { current: "a", boards: [{ id: "a", board: play.board, at: 1 }] };
  await page.addInitScript(([key, value]) => localStorage.getItem(key) ?? localStorage.setItem(key, value), [STORE_KEY, JSON.stringify(store)] as const);
  await page.clock.install();
  await openBoard(page);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await expect(page.getByRole("toolbar", { name: "Steps" }).locator(".chip")).toHaveCount(4);
  const saved = await page.evaluate((key) => localStorage.getItem(key), STORE_KEY);
  await playButton(page).click();
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(STILL + MOVE / 2);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORE_KEY)).toBe(saved);
    await page.clock.runFor(MOVE / 2 + 50);
  }
  await page.clock.runFor(STILL);
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORE_KEY)).toBe(saved);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
});

/** JavaScript errors on the page, collected from now on. */
function errors(page: Page) {
  const seen: string[] = [];
  page.on("pageerror", (e) => seen.push(e.message));
  return seen;
}

test("Empty court and the default lineup on step 3 leave a board of one step that still works", async ({ page }) => {
  const seen = errors(page);
  const steps = page.getByRole("toolbar", { name: "Steps" });
  for (const item of ["Empty court", "Default lineup"]) {
    // A fresh load: the same page with another link would only change the hash.
    await page.goto("about:blank");
    await openBoard(page, `#t=${play.link}`);
    await steps.getByRole("button", { name: "3", exact: true }).click();
    await page.getByTitle("More", { exact: true }).click();
    await page.getByRole("button", { name: item, exact: true }).click();
    await expect(steps.locator(".chip")).toHaveCount(1);
    expect(await current(page)).toBe(1);
    // A ball on the court: it is there, in the board.
    const balls = await page.locator('.stage [data-kind="ball"]').count();
    await page.getByRole("toolbar", { name: "Tools" }).getByRole("button", { name: "Ball" }).click();
    // An empty spot, in decimetres: in the backcourt, away from every player.
    const spot = await page.locator(".stage svg").evaluate((svg: SVGSVGElement) => {
      const p = new DOMPoint(140, 180).matrixTransform(svg.getScreenCTM()!);
      return { x: p.x, y: p.y };
    });
    await page.mouse.click(spot.x, spot.y);
    await expect(page.locator('.stage [data-kind="ball"]')).toHaveCount(balls + 1);
    await page.getByRole("toolbar", { name: "Tools" }).getByRole("button", { name: "Arrow" }).click();
  }
  expect(seen).toEqual([]);
});

test("Empty court while playing stops it first", async ({ page }) => {
  const seen = errors(page);
  await openPaused(page);
  await playButton(page).click();
  await page.clock.runFor(STILL + MOVE + STILL + MOVE / 2);
  expect(await current(page)).toBe(2);
  await page.getByTitle("More", { exact: true }).click();
  await page.getByRole("button", { name: "Empty court", exact: true }).click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await page.clock.runFor(STILL + MOVE);
  expect(await current(page)).toBe(1);
  await expect(page.getByRole("toolbar", { name: "Steps" }).locator(".chip")).toHaveCount(1);
  expect(seen).toEqual([]);
});

test("a tap on the sentence while playing stops it, so the sentence stays with its step", async ({ page }) => {
  await openPaused(page);
  await playButton(page).click();
  await page.clock.runFor(STILL / 2);
  await page.locator(".text .line").click();
  await expect(playButton(page)).toHaveAttribute("aria-label", "Play");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type(" Snel!");
  await page.clock.runFor(STILL + MOVE);
  await page.keyboard.press("Enter");
  expect(await current(page)).toBe(1);
  await page.clock.runFor(1000);
  await expect.poll(async () => (await inLink(page))!.frames.map((f) => f.text)).toEqual([
    `${play.board.frames[0]!.text} Snel!`,
    ...play.board.frames.slice(1).map((f) => f.text),
  ]);
});
