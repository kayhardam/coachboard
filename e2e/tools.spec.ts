import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { decode, type Board } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import { dragPlayer, expect, fromMenu, linkInAddressBar, moveTool, openBoard, openViewer, pieces, savedBoards, saveOwnBoard, test } from "./helpers";

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

/** Drags from the centre of a piece to the centre of player `to`. */
async function dragTo(page: Page, kind: string, index: number, to: number) {
  const b = (await player(page, to).boundingBox())!;
  await dragPiece(page, kind, index, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
}

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

    // A tap on an empty spot picks nothing; a tap on the arrow (straight up from LB) picks it again.
    await tapAt(page, 150, 90);
    await expect(kinds(page)).toHaveCount(0);
    await tapAt(page, 16, 95);
    await expect(kinds(page)).toBeVisible();
  });

  test("a drag from the ball is a pass of the player nearest it; far from everyone, of nobody", async ({ page }) => {
    await openBoard(page);
    // The ball is with CB (2): their pass, which starts at CB.
    await dragPiece(page, "ball", 0, await onCourt(page, 184, 112));
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

  // Decision 6 (Kay, 9 October 2026): who receives a pass or bounce has the ball, and a drag from them is
  // their pass; after it, a drag is a run again (pass and go). A pass of a player into the goal is a shot.
  test("a chain of passes over three players, then pass and go", async ({ page }) => {
    await openBoard(page);
    const [CB, RB, RW] = [2, 3, 4];
    await dragTo(page, "ball", 0, RB);
    await dragTo(page, "player", RB, RW);
    await dragPlayer(page, RB, -20, -60);
    expect((await inLink(page)).frames[0]!.arrows.map((a) => [a.kind, a.from])).toEqual([
      ["pass", CB],
      ["pass", RB],
      ["run", RB],
    ]);
  });

  test("a receiver still runs if the kind bar says so", async ({ page }) => {
    await openBoard(page);
    await dragTo(page, "ball", 0, 3);
    await dragPlayer(page, 3, -10, -60);
    await expect(kinds(page).getByRole("button", { name: "Pass" })).toHaveAttribute("aria-pressed", "true");
    await kinds(page).getByRole("button", { name: "Run" }).click();
    await expect.poll(async () => (await inLink(page)).frames[0]!.arrows.map((a) => [a.kind, a.from])).toEqual([
      ["pass", 2],
      ["run", 3],
    ]);
  });

  test("a pass of a player into the goal is a shot; a pass without a player stays a pass", async ({ page }) => {
    await openBoard(page);
    await dragPiece(page, "ball", 0, await onCourt(page, 100, 0));
    expect((await inLink(page)).frames[0]!.arrows).toMatchObject([{ kind: "shot", from: 2, pts: [[100, 130], [100, 0]] }]);

    await moveTool(page);
    await dragPiece(page, "ball", 0, await onCourt(page, 196, 196));
    await tool(page, "Arrow").click();
    await dragPiece(page, "ball", 0, await onCourt(page, 100, 0));
    const arrows = (await inLink(page)).frames[0]!.arrows;
    expect(arrows[1]).toMatchObject({ kind: "pass" });
    expect(arrows[1]!.from).toBeUndefined();
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
    await expect.poll(async () => (await savedBoards(page))[0]?.board.frames[0]!.players[0]).toEqual({ team: "p", at: [8, 16] });
  });
});

// A number or position on a player (Kay, 14 November 2026): in the team bar's
// heading row, tap to edit, as the title. The lineup is one, so every step.
test.describe("number or position", () => {
  const tag = (page: Page) => teams(page).getByRole("button", { name: /^Number or position/ });
  const field = (page: Page) => teams(page).getByRole("textbox", { name: "Number or position" });
  const labels = async (page: Page) => (await inLink(page)).frames.map((f) => f.players[0]!.label);

  test("a tap gives a player a number in every step; Undo puts the old label back", async ({ page }) => {
    await openBoard(page);
    await page.getByRole("button", { name: "New step" }).click();
    await player(page, 0).click();
    // Selecting shows the label, and never opens the keyboard.
    await expect(tag(page)).toHaveAccessibleName("Number or position LW");
    await expect(field(page)).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("INPUT");

    await tag(page).click();
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveValue("LW");
    await field(page).fill(" 7 ");
    await field(page).press("Enter");
    await expect(tag(page)).toHaveAccessibleName("Number or position 7");
    await expect(player(page, 0).locator("text")).toHaveText("7");
    await expect.poll(() => labels(page)).toEqual(["7", "7"]);
    await expect.poll(async () => (await savedBoards(page))[0]?.board.frames.map((f) => f.players[0]!.label)).toEqual(["7", "7"]);

    await page.getByRole("button", { name: "Undo" }).click();
    await player(page, 0).click();
    await expect(tag(page)).toHaveAccessibleName("Number or position LW");
    await expect(player(page, 0).locator("text")).toHaveText("LW");
    await expect.poll(() => labels(page)).toEqual(["LW", "LW"]);
  });

  test("Backspace in the field takes a character, not the player; Escape and an empty label", async ({ page }) => {
    await openBoard(page);
    const count = await page.locator(".stage [data-kind=player]").count();
    await player(page, 0).click();
    await tag(page).click();
    // The cursor at the end (focusField() selects the label; End doesn't move it in WebKit).
    await field(page).evaluate((f: HTMLInputElement) => f.setSelectionRange(2, 2));
    await field(page).press("Backspace");
    await expect(field(page)).toHaveValue("L");
    await field(page).blur();
    await expect(page.locator(".stage [data-kind=player]")).toHaveCount(count);
    await expect(player(page, 0).locator("text")).toHaveText("L");

    // Escape drops what was typed; at most three characters.
    await tag(page).click();
    await field(page).pressSequentially("1234");
    await expect(field(page)).toHaveValue("123");
    await field(page).press("Escape");
    await expect(tag(page)).toHaveAccessibleName("Number or position L");

    // Empty: no label, only the pencil.
    await tag(page).click();
    await field(page).fill("");
    await field(page).press("Enter");
    await expect(tag(page)).toHaveAccessibleName("Number or position");
    await expect(player(page, 0).locator("text")).toHaveCount(0);
    await expect.poll(() => labels(page)).toEqual([undefined]);

    // A passer has no label, and no field for one.
    await teams(page).getByRole("button", { name: "Passer" }).click();
    await expect(tag(page)).toHaveCount(0);
  });

  test("a tap on the court keeps the label for the player it was typed for", async ({ page }) => {
    await openBoard(page);
    await player(page, 0).click();
    await tag(page).click();
    await field(page).fill("9");
    await player(page, 1).click();
    await expect(player(page, 0).locator("text")).toHaveText("9");
    await expect(tag(page)).toHaveAccessibleName("Number or position LB");
  });

  test("the shared link shows the number in the viewer", async ({ page }) => {
    await openBoard(page);
    await player(page, 0).click();
    await tag(page).click();
    await field(page).fill("11");
    await field(page).press("Enter");
    await expect.poll(() => labels(page)).toEqual(["11"]);
    const link = new URL(await linkInAddressBar(page)).hash;
    await openViewer(page, link);
    await expect(page.locator('[data-kind="player"][data-index="0"] text')).toHaveText("11");
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
    for (const x of [20, 60, 140, 180]) await tapAt(page, x, 150);
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
    await openBoard(page, `#t=${play.link}`);
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

test.describe("clear of each other", () => {
  // The default lineup: 1 LB, 2 CB (100, 130), 3 RB; 9 the defender at (80, 66) who stays.
  const [LB, CB, D] = [1, 2, 9];
  const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  test("a run let go on a defender who stays stops 2 m before him; on a teammate who leaves, it ends on his spot", async ({ page }) => {
    await openBoard(page);
    // CB's run, let go on the defender: it ends 20 dm before him, on the way there.
    await dragTo(page, "player", CB, D);
    let board = await inLink(page);
    const run = board.frames[0]!.arrows[0]!;
    expect(run).toMatchObject({ kind: "run", from: CB });
    expect(dist(run.pts.at(-1)!, [80, 66])).toBeCloseTo(20, 0);
    expect(run.pts.at(-1)![1]).toBeGreaterThan(66);
    // LB runs to where CB stood: CB leaves it this step, so the run ends there.
    await dragTo(page, "player", LB, CB);
    board = await inLink(page);
    expect(board.frames[0]!.arrows[1]).toMatchObject({ kind: "run", from: LB, pts: [expect.anything(), [100, 130]] });
    // After New step (the court shows step 2, so read the link itself), nobody stands on anyone.
    await page.getByRole("button", { name: "New step", exact: true }).click();
    const linked = async () => (await decode(new URL(page.url()).hash.replace(/^#t=/, "")))!;
    await expect.poll(async () => (await linked()).frames.length).toBe(2);
    const next = (await linked()).frames[1]!.players.map((p) => p.at);
    for (let i = 0; i < next.length; i++) for (let j = i + 1; j < next.length; j++) expect(dist(next[i]!, next[j]!)).toBeGreaterThan(17);
  });

  test("Move never sets a player down on another", async ({ page }) => {
    await openBoard(page);
    await tool(page, "Move").click();
    await dragTo(page, "player", LB, CB);
    // The link follows the drag 300 ms later; poll until it has the drop.
    const between = async () => {
      const f = (await inLink(page)).frames[0]!;
      expect(f.players[CB]!.at).toEqual([100, 130]);
      return dist(f.players[LB]!.at, f.players[CB]!.at);
    };
    await expect.poll(between).toBeLessThan(20);
    expect(await between()).toBeGreaterThanOrEqual(17);
  });
});
