import { expect, test } from "./helpers";

// These rely on wrangler.jsonc and public/_redirects, which `wrangler dev` applies.

test("/ goes to /nl/", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/nl\/$/);
});

test("/en/privacy goes to /en/privacy/", async ({ page }) => {
  await page.goto("/en/privacy");
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
});

test("an unknown URL gets the 404 page", async ({ page }) => {
  const response = await page.goto("/en/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
});

// Tactic pages moved from tactics/<category>/<slug>/ to tactics/<slug>/ in phase 10.
const moved = {
  "/en/tactics/attack/fast-break-second-wave/": "/en/tactics/fast-break-second-wave/",
  "/en/tactics/defense/6-0-defense-basics/": "/en/tactics/6-0-defense-basics/",
};

for (const [from, to] of Object.entries(moved)) {
  test(`${from} moved permanently to ${to}`, async ({ page, request }) => {
    // With and without the trailing slash, and the share image next to the page.
    for (const [old, now] of [
      [from, to],
      [from.slice(0, -1), to],
      [`${from}og.png`, `${to}og.png`],
    ]) {
      const response = await request.get(old!, { maxRedirects: 0 });
      expect(response.status(), old).toBe(301);
      expect(new URL(response.headers()["location"]!, "http://x").pathname, old).toBe(now);
    }

    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
    await expect(page.getByRole("link", { name: "Open in the board" })).toBeVisible();
  });
}
