import { readFileSync } from "node:fs";
import { t } from "../src/i18n/ui";
import { expect, test } from "./helpers";

// The lite MVP's core flow: draw on /[lang]/lite/, the change lands in the
// address bar as a link, Share shows a QR code and the link, and the link
// opens in the lite viewer /[lang]/lite/v/. The link is a normal "2." link:
// the board's own viewer opens it too (e2e/viewer.spec.ts covers that side).

/** A version 1 link from the fixtures: the lite viewer must keep opening it. */
const v1 = (JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v1-full-lineup.json", import.meta.url), "utf8")) as { link: string }).link;

for (const lang of ["en", "nl"]) {
  test(`the lite board's core flow (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}/lite/`);
    await expect(page.getByRole("toolbar", { name: t(lang, "board.tools") })).toBeVisible();

    // Arrow is the tool on opening: a drag from a player draws their run.
    const box = (await page.locator(`.stage [data-kind="player"][data-index="2"]`).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator(`.stage [data-kind="arrow"]`)).toHaveCount(1);

    // The change lands in the address bar as a shareable "2." link.
    await expect(page).toHaveURL(/#t=2\./);

    // A second step.
    await page.getByRole("button", { name: t(lang, "board.newStep"), exact: true }).click();
    await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-pressed", "true");

    // Share: the dialog shows the QR code and the link to the lite viewer.
    await page.getByRole("button", { name: t(lang, "board.share"), exact: true }).click();
    const dialog = page.getByRole("dialog", { name: t(lang, "board.share") });
    await expect(dialog.locator(".code svg")).toBeVisible();
    const link = await dialog.locator("input").inputValue();
    expect(link).toContain(`/${lang}/lite/v/#t=2.`);
    await page.keyboard.press("Escape");

    // The shared link opens in the lite viewer; Next goes to step 2.
    await page.goto(link);
    await expect(page.locator(`.stage [data-kind="player"]`)).toHaveCount(13);
    await expect(page.getByText("1/2")).toBeVisible();
    await page.getByRole("button", { name: t(lang, "viewer.next"), exact: true }).click();
    await expect(page.getByText("2/2")).toBeVisible();
  });

  test(`a version 1 link still opens in the lite viewer (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}/lite/v/#t=${v1}`);
    await expect(page.locator(`.stage [data-kind="player"]`)).toHaveCount(14);
    await expect(page.locator(`.stage [data-kind="arrow"]`)).toHaveCount(6);
    await expect(page.getByText(t(lang, "viewer.broken"))).toHaveCount(0);
  });
}

test("a broken link shows the notice in the lite viewer", async ({ page }) => {
  await page.goto("/en/lite/v/#t=2.broken-payload");
  await expect(page.getByText(t("en", "viewer.broken"))).toBeVisible();
});
