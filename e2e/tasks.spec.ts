import type { Browser, Locator, Page } from "@playwright/test";
import { defaultBoardFor } from "../src/lib/board/defaults";
import { decode } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import {
  chooseFile,
  downloaded,
  expect,
  expectBoard,
  moreButton,
  openBoard,
  savedBoards,
  saveOwnBoard,
  stubBeacon,
  test,
} from "./helpers";

// The tap budget: the shortest route for each measured task, counted in
// actions (every tap, drag and key press is one). The count must equal the
// budget exactly: a route that needs one more action fails until the budget
// goes up on purpose, and a shorter route fails until it goes down, so every
// gain stays recorded. Change a budget only with the reason in the PR and the
// new measurement in docs/metingen.md ("UX-metingen").
// Opening the board doesn't count, nor does the phone's own share sheet.
// The budget holds in every language: the routes run on /en/ and /nl/.
const TAP_BUDGET = {
  // T1: an attack against a 6-0, three arrows (run, run, pass), shared. Phase 13-2: Arrow is the
  // tool on opening, and a drag from the ball is a pass, so the taps on Run and Pass are gone.
  T1: 4,
  // T1 for a returning coach: their own board is on the court first.
  "T1 with your own board": 6,
  // T4: three boards prepared on a laptop and opened on the phone, sent as links to yourself.
  // Kept for comparison; T4's goal is set on the route below.
  "T4 as links to yourself": 10,
  // T4, the route that counts: the boards moved as one exported file, until each has been on
  // the phone's court. Goal 20 (docs/metingen.md), reached in phase 13-2: no tap on Run.
  "T4 with export and import": 20,
  // T3: the drill "crossing in pairs": two lines of three, a goalkeeper, two cones, a ball and the
  // crossing, shared. Phase 13-3: the starting lineup "2 lines" sets out the drill, so only the
  // crossing is drawn. Goal 5 (docs/metingen.md), reached.
  T3: 5,
  // T3 for a returning coach: their own board is on the court first.
  "T3 with your own board": 7,
  // T3 by hand on an emptied court, without a starting lineup. Kept for comparison.
  "T3 without a starting lineup": 21,
};
/** Of those, the actions until the three boards are in My boards on the phone. */
const T4_UNTIL_IMPORTED = 13;

/** Counts the actions of a route. Every tap is on a button that's already on screen. */
function route(page: Page) {
  let count = 0;
  const centre = async (index: number, kind = "player") => {
    const box = (await page.locator(`.stage [data-kind="${kind}"][data-index="${index}"]`).boundingBox())!;
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
    /** Taps an empty spot on the court, in court coordinates (decimetres). */
    async tapAt(x: number, y: number) {
      const at = await page.locator(".stage svg").evaluate((svg: SVGSVGElement, [x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
        return { x: p.x, y: p.y };
      }, [x, y]);
      await page.mouse.click(at.x, at.y);
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
    /** Drags from a ball's centre to a player's: with Arrow, a pass of whoever has the ball. */
    async passTo(ball: number, to: number) {
      await drag(await centre(ball, "ball"), await centre(to));
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

/** A laptop next to the project's phone: a second device with its own storage, and a stubbed share sheet. */
async function laptop(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 720 } });
  await stubBeacon(context);
  const page = await context.newPage();
  return { context, page, shared: await stubShareSheet(page) };
}

// Players in the default lineup: 0 LW, 1 LB, 2 CB, 3 RB, 4 RW, 5 P (in Dutch LH, LO, MO, RO, RH, CL).
const [LB, CB, RB] = [1, 2, 3];

/** T1 from the default lineup: two runs and a pass (from the ball, which CB has), then Share. */
async function drawAndShare(page: Page, lang: string, steps: ReturnType<typeof route>) {
  await steps.drag(LB, 10, -40);
  await steps.drag(RB, -10, -40);
  await steps.passTo(0, RB);
  await steps.tap(page.getByRole("button", { name: t(lang, "board.share") }));
}

async function expectSharedT1(shared: () => Promise<string[]>, lang: string) {
  await expect.poll(shared).toHaveLength(1);
  const url = new URL((await shared())[0]!);
  expect(url.pathname).toBe(`/${lang}/board/link/`);
  const frame = (await decode(url.hash.replace(/^#t=/, "")))?.frames[0];
  // The attack against a 6-0 is the default lineup, untouched, labelled in the page's language.
  expect(frame?.players).toEqual(defaultBoardFor(lang).frames[0]!.players);
  expect(frame?.arrows).toMatchObject([
    { kind: "run", from: LB },
    { kind: "run", from: RB },
    { kind: "pass", from: CB },
  ]);
}

for (const lang of ["en", "nl"]) {
  test(`T1 (${lang}): the shortest route takes exactly its tap budget`, async ({ page }) => {
    const shared = await stubShareSheet(page);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(page);

    await drawAndShare(page, lang, steps);

    await expectSharedT1(shared, lang);
    expect(steps.count).toBe(TAP_BUDGET.T1);
  });

  test(`T1 (${lang}) with your own board: a new board first, which keeps yours`, async ({ page }) => {
    const shared = await stubShareSheet(page);
    const own = await saveOwnBoard(page);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(page);

    await steps.tap(moreButton(page, lang));
    await steps.tap(page.getByRole("button", { name: t(lang, "board.newBoard"), exact: true }));
    await drawAndShare(page, lang, steps);

    await expectSharedT1(shared, lang);
    // Your own board is still in My boards, next to the new one.
    await expect.poll(async () => (await savedBoards(page)).length).toBe(2);
    expect(await savedBoards(page)).toContainEqual(JSON.parse(own)[0]);
    expect(steps.count).toBe(TAP_BUDGET["T1 with your own board"]);
  });

  // T4: prepare a training on the laptop and open it on the phone the next day.
  // Three boards, each the default lineup with one run (from LB, CB and RB).
  // No titles: typing counts per key and would measure the typing. The boards
  // go to the phone as links to yourself: Share, then a chat or mail, which is
  // outside the page and doesn't count, nor does tapping a link there.
  test(`T4 (${lang}): three boards from the laptop to the phone, as links to yourself`, async ({ browser, baseURL, page }) => {
    const desk = await laptop(browser, baseURL);
    await openBoard(desk.page, "", `/${lang}/board/`);
    const steps = route(desk.page);
    const runs = [LB, CB, RB];

    for (const [i, player] of runs.entries()) {
      if (i > 0) {
        // The next board is a new one: the one before stays in My boards.
        await steps.tap(moreButton(desk.page, lang));
        await steps.tap(desk.page.getByRole("button", { name: t(lang, "board.newBoard"), exact: true }));
      }
      await steps.drag(player, 0, -40);
      await steps.tap(desk.page.getByRole("button", { name: t(lang, "board.share") }));
    }

    // The next day, on the phone: each link opens its board.
    await expect.poll(desk.shared).toHaveLength(runs.length);
    for (const [i, link] of (await desk.shared()).entries()) {
      const url = new URL(link);
      expect(url.pathname).toBe(`/${lang}/board/link/`);
      const board = (await decode(url.hash.replace(/^#t=/, "")))!;
      expect(board.frames[0]!.players).toEqual(defaultBoardFor(lang).frames[0]!.players);
      expect(board.frames[0]!.arrows).toMatchObject([{ kind: "run", from: runs[i] }]);
      await openBoard(page, url.hash, url.pathname);
      await expectBoard(page, board);
    }
    expect(steps.count).toBe(TAP_BUDGET["T4 as links to yourself"]);
    // All three boards are kept on the laptop.
    await expect.poll(async () => (await savedBoards(desk.page)).length).toBe(runs.length);
    await desk.context.close();
  });

  // T4 with My boards: the laptop exports the three boards as one file, which
  // goes to the phone outside the page (AirDrop, mail, a chat: not counted, nor
  // is picking the file in the phone's own chooser). The phone imports it and
  // opens each board from My boards. Same boards as the route with links.
  test(`T4 (${lang}): three boards from the laptop to the phone, exported and imported`, async ({ browser, baseURL, page }) => {
    const desk = await laptop(browser, baseURL);
    await openBoard(desk.page, "", `/${lang}/board/`);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(desk.page);
    const runs = [LB, CB, RB];
    const menuItem = (p: Page, key: Parameters<typeof t>[1]) => p.getByRole("button", { name: t(lang, key), exact: true });
    const list = (p: Page) => p.getByRole("dialog", { name: t(lang, "board.myBoards") });

    for (const [i, player] of runs.entries()) {
      if (i > 0) {
        await steps.tap(moreButton(desk.page, lang));
        await steps.tap(menuItem(desk.page, "board.newBoard"));
      }
      await steps.drag(player, 0, -40);
    }
    await steps.tap(moreButton(desk.page, lang));
    await steps.tap(menuItem(desk.page, "board.myBoards"));
    const file = await downloaded(desk.page, () => steps.tap(list(desk.page).getByRole("button", { name: t(lang, "board.exportAll") })));
    const exported = JSON.parse(file.text).boards as { link: string; at: string }[];
    expect(exported).toHaveLength(runs.length);

    // The next day, on the phone.
    const phone = route(page);
    await phone.tap(moreButton(page, lang));
    await phone.tap(menuItem(page, "board.myBoards"));
    await chooseFile(page, () => phone.tap(list(page).locator("label", { hasText: t(lang, "board.import") })), file.text, file.name);
    await expect(list(page).getByRole("status")).toContainText(t(lang, "board.imported").replace("{count}", "3"));
    expect(steps.count + phone.count).toBe(T4_UNTIL_IMPORTED);
    const onPhone = await savedBoards(page);
    expect(onPhone.map((s) => new Date(s.at).toISOString()).sort()).toEqual(exported.map((b) => b.at).sort());

    // Each board once on the phone's court, from My boards: the newest first in the list.
    const rows = () => list(page).locator("li .open");
    for (const [i, entry] of exported.entries()) {
      if (i > 0) {
        await phone.tap(moreButton(page, lang));
        await phone.tap(menuItem(page, "board.myBoards"));
      }
      await phone.tap(rows().nth(i));
      const board = (await decode(new URL(entry.link).hash.slice(3)))!;
      expect(board.frames[0]!.arrows).toMatchObject([{ kind: "run" }]);
      await expectBoard(page, board);
    }
    expect(steps.count + phone.count).toBe(TAP_BUDGET["T4 with export and import"]);
    // The laptop keeps all three.
    expect(await savedBoards(desk.page)).toHaveLength(runs.length);
    await desk.context.close();
  });
}

// T3: the drill "crossing in pairs" on a half court. Two lines of three attackers without labels,
// a goalkeeper, two cones and a ball with the first of the left line. The crossing: the first on the
// left runs, the first on the right runs behind them, and the left one passes to the right one.
// The goalkeeper is a defender. Attackers 0–2 are the left line, 3–5 the right, the first of each
// line nearest the goal.
const LINES = { left: 60, right: 140, rows: [120, 145, 170] };

/** The crossing: two runs, and a pass from the ball, which the first on the left has. Then Share. */
async function crossAndShare(page: Page, lang: string, steps: ReturnType<typeof route>) {
  await steps.drag(0, 40, -40);
  await steps.drag(3, -40, -30);
  await steps.passTo(0, 3);
  await steps.tap(page.getByRole("button", { name: t(lang, "board.share") }));
}

/** T3 from a new board: the starting lineup "2 lines" sets out the drill. */
async function drawCrossing(page: Page, lang: string, steps: ReturnType<typeof route>) {
  await steps.tap(page.getByRole("button", { name: t(lang, "board.setup.2-lines"), exact: true }));
  await crossAndShare(page, lang, steps);
}

/** T3 by hand, for comparison: the lines, cones, keeper and ball tapped onto an emptied court. */
async function drawCrossingByHand(page: Page, lang: string, steps: ReturnType<typeof route>) {
  const tool = (key: Parameters<typeof t>[1]) =>
    page.getByRole("toolbar", { name: t(lang, "board.tools") }).getByRole("button", { name: t(lang, key) });
  await steps.tap(moreButton(page, lang));
  await steps.tap(page.getByRole("button", { name: t(lang, "board.emptyCourt"), exact: true }));
  await steps.tap(tool("board.tool.attack"));
  for (const x of [LINES.left, LINES.right]) for (const y of LINES.rows) await steps.tapAt(x, y);
  // Two cones in front of the lines, then the goalkeeper.
  await steps.tap(tool("board.tool.cone"));
  await steps.tapAt(LINES.left, 90);
  await steps.tapAt(LINES.right, 90);
  await steps.tap(tool("board.tool.defence"));
  await steps.tapAt(100, 8);
  await steps.tap(tool("board.tool.ball"));
  await steps.tapAt(LINES.left + 14, 120);
  await steps.tap(tool("board.tool.arrow"));
  await crossAndShare(page, lang, steps);
}

/** Checks the pieces and the kinds of arrows, not where they are. */
async function expectSharedT3(shared: () => Promise<string[]>, lang: string) {
  await expect.poll(shared).toHaveLength(1);
  const url = new URL((await shared())[0]!);
  expect(url.pathname).toBe(`/${lang}/board/link/`);
  const board = (await decode(url.hash.replace(/^#t=/, "")))!;
  expect(board.court).toBe("half");
  const frame = board.frames[0]!;
  expect(frame.players.filter((p) => p.team === "a" && !p.label)).toHaveLength(6);
  expect(frame.players.filter((p) => p.team === "d")).toHaveLength(1);
  expect(frame.players).toHaveLength(7);
  expect(board.cones).toHaveLength(2);
  expect(frame.balls).toHaveLength(1);
  expect(frame.arrows).toMatchObject([
    { kind: "run", from: 0 },
    { kind: "run", from: 3 },
    { kind: "pass", from: 0 },
  ]);
}

for (const lang of ["en", "nl"]) {
  test(`T3 (${lang}): the shortest route takes exactly its tap budget`, async ({ page }) => {
    const shared = await stubShareSheet(page);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(page);

    await drawCrossing(page, lang, steps);

    await expectSharedT3(shared, lang);
    expect(steps.count).toBe(TAP_BUDGET.T3);
  });

  test(`T3 (${lang}) with your own board: a new board first, which keeps yours`, async ({ page }) => {
    const shared = await stubShareSheet(page);
    const own = await saveOwnBoard(page);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(page);

    await steps.tap(moreButton(page, lang));
    await steps.tap(page.getByRole("button", { name: t(lang, "board.newBoard"), exact: true }));
    await drawCrossing(page, lang, steps);

    await expectSharedT3(shared, lang);
    await expect.poll(async () => (await savedBoards(page)).length).toBe(2);
    expect(await savedBoards(page)).toContainEqual(JSON.parse(own)[0]);
    expect(steps.count).toBe(TAP_BUDGET["T3 with your own board"]);
  });

  test(`T3 (${lang}) without a starting lineup: by hand, for comparison`, async ({ page }) => {
    const shared = await stubShareSheet(page);
    await openBoard(page, "", `/${lang}/board/`);
    const steps = route(page);

    await drawCrossingByHand(page, lang, steps);

    await expectSharedT3(shared, lang);
    expect(steps.count).toBe(TAP_BUDGET["T3 without a starting lineup"]);
  });
}
