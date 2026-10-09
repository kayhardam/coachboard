import { beaconEndpoint, beaconSrc } from "../src/data/analytics";
import { t } from "../src/i18n/ui";
import { allPages, chooseFile, downloaded, dragPlayer, expect, fromMenu, openBoard, savedBoards, test, watchViolations } from "./helpers";

// The headers come from public/_headers, which `wrangler dev` applies. The CSP
// for scripts and styles is a <meta> that Astro writes (security.csp in
// astro.config.mjs); browsers ignore frame-ancestors there, so it is a header.

const headers = {
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'",
  "cross-origin-opener-policy": "same-origin",
};

/** The board and the pages for shared boards: the only ones with the beacon. */
const isBoard = (path: string) => /^\/[^/]+\/board\/(?:(?:link|qr)\/)?$/.test(path);

test("every language's board pages are among the pages checked here", () => {
  // allPages() reads dist/. Without this, a language whose pages failed to build
  // would quietly drop out of every check below.
  for (const lang of ["en", "nl"]) {
    for (const page of ["board/", "board/link/", "board/qr/"]) {
      expect(allPages()).toContain(`/${lang}/${page}`);
    }
  }
});

for (const path of allPages()) {
  test(`security headers and CSP on ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    // Deployed, Cloudflare leaves _headers off the 404 page; `wrangler dev` adds
    // them. Only the <meta> CSP reaches it (docs/metingen.md, finding 15).
    if (response!.status() !== 404) {
      expect(response!.headers()).toMatchObject(headers);
      expect(response!.headers()["permissions-policy"]).toContain("camera=()");
    }

    const csp = (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute("content"))!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("frame-ancestors");
    // script-src: 'self', hashes, and only on the board pages the beacon.
    const scriptSrc = csp.match(/script-src ([^;]*);/)![1]!.trim().split(/\s+/);
    expect(scriptSrc[0]).toBe("'self'");
    expect(scriptSrc.some((s) => s.startsWith("'sha256-"))).toBe(true);
    expect(scriptSrc.filter((s) => s !== "'self'" && !s.startsWith("'sha256-"))).toEqual(
      isBoard(path) ? [beaconSrc] : [],
    );
    if (isBoard(path)) expect(csp).toContain(`connect-src 'self' ${beaconEndpoint};`);
    else expect(csp).not.toContain("connect-src");
  });

  // The CSP <meta> only covers what comes after it, so it can't stop a script
  // that Cloudflare injects above it (the RUM auto-setup). This checks the page itself.
  test(`no script from another origin on ${path}`, async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => void (r.resourceType() === "script" && requested.push(r.url())));
    await page.goto(path, { waitUntil: "load" });
    const inPage = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter(Boolean));
    const origin = new URL(page.url()).origin;
    const foreign = [...new Set([...requested, ...inPage])].filter((url) => new URL(url).origin !== origin);
    expect(foreign).toEqual(isBoard(path) ? [beaconSrc] : []);
  });

  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto(path);
    expect(await violations()).toEqual([]);
  });
}

for (const lang of ["en", "nl"]) {
  test(`no CSP violations while using the board (${lang})`, async ({ page }) => {
    const violations = await watchViolations(page);
    await openBoard(page, "", `/${lang}/board/`);
    await fromMenu(page, "board.qr", lang);
    await expect(page.getByRole("dialog", { name: t(lang, "board.qr") }).locator("svg")).toBeVisible();
    // The editor's CSS arrives as a <style> that Svelte injects; a blocked one leaves the bars unstyled.
    await expect(page.locator(".editor")).toHaveCSS("display", "grid");
    await page.keyboard.press("Escape");
    // Export (a download from a blob: URL) and import (reading the file) in My boards.
    await dragPlayer(page, 5, 30, 30);
    await expect.poll(async () => (await savedBoards(page)).length).toBe(1);
    await fromMenu(page, "board.myBoards", lang);
    const list = page.getByRole("dialog", { name: t(lang, "board.myBoards") });
    const file = await downloaded(page, () => list.getByRole("button", { name: t(lang, "board.exportAll") }).click());
    await chooseFile(page, () => list.locator("label", { hasText: t(lang, "board.import") }).click(), file.text);
    await expect(list.getByRole("status")).toContainText(t(lang, "board.importKnown"));
    expect(await violations()).toEqual([]);
  });
}
