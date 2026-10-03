import AxeBuilder from "@axe-core/playwright";
import { t } from "../src/i18n/ui";
import { allPages, expect, test } from "./helpers";

for (const path of allPages()) {
  test(`axe finds nothing serious on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path.endsWith("/board/")) {
      await expect(page.getByRole("toolbar", { name: t(path.split("/")[1]!, "board.tools") })).toBeVisible();
    }
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  });
}
