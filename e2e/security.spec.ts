import { expect, test, type Page } from "@playwright/test";
import { allPages, openBoard } from "./helpers";

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

/** Collects CSP violations from the moment the document exists. */
async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { cspViolations: string[] }).cspViolations = seen;
    document.addEventListener("securitypolicyviolation", (e) =>
      seen.push(`${e.effectiveDirective} blocked ${e.blockedURI || "inline"}: ${e.sample}`),
    );
  });
  return () => page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);
}

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
    expect(csp).toMatch(/script-src 'self'( 'sha256-[^']+')+;/);
    expect(csp).not.toContain("frame-ancestors");
  });

  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto(path);
    expect(await violations()).toEqual([]);
  });
}

test("no CSP violations while using the board", async ({ page }) => {
  const violations = await watchViolations(page);
  await openBoard(page);
  await page.getByRole("button", { name: "QR code" }).click();
  await expect(page.getByRole("dialog", { name: "QR code" }).locator("svg")).toBeVisible();
  // The editor's CSS arrives as a <style> that Svelte injects; a blocked one leaves the bars unstyled.
  await expect(page.locator(".editor")).toHaveCSS("display", "grid");
  expect(await violations()).toEqual([]);
});
