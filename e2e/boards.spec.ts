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
  moreButton,
  OLD_KEY,
  openBoard,
  pieces,
  savedBoards,
  saveOwnBoard,
  STORE_KEY,
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

  test("a received board is saved from More as it is, once, and a reload opens it without a copy", async ({ page }) => {
    await openBoard(page);
    await moreButton(page).click();
    // A new board isn't received: it is saved at its first change.
    await expect(page.getByRole("button", { name: "Save to My boards" })).toHaveCount(0);

    await page.goto("/en/");
    await openBoard(page, `#t=${play.link}`);
    await fromMenu(page, "board.save");
    await expect(page.getByRole("status")).toContainText("Saved to My boards.");
    const boards = await savedBoards(page);
    expect(boards).toHaveLength(1);
    await expectBoard(page, boards[0]!.board);
    await moreButton(page).click();
    await expect(page.getByRole("button", { name: "Save to My boards" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    await dragPlayer(page, 0, 20, 20);
    await settled(page);
    expect((await savedBoards(page)).map((s) => s.id)).toEqual([boards[0]!.id]);
  });

  test("without storage, saving a received board says nothing", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Blocked", "SecurityError");
      };
    });
    await openBoard(page, `#t=${play.link}`);
    await fromMenu(page, "board.save");
    await page.waitForTimeout(300);
    await expect(page.getByRole("status")).toHaveCount(0);
    await moreButton(page).click();
    await expect(page.getByRole("button", { name: "Save to My boards" })).toBeVisible();
  });

  test("editing a received link makes a new board, and yours stays", async ({ page, context }) => {
    const own = JSON.parse(await saveOwnBoard(page))[0];
    const other = await context.newPage();
    await openBoard(other, `#t=${play.link}`);
    await settled(other);
    expect(await savedBoards(other)).toEqual([own]);

    await dragPlayer(other, 0, 20, 20);
    await expect.poll(async () => (await savedBoards(other)).length).toBe(2);
    expect(await savedBoards(other)).toContainEqual(own);
  });
});

// After Save to My boards, the notice stays and offers the board's folder (t6-korter-a): Add to the
// latest folder, or New folder with a name field in the notice. The field works as in My boards.
test.describe("the folder from the notice after saving", () => {
  const notice = (page: Page) => page.getByRole("status");
  const nameField = (page: Page) => notice(page).getByRole("textbox", { name: "Folder name" });

  /** My boards with these folders, one board each; the last is the latest. */
  async function withFolders(page: Page, folders: string[]) {
    await page.goto("/en/");
    const boards = folders.map((folder, i) => ({ id: `f${i}`, board: { ...defaultBoardFor("en"), title: `Board ${i}` }, folder, at: 1000 + i }));
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORE_KEY, JSON.stringify({ current: null, boards })] as const);
  }

  async function saveReceived(page: Page) {
    await openBoard(page, `#t=${play.link}`);
    await fromMenu(page, "board.save");
    await expect(notice(page)).toContainText("Saved to My boards.");
  }

  /** The folder of the board on the court (the one saved last). */
  const folderOfSaved = async (page: Page) => (await savedBoards(page)).find((s) => s.board.title === play.board.title)?.folder;

  test("without folders only New folder; Enter puts the board in it, and the notice says so for six seconds", async ({ page }) => {
    await page.clock.install();
    await saveReceived(page);
    await expect(notice(page).getByRole("button", { name: /^Add to / })).toHaveCount(0);
    // Lasting: it waits for the coach.
    await page.clock.runFor(10_000);
    await notice(page).getByRole("button", { name: "New folder", exact: true }).click();
    await nameField(page).fill("Tuesday");
    await page.keyboard.press("Enter");
    await expect(notice(page)).toContainText("Saved to Tuesday.");
    expect(await folderOfSaved(page)).toBe("Tuesday");
    await page.clock.runFor(6500);
    await expect(notice(page)).toHaveCount(0);
  });

  test("leaving the name field keeps the name, as Done or a tap beside it does on a phone", async ({ page }) => {
    await saveReceived(page);
    await notice(page).getByRole("button", { name: "New folder", exact: true }).click();
    await nameField(page).fill("Tuesday");
    // A tap beside the field: on the court's empty top corner.
    const court = (await page.locator(".stage svg").boundingBox())!;
    await page.mouse.click(court.x + 4, court.y + court.height - 4);
    await expect(notice(page)).toContainText("Saved to Tuesday.");
    expect(await folderOfSaved(page)).toBe("Tuesday");
  });

  test("Escape drops the name: the board stays saved without a folder, and the notice offers it again", async ({ page }) => {
    await saveReceived(page);
    await notice(page).getByRole("button", { name: "New folder", exact: true }).click();
    await nameField(page).fill("Tuesday");
    await page.keyboard.press("Escape");
    await expect(nameField(page)).toHaveCount(0);
    await expect(notice(page).getByRole("button", { name: "New folder", exact: true })).toBeVisible();
    const boards = await savedBoards(page);
    expect(boards).toHaveLength(1);
    expect(boards[0]!.folder).toBeUndefined();
  });

  test("Add to the latest folder puts the board at its bottom; New folder can start the next training", async ({ page }) => {
    await withFolders(page, ["Older", "Last week"]);
    await saveReceived(page);
    await expect(notice(page).getByRole("button", { name: "Add to Older" })).toHaveCount(0);
    await notice(page).getByRole("button", { name: "Add to Last week", exact: true }).click();
    await expect(notice(page)).toContainText("Saved to Last week.");
    expect((await savedBoards(page)).filter((s) => s.folder === "Last week").map((s) => s.board.title)).toEqual(["Board 1", play.board.title]);
  });

  test("New folder with a name in use adds the board to that folder's bottom", async ({ page }) => {
    await withFolders(page, ["Older", "Last week"]);
    await saveReceived(page);
    await notice(page).getByRole("button", { name: "New folder", exact: true }).click();
    await nameField(page).fill("Older");
    await page.keyboard.press("Enter");
    await expect(notice(page)).toContainText("Saved to Older.");
    expect((await savedBoards(page)).filter((s) => s.folder === "Older").map((s) => s.board.title)).toEqual(["Board 0", play.board.title]);
  });

  test("an empty name puts the board in no folder", async ({ page }) => {
    await saveReceived(page);
    await notice(page).getByRole("button", { name: "New folder", exact: true }).click();
    await nameField(page).fill("   ");
    await page.keyboard.press("Enter");
    await expect(notice(page)).toHaveCount(0);
    expect(await folderOfSaved(page)).toBeUndefined();
  });

  test("an edit closes the notice; the board stays saved without a folder", async ({ page }) => {
    await saveReceived(page);
    await dragPlayer(page, 0, 20, 20);
    await expect(notice(page)).toHaveCount(0);
    expect(await folderOfSaved(page)).toBeUndefined();
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
    await openBoard(page, `#t=${play.link}`);
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

/** `boards` in My boards, then the editor opened. */
async function withList(page: Page, boards: Saved[]) {
  await page.goto("/en/");
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORE_KEY, JSON.stringify({ current: null, boards })]);
  await openBoard(page);
}

/** A board with a title, LB moved by `x`, so each is its own board. */
function titled(title: string, x: number): Board {
  const board = { ...defaultBoardFor("en"), title };
  board.frames[0]!.players[1]!.at = [30 + x, 100];
  return board;
}

/** The titles in the list, from group `group` on (all groups by default), in the order shown. */
const namesIn = (page: Page, group?: number) =>
  (group === undefined ? list(page) : list(page).locator("ul").nth(group)).locator(".name");

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

  test("a folder keeps its own order: a board put in it goes last, Move up and Move down, and the export keeps it", async ({ page }) => {
    await withList(page, [
      { id: "a", board: titled("Opwarmen", 1), folder: "Tuesday", at: 3 },
      { id: "b", board: titled("Kruising", 2), folder: "Tuesday", at: 1 },
      { id: "c", board: titled("Afronden", 3), at: 5 },
    ]);
    await openList(page);
    await list(page).getByTitle("More for Afronden", { exact: true }).click();
    await list(page).locator(".actions-panel").getByRole("button", { name: "Tuesday", exact: true }).click();
    await expect(namesIn(page)).toHaveText(["Opwarmen", "Kruising", "Afronden"]);

    await list(page).getByTitle("More for Opwarmen", { exact: true }).click();
    await expect(list(page).getByRole("button", { name: "Move up" })).toHaveCount(0);
    await list(page).getByRole("button", { name: "Move down" }).click();
    await expect(namesIn(page)).toHaveText(["Kruising", "Opwarmen", "Afronden"]);
    await list(page).getByTitle("More for Afronden", { exact: true }).click();
    await expect(list(page).getByRole("button", { name: "Move down" })).toHaveCount(0);
    await list(page).getByRole("button", { name: "Move up" }).click();
    await expect(namesIn(page)).toHaveText(["Kruising", "Afronden", "Opwarmen"]);

    const file = await downloaded(page, () => list(page).getByRole("button", { name: "Export all boards" }).click());
    const titles = await Promise.all(JSON.parse(file.text).boards.map(async (b: { link: string }) => (await decode(new URL(b.link).hash.slice(3)))!.title));
    expect(titles).toEqual(["Kruising", "Afronden", "Opwarmen"]);
  });

  test("Share folder sends the folder's name, then each board's title and its link to the viewer, in order", async ({ page }) => {
    await page.addInitScript(() => {
      navigator.share = async (data) => void ((window as unknown as { shared: ShareData }).shared = data!);
    });
    await withList(page, [
      { id: "a", board: titled("Opwarmen", 1), folder: "Tuesday", at: 3 },
      { id: "c", board: titled("Los", 3), at: 5 },
      { id: "b", board: defaultBoardFor("en"), folder: "Tuesday", at: 1 },
    ]);
    await openList(page);
    await list(page).getByTitle("More for Tuesday", { exact: true }).click();
    await list(page).getByRole("button", { name: "Share folder" }).click();
    const shared = await page.waitForFunction(() => (window as unknown as { shared?: ShareData }).shared);
    const { text } = (await shared.jsonValue())!;
    const [name, ...boards] = text!.split("\n\n");
    expect(name).toBe("Tuesday");
    expect(boards.map((b) => b.split("\n")[0])).toEqual(["Opwarmen", "Untitled"]);
    for (const [i, want] of [titled("Opwarmen", 1), defaultBoardFor("en")].entries()) {
      const link = new URL(boards[i]!.split("\n")[1]!);
      expect(link.pathname).toBe("/en/board/link/");
      expect(await decode(link.hash.slice(3))).toEqual(want);
    }
  });

  test("Share folder without a share sheet copies the message", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
      });
    });
    await withList(page, [{ id: "a", board: titled("Opwarmen", 1), folder: "Tuesday", at: 3 }]);
    await openList(page);
    await list(page).getByTitle("More for Tuesday", { exact: true }).click();
    await list(page).getByRole("button", { name: "Share folder" }).click();
    await expect(list(page).getByRole("status")).toContainText("Links copied.");
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toMatch(/^Tuesday\n\nOpwarmen\nhttp.*\/en\/board\/link\/#t=2\./);
  });

  test("Duplicate folder: a copy on top with every board in order, its name open to change, and (copy 2) the next time", async ({ page }) => {
    await withList(page, [
      { id: "a", board: titled("Opwarmen", 1), folder: "Week 1", at: 3 },
      { id: "b", board: titled("Kruising", 2), folder: "Week 1", at: 1 },
      { id: "c", board: titled("Los", 3), folder: "Later", at: 9 },
    ]);
    await openList(page);
    await list(page).getByTitle("More for Week 1", { exact: true }).click();
    await list(page).getByRole("button", { name: "Duplicate folder" }).click();
    const name = list(page).getByRole("textbox", { name: "Folder name" });
    await expect(name).toBeFocused();
    await expect(name).toHaveValue("Week 1 (copy)");
    await name.fill("Week 2");
    await page.keyboard.press("Enter");
    await expect(list(page).locator("h3")).toHaveText(["Week 2", "Later", "Week 1"]);
    await expect(namesIn(page, 0)).toHaveText(["Opwarmen", "Kruising"]);
    expect((await savedBoards(page)).filter((s) => s.folder === "Week 2").map((s) => s.board.title)).toEqual(["Opwarmen", "Kruising"]);

    await list(page).getByTitle("More for Week 1", { exact: true }).click();
    await list(page).getByRole("button", { name: "Duplicate folder" }).click();
    await expect(name).toHaveValue("Week 1 (copy)");
    await page.keyboard.press("Enter");
    await list(page).getByTitle("More for Week 1", { exact: true }).click();
    await list(page).getByRole("button", { name: "Duplicate folder" }).click();
    await expect(name).toHaveValue("Week 1 (copy 2)");
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
        { id: "x", board: own!.board, at },
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
    // Yours is already there, without a folder: it stays one board.
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
