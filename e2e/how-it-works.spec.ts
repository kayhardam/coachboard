import { t } from "../src/i18n/ui";
import { allPages, expect, test } from "./helpers";

// How the board works (/<lang>/how-it-works/): its heading, the ten features in
// the order you use the board, each with an image that says what it shows; and
// the ways in: the footer of every content page, the home page and About.

const features: Record<string, string[]> = {
  nl: [
    "Startopstellingen",
    "Pijlen tekenen",
    "Schieten",
    "Soorten pijlen",
    "Rugnummers en posities",
    "Stappen",
    "Afspelen",
    "Delen",
    "Mijn borden",
    "Op een ander toestel",
  ],
  en: [
    "Starting lineups",
    "Drawing arrows",
    "Shooting",
    "Kinds of arrow",
    "Numbers and positions",
    "Steps",
    "Play",
    "Sharing",
    "My boards",
    "On another device",
  ],
};

/** The eight lines About had before this page: their headings. */
const aboutLines: Record<string, string[]> = {
  nl: ["Pijlen tekenen.", "Soorten pijlen.", "Schieten.", "Startopstellingen.", "Stappen.", "Afspelen.", "Mijn borden.", "Delen."],
  en: ["Drawing arrows.", "Kinds of arrow.", "Shooting.", "Starting lineups.", "Steps.", "Play.", "My boards.", "Sharing."],
};

for (const lang of ["nl", "en"]) {
  const page_ = `/${lang}/how-it-works/`;

  test(`${page_} has its heading and the ten features in order, each with an image that says what it shows`, async ({ page }) => {
    await page.goto(page_);
    await expect(page.locator("h1")).toHaveText(t(lang, "howItWorks.heading"));
    const items = page.locator(".features > li");
    await expect(items.locator("h2")).toHaveText(features[lang]!);
    for (const item of await items.all()) {
      // A screenshot is an <img> with an alt text; a drawing is Court's <svg role="img"> with a label.
      const images = item.locator('img, svg[role="img"]');
      await expect(images.first()).toBeVisible();
      for (const image of await images.all()) {
        const text = (await image.getAttribute("alt")) ?? (await image.getAttribute("aria-label"));
        expect(text?.trim(), await item.locator("h2").textContent() ?? "").toBeTruthy();
      }
    }
  });

  test(`${page_} has no script and its images keep their size while they load`, async ({ page }) => {
    await page.goto(page_);
    await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(0);
    for (const img of await page.locator(".features img").all()) {
      await expect(img).toHaveAttribute("width", /^\d+$/);
      await expect(img).toHaveAttribute("height", /^\d+$/);
    }
    // Every screenshot is there.
    for (const src of await page.locator(".features img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src))) {
      expect((await page.request.get(src)).status(), src).toBe(200);
    }
  });

  test(`/${lang}/ links to How the board works below the three steps`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    const link = page.locator("main .more a", { hasText: t(lang, "home.allFeatures") });
    await expect(link).toHaveAttribute("href", page_);
  });

  test(`/${lang}/about/ links to How the board works instead of listing what the board can do`, async ({ page }) => {
    await page.goto(`/${lang}/about/`);
    await expect(page.locator("main").getByRole("link", { name: t(lang, "nav.howItWorks"), exact: true })).toHaveAttribute("href", page_);
    for (const line of aboutLines[lang]!) await expect(page.locator("main strong", { hasText: line })).toHaveCount(0);
  });
}

// Every content page (not the board's own pages, which have no footer) links to it in its footer,
// in its own language; the 404 is one page for the whole site, in the default language.
for (const path of allPages().filter((p) => !/\/board\//.test(p))) {
  test(`the footer of ${path} links to How the board works`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const footer = html.slice(html.indexOf('<footer class="site-footer'));
    const lang = /does-not-exist/.test(path) ? "en" : path.split("/")[1];
    expect(footer).toContain(`<a href="/${lang}/how-it-works/"`);
  });
}
