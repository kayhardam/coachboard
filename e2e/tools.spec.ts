import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { decode, type Board } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import { dragPlayer, expect, fromMenu, moveTool, openBoard, pieces, savedBoards, saveOwnBoard, test } from "./helpers";

// Phase 13-2: Arrow is the tool on opening and picks what a tap is on; a bar
// over the court changes what is picked (the kind of an arrow, the team of a
// player) or, on a new board, offers the starting lineups. Cones, more balls,
// and the keys 1–6 for the tools.

const play = JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as {
  link: string;
};

const tools = (page: Page) => page.getByRole("toolbar", { name: "Tools" });
const tool = (page: Page, name: string) => tools(page).getByRole("button", { name, exact: true });
const bar = (page: Page, name: string) => page.getByRole("toolbar", { name });
const kinds = (page: Page) => bar(page, "Arrow type");
const teams = (page: Page) => bar(page, "Team");
const setups = (page: Page, lang = "en") => bar(page, t(lang, "board.setup"));
/** A starting lineup's button: its name keeps the defence on one line with a non-breaking hyphen. */
const setup = (page: Page, name: string, lang = "en") =>
  setups(page, lang).getByRole("button", { name: name.replaceAll("-", "\u2011") });

/** The board in the address bar, once it draws what the court shows. */
async function inLink(page: Page): Promise<Board> {
  let board: Board | null = null;
  await expect
    .poll(async () => {
      board = await decode(new URL(page.url()).hash.replace(/^#t=/, ""));
      const drawn = await pieces(page);
      return board !== null && drawn.filter((p) => p.startsWith("arrow:")).length === board.frames[0]!.arrows.length &&
        drawn.filter((p) => p.startsWith("cone:")).length === board.cones.length &&
        drawn.filter((p) => p.startsWith("ball:")).length === board.frames[0]!.balls.length;
    })
    .toBe(true);
  return board!;
}

/** The screen point of a court point (decimetres). */
function onCourt(page: Page, x: number, y: number) {
  return page.locator(".stage svg").evaluate((svg: SVGSVGElement, [x, y]) => {
    const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
    return { x: p.x, y: p.y };
  }, [x, y]);
}

async function tapAt(page: Page, x: number, y: number) {
  const at = await onCourt(page, x, y);
  await page.mouse.click(at.x, at.y);
}

async function dragPiece(page: Page, kind: string, index: number, to: { x: number; y: number }) {
  const box = (await page.locator(`.stage [data-kind="${kind}"][data-index="${index}"]`).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

const player = (page: Page, index: number) => page.locator(`.stage [data-kind="player"][data-index="${index}"]`);

test.describe("Arrow", () => {
  test("is the tool on opening: a tap picks a player or an arrow, a drag draws", async ({ page }) => {
    await openBoard(page);
    await expect(tool(page, "Arrow")).toHaveAttribute("aria-pressed", "true");

    // A tap on the pivot picks them: the team bar, and no arrow.
    await player(page, 5).click();
    await expect(teams(page).getByRole("button", { name: "Attack" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();

    // A drag from LB draws their run, picked: the kind bar.
    await dragPlayer(page, 1, 0, -60);
    await expect(kinds(page).getByRole("button", { name: "Run" })).toHaveAttribute("aria-pressed", "true");
    await expect(teams(page)).toHaveCount(0);
    expect((await inLink(page)).frames[0]!.arrows).toMatchObject([{ kind: "run", from: 1 }]);

    // A tap on an empty spot picks nothing; a tap on the arrow picks it again.
    await tapAt(page, 150, 90);
    await expect(kinds(page)).toHaveCount(0);
    await tapAt(page, 30, 95);
    await expect(kinds(page)).toBeVisible();
  });

  test("a drag from the ball is a pass of the player nearest it; far from everyone, of nobody", async ({ page }) => {
    await openBoard(page);
    // The ball is with CB (2): their pass, which starts at CB.
    await dragPiece(page, "ball", 0, await onCourt(page, 170, 118));
    expect((await inLink(page)).frames[0]!.arrows).toMatchObject([{ kind: "pass", from: 2 }]);
    await expect(kinds(page).getByRole("button", { name: "Pass" })).toHaveAttribute("aria-pressed", "true");

    // The ball in the corner, far from everyone: a pass without a player, which can't be a shot.
    await moveTool(page);
    await dragPiece(page, "ball", 0, await onCourt(page, 196, 196));
    await tool(page, "Arrow").click();
    await dragPiece(page, "ball", 0, await onCourt(page, 150, 160));
    const arrows = (await inLink(page)).frames[0]!.arrows;
    expect(arrows).toHaveLength(2);
    expect(arrows[1]).toMatchObject({ kind: "pass" });
    expect(arrows[1]!.from).toBeUndefined();
    await expect(kinds(page).getByRole("button", { name: "Shot" })).toBeDisabled();
  });

  test("the kind bar changes the kind of the arrow: a shot ends in the goal", async ({ page }) => {
    await openBoard(page);
    await dragPlayer(page, 1, 0, -60);
    for (const [name, kind] of [["Screen", "block"], ["Bounce", "bounce"], ["Dribble", "dribble"], ["Shot", "shot"]]) {
      await kinds(page).getByRole("button", { name }).click();
      await expect(kinds(page).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      await expect.poll(async () => (await inLink(page)).frames[0]!.arrows[0]!.kind).toBe(kind);
    }
    const shot = (await inLink(page)).frames[0]!.arrows[0]!;
    expect(shot.from).toBe(1);
    expect(shot.pts[1]![1]).toBe(0);
    // One undo step per change.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(async () => (await inLink(page)).frames[0]!.arrows[0]!.kind).toBe("dribble");
  });

  test("the team bar makes a passer, who has no label, and saves a valid board", async ({ page }) => {
    await openBoard(page);
    await player(page, 0).click();
    await teams(page).getByRole("button", { name: "Passer" }).click();
    await expect(teams(page).getByRole("button", { name: "Passer" })).toHaveAttribute("aria-pressed", "true");
    await expect(player(page, 0).locator("text")).toHaveCount(0);
    await expect.poll(async () => (await savedBoards(page))[0]?.board.frames[0]!.players[0]).toEqual({ team: "p", at: [8, 48] });
  });
});

test.describe("cones and balls", () => {
  test("Cone puts cones down; they move with Move, and Delete removes one", async ({ page }) => {
    await openBoard(page);
    await tool(page, "Cone").click();
    await tapAt(page, 60, 100);
    await tapAt(page, 140, 100);
    await expect(page.locator('.stage [data-kind="cone"]')).toHaveCount(2);
    expect((await inLink(page)).cones).toEqual([
      [60, 100],
      [140, 100],
    ]);

    await moveTool(page);
    await dragPiece(page, "cone", 0, await onCourt(page, 40, 180));
    // Within a decimetre: the drag starts at the middle of the cone's drawing, not at its point.
    const near = async () => (await inLink(page)).cones[0]!.map((v, i) => Math.abs(v - [40, 180][i]!) <= 1);
    await expect.poll(near).toEqual([true, true]);

    await tapAt(page, 140, 100);
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator('.stage [data-kind="cone"]')).toHaveCount(1);
    // The board is valid, so it stays in My boards.
    const cone = (await inLink(page)).cones[0];
    await expect.poll(async () => (await savedBoards(page))[0]?.board.cones).toEqual([cone]);
    await page.reload();
    await expect(page.locator('.stage [data-kind="cone"]')).toHaveCount(1);
  });

  test("Ball adds a ball, up to four", async ({ page }) => {
    await openBoard(page);
    await tool(page, "Ball").click();
    for (const x of [20, 60, 140, 180]) await tapAt(page, x, 100);
    await expect(page.locator('.stage [data-kind="ball"]')).toHaveCount(4);
    expect((await inLink(page)).frames[0]!.balls).toHaveLength(4);
  });
});

test.describe("starting lineups", () => {
  test("a new board offers them; picking one saves nothing, the first edit does and hides them", async ({ page }) => {
    await openBoard(page);
    await expect(setups(page)).toBeVisible();
    const defenders = () => pieces(page).then((all) => all.filter((p) => /^player:(7|8|9|10|11|12):/.test(p)));
    const sixZero = await defenders();
    await setup(page, "vs 5-1").click();
    await expect.poll(defenders).not.toEqual(sixZero);
    // Switch again: the strip stays until the first edit.
    await setup(page, "3 lines").click();
    await expect(page.locator('.stage [data-kind="cone"]')).toHaveCount(3);
    await setup(page, "vs 3-2-1").click();
    await expect(page.locator('.stage [data-kind="cone"]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await savedBoards(page)).toEqual([]);

    await dragPlayer(page, 1, 0, -60);
    await expect(setups(page)).toHaveCount(0);
    await expect.poll(async () => (await savedBoards(page)).length).toBe(1);

    // New board: the strip again.
    await fromMenu(page, "board.newBoard");
    await expect(setups(page)).toBeVisible();
  });

  test("not on a received board, nor on one of yours", async ({ page }) => {
    await openBoard(page, `#t=${play.link}`, "/en/board/link/");
    await expect(page.locator(".stage [data-kind=player]").first()).toBeVisible();
    await expect(setups(page)).toHaveCount(0);

    await saveOwnBoard(page);
    await page.reload();
    await expect(tools(page)).toBeVisible();
    await expect(setups(page)).toHaveCount(0);
  });

  test("in Dutch, against a 5-1 the middle defender stands beside the pivot", async ({ page }) => {
    await openBoard(page, "", "/nl/board/");
    await setup(page, t("nl", "board.setup.5-1"), "nl").click();
    await expect.poll(async () => (await inLink(page)).frames[0]!.players.filter((p) => p.team === "d").length).toBe(7);
    const players = (await inLink(page)).frames[0]!.players;
    const pivot = players.find((p) => p.label === "CL")!.at;
    for (const d of players.filter((p) => p.team === "d")) {
      expect(Math.hypot(d.at[0] - pivot[0], d.at[1] - pivot[1])).toBeGreaterThan(9);
    }
  });
});

test.describe("keys 1–6", () => {
  test("pick a tool, but not while typing a title or a folder name", async ({ page }) => {
    await openBoard(page);
    await expect(tool(page, "Move")).toHaveAttribute("aria-keyshortcuts", "1");
    await expect(tool(page, "Move")).toHaveAttribute("title", "Move (1)");
    await page.keyboard.press("1");
    await expect(tool(page, "Move")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("6");
    await expect(tool(page, "Cone")).toHaveAttribute("aria-pressed", "true");

    await page.getByTitle("Edit title").click();
    await page.keyboard.type("6-0 2");
    await expect(tool(page, "Cone")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(page.locator(".title span")).toHaveText("6-0 2");

    // A folder name, in My boards (the titled board is in it).
    await fromMenu(page, "board.myBoards");
    const list = page.getByRole("dialog", { name: "My boards" });
    await list.getByTitle(/More for/).first().click();
    await list.getByRole("button", { name: "New folder" }).click();
    await page.keyboard.type("U13");
    await page.keyboard.press("Enter");
    await expect(list.getByRole("button", { name: /U13/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tool(page, "Cone")).toHaveAttribute("aria-pressed", "true");
  });
});
