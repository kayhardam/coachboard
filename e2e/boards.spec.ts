import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { exportFile, type Saved } from "../src/lib/board/boards";
import { defaultBoardFor } from "../src/lib/board/defaults";
import { decode, encode, type Board } from "../src/lib/board/format";
import {
  chooseFile,
  downloaded,
  dragPlayer,
  moveTool,
  expect,
  expectBoard,
  expectedPieces,
  fromMenu,
  OLD_KEY,
  openBoard,
  pieces,
  savedBoards,
  saveOwnBoard,
  test,
} from "./helpers";

// My boards (src/lib/board/boards.ts): a board enters the list at its first
// real change, a received board never replaces yours, and a reload is told
// apart from a received link by the id in the tab's history.

const play = JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as {
  link: string;
  board: Board;
};

const list = (page: Page) => page.getByRole("dialog", { name: "My boards" });

async function openList(page: Page) {
  await fromMenu(page, "board.myBoards");
  await expect(list(page)).toBeVisible();
}

/**
 * Waits until the address bar holds the board on the court. The editor
 * decides whether to save just before it writes the link (300 ms after a
 * change), so after this a check of storage or a reload sees that decision.
 * Not a fixed wait: a CI machine is slower than a Mac.
 */
async function settled(page: Page) {
  const drawn = (list: string[]) => [...list.filter((p) => !p.startsWith("arrow:")), `arrows:${list.filter((p) => p.startsWith("arrow:")).length}`].sort();
  await expect
    .poll(async () => {
      const board = await decode(new URL(page.url()).hash.replace(/^#t=/, ""));
      if (!board) return false;
      const want = expectedPieces(board);
      const inLink = drawn([...want.players, ...want.ball, ...Array.from({ length: want.arrows }, () => "arrow:")]);
      return JSON.stringify(inLink) === JSON.stringify(drawn(await pieces(page)));
    })
    .toBe(true);
}

async function setTitle(page: Page, title: string) {
  await page.getByRole("button", { name: "Add title" }).click();
  await page.getByRole("textbox", { name: "Edit title" }).fill(title);
  await page.keyboard.press("Enter");
}

test.describe("saving", () => {
  test("the first visit keeps nothing until you draw", async ({ page }) => {
    await openBoard(page);
    await settled(page);
    expect(await savedBoards(page)).toEqual([]);
    await openList(page);
    await expect(list(page)).toContainText("No boards yet. Once you draw something, your board shows up here.");
    await list(page).getByRole("button", { name: "Close" }).click();

    await dragPlayer(page, 5, 30, 30);
    await expect.poll(async () => (await savedBoards(page)).length).toBe(1);
  });

  test("Default lineup on an untouched lineup is no change", async ({ page }) => {
    await openBoard(page);
    await fromMenu(page, "board.resetLineup");
    await settled(page);
    expect(await savedBoards(page)).toEqual([]);
  });

  test("editing a received link makes a new board, and yours stays", async ({ page, context }) => {
    const own = JSON.parse(await saveOwnBoard(page))[0];
    const other = await context.newPage();
    await openBoard(other, `#t=${play.link}`, "/en/board/link/");
    await settled(other);
    expect(await savedBoards(other)).toEqual([own]);

    await dragPlayer(other, 0, 20, 20);
    await expect.poll(async () => (await savedBoards(other)).length).toBe(2);
    expect(await savedBoards(other)).toContainEqual(own);
  });
});

test.describe("your board from before My boards", () => {
  test("becomes the first board, and doesn't come back after you delete it", async ({ page }) => {
    const before = { ...defaultBoardFor("en"), title: "Kruising" };
    before.frames[0]!.players[1]!.at = [40, 100];
    await page.goto("/en/");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [OLD_KEY, JSON.stringify(before)]);

    await openBoard(page);
    await expect(page.locator(".title span")).toHaveText("Kruising");
    expect((await savedBoards(page)).map((s) => s.board)).toEqual([before]);

    await openList(page);
    await list(page).getByTitle("More for Kruising", { exact: true }).click();
    await list(page).getByRole("button", { name: "Delete" }).click();
    expect(await savedBoards(page)).toEqual([]);
    // The default lineup takes the deleted board's place, also in the address bar.
    await expectBoard(page, defaultBoardFor("en"));
    await settled(page);

    await page.reload();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    await expectBoard(page, defaultBoardFor("en"));
    expect(await savedBoards(page)).toEqual([]);
  });

  test("is left out when it was an untouched default lineup", async ({ page }) => {
    await page.goto("/en/");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [OLD_KEY, JSON.stringify(defaultBoardFor("nl"))]);
    await openBoard(page, "", "/nl/board/");
    await settled(page);
    expect(await savedBoards(page)).toEqual([]);
  });
});

test.describe("reloading", () => {
  /** Edits, then expects exactly `count` boards, the last edit among them. */
  async function editAndCount(page: Page, count: number) {
    const before = await pieces(page);
    // With Move: the same drag twice with Arrow may draw nothing the second time.
    await moveTool(page);
    await dragPlayer(page, 5, 15, 15);
    await expect.poll(() => pieces(page)).not.toEqual(before);
    await settled(page);
    expect(await savedBoards(page)).toHaveLength(count);
  }

  async function reload(page: Page) {
    await page.reload();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
  }

  test("your own board: edit, reload, edit", async ({ page }) => {
    await saveOwnBoard(page);
    await reload(page);
    await editAndCount(page, 1);
    await reload(page);
    await editAndCount(page, 1);
  });

  test("a tactic: reload, edit, reload, edit makes one new board", async ({ page }) => {
    await page.goto("/en/tactics/6-0-defense-basics/");
    await page.getByRole("link", { name: "Open in the board" }).click();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    await reload(page);
    await settled(page);
    expect(await savedBoards(page)).toEqual([]);
    await editAndCount(page, 1);
    await reload(page);
    await editAndCount(page, 1);
  });

  test("a shared link: reload, edit makes one new board", async ({ page }) => {
    await openBoard(page, `#t=${play.link}`, "/en/board/link/");
    await reload(page);
    await editAndCount(page, 1);
    await reload(page);
    await editAndCount(page, 1);
  });

  test("the id in the tab's history is gone: the link still finds the board you had open", async ({ page }) => {
    await saveOwnBoard(page);
    await settled(page);
    await page.evaluate(() => history.replaceState(null, ""));
    await reload(page);
    await editAndCount(page, 1);
  });

  test("a link pasted in the address bar is received; Back brings your board back", async ({ page }) => {
    await saveOwnBoard(page);
    await settled(page);
    const own = await pieces(page);
    await page.evaluate((hash) => (location.hash = hash), `#t=${play.link}`);
    await expectBoard(page, play.board);
    await page.goBack();
    await expect.poll(() => pieces(page)).toEqual(own);
    await editAndCount(page, 1);
  });
});

test.describe("two tabs", () => {
  test("each with its own board: neither overwrites the other's work", async ({ page, context }) => {
    await saveOwnBoard(page);
    const other = await context.newPage();
    await openBoard(other);
    await fromMenu(other, "board.newBoard");
    await dragPlayer(other, 0, 20, 20);
    await expect.poll(async () => (await savedBoards(other)).length).toBe(2);

    // Each tab edits its own board in turn, and saves from the list as it is now.
    for (const tab of [page, other, page, other]) {
      const before = await savedBoards(tab);
      await moveTool(tab);
      await dragPlayer(tab, 5, 10, -10);
      await expect.poll(() => savedBoards(tab)).not.toEqual(before);
    }
    const [a, b] = await Promise.all([page, other].map((tab) => pieces(tab)));
    const boards = await savedBoards(page);
    expect(boards).toHaveLength(2);
    // Each board in storage draws what its tab shows.
    for (const [tab, drawn] of [[page, a], [other, b]] as const) {
      await tab.reload();
      await expect(tab.getByRole("toolbar", { name: "Tools" })).toBeVisible();
      await expect.poll(() => pieces(tab)).toEqual(drawn);
    }
  });
});

test.describe("the list", () => {
  test("New board, open, duplicate with (copy), delete with Undo", async ({ page }) => {
    await openBoard(page);
    await setTitle(page, "Kruising MO–LO");
    await dragPlayer(page, 5, 20, 20);
    const kruising = await pieces(page);
    await fromMenu(page, "board.newBoard");
    await expectBoard(page, defaultBoardFor("en"));
    await dragPlayer(page, 0, 20, 20);
    await expect.poll(async () => (await savedBoards(page)).length).toBe(2);

    await openList(page);
    await list(page).getByRole("button", { name: /Kruising MO–LO/ }).click();
    await expect(list(page)).toBeHidden();
    await expect(page.locator(".title span")).toHaveText("Kruising MO–LO");
    expect(await pieces(page)).toEqual(kruising);

    await openList(page);
    await list(page).getByTitle("More for Kruising MO–LO", { exact: true }).click();
    await list(page).getByRole("button", { name: "Duplicate" }).click();
    await expect(list(page).getByRole("button", { name: /Kruising MO–LO \(copy\)/ })).toBeVisible();
    expect(await savedBoards(page)).toHaveLength(3);

    await list(page).getByTitle("More for Kruising MO–LO (copy)", { exact: true }).click();
    await list(page).getByRole("button", { name: "Delete" }).click();
    const notice = list(page).getByRole("status");
    await expect(notice).toContainText("Board deleted.");
    expect(await savedBoards(page)).toHaveLength(2);
    await notice.getByRole("button", { name: "Undo" }).click();
    await expect(list(page).getByRole("button", { name: /Kruising MO–LO \(copy\)/ })).toBeVisible();
    expect(await savedBoards(page)).toHaveLength(3);
  });

  test("deleting the board on the court leaves the default lineup, and Undo brings it back", async ({ page }) => {
    await openBoard(page);
    await setTitle(page, "Tegen 5-1");
    const drawn = await pieces(page);
    await openList(page);
    await list(page).getByTitle("More for Tegen 5-1", { exact: true }).click();
    await list(page).getByRole("button", { name: "Delete" }).click();
    await expectBoard(page, defaultBoardFor("en"));
    await settled(page);
    expect(await savedBoards(page)).toEqual([]);
    await list(page).getByRole("status").getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".title span")).toHaveText("Tegen 5-1");
    expect(await pieces(page)).toEqual(drawn);
    expect(await savedBoards(page)).toHaveLength(1);
  });

  test("folders: a new one, renamed, and back to no folder", async ({ page }) => {
    await openBoard(page);
    await setTitle(page, "Opwarmen");
    await openList(page);
    await list(page).getByTitle("More for Opwarmen", { exact: true }).click();
    await list(page).getByRole("button", { name: "New folder" }).click();
    await list(page).getByRole("textbox", { name: "Folder name" }).fill("Training Tuesday");
    await page.keyboard.press("Enter");
    const heading = list(page).getByRole("button", { name: "Training Tuesday" });
    await expect(heading).toBeVisible();
    expect((await savedBoards(page))[0]!.folder).toBe("Training Tuesday");

    await heading.click();
    await list(page).getByRole("textbox", { name: "Folder name" }).fill("Tuesday");
    await page.keyboard.press("Enter");
    await expect(list(page).getByRole("button", { name: "Tuesday", exact: true })).toBeVisible();
    expect((await savedBoards(page))[0]!.folder).toBe("Tuesday");

    await list(page).getByTitle("More for Opwarmen", { exact: true }).click();
    await list(page).getByRole("button", { name: "No folder" }).click();
    await expect(list(page).getByRole("button", { name: "Tuesday", exact: true })).toHaveCount(0);
    expect((await savedBoards(page))[0]).not.toHaveProperty("folder");
  });

  test("Escape in a folder name drops it and keeps the list open", async ({ page }) => {
    await openBoard(page);
    await setTitle(page, "Opwarmen");
    await openList(page);
    await list(page).getByTitle("More for Opwarmen", { exact: true }).click();
    await list(page).getByRole("button", { name: "New folder" }).click();
    await list(page).getByRole("textbox", { name: "Folder name" }).fill("Weg");
    await page.keyboard.press("Escape");
    await expect(list(page)).toBeVisible();
    expect((await savedBoards(page))[0]).not.toHaveProperty("folder");
  });
});

test.describe("export and import", () => {
  const BASE = "http://localhost/en/board/#t=";
  const exportButton = (page: Page) => list(page).getByRole("button", { name: "Export all boards" });
  const importButton = (page: Page) => list(page).locator("label", { hasText: "Import boards" });
  const importText = (page: Page, text: string) => chooseFile(page, () => importButton(page).click(), text);
  const notice = (page: Page) => list(page).getByRole("status");
  /** A board of the default lineup with a run from player `from`, as a test board. */
  const withRun = (from: number): Board => {
    const board = defaultBoardFor("en");
    const at = board.frames[0]!.players[from]!.at;
    board.frames[0]!.arrows.push({ kind: "run", from, pts: [at, [at[0], at[1] + 40]] });
    return board;
  };

  test("without boards there is nothing to export, and import is there", async ({ page }) => {
    await openBoard(page);
    await openList(page);
    await expect(exportButton(page)).toHaveCount(0);
    await expect(importButton(page)).toBeVisible();
  });

  test("export right after a change has that change, and makes no copy", async ({ page }) => {
    await page.clock.install();
    await saveOwnBoard(page);
    const [own] = await savedBoards(page);
    // Stop the clock: the save that waits 300 ms after a change can't run.
    await page.clock.pauseAt(Date.now() + 60_000);
    await dragPlayer(page, 0, 20, 20);
    const drawn = await pieces(page);
    expect(await savedBoards(page)).toEqual([own]);
    await openList(page);
    const file = await downloaded(page, () => exportButton(page).click());
    expect(file.name).toMatch(/^coachboard-boards-\d{4}-\d{2}-\d{2}\.json$/);
    const { coachboard, boards } = JSON.parse(file.text);
    expect(coachboard).toBe(1);
    expect(boards).toHaveLength(1);
    expect(boards[0].link).toMatch(/^http:\/\/[^/]+\/en\/board\/#t=2\./);
    const exported = (await decode(new URL(boards[0].link).hash.slice(3)))!;
    await list(page).getByRole("button", { name: "Close" }).click();
    await expectBoard(page, exported);
    // The waiting save runs: still one board, with the change.
    await page.clock.runFor(1000);
    await page.clock.resume();
    await settled(page);
    const kept = await savedBoards(page);
    expect(kept).toHaveLength(1);
    expect(kept[0]!.id).toBe(own!.id);
    await expectBoard(page, kept[0]!.board);
    expect(await pieces(page)).toEqual(drawn);
  });

  test("import adds the new boards with their folder and date, and leaves yours and the court alone", async ({ page }) => {
    await saveOwnBoard(page);
    const [own] = await savedBoards(page);
    const drawn = await pieces(page);
    const at = Date.parse("2026-10-08T17:12:00Z");
    const file = await exportFile(
      [
        { id: "x", board: own!.board, folder: "Somewhere else", at },
        { id: "y", board: withRun(1), folder: "Training Tuesday", at },
        { id: "z", board: withRun(2), at: at - 1 },
      ] as Saved[],
      BASE,
    );
    await openList(page);
    await importText(page, file);
    await expect(notice(page)).toContainText("2 boards added.");
    const boards = await savedBoards(page);
    expect(boards).toHaveLength(3);
    // Yours is already there: it stays one board, in its own folder.
    expect(boards.find((s) => s.id === own!.id)).toEqual(own);
    expect(boards.filter((s) => s.id !== own!.id).map((s) => [s.folder, s.at])).toEqual([
      ["Training Tuesday", at],
      [undefined, at - 1],
    ]);
    await expect(list(page).getByRole("button", { name: "Training Tuesday" })).toBeVisible();
    expect(await pieces(page)).toEqual(drawn);

    // The same file again adds nothing.
    await importText(page, file);
    await expect(notice(page)).toContainText("All boards in this file are already here.");
    expect(await savedBoards(page)).toHaveLength(3);

    // A reload still opens your own board.
    await page.reload();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    expect(await pieces(page)).toEqual(drawn);
  });

  test("one board added, and a file without boards", async ({ page }) => {
    await openBoard(page);
    await openList(page);
    await importText(page, JSON.stringify({ coachboard: 1, boards: [{ link: BASE + (await encode(withRun(3))) }] }));
    await expect(notice(page)).toContainText("1 board added.");
    await expect(list(page).getByRole("button", { name: /Untitled/ })).toHaveCount(1);
    await importText(page, "not a file of boards");
    await expect(notice(page)).toContainText("This file has no boards.");
    expect(await savedBoards(page)).toHaveLength(1);
  });

  test("an imported board opens from the list as it was exported", async ({ page }) => {
    await openBoard(page);
    await openList(page);
    const board = { ...withRun(1), title: "Kruising MO–LO" };
    await importText(page, await exportFile([{ id: "a", board, at: 1 }], BASE));
    await list(page).getByRole("button", { name: /Kruising MO–LO/ }).click();
    await expectBoard(page, board);
  });
});
