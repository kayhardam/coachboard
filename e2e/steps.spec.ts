import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { defaultBoardFor } from "../src/lib/board/defaults";
import { decode, encode, settle, type Board } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import { dragPlayer, expect, fromMenu, moreButton, openBoard, savedBoards, test } from "./helpers";

// Phase 14-2: steps. The step bar (a button per step, New step), the sentence
// of the step on the court, Delete step in More, the keys N and ← →, the step
// a reload opens, and the QR code of a board too large to scan.

const play = JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as {
  link: string;
  board: Board;
};

const steps = (page: Page, lang = "en") => page.getByRole("toolbar", { name: t(lang, "board.steps") });
const stepButton = (page: Page, n: number, lang = "en") =>
  steps(page, lang).getByRole("button", { name: String(n), exact: true });
const newStep = (page: Page, lang = "en") => page.getByRole("button", { name: t(lang, "board.newStep"), exact: true });
const sentence = (page: Page) => page.locator(".text .line");

/** The board in the address bar, once it has `count` steps. */
async function inLink(page: Page, count = 1): Promise<Board> {
  const read = async () => decode(new URL(page.url()).hash.slice(3));
  await expect.poll(async () => (await read())?.frames.length).toBe(count);
  return (await read())!;
}

/** The step on the court: the step button that is pressed. */
async function current(page: Page, lang = "en") {
  return Number(await steps(page, lang).locator('.chip[aria-pressed="true"]').textContent());
}

// CB (2) runs diagonally left with the ball, as in T2.
const CB = 2;
async function runCb(page: Page) {
  await dragPlayer(page, CB, -40, -50);
}

test("New step puts everyone where they ended, takes the ball along, and Undo goes back", async ({ page }) => {
  await openBoard(page);
  await runCb(page);
  await expect.poll(async () => (await inLink(page)).frames[0]!.arrows.length).toBe(1);
  const one = await inLink(page);
  await newStep(page).click();
  expect(await current(page)).toBe(2);
  const board = await inLink(page, 2);
  expect(board.frames).toHaveLength(2);
  const end = one.frames[0]!.arrows[0]!.pts.at(-1)!;
  expect(board.frames[1]!.players[CB]!.at).toEqual(end);
  expect(board.frames[1]!.balls).toEqual([[end[0] + 10, end[1] - 8]]);
  expect(board.frames[1]!.arrows).toEqual([]);
  // The court shows step 2: no arrows yet.
  await expect(page.locator(".stage [data-kind=arrow]")).toHaveCount(0);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(steps(page).locator(".chip")).toHaveCount(1);
  expect(await current(page)).toBe(1);
  await expect(page.locator(".stage [data-kind=arrow]")).toHaveCount(1);
});

test("a sentence per step: Enter keeps it, Escape drops it, and New step keeps one being typed", async ({ page }) => {
  await openBoard(page);
  await sentence(page).click();
  await page.keyboard.type("CB goes left.");
  await page.keyboard.press("Enter");
  await expect(sentence(page)).toHaveText("CB goes left.");

  await sentence(page).click();
  await page.keyboard.type(" And back.");
  await page.keyboard.press("Escape");
  await expect(sentence(page)).toHaveText("CB goes left.");

  await newStep(page).click();
  await expect(sentence(page)).toHaveText(t("en", "board.addText"));
  await sentence(page).click();
  await page.keyboard.type("LB crosses.");
  // Straight from typing to New step: the sentence is kept first (decision Kay).
  await newStep(page).click();
  expect(await current(page)).toBe(3);
  await expect.poll(async () => (await inLink(page, 3)).frames.map((f) => f.text)).toEqual(["CB goes left.", "LB crosses.", undefined]);
  await stepButton(page, 2).click();
  await expect(sentence(page)).toHaveText("LB crosses.");
});

test("Share keeps a sentence being typed", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: async () => {}, configurable: true }));
  await openBoard(page);
  await sentence(page).click();
  await page.keyboard.type("CB goes left.");
  await page.getByRole("button", { name: "Share" }).click();
  await expect(sentence(page)).toHaveText("CB goes left.");
});

test("N adds a step and ← → go between steps, but not while typing", async ({ page }) => {
  await openBoard(page);
  await page.keyboard.press("n");
  await page.keyboard.press("N");
  expect(await current(page)).toBe(3);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect(await current(page)).toBe(1);
  await page.keyboard.press("ArrowRight");
  expect(await current(page)).toBe(2);
  await sentence(page).click();
  await page.keyboard.type("No new steps");
  await page.keyboard.press("ArrowLeft");
  await expect(steps(page).locator(".chip")).toHaveCount(3);
  expect(await current(page)).toBe(2);
  await expect(newStep(page)).toHaveAttribute("aria-keyshortcuts", "N");
});

test("Delete step is in More only with more than one step", async ({ page }) => {
  await openBoard(page);
  await moreButton(page).click();
  await expect(page.getByRole("button", { name: "Empty court" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete step" })).toHaveCount(0);
  await moreButton(page).click();
  await expect(page.getByRole("button", { name: "Empty court" })).toBeHidden();
  await newStep(page).click();
  await expect(steps(page).locator(".chip")).toHaveCount(2);
  await fromMenu(page, "board.removeStep");
  await expect(steps(page).locator(".chip")).toHaveCount(1);
  expect(await current(page)).toBe(1);
});

test("a shared board opens on step 1 with all its steps", async ({ page }) => {
  await openBoard(page, `#t=${play.link}`);
  await expect(steps(page).locator(".chip")).toHaveCount(play.board.frames.length);
  expect(await current(page)).toBe(1);
  await expect(sentence(page)).toHaveText(play.board.frames[0]!.text!);
  await stepButton(page, 3).click();
  await expect(sentence(page)).toHaveText(play.board.frames[2]!.text!);
});

test("a reload opens the step you were on; My boards and a link open step 1", async ({ page }) => {
  await openBoard(page);
  await runCb(page);
  await newStep(page).click();
  await newStep(page).click();
  await stepButton(page, 2).click();
  // Saved in My boards, with the step in the tab's history.
  await expect.poll(async () => (await savedBoards(page)).at(0)?.board.frames.length).toBe(3);
  await page.reload();
  await expect(steps(page).locator(".chip")).toHaveCount(3);
  expect(await current(page)).toBe(2);
  // No copy: still one board.
  expect(await savedBoards(page)).toHaveLength(1);

  await fromMenu(page, "board.myBoards");
  await page.getByRole("dialog", { name: "My boards" }).locator("li .open").first().click();
  expect(await current(page)).toBe(1);

  const link = page.url();
  await stepButton(page, 3).click();
  const other = await page.context().newPage();
  await openBoard(other, new URL(link).hash);
  expect(await current(other)).toBe(1);
});

/**
 * A board of eight steps with `arrows` bent runs each and long sentences:
 * busy enough to pass a QR code's size. Seeded, so the same every run.
 */
function busyBoard(arrows: number): Board {
  let seed = 3;
  const random = (n: number) => Math.floor(((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * n);
  const board = defaultBoardFor("en");
  const lineup = board.frames[0]!.players;
  board.frames = Array.from({ length: 8 }, (_, s) => ({
    players: lineup.map((p) => ({ ...p, at: [random(201), random(201)] as [number, number] })),
    balls: [[random(201), random(201)]],
    arrows: Array.from({ length: arrows }, (_, i) => ({
      kind: "run" as const,
      from: i % lineup.length,
      pts: [[0, 0], [random(201), random(201)], [random(201), random(201)]] as [number, number][],
    })),
    text: `Step ${s + 1}: ${"abcdefghij".repeat(10)}`.slice(0, 100),
  }));
  return settle(board);
}

test("a QR code past what the scan test read gets a note; past what a QR code holds, a notice", async ({ page }) => {
  // Version 31 to 40: the code, with a note under it.
  await openBoard(page, `#t=${await encode(busyBoard(20))}`);
  await fromMenu(page, "board.qr");
  const dialog = page.getByRole("dialog", { name: "QR code" });
  await expect(dialog.locator("svg")).toBeVisible();
  await expect(dialog).toContainText(t("en", "board.qrLarge"));
  await dialog.getByRole("button", { name: "Close" }).click();

  // Past version 40: no code, a notice instead.
  await openBoard(page, `#t=${await encode(busyBoard(30))}`);
  await fromMenu(page, "board.qr");
  await expect(page.getByRole("status")).toContainText(t("en", "board.qrTooLarge"));
  await expect(dialog).toBeHidden();
});

test("a QR code that scans gets no note", async ({ page }) => {
  await openBoard(page, `#t=${play.link}`);
  await fromMenu(page, "board.qr");
  const dialog = page.getByRole("dialog", { name: "QR code" });
  await expect(dialog).toContainText(t("en", "board.qrHint"));
});
