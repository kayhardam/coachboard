import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test as base, expect, type Page } from "@playwright/test";
import { beaconEndpoint, beaconSrc } from "../src/data/analytics";
import type { Board } from "../src/lib/board/format";

export { expect };

/**
 * Every test imports `test` from here. It answers the statistics beacon with an
 * empty script and its endpoint with 204, so no test (also not one against a
 * deployed site) sends data to the real dashboard. `beacon.sent` collects what
 * reaches the endpoint; analytics.spec.ts runs the real beacon with page.route(),
 * which comes before these context routes.
 */
export const test = base.extend<{ beacon: { sent: string[] } }>({
  beacon: [
    async ({ context }, use) => {
      const sent: string[] = [];
      // A module script from another origin needs CORS, as Cloudflare sends it.
      await context.route(beaconSrc, (route) =>
        route.fulfill({ contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: "" }),
      );
      await context.route(`${beaconEndpoint}/**`, (route) => {
        sent.push(route.request().postData() ?? "");
        return route.fulfill({ status: 204 });
      });
      await use({ sent });
    },
    { auto: true },
  ],
});

export const STORAGE_KEY = "coachboard.board";

/** Every page in the build, plus a URL that gets the 404 page. The webServer builds before the tests run. */
export function allPages(): string[] {
  const dist = new URL("../dist/", import.meta.url).pathname;
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  return walk(dist)
    .filter((f) => f.endsWith("index.html"))
    .map((f) => "/" + relative(dist, f).replace(/index\.html$/, ""))
    .concat("/en/does-not-exist/")
    .sort();
}

/** Opens the board and waits until the editor has replaced the static fallback. */
export async function openBoard(page: Page, hash = "", path = "/en/board/") {
  await page.goto(`${path}${hash}`);
  await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
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

/** Players and ball of a board, in the same form as `pieces()`; arrows only by count. */
export function expectedPieces(board: Board) {
  const frame = board.frames[0]!;
  return {
    players: frame.players.map((p, i) => `player:${i}:translate(${p.at[0]} ${p.at[1]})`),
    ball: frame.ball ? [`ball:0:translate(${frame.ball[0]} ${frame.ball[1]})`] : [],
    arrows: frame.arrows.length,
  };
}

export async function expectBoard(page: Page, board: Board) {
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

export function saved(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

/** The `#t=` link in the address bar. */
export async function linkInAddressBar(page: Page) {
  await expect(page).toHaveURL(/#t=1\./, { timeout: 1000 });
  return page.url();
}

/**
 * Makes and saves a board of your own: moves the pivot, which no other piece
 * covers, and waits until that move (not the default lineup) is in storage.
 */
export async function saveOwnBoard(page: Page) {
  await openBoard(page);
  await expect.poll(() => saved(page)).not.toBeNull();
  const before = await saved(page);
  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => saved(page)).not.toBe(before);
  return (await saved(page))!;
}
