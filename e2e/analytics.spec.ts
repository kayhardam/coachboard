import { readFileSync } from "node:fs";
import { analyticsToken, beaconSrc } from "../src/data/analytics";
import type { Board, BoardV1 } from "../src/lib/board/format";
import { dragPlayer, expect, expectBoard, linkInAddressBar, openViewer, test, watchViolations } from "./helpers";

// The statistics beacon (Cloudflare Web Analytics) on the board pages; see
// src/components/Beacon.astro. Other specs answer it with an empty script.

const fixture = JSON.parse(
  readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
) as { link: string; board: BoardV1 };
// For the viewer: the crossing, whose players move in every step.
const play = JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as {
  link: string;
  board: Board;
};

test("the editor on /en/board/ doesn't wait for the beacon", async ({ page }) => {
  // The beacon never arrives: the editor must load and work all the same.
  // (The load event does wait for it, so goto waits only for the response.)
  await page.route(beaconSrc, () => {});
  await page.goto(`/en/board/#t=${fixture.link}`, { waitUntil: "commit" });
  await expectBoard(page, fixture.board);
  await dragPlayer(page, 5, 30, 30);
  await expect.poll(() => page.url()).not.toContain(fixture.link);
  expect(new URL(await linkInAddressBar(page)).pathname).toBe("/en/board/");
});

for (const path of ["/en/board/link/", "/en/board/qr/"]) {
  test(`the viewer on ${path} doesn't wait for the beacon`, async ({ page }) => {
    await page.route(beaconSrc, () => {});
    await page.goto(`${path}#t=${play.link}`, { waitUntil: "commit" });
    await expectBoard(page, play.board);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(".viewer .count [aria-hidden]")).toHaveText("2/4");
  });
}

test("the real beacon sends no board and stores nothing", async ({ page, context, beacon }) => {
  // This test fetches the real beacon from Cloudflare; its endpoint stays answered by the fixture.
  await page.route(beaconSrc, async (route) => route.fulfill({ response: await route.fetch() }));
  const violations = await watchViolations(page);

  await openViewer(page, `?via=test#t=${play.link}`);
  await expectBoard(page, play.board);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator(".viewer .count [aria-hidden]")).toHaveText("2/4");
  // The viewer keeps nothing: watching changes no storage.
  const storage = () => page.evaluate(() => ({ local: Object.keys(localStorage), session: sessionStorage.length }));
  expect(await storage()).toEqual({ local: [], session: 0 });
  expect(await violations()).toEqual([]);

  // The beacon sends on load and again when the page is left. WebKit doesn't
  // show the body of a sendBeacon() to the route; its XHRs have one.
  await page.goto("/en/");
  const bodies = () => beacon.sent.filter(Boolean);
  await expect.poll(() => bodies().length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin;
  for (const body of bodies()) {
    expect(body).not.toContain("#t=");
    expect(body).not.toContain(play.link.slice(2, 40));
    expect(body).not.toContain("via=test");
    expect(JSON.parse(body)).toMatchObject({ location: `${origin}/en/board/link/`, siteToken: analyticsToken });
  }
  expect(await context.cookies()).toEqual([]);
});
