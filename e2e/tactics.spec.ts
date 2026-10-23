import { dragPlayer, expect, pieces, saved, saveOwnBoard, test } from "./helpers";
import { t } from "../src/i18n/ui";

// A tactic and a drill: the same link into the board.
const items = [
  { path: "/en/tactics/6-0-defense-basics/", title: "6-0 defense: the basics", steps: 4, text: "Each defender stands just outside the goal area" },
  { path: "/en/drills/crossing-in-pairs/", title: "Crossing in pairs", steps: 4, text: "The first on the left runs diagonally to the middle with the ball." },
];

for (const { path, title, steps: count, text } of items) {
  test(`"Open in the board" on ${path} shows its steps and title, and keeps the saved board until the first edit`, async ({ page }) => {
    // Save a board of your own first.
    const own = await saveOwnBoard(page);

    await page.goto(path);
    // Step 1 of the strip: the board opens on it.
    const diagram = await page.locator(".strip svg").first().evaluate((svg) =>
      [...svg.querySelectorAll("[data-kind]")].map((g) => {
        const kind = g.getAttribute("data-kind");
        const where = kind === "arrow" ? g.querySelectorAll("path")[1]?.getAttribute("d") : g.getAttribute("transform");
        return `${kind}:${g.getAttribute("data-index")}:${where}`;
      }),
    );

    await page.getByRole("link", { name: "Open in the board" }).click();
    await expect(page.getByRole("toolbar", { name: "Tools" })).toBeVisible();
    await expect.poll(() => pieces(page)).toEqual(diagram);
    await expect(page.locator(".titlebar .title")).toHaveText(title);
    const steps = page.getByRole("toolbar", { name: t("en", "board.steps") });
    await expect(steps.locator(".chip")).toHaveCount(count);
    await expect(steps.locator('.chip[aria-pressed="true"]')).toHaveText("1");
    await expect(page.locator(".text")).toContainText(text);

    await page.waitForTimeout(600);
    expect(await saved(page)).toBe(own);

    await dragPlayer(page, 0, 20, 20);
    await expect.poll(() => saved(page)).not.toBe(own);
  });
}
