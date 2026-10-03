import { devices, type Page } from "@playwright/test";
import { expect, openBoard, test } from "./helpers";

// Finding 1 and 2 in docs/metingen.md: the court scaled to the screen's width
// only, so the full court (and, in landscape, the half court too) pushed both
// bars below the screen, where nothing could reach them.
// Don't click to check this: Playwright scrolls a button into view first.

/** A real landscape viewport for the project's phone. */
function landscape() {
  const phone = test.info().project.name === "iphone" ? "iPhone 15 landscape" : "Pixel 7 landscape";
  return devices[phone]!.viewport;
}

async function toCourt(page: Page, court: "half" | "full") {
  if (court === "full") {
    // evaluate(): before the fix this button was off screen, and click() would scroll to it.
    await page.locator('.editor [title="Full court"]').evaluate((b: HTMLElement) => b.click());
  }
}

async function expectEverythingOnScreen(page: Page) {
  for (const button of await page.locator(".editor [role=toolbar] :is(button, summary, a):visible").all()) {
    await expect(button).toBeInViewport({ ratio: 1, timeout: 2000 });
  }
  await expect(page.locator(".stage svg")).toBeInViewport({ ratio: 1 });
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return { x: root.scrollWidth - innerWidth, y: root.scrollHeight - innerHeight };
  });
  expect(overflow).toEqual({ x: 0, y: 0 });
}

for (const court of ["half", "full"] as const) {
  test(`portrait, ${court} court: every button and the whole court are on screen`, async ({ page }) => {
    await openBoard(page);
    await toCourt(page, court);
    await expectEverythingOnScreen(page);
  });

  test(`landscape, ${court} court: every button and the whole court are on screen`, async ({ page }) => {
    await page.setViewportSize(landscape());
    await openBoard(page);
    await toCourt(page, court);
    await expectEverythingOnScreen(page);
  });
}

test("turning the phone to landscape keeps everything on screen", async ({ page }) => {
  await openBoard(page);
  await toCourt(page, "full");
  await page.setViewportSize(landscape());
  await expectEverythingOnScreen(page);
});

test("in landscape the header makes way, and the bar links home", async ({ page }) => {
  await openBoard(page);
  const home = page.getByRole("link", { name: "Home" });
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(home).toBeHidden();

  await page.setViewportSize(landscape());
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(home).toBeInViewport({ ratio: 1 });
  await expect(home).toHaveAttribute("href", "/en/");
  // The tools on the left, the actions on the right, the court between them.
  const [tools, court, actions] = await Promise.all(
    [page.getByRole("toolbar", { name: "Tools" }), page.locator(".stage svg"), page.getByRole("toolbar", { name: "Actions" })].map(
      async (l) => (await l.boundingBox())!,
    ),
  );
  expect(tools.x + tools.width).toBeLessThanOrEqual(court.x);
  expect(court.x + court.width).toBeLessThanOrEqual(actions.x);
});

// Finding 14 in docs/metingen.md: the static fallback didn't reserve the bars'
// space, so the court jumped when the editor replaced it.
for (const orientation of ["portrait", "landscape"] as const) {
  test(`${orientation}: the court stays put when the editor loads`, async ({ page }) => {
    if (orientation === "landscape") await page.setViewportSize(landscape());
    // Hold the scripts, so the fallback stays on screen during this one page load.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });

    // "commit": the held scripts would keep the load event from firing.
    await page.goto("/en/board/", { waitUntil: "commit" });
    // The court's surface, not the <svg>: that fills its box and letterboxes the court in it.
    const fallback = page.locator(".fallback svg > rect:first-of-type");
    await expect(fallback).toBeInViewport({ ratio: 1 });
    const before = (await fallback.boundingBox())!;

    release();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    const after = (await page.locator(".stage svg > rect:first-of-type").boundingBox())!;

    const moved = {
      x: Math.abs(after.x - before.x),
      y: Math.abs(after.y - before.y),
      width: Math.abs(after.width - before.width),
      height: Math.abs(after.height - before.height),
    };
    for (const [key, px] of Object.entries(moved)) {
      expect(px, `${key}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`).toBeLessThanOrEqual(1);
    }
  });
}

for (const orientation of ["portrait", "landscape"] as const) {
  test(`${orientation}: the Clear menu opens on screen`, async ({ page }) => {
    if (orientation === "landscape") await page.setViewportSize(landscape());
    await openBoard(page);
    await page.getByTitle("Clear").click();
    for (const name of ["Clear arrows and ball", "Default lineup", "Empty court"]) {
      await expect(page.getByRole("button", { name })).toBeInViewport({ ratio: 1 });
    }
  });
}

// The tool labels sit under their icons and get an ellipsis when they don't
// fit. Dutch words are longer ("Verdedig"), so every language is checked on
// a narrow phone (360 px) and in landscape.
for (const lang of ["en", "nl"]) {
  for (const orientation of ["portrait", "landscape"] as const) {
    test(`${lang}, ${orientation}: no tool label is cut off`, async ({ page }) => {
      await page.setViewportSize(orientation === "portrait" ? { width: 360, height: 740 } : landscape());
      await openBoard(page, "", `/${lang}/board/`);
      const labels = page.locator(".editor .tool span");
      await expect(labels.first()).toBeVisible();
      const cut = await labels.evaluateAll((spans) =>
        spans.filter((s) => s.scrollWidth > s.clientWidth).map((s) => s.textContent),
      );
      expect(cut).toEqual([]);
    });
  }
}
