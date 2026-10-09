import AxeBuilder from "@axe-core/playwright";
import { t } from "../src/i18n/ui";
import { allPages, expect, fromMenu, openBoard, test } from "./helpers";

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

for (const lang of ["en", "nl"]) {
  test(`axe finds nothing serious in My boards (${lang}), with a board's menu open`, async ({ page }) => {
    await openBoard(page, "", `/${lang}/board/`);
    await page.getByRole("button", { name: t(lang, "board.addTitle") }).click();
    await page.getByRole("textbox", { name: t(lang, "board.editTitle") }).fill("Kruising");
    await page.keyboard.press("Enter");
    await fromMenu(page, "board.myBoards", lang);
    await page.getByTitle(t(lang, "board.moreFor", { title: "Kruising" }), { exact: true }).click();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  });
}

for (const lang of ["en", "nl"]) {
  test(`axe finds nothing serious in an empty My boards (${lang}), with import in it`, async ({ page }) => {
    await openBoard(page, "", `/${lang}/board/`);
    await fromMenu(page, "board.myBoards", lang);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  });
}
