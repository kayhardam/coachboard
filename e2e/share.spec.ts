import { expect, test } from "@playwright/test";
import { openBoard } from "./helpers";

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
  expect(copied[0]).toMatch(/^http:\/\/127\.0\.0\.1:8787\/en\/board\/#t=1\./);
});
