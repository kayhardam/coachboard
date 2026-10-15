import type { Page } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { t } from "../src/i18n/ui";
import { encode, toBoard, type Board, type BoardV1 } from "../src/lib/board/format";
import { endOf } from "../src/lib/board/moves";
import { moveFor, stillFor } from "../src/lib/board/viewer";
import { expect, expectBoard, openViewer, pieces, savedBoards, test } from "./helpers";

// Phase 15-2: the viewer on /<lang>/board/link/ and /<lang>/board/qr/, where a
// shared link and a QR code open (decisions K1–K13 in the product plan). It
// shows a board step by step and changes nothing; "Edit a copy" opens the
// editor, which keeps the board in My boards at once (K4).

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../src/lib/board/fixtures/${name}`, import.meta.url), "utf8")) as {
    link: string;
    board: Board | BoardV1;
  };
const play = fixture("v2-play.json") as { link: string; board: Board };
const drill = fixture("v2-drill.json") as { link: string; board: Board };

const button = (page: Page, key: Parameters<typeof t>[1], lang = "en") =>
  page.locator(".viewer").getByRole("button", { name: t(lang, key), exact: true });
const sentence = (page: Page) => page.locator(".viewer .text p");
const count = (page: Page) => page.locator(".viewer .count [aria-hidden]");
/** Where a player is drawn: their transform's x and y. */
const placeOf = async (page: Page, index: number) => {
  const tr = await page.locator(`.stage [data-kind="player"][data-index="${index}"]`).getAttribute("transform");
  return tr!.match(/translate\(([\d.-]+) ([\d.-]+)\)/)!.slice(1).map(Number);
};
const drawn = (board: Board, step: number) =>
  board.frames[step]!.players.map((p, i) => `player:${i}:translate(${p.at[0]} ${p.at[1]})`);
const players = async (page: Page) => (await pieces(page)).filter((p) => p.startsWith("player:"));

/** Opens the crossing with Playwright's clock paused, so the test moves time on itself. */
async function openPaused(page: Page, link = play.link, path = "/en/board/link/") {
  await page.clock.install();
  await openViewer(page, `#t=${link}`, path);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
}

for (const path of ["/en/board/link/", "/nl/board/qr/"]) {
  test(`every fixture opens in the viewer on ${path}`, async ({ page }) => {
    for (const name of readdirSync(new URL("../src/lib/board/fixtures/", import.meta.url)).filter((f) => f.endsWith(".json"))) {
      const { link, board } = fixture(name);
      await openViewer(page, `#t=${link}`, path);
      await expectBoard(page, board);
      await page.goto("about:blank");
    }
  });
}

test("it shows the title, step 1 with its sentence, and where you are", async ({ page }) => {
  await openViewer(page, `#t=${play.link}`);
  await expect(page.locator(".viewer .title")).toHaveText(play.board.title!);
  await expect(sentence(page)).toHaveText(play.board.frames[0]!.text!);
  await expect(count(page)).toHaveText("1/4");
  await expect(page.locator(".viewer .count")).toHaveAttribute("title", "Step 1 of 4");
  await expect(button(page, "viewer.prev")).toBeDisabled();
});

test("a board without a title shows none, and one step shows no count", async ({ page }) => {
  const untitled = { ...play.board, frames: play.board.frames.slice(0, 1) };
  delete untitled.title;
  await openViewer(page, `#t=${await encode(untitled)}`);
  await expect(page.locator(".viewer .titlebar")).not.toContainText(t("en", "board.untitled"));
  await expect(page.locator(".viewer .title")).toHaveCount(0);
  await expect(page.locator(".viewer .count")).toHaveCount(0);
});

test("Next moves the players along their arrows to the next step", async ({ page }) => {
  await openPaused(page);
  const before = await placeOf(page, 2);
  await button(page, "viewer.next").click();
  await page.clock.runFor(moveFor(play.board.frames[0]!) / 2);
  const halfway = await placeOf(page, 2);
  expect(halfway).not.toEqual(before);
  expect(halfway).not.toEqual(play.board.frames[1]!.players[2]!.at);
  await page.clock.runFor(moveFor(play.board.frames[0]!) / 2 + 50);
  await expect(count(page)).toHaveText("2/4");
  await expect(sentence(page)).toHaveText(play.board.frames[1]!.text!);
  expect(await players(page)).toEqual(drawn(play.board, 1));
});

test("Next during a move goes there at once; Previous goes back", async ({ page }) => {
  await openPaused(page);
  await button(page, "viewer.next").click();
  await page.clock.runFor(200);
  await button(page, "viewer.next").click();
  await expect(count(page)).toHaveText("2/4");
  expect(await players(page)).toEqual(drawn(play.board, 1));
  await button(page, "viewer.prev").click();
  await expect(count(page)).toHaveText("1/4");
  expect(await players(page)).toEqual(drawn(play.board, 0));
});

test("on the last step Next plays its move and stays there; Previous goes back to the step's start (K8)", async ({ page }) => {
  await openPaused(page);
  for (const i of [0, 1, 2]) {
    await button(page, "viewer.next").click();
    await page.clock.runFor(moveFor(play.board.frames[i]!) + 50);
  }
  await expect(count(page)).toHaveText("4/4");
  const last = play.board.frames[3]!;
  await button(page, "viewer.next").click();
  await page.clock.runFor(moveFor(last) + 50);
  // Everyone where the last step's arrows take them, and Next is off.
  const ends = last.players.map((_, i) => `player:${i}:translate(${endOf(last, i).join(" ")})`);
  expect(await players(page)).toEqual(ends);
  await expect(button(page, "viewer.next")).toBeDisabled();
  // It stays there.
  await page.clock.runFor(5000);
  expect(await players(page)).toEqual(ends);

  await button(page, "viewer.prev").click();
  await expect(count(page)).toHaveText("4/4");
  expect(await players(page)).toEqual(drawn(play.board, 3));
  await expect(button(page, "viewer.next")).toBeEnabled();
});

test("Play goes through every step from the first, each still long enough to read, and ends after the last move", async ({ page }) => {
  await openPaused(page);
  await button(page, "viewer.next").click();
  await page.clock.runFor(2000);
  await button(page, "board.play").click();
  for (const [i, f] of play.board.frames.entries()) {
    await expect(count(page)).toHaveText(`${i + 1}/4`);
    // Still while it can be read.
    await page.clock.runFor(stillFor(f) / 2);
    expect(await players(page)).toEqual(drawn(play.board, i));
    await page.clock.runFor(stillFor(f) / 2 + moveFor(f) + 50);
  }
  await expect(button(page, "board.play")).toBeVisible();
  await expect(button(page, "viewer.next")).toBeDisabled();
});

test("Stop, or a tap on the court, stops on the start of the step", async ({ page }) => {
  await openPaused(page);
  await button(page, "board.play").click();
  await page.clock.runFor(stillFor(play.board.frames[0]!) + 300);
  await button(page, "board.stop").click();
  await expect(button(page, "board.play")).toBeVisible();
  expect(await players(page)).toEqual(drawn(play.board, 0));

  await button(page, "board.play").click();
  await page.clock.runFor(stillFor(play.board.frames[0]!) + 300);
  await page.locator(".viewer .stage").click({ position: { x: 5, y: 5 } });
  await expect(button(page, "board.play")).toBeVisible();
  expect(await players(page)).toEqual(drawn(play.board, 0));
});

test("with reduced motion, Next goes to the next step without moving", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPaused(page);
  await button(page, "viewer.next").click();
  await expect(count(page)).toHaveText("2/4");
  expect(await players(page)).toEqual(drawn(play.board, 1));
});

test("the arrow keys go to the next and the previous step", async ({ page }) => {
  await openPaused(page);
  await page.keyboard.press("ArrowRight");
  await page.clock.runFor(moveFor(play.board.frames[0]!) + 50);
  await expect(count(page)).toHaveText("2/4");
  await page.keyboard.press("ArrowLeft");
  await expect(count(page)).toHaveText("1/4");
});

test("the legend lists what is on the board, in a fixed order (K9)", async ({ page }) => {
  const items = () => page.locator(".viewer .legend li").allTextContents();
  await openViewer(page, `#t=${play.link}`, "/nl/board/link/");
  expect((await items()).map((s) => s.trim())).toEqual(["Loop", "Pass", "Dribbel", "Schot", "Sper"]);
  await openViewer(page, `#t=${drill.link}`, "/en/board/qr/");
  expect((await items()).map((s) => s.trim())).toEqual(["Passer", "Cone", "Run", "Pass", "Bounce", "Shot"]);
});

test("watching keeps nothing and never loads the editor", async ({ page }) => {
  const editor: string[] = [];
  page.on("request", (r) => void (/\/BoardEditor\.[^/]+\.js$/.test(r.url()) && editor.push(r.url())));
  await openViewer(page, `#t=${play.link}`);
  await button(page, "board.play").click();
  await button(page, "viewer.next").click();
  await page.waitForTimeout(500);
  expect(new URL(page.url()).hash).toBe(`#t=${play.link}`);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(editor).toEqual([]);
});

test("a broken link shows the notice on an empty court", async ({ page }) => {
  let loads = 0;
  page.on("load", () => loads++);
  await page.goto("/en/board/link/#t=2.broken");
  await expect(sentence(page)).toHaveText(t("en", "viewer.broken"));
  await expect(page.locator(".stage [data-kind]")).toHaveCount(0);
  await expect(page.locator(".viewer .edit")).toHaveCount(0);
  expect(loads).toBe(1);
});

test("a link from a newer version reloads once, then shows the notice", async ({ page }) => {
  await page.goto("/en/board/link/#t=3.fromthefuture");
  await expect(sentence(page)).toHaveText(t("en", "viewer.broken"));
  // This page is the reload, and it didn't reload again.
  const navigation = () => page.evaluate(() => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).type);
  expect(await navigation()).toBe("reload");
  await page.waitForTimeout(500);
  expect(await navigation()).toBe("reload");
  await expect(sentence(page)).toHaveText(t("en", "viewer.broken"));
});

test("without a board the page sends you to the editor", async ({ page }) => {
  await page.goto("/nl/board/qr/");
  await expect(page).toHaveURL(/\/nl\/board\/$/);
  await expect(page.getByRole("toolbar", { name: t("nl", "board.tools") })).toBeVisible();
});

test("a link pasted in the address bar of an open viewer opens there", async ({ page }) => {
  await openViewer(page, `#t=${play.link}`);
  await page.evaluate((link) => (location.hash = `#t=${link}`), drill.link);
  await expectBoard(page, drill.board);
  await expect(page.locator(".viewer .title")).toHaveText(drill.board.title!);
});

test.describe("Edit a copy (K4)", () => {
  const edit = (page: Page) => page.getByRole("link", { name: t("en", "viewer.edit") });
  const tools = (page: Page) => page.getByRole("toolbar", { name: t("en", "board.tools") });

  test("opens the editor with the board kept in My boards at once, its title as it was", async ({ page }) => {
    await openViewer(page, `#t=${play.link}`);
    await edit(page).click();
    await expect(page).toHaveURL(/\/en\/board\/#t=/);
    await expect(tools(page)).toBeVisible();
    await expect.poll(async () => (await savedBoards(page)).length).toBe(1);
    expect((await savedBoards(page))[0]!.board).toEqual(play.board);
    expect(await page.evaluate(() => sessionStorage.getItem("coachboard.copy"))).toBeNull();
    // A reload is that board, not another copy.
    await page.reload();
    await expect(tools(page)).toBeVisible();
    await page.waitForTimeout(600);
    expect(await savedBoards(page)).toHaveLength(1);
  });

  test("a board that is already in My boards opens; no second one", async ({ page }) => {
    await openViewer(page, `#t=${play.link}`);
    await edit(page).click();
    await expect.poll(async () => (await savedBoards(page)).length).toBe(1);
    const [first] = await savedBoards(page);
    await openViewer(page, `#t=${play.link}`);
    await edit(page).click();
    await expect(tools(page)).toBeVisible();
    await page.waitForTimeout(600);
    expect(await savedBoards(page)).toEqual([first]);
    expect(await page.evaluate(() => history.state?.board)).toBe(first!.id);
  });

  test("an old key keeps no other board, and is gone after the editor opens", async ({ page }) => {
    await page.goto("/en/");
    await page.evaluate((link) => sessionStorage.setItem("coachboard.copy", link), drill.link);
    await page.goto(`/en/board/#t=${play.link}`);
    await expect(tools(page)).toBeVisible();
    await page.waitForTimeout(600);
    expect(await savedBoards(page)).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem("coachboard.copy"))).toBeNull();
  });

  test("without storage the editor opens it as a received board", async ({ page }) => {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException("blocked", "SecurityError");
      };
      Object.defineProperty(window, "sessionStorage", { get: blocked });
    });
    await openViewer(page, `#t=${play.link}`);
    await edit(page).click();
    await expect(tools(page)).toBeVisible();
    await page.waitForTimeout(600);
    // Not kept: My boards stays empty until the first change.
    expect(await savedBoards(page)).toEqual([]);
    await expectBoard(page, toBoard(play.board)!);
  });
});
