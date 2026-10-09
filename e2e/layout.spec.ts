import { devices, type Page } from "@playwright/test";
import { defaultBoard, defaultBoardFor } from "../src/lib/board/defaults";
import { MAX_TITLE } from "../src/lib/board/format";
import { t } from "../src/i18n/ui";
import { expect, fromMenu, moreButton, OLD_KEY, openBoard, STORE_KEY, test } from "./helpers";

// Finding 1 and 2 in docs/metingen.md: the court scaled to the screen's width
// only, so the full court (and, in landscape, the half court too) pushed both
// bars below the screen, where nothing could reach them.
// Don't click to check this: Playwright scrolls a button into view first.

/** A real landscape viewport for the project's phone. */
function landscape() {
  const phone = test.info().project.name === "iphone" ? "iPhone 15 landscape" : "Pixel 7 landscape";
  return devices[phone]!.viewport;
}

/** A laptop: the wide layout. */
const WIDE = { width: 1280, height: 720 };

type Orientation = "portrait" | "landscape" | "wide";
const ORIENTATIONS: Orientation[] = ["portrait", "landscape", "wide"];

async function orient(page: Page, orientation: Orientation) {
  if (orientation === "landscape") await page.setViewportSize(landscape());
  if (orientation === "wide") await page.setViewportSize(WIDE);
}

async function toCourt(page: Page, court: "half" | "full") {
  if (court === "full") await fromMenu(page, "board.fullCourt");
}

async function expectEverythingOnScreen(page: Page) {
  for (const button of await page.locator(".editor [role=toolbar] :is(button, summary, a):visible").all()) {
    await expect(button).toBeInViewport({ ratio: 1, timeout: 2000 });
    // A tap target is at least 44 px high (--tap); the title is text, and may be lower.
    const { height } = (await button.boundingBox())!;
    if (!(await button.evaluate((b) => b.classList.contains("title")))) expect(height).toBeGreaterThanOrEqual(43.5);
  }
  await expect(page.locator(".stage svg")).toBeInViewport({ ratio: 1 });
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return { x: root.scrollWidth - innerWidth, y: root.scrollHeight - innerHeight };
  });
  expect(overflow).toEqual({ x: 0, y: 0 });
}

/** The court's surface, not the <svg>: that fills its box and letterboxes the court in it. */
const surface = (page: Page) => page.locator(".stage svg > rect:first-of-type").boundingBox();

for (const orientation of ORIENTATIONS) {
  for (const court of ["half", "full"] as const) {
    test(`${orientation}, ${court} court: every button and the whole court are on screen`, async ({ page }) => {
      await orient(page, orientation);
      await openBoard(page);
      await toCourt(page, court);
      await expectEverythingOnScreen(page);
    });
  }
}

test("turning the phone to landscape keeps everything on screen", async ({ page }) => {
  await openBoard(page);
  await toCourt(page, "full");
  await page.setViewportSize(landscape());
  await expectEverythingOnScreen(page);
});

test("the title bar takes the site header's place and links home, in both orientations", async ({ page }) => {
  await openBoard(page);
  const home = page.getByRole("link", { name: "Home" });
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(home).toBeInViewport({ ratio: 1 });
  await expect(home).toHaveAttribute("href", "/en/");
  // Portrait: the title bar above the court, the tools below it.
  const [bar, court, tools] = await Promise.all(
    [page.getByRole("toolbar", { name: "Actions" }), page.locator(".stage svg"), page.getByRole("toolbar", { name: "Tools" })].map(
      async (l) => (await l.boundingBox())!,
    ),
  );
  expect(bar.y + bar.height).toBeLessThanOrEqual(court.y);
  expect(court.y + court.height).toBeLessThanOrEqual(tools.y);

  await page.setViewportSize(landscape());
  await expect(home).toBeInViewport({ ratio: 1 });
  // Landscape: the tools on the left, the title bar's buttons on the right, the court between them.
  const [left, middle, right] = await Promise.all(
    [page.getByRole("toolbar", { name: "Tools" }), page.locator(".stage svg"), page.getByRole("toolbar", { name: "Actions" })].map(
      async (l) => (await l.boundingBox())!,
    ),
  );
  expect(left.x + left.width).toBeLessThanOrEqual(middle.x);
  expect(middle.x + middle.width).toBeLessThanOrEqual(right.x);
});

test("wide, the title bar runs across the top and the tools stand beside the court", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await openBoard(page);
  const [bar, tools, court] = await Promise.all(
    [page.getByRole("toolbar", { name: "Actions" }), page.getByRole("toolbar", { name: "Tools" }), page.locator(".stage svg")].map(
      async (l) => (await l.boundingBox())!,
    ),
  );
  expect(bar.width).toBe(WIDE.width);
  expect(bar.y + bar.height).toBeLessThanOrEqual(tools.y);
  expect(tools.x + tools.width).toBeLessThanOrEqual(court.x);
  // Larger than the portrait layout gave a laptop (478 px, docs/metingen.md).
  expect((await surface(page))!.width).toBeGreaterThan(520);
});

// Finding 14 in docs/metingen.md: the static fallback didn't reserve the bars'
// space, so the court jumped when the editor replaced it.
for (const orientation of ORIENTATIONS) {
  test(`${orientation}: the court stays put when the editor loads`, async ({ page }) => {
    await orient(page, orientation);
    // Hold the scripts, so the fallback stays on screen during this one page load.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });

    // "commit": the held scripts would keep the load event from firing.
    await page.goto("/en/board/", { waitUntil: "commit" });
    const fallback = page.locator(".fallback svg > rect:first-of-type");
    await expect(fallback).toBeInViewport({ ratio: 1 });
    const before = (await fallback.boundingBox())!;

    release();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    const after = (await surface(page))!;

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

for (const orientation of ORIENTATIONS) {
  test(`${orientation}: the More menu opens on screen`, async ({ page }) => {
    await orient(page, orientation);
    await openBoard(page);
    await moreButton(page).click();
    for (const name of ["My boards", "New board", "QR code", "Full court", "Clear arrows and ball", "Default lineup", "Empty court"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeInViewport({ ratio: 1 });
    }
  });

  test(`${orientation}: Delete is there only with a selection, and it neither moves nor covers the court`, async ({ page }) => {
    await orient(page, orientation);
    await openBoard(page);
    const remove = page.getByRole("button", { name: "Delete" });
    await expect(remove).toHaveCount(0);
    const before = (await surface(page))!;

    // Move is the tool on opening: a tap on the pivot selects them.
    await page.locator('.stage [data-kind="player"][data-index="5"]').click();
    await expect(remove).toBeInViewport({ ratio: 1 });
    expect(await surface(page)).toEqual(before);
    // On the half court it sits beside the court, never on it (a wing stands in the corner).
    const box = (await remove.boundingBox())!;
    const apart =
      box.x >= before.x + before.width ||
      box.x + box.width <= before.x ||
      box.y + box.height <= before.y ||
      box.y >= before.y + before.height;
    expect(apart, `${JSON.stringify(box)} on ${JSON.stringify(before)}`).toBe(true);

    await remove.click();
    await expect(page.locator(".stage [data-kind=player]")).toHaveCount(defaultBoard.frames[0]!.players.length - 1);
    await expect(remove).toHaveCount(0);
  });
}

// The labels sit under their icons (and next to it, on Share) and get an
// ellipsis when they don't fit. Dutch words are longer ("Verdedig"), so every
// language is checked on a narrow phone (360 px) and in landscape.
for (const lang of ["en", "nl"]) {
  for (const orientation of ORIENTATIONS) {
    test(`${lang}, ${orientation}: no label is cut off`, async ({ page }) => {
      await page.setViewportSize(
        orientation === "portrait" ? { width: 360, height: 740 } : orientation === "wide" ? WIDE : landscape(),
      );
      await openBoard(page, "", `/${lang}/board/`);
      // A selection, so Delete shows its label too.
      await page.locator('.stage [data-kind="player"][data-index="5"]').click();
      // .label is only shown in landscape; elsewhere it is 1 px, for screen readers.
      const labels = page.locator(".editor :is(.tool, .share, .delete) span, .editor .label");
      await expect(labels.first()).toBeVisible();
      const cut = await labels.evaluateAll((spans) =>
        spans.filter((s) => s.clientWidth > 1 && s.scrollWidth > s.clientWidth).map((s) => s.textContent),
      );
      expect(cut).toEqual([]);
    });
  }
}

test("a long title gets an ellipsis and pushes no button off screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const title = "Kruising MO–LO met een blok van de cirkel";
  await page.addInitScript(
    ([key, board]) => localStorage.setItem(key, JSON.stringify(board)),
    [OLD_KEY, { ...defaultBoard, title: title.slice(0, MAX_TITLE) }] as const,
  );
  await openBoard(page);
  const shown = page.locator(".title span");
  await expect(shown).toHaveText(title.slice(0, MAX_TITLE));
  expect(await shown.evaluate((s) => s.scrollWidth > s.clientWidth)).toBe(true);
  await expectEverythingOnScreen(page);
});

test("on a narrow phone the title bar shows only the pencil, and a wider one shows the title", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openBoard(page);
  const title = page.getByTitle("Edit title");
  await expect(title.locator("span")).toBeHidden();
  await expect(title.locator("svg")).toBeInViewport({ ratio: 1 });
  // Still a button with a name, from its title.
  await expect(page.getByRole("button", { name: "Edit title" })).toBeVisible();

  await page.setViewportSize({ width: 393, height: 659 });
  await expect(title.locator("span")).toHaveText("Add title");
  await expect(title.locator("span")).toBeVisible();
});

// Without the site header, the largest text on the board was the editor's
// title, which comes with the JS: on a slow phone the LCP waited for it (2.5 s
// in Lighthouse with real throttling, phase 12a in docs/metingen.md). The
// fallback shows the same placeholder, so the LCP paints with the HTML.
test("the largest text paints with the HTML, not after the editor's JS", async ({ page }) => {
  test.skip(test.info().project.name === "iphone", "WebKit has no largest-contentful-paint entries");
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { lcp: string[] }).lcp = seen;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element })[]) {
        seen.push(e.element?.closest(".fallback, .editor")?.className.split(" ")[0] ?? "other");
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  const lcp = () => page.evaluate(() => (window as unknown as { lcp: string[] }).lcp);

  await page.goto("/en/board/", { waitUntil: "commit" });
  await expect(page.locator(".fallback .title")).toHaveText("Add title");
  await expect.poll(lcp).toEqual(["fallback"]);
  release();
  await expect(page.getByRole("button", { name: "Add title" })).toBeVisible();
  // The editor's title is no larger, so it doesn't become a later LCP.
  await page.waitForTimeout(300);
  expect(await lcp()).toEqual(["fallback"]);
});

/** Three boards in My boards before the page loads: two in a folder, one with a long title, one without. */
async function withBoards(page: Page, lang: string) {
  const board = (x: number, title?: string) => {
    const b = defaultBoardFor(lang);
    b.frames[0]!.players[1]!.at = [x, 100];
    if (title) b.title = title;
    return b;
  };
  const store = {
    current: "a",
    boards: [
      { id: "a", board: board(40, "Kruising MO–LO"), folder: "Training dinsdag", at: 3 },
      { id: "b", board: board(50, "Opwarmen in drie rijen met twee ballen"), folder: "Training dinsdag", at: 2 },
      { id: "c", board: board(60), at: 1 },
    ],
  };
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORE_KEY, JSON.stringify(store)] as const);
}

for (const lang of ["en", "nl"]) {
  for (const orientation of ORIENTATIONS) {
    test(`${lang}, ${orientation}: My boards fits, every button is big enough, and no label is cut off`, async ({ page }) => {
      await orient(page, orientation);
      await withBoards(page, lang);
      await openBoard(page, "", `/${lang}/board/`);
      await fromMenu(page, "board.myBoards", lang);
      const list = page.getByRole("dialog", { name: t(lang, "board.myBoards") });
      await expect(list).toBeVisible();
      const newBoard = list.getByRole("button", { name: t(lang, "board.newBoard"), exact: true });
      for (const button of [newBoard, list.getByRole("button", { name: t(lang, "board.close") })]) {
        await expect(button).toBeInViewport({ ratio: 1 });
      }
      // Landscape: New board sits in the bar beside the heading, so more boards fit.
      if (orientation === "landscape") {
        const [bar, button] = await Promise.all([list.locator(".boards-bar").boundingBox(), newBoard.boundingBox()]);
        expect(button!.y + button!.height).toBeLessThanOrEqual(bar!.y + bar!.height);
      }
      // Export and import, after the list: on a phone a scroll away (the iPhone already with
      // these three boards), wide in view.
      const backup = [
        list.getByRole("button", { name: t(lang, "board.exportAll") }),
        list.locator("label", { hasText: t(lang, "board.import") }),
      ];
      for (const button of backup) {
        if (orientation !== "wide") await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport({ ratio: 1 });
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      }
      await list.locator("summary").first().click();
      for (const button of await list.locator(":is(button, summary):visible").all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      }
      const cut = await list
        .locator(":is(h2, h3, .new, .actions-panel button, .backup button, .backup label)")
        .evaluateAll((els) => els.filter((e) => e.clientWidth > 1 && e.scrollWidth > e.clientWidth).map((e) => e.textContent));
      expect(cut).toEqual([]);
      expect(await list.evaluate((d) => d.scrollWidth - d.clientWidth)).toBe(0);
    });
  }
}

for (const lang of ["en", "nl"]) {
  for (const orientation of ORIENTATIONS) {
    test(`${lang}, ${orientation}: an empty My boards has import in view, and no export`, async ({ page }) => {
      await orient(page, orientation);
      await openBoard(page, "", `/${lang}/board/`);
      await fromMenu(page, "board.myBoards", lang);
      const list = page.getByRole("dialog", { name: t(lang, "board.myBoards") });
      const importButton = list.locator("label", { hasText: t(lang, "board.import") });
      await expect(importButton).toBeInViewport({ ratio: 1 });
      expect((await importButton.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect(await importButton.evaluate((e) => e.scrollWidth - e.clientWidth)).toBe(0);
      await expect(list.getByRole("button", { name: t(lang, "board.exportAll") })).toHaveCount(0);
    });
  }
}

test("wide, My boards is a panel on the right, and the tools stay in view beside it", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await withBoards(page, "en");
  await openBoard(page);
  await fromMenu(page, "board.myBoards");
  const panel = (await page.getByRole("dialog", { name: "My boards" }).boundingBox())!;
  expect(panel.width).toBeLessThanOrEqual(440);
  expect(panel.x + panel.width).toBeCloseTo(WIDE.width, 0);
  const tools = (await page.getByRole("toolbar", { name: "Tools" }).boundingBox())!;
  expect(tools.x + tools.width).toBeLessThanOrEqual(panel.x);
});
