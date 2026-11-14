import AxeBuilder from "@axe-core/playwright";
import { t } from "../src/i18n/ui";
import { readFileSync } from "node:fs";
import { allPages, expect, fromMenu, openBoard, openViewer, test } from "./helpers";

/** The viewer's pages need a board in #t=; without one they send you to the editor. */
const shared = (JSON.parse(readFileSync(new URL("../src/lib/board/fixtures/v2-play.json", import.meta.url), "utf8")) as { link: string }).link;
const isViewer = (path: string) => /\/board\/(?:link|qr)\/$/.test(path);

for (const path of allPages()) {
  test(`axe finds nothing serious on ${path}`, async ({ page }) => {
    if (isViewer(path)) await openViewer(page, `#t=${shared}`, path);
    else await page.goto(path);
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

for (const lang of ["en", "nl"]) {
  test(`axe finds nothing serious in the viewer (${lang}) after the last step, with Made with Coachboard`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openViewer(page, `#t=${shared}`, `/${lang}/board/link/`);
    const next = page.locator(".viewer").getByRole("button", { name: t(lang, "viewer.next"), exact: true });
    while (await next.isEnabled()) await next.click();
    await expect(page.locator(".viewer").getByRole("link", { name: t(lang, "viewer.made") })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  });
}

for (const lang of ["en", "nl"]) {
  test(`axe finds nothing serious with a player selected (${lang}), their number or position open and closed`, async ({ page }) => {
    await openBoard(page, "", `/${lang}/board/`);
    await page.locator('.stage [data-kind="player"][data-index="0"]').click();
    const bar = page.getByRole("toolbar", { name: t(lang, "board.team") });
    for (const open of [false, true]) {
      if (open) await bar.getByRole("button", { name: new RegExp(`^${t(lang, "board.label")}`) }).click();
      await expect(bar.getByRole("textbox")).toHaveCount(open ? 1 : 0);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(serious).toEqual([]);
    }
  });
}
