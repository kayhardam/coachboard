import { expect, test } from "@playwright/test";
import { openBoard } from "./helpers";

// Finding 1 in docs/metingen.md: on a phone, with the full court on, the
// court grows taller than the screen and pushes both bars below it. The page
// doesn't scroll, so the buttons can't be reached. Fixed in phase 5.
// Don't click to check this: Playwright scrolls a button into view first.
test("on the full court the buttons at the bottom stay on screen", async ({ page }) => {
  test.fail(true, "Finding 1 in docs/metingen.md, to be fixed in phase 5");
  await openBoard(page);
  await page.getByRole("button", { name: "Full court" }).click();

  await expect(page.getByRole("button", { name: "Half court" })).toBeInViewport({ ratio: 1, timeout: 2000 });
  await expect(page.getByRole("button", { name: "Attack" })).toBeInViewport({ ratio: 1, timeout: 2000 });
});
