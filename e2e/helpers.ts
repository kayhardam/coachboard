import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { beaconEndpoint, beaconSrc } from "../src/data/analytics";
import { STORE_KEY } from "../src/lib/board/boards";
import { toBoard, type Board, type BoardV1 } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";

export { expect };

/**
 * Answers the statistics beacon in `context` with an empty script and its
 * endpoint with 204, and collects what reaches the endpoint in `sent`. The
 * `test` below does this for every test's own context; a context a test makes
 * itself (a second device) needs it too.
 */
export async function stubBeacon(context: BrowserContext, sent: string[] = []) {
  // A module script from another origin needs CORS, as Cloudflare sends it.
  await context.route(beaconSrc, (route) =>
    route.fulfill({ contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: "" }),
  );
  await context.route(`${beaconEndpoint}/**`, (route) => {
    sent.push(route.request().postData() ?? "");
    return route.fulfill({ status: 204 });
  });
}

/**
 * Every test imports `test` from here. It stubs the statistics beacon (see
 * stubBeacon()), so no test (also not one against a deployed site) sends data
 * to the real dashboard. `beacon.sent` collects what reaches the endpoint;
 * analytics.spec.ts runs the real beacon with page.route(), which comes before
 * these context routes.
 */
export const test = base.extend<{ beacon: { sent: string[] } }>({
  beacon: [
    async ({ context }, use) => {
      const sent: string[] = [];
      await stubBeacon(context, sent);
      await use({ sent });
    },
    { auto: true },
  ],
});

/** My boards in localStorage, and the one board earlier versions kept (src/lib/board/boards.ts). */
export { OLD_KEY, STORE_KEY } from "../src/lib/board/boards";

/** Every page in the build, plus a URL that gets the 404 page. The webServer builds before the tests run. */
export function allPages(): string[] {
  const dist = new URL("../dist/", import.meta.url).pathname;
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  return walk(dist)
    .filter((f) => f.endsWith("index.html"))
    .map((f) => "/" + relative(dist, f).replace(/index\.html$/, ""))
    // A missing page in each language: the host serves the one 404 page.
    .concat("/en/does-not-exist/", "/nl/does-not-exist/")
    .sort();
}

/** Opens the board and waits until the editor has replaced the static fallback. */
export async function openBoard(page: Page, hash = "", path = "/en/board/") {
  await page.goto(`${path}${hash}`);
  const lang = path.split("/")[1]!;
  await expect(page.getByRole("toolbar", { name: t(lang, "board.tools") })).toBeVisible();
}

/** The title bar's More button, which opens the menu with the QR code, the court size and clearing. */
export function moreButton(page: Page, lang = "en") {
  return page.getByTitle(t(lang, "board.more"), { exact: true });
}

/** Opens the More menu and picks `item` (a key of src/i18n/ui.ts). */
export async function fromMenu(page: Page, item: Parameters<typeof t>[1], lang = "en") {
  await moreButton(page, lang).click();
  await page.getByRole("button", { name: t(lang, item), exact: true }).click();
}

/**
 * The pieces the editor draws, as `kind:index:position`. Links are compared by
 * what they draw, not by their text: compression may give other bytes per browser.
 */
export function pieces(page: Page): Promise<string[]> {
  return page.locator(".stage svg").evaluate((svg) =>
    [...svg.querySelectorAll("[data-kind]")]
      .filter((g) => g.getAttribute("data-kind") !== "handle")
      .map((g) => {
        const kind = g.getAttribute("data-kind");
        const where = kind === "arrow" ? g.querySelectorAll("path")[1]?.getAttribute("d") : g.getAttribute("transform");
        return `${kind}:${g.getAttribute("data-index")}:${where}`;
      }),
  );
}

/**
 * Players and balls of a board, in the same form as `pieces()`; arrows only by
 * count. A version 1 board (in fixtures and older saved boards) draws the same.
 */
export function expectedPieces(board: Board | BoardV1) {
  const frame = toBoard(board)!.frames[0]!;
  return {
    players: frame.players.map((p, i) => `player:${i}:translate(${p.at[0]} ${p.at[1]})`),
    ball: frame.balls.map((b, i) => `ball:${i}:translate(${b[0]} ${b[1]})`),
    arrows: frame.arrows.length,
  };
}

export async function expectBoard(page: Page, board: Board | BoardV1) {
  const want = expectedPieces(board);
  await expect
    .poll(async () => {
      const got = await pieces(page);
      return {
        players: got.filter((p) => p.startsWith("player:")),
        ball: got.filter((p) => p.startsWith("ball:")),
        arrows: got.filter((p) => p.startsWith("arrow:")).length,
      };
    })
    .toEqual(want);
}

/** Drags a player by (dx, dy) screen pixels with the pointer. */
export async function dragPlayer(page: Page, index: number, dx: number, dy: number) {
  const box = (await page.locator(`.stage [data-kind="player"][data-index="${index}"]`).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Collects CSP violations from the moment the document exists. */
export async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { cspViolations: string[] }).cspViolations = seen;
    document.addEventListener("securitypolicyviolation", (e) =>
      seen.push(`${e.effectiveDirective} blocked ${e.blockedURI || "inline"}: ${e.sample}`),
    );
  });
  return () => page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);
}

/**
 * The boards in My boards as JSON, or null before the list exists. Opening a
 * board doesn't change it; saving or deleting one does.
 */
export function saved(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.stringify(JSON.parse(raw).boards);
  }, STORE_KEY);
}

/** The boards in My boards, parsed. */
export async function savedBoards(page: Page): Promise<{ id: string; board: Board; folder?: string; at: number }[]> {
  return JSON.parse((await saved(page)) ?? "[]");
}

/** The `#t=` link in the address bar. */
export async function linkInAddressBar(page: Page) {
  await expect(page).toHaveURL(/#t=2\./, { timeout: 1000 });
  return page.url();
}

/**
 * Makes and saves a board of your own: moves the pivot, which no other piece
 * covers, and waits until it is in My boards (an untouched lineup isn't saved).
 */
export async function saveOwnBoard(page: Page) {
  await openBoard(page);
  const before = await saved(page);
  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => saved(page)).not.toBe(before);
  return (await saved(page))!;
}

/** The file the page downloads while `action` runs (Export all boards): its name and its text. */
export async function downloaded(page: Page, action: () => Promise<unknown>) {
  const [download] = await Promise.all([page.waitForEvent("download"), action()]);
  return { name: download.suggestedFilename(), text: readFileSync((await download.path())!, "utf8") };
}

/** Picks `text` as the file in the chooser that `action` opens (Import boards): the device's own picker, outside the page. */
export async function chooseFile(page: Page, action: () => Promise<unknown>, text: string, name = "coachboard-boards.json") {
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), action()]);
  await chooser.setFiles({ name, mimeType: "application/json", buffer: Buffer.from(text) });
}
