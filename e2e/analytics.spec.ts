import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { beaconSrc } from "../src/data/analytics";
import type { Board } from "../src/lib/board/format";
import { dragPlayer, expect, expectBoard, linkInAddressBar, openBoard, STORAGE_KEY, test, watchViolations } from "./helpers";

// The statistics beacon (Cloudflare Web Analytics) on the board pages; see
// src/components/Beacon.astro. Other specs answer it with an empty script.

const fixture = JSON.parse(
  readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
) as { link: string; board: Board };

for (const path of ["/en/board/", "/en/board/link/", "/en/board/qr/"]) {
  test(`the board on ${path} doesn't wait for the beacon`, async ({ page }) => {
    // The beacon never arrives: the editor must load and work all the same.
    // (The load event does wait for it, so goto waits only for the response.)
    await page.route(beaconSrc, () => {});
    await page.goto(`${path}#t=${fixture.link}`, { waitUntil: "commit" });
    await expectBoard(page, fixture.board);
    await dragPlayer(page, 5, 30, 30);
    await expect.poll(() => page.url()).not.toContain(fixture.link);
    expect(new URL(await linkInAddressBar(page)).pathname).toBe(path);
  });
}

/** Serves the page with a test token, so the beacon runs: without a token it does nothing. */
async function withToken(page: Page) {
  await page.route(/\/board\/(?:link\/|qr\/)?(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/(&quot;token&quot;:&quot;)[^&]*(&quot;)/, "$1e2e-token$2");
    await route.fulfill({ response, body });
  });
}

test("the real beacon sends no board and stores nothing", async ({ page, context, beacon }) => {
  // This test fetches the real beacon from Cloudflare; its endpoint stays answered by the fixture.
  await page.route(beaconSrc, async (route) => route.fulfill({ response: await route.fetch() }));
  await withToken(page);
  const violations = await watchViolations(page);

  await openBoard(page, `?via=test#t=${fixture.link}`, "/en/board/link/");
  await expectBoard(page, fixture.board);
  await dragPlayer(page, 5, 30, 30);
  // The edit is saved: the board's key is the only thing in storage.
  const storage = () => page.evaluate(() => ({ local: Object.keys(localStorage), session: sessionStorage.length }));
  await expect.poll(storage).toEqual({ local: [STORAGE_KEY], session: 0 });
  expect(await violations()).toEqual([]);

  // The beacon sends on load and again when the page is left. WebKit doesn't
  // show the body of a sendBeacon() to the route; its XHRs have one.
  await page.goto("/en/");
  const bodies = () => beacon.sent.filter(Boolean);
  await expect.poll(() => bodies().length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin;
  for (const body of bodies()) {
    expect(body).not.toContain("#t=");
    expect(body).not.toContain(fixture.link.slice(2, 40));
    expect(body).not.toContain("via=test");
    expect(JSON.parse(body)).toMatchObject({ location: `${origin}/en/board/link/` });
  }
  expect(await context.cookies()).toEqual([]);
});
