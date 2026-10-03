import { allPages, expect, test } from "./helpers";

// English and Dutch: hreflang, the sitemap and the language links. Every page
// exists in both languages; translations share the path after the prefix.

const languages = ["en", "nl"];
const site = "https://handballcoachboard.com";
/** The pages for shared boards and the 404: noindex, so no canonical or hreflang. */
const isNoindex = (path: string) => /\/board\/(link|qr)\/$|does-not-exist/.test(path);

const alternates = (html: string) =>
  Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));

for (const path of allPages().filter((p) => p !== "/" && !isNoindex(p))) {
  test(`hreflang on ${path} points at the page in each language, x-default at English`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const rest = path.split("/").slice(2).join("/");
    expect(alternates(html)).toEqual({
      ...Object.fromEntries(languages.map((lang) => [lang, `${site}/${lang}/${rest}`])),
      // Not /: that redirects to /nl/.
      "x-default": `${site}/en/${rest}`,
    });
  });
}

for (const lang of languages) {
  for (const page of ["board/link/", "board/qr/"]) {
    test(`/${lang}/${page} is noindex, without canonical or hreflang`, async ({ request }) => {
      const html = await (await request.get(`/${lang}/${page}`)).text();
      expect(html).toContain('<meta name="robots" content="noindex">');
      expect(html).not.toContain('rel="canonical"');
      expect(alternates(html)).toEqual({});
    });
  }
}

test("the sitemap lists every indexable page in both languages, and no shared-board page", async ({ request }) => {
  const xml = await (await request.get("/sitemap-0.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname).sort();
  const indexable = allPages().filter((p) => p !== "/" && !isNoindex(p));
  expect(locs).toEqual(indexable);
  expect(locs.filter((p) => p.startsWith("/nl/")).length).toBe(locs.filter((p) => p.startsWith("/en/")).length);
});

test("the footer's language link opens the same page in the other language", async ({ page }) => {
  await page.goto("/en/tactics/6-0-defense-basics/");
  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "NL" }).click();
  await expect(page).toHaveURL(/\/nl\/tactics\/6-0-defense-basics\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("link", { name: "Open in het bord" })).toBeVisible();
});

test("a Dutch tactic opens in the Dutch board, with Dutch labels", async ({ page }) => {
  await page.goto("/nl/tactics/6-0-defense-basics/");
  await page.getByRole("link", { name: "Open in het bord" }).click();
  await expect(page).toHaveURL(/\/nl\/board\/#t=/);
  await expect(page.getByRole("toolbar", { name: "Gereedschap" })).toBeVisible();
  const labels = await page.locator(".stage svg [data-kind=player] text").allTextContents();
  expect(labels).toEqual(["LH", "LO", "MO", "RO", "RH", "CL", "K"]);
});
