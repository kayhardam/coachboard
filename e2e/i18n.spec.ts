import { allPages, expect, test } from "./helpers";

// English and Dutch: hreflang, the sitemap and the language links. Translations
// share the path after the prefix; a library item may exist in one language only.

const languages = ["en", "nl"];
const site = "https://handballcoachboard.com";
/** The pages for shared boards and the 404: noindex, so no canonical or hreflang. */
const isNoindex = (path: string) => /\/board\/(link|qr)\/$|does-not-exist/.test(path);

const alternates = (html: string) =>
  Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));

const pages = allPages();
for (const path of pages.filter((p) => p !== "/" && !isNoindex(p))) {
  const rest = path.split("/").slice(2).join("/");
  const existing = languages.filter((lang) => pages.includes(`/${lang}/${rest}`));
  test(`hreflang on ${path} points at the page in each language it exists in, x-default at English`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    // A page in one language has no translations to point at.
    expect(alternates(html)).toEqual(
      existing.length < 2
        ? {}
        : {
            ...Object.fromEntries(existing.map((lang) => [lang, `${site}/${lang}/${rest}`])),
            // Not /: that redirects to /nl/.
            "x-default": `${site}/en/${rest}`,
          },
    );
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

// Phase 19-1 (Z2): Google takes the site name from one WebSite block per home page.
for (const lang of languages) {
  test(`/${lang}/ has exactly one valid JSON-LD block: the WebSite with its creator`, async ({ request }) => {
    const html = await (await request.get(`/${lang}/`)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)];
    expect(blocks).toHaveLength(1);
    expect(html.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(JSON.parse(blocks[0]![1]!)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Handball Coachboard",
      alternateName: "Coachboard",
      url: `${site}/`,
      inLanguage: lang,
      creator: { "@type": "Person", name: "Kay Hardam", url: "https://kayhardam.dev/" },
    });
  });
}

test("the sitemap lists every indexable page, and no shared-board page", async ({ request }) => {
  const xml = await (await request.get("/sitemap-0.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname).sort();
  const indexable = allPages().filter((p) => p !== "/" && !isNoindex(p));
  expect(locs).toEqual(indexable);
});

test("the footer's language link opens the same page in the other language", async ({ page }) => {
  await page.goto("/en/tactics/6-0-defense-basics/");
  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "NL" }).click();
  await expect(page).toHaveURL(/\/nl\/tactics\/6-0-defense-basics\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("link", { name: "Open in het bord" })).toBeVisible();
});

test("on a page without an English version, the footer's EN link opens the English home page", async ({ page }) => {
  await page.goto("/nl/tactics/crossing-cb-lb/");
  await page.getByRole("navigation", { name: "Taal" }).getByRole("link", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
});

test("a Dutch tactic opens in the Dutch board, with Dutch labels", async ({ page }) => {
  await page.goto("/nl/tactics/6-0-defense-basics/");
  await page.getByRole("link", { name: "Open in het bord" }).click();
  await expect(page).toHaveURL(/\/nl\/board\/#t=/);
  await expect(page.getByRole("toolbar", { name: "Gereedschap" })).toBeVisible();
  const labels = await page.locator(".stage svg [data-kind=player] text").allTextContents();
  expect(labels).toEqual(["LH", "LO", "MO", "RO", "RH", "CL", "K"]);
});
