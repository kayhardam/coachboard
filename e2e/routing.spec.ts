import { expect, test } from "./helpers";

// These rely on wrangler.jsonc and public/_redirects, which `wrangler dev` applies.

test("/ goes to /en/", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
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
