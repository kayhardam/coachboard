import { readFileSync } from "node:fs";
import { renderSVG } from "uqr";
import type { BoardV1 } from "../src/lib/board/format";
import { dragPlayer, expect, expectBoard, linkInAddressBar, openBoard, test } from "./helpers";

test("the QR dialog shows a QR code", async ({ page }) => {
  await openBoard(page);
  await page.getByRole("button", { name: "QR code" }).click();
  const dialog = page.getByRole("dialog", { name: "QR code" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("svg")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("without navigator.share, Share copies the link", async ({ page }) => {
  await page.addInitScript(() => {
    // No share sheet, and a clipboard that records what it gets.
    Object.defineProperty(Navigator.prototype, "share", { value: undefined, configurable: true });
    const copied: string[] = [];
    (window as unknown as { copied: string[] }).copied = copied;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void copied.push(text) },
      configurable: true,
    });
  });
  await openBoard(page);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status")).toContainText("Link copied.");
  const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
  expect(copied).toHaveLength(1);
  // A shared link opens /board/link/, so statistics count it apart from the board.
  expect(new URL(copied[0]!, page.url()).pathname).toBe("/en/board/link/");
  expect(copied[0]).toMatch(/#t=2\./);
});

test("the QR code holds the board's link on /board/qr/", async ({ page }) => {
  await openBoard(page);
  await dragPlayer(page, 5, 30, 30);
  const { hash, origin } = new URL(await linkInAddressBar(page));
  await page.getByRole("button", { name: "QR code" }).click();
  const modules = await page.getByRole("dialog", { name: "QR code" }).locator(".code path").getAttribute("d");
  // The same browser encodes the address bar and the QR code, so the bytes match.
  const expected = renderSVG(`${origin}/en/board/qr/${hash}`, { ecc: "L", border: 2 });
  expect(modules).toBe(expected.match(/ d="([^"]+)"/)![1]);
});

for (const via of ["link", "qr"]) {
  test(`a shared board opens on /board/${via}/, out of search results`, async ({ page }) => {
    const { link, board } = JSON.parse(
      readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8"),
    ) as { link: string; board: BoardV1 };
    await openBoard(page, `#t=${link}`, `/en/board/${via}/`);
    await expectBoard(page, board);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
}

// The QR library loads after the board, not with it; it must be there
// before the phone goes offline in the gym.
test("the QR code still opens after going offline", async ({ page, context }) => {
  // WebKit's emulated offline mode also fails reading a Blob, which encode()
  // uses (NotReadableError), so the link can't be made there at all. A real
  // iPhone in airplane mode is test 14 in Kay's test round (docs/metingen.md).
  test.skip(test.info().project.name === "iphone", "WebKit's offline emulation blocks Blob reads");
  await openBoard(page);
  // Wait until the QR chunk (the one JS file that isn't the editor or Svelte's client) has loaded.
  const qrChunkLoaded = () =>
    page.evaluate(() =>
      performance.getEntriesByType("resource").some((r) => /\/_astro\/(?!client|BoardEditor)[^/]+\.js$/.test(r.name)),
    );
  await expect.poll(qrChunkLoaded).toBe(true);
  await context.setOffline(true);
  await page.getByRole("button", { name: "QR code" }).click();
  await expect(page.getByRole("dialog", { name: "QR code" }).locator("svg")).toBeVisible();
});
