// The screenshots of features 7–10 on How the board works, in every language:
//   npm run screenshots              (builds first)
//   npm run screenshots -- --no-build (uses the dist/ there is)
// Serves dist/ itself (a small static server, so nothing keeps running
// afterwards), opens the board in Chromium as a phone of
// 360 × 640 at 2× (Playwright, as the e2e tests do) and writes each image as a
// PNG with a palette (sharp) to public/how-it-works/<lang>/<name>.png. The
// sizes come from `shots` in src/data/howItWorks.ts, which the page uses too;
// an image of another size fails the script. The boards are the drawing
// `steps` of src/data/howItWorks.ts (two steps, its title) and, in My boards,
// two folders. Run it again when the board's look changes, and commit the PNGs.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = 4329;
const origin = `http://127.0.0.1:${port}`;
/** The address the pasted message in feature 10 shows. */
const site = "https://handballcoachboard.com";
const phone = { width: 360, height: 640 };
const scale = 2;
/** A fixed clock: My boards shows dates. */
const now = new Date("2026-11-10T19:00:00Z").getTime();
const day = 24 * 60 * 60 * 1000;

/** The folders in My boards, per language: a folder with its boards (a title and a drawing). */
const folders = {
  nl: [
    ["Dinsdag", [["Instarten en schieten", "steps"], ["Tegen 6-0", "lineup"]]],
    ["Donderdag", [["6-0-dekking", "lineup"]]],
  ],
  en: [
    ["Tuesday", [["Cut in and shoot", "steps"], ["vs 6-0", "lineup"]]],
    ["Thursday", [["6-0 defense", "lineup"]]],
  ],
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))));
  });
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

/** dist/ as the host serves it: a path ending in / is its index.html. */
function serve(dist) {
  return createHttpServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, origin).pathname));
    let file = join(dist, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!file.startsWith(dist) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
}

if (!process.argv.includes("--no-build")) await run("npx", ["astro", "build"]);

const vite = await createServer({ root, configFile: false, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
const server = serve(join(root, "dist"));
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
const browser = await chromium.launch();
let failed = false;
try {
  const { shots, shotPath, drawing } = await vite.ssrLoadModule("/src/data/howItWorks.ts");
  const { encode } = await vite.ssrLoadModule("/src/lib/board/format.ts");
  const { folderMessage, STORE_KEY } = await vite.ssrLoadModule("/src/lib/board/boards.ts");
  const { t } = await vite.ssrLoadModule("/src/i18n/ui.ts");

  for (const lang of ["nl", "en"]) {
    const steps = await drawing(lang, "steps");
    const hash = `#t=${await encode(steps)}`;
    const saved = [];
    let at = now;
    for (const [folder, boards] of folders[lang]) {
      for (const [title, name] of boards) {
        const board = { ...(await drawing(lang, name)), title };
        saved.push({ id: `${folder}-${saved.length}`, board, folder, at: (at -= day) });
      }
    }
    const context = await browser.newContext({
      viewport: phone,
      deviceScaleFactor: scale,
      isMobile: true,
      hasTouch: true,
      locale: lang,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.clock.setFixedTime(now);
    const images = {};
    const editor = async (withBoards) => {
      await page.goto(`${origin}/${lang}/board/`);
      await page.evaluate(([key, value]) => (value ? localStorage.setItem(key, value) : localStorage.clear()), [
        STORE_KEY,
        withBoards ? JSON.stringify({ current: null, boards: saved }) : null,
      ]);
    };
    const ready = () => page.getByRole("toolbar", { name: t(lang, "board.tools") }).waitFor();
    const myBoards = async () => {
      await page.getByTitle(t(lang, "board.more"), { exact: true }).click();
      await page.getByRole("button", { name: t(lang, "board.myBoards"), exact: true }).click();
      await page.locator(".boards").waitFor();
    };

    // 7: the step bar with Play, on the board of two steps.
    await editor(false);
    await page.goto(`${origin}/${lang}/board/${hash}`);
    await ready();
    const bar = await page.locator(".editor .steps").boundingBox();
    images.play = await page.screenshot({ clip: { x: 0, y: bar.y, width: phone.width, height: shots.play.height / scale } });

    // 8: the same board in the viewer, as a player sees it.
    await page.goto(`${origin}/${lang}/board/link/${hash}`);
    await page.locator(".viewer .edit").waitFor();
    images.viewer = await page.screenshot();

    // 9: My boards with two folders.
    await editor(true);
    await page.reload();
    await ready();
    await myBoards();
    // From the top down to the end of the last folder (the height in `shots`).
    images["my-boards"] = await page.screenshot({ clip: { x: 0, y: 0, width: phone.width, height: shots["my-boards"].height / scale } });

    // 10: Open a link on a device without boards, with Share folder's message pasted.
    await editor(false);
    await page.reload();
    await ready();
    await myBoards();
    const [folder] = folders[lang][0];
    const message = await folderMessage(
      folder,
      saved.filter((s) => s.folder === folder),
      `${site}/${lang}/board/link/#t=`,
      t(lang, "board.untitled"),
    );
    // The message from its first board (its title, then its link), without the focus ring;
    // from the empty list down, so the image shows this device has no boards yet.
    const paste = page.locator(".boards form.paste");
    await paste.locator("textarea").fill(message);
    await paste.locator("textarea").evaluate((field) => {
      field.blur();
      field.scrollTop = 2 * parseFloat(getComputedStyle(field).lineHeight);
    });
    await page.locator(".boards .empty").scrollIntoViewIfNeeded();
    const height = shots["open-link"].height / scale;
    const y = (await page.locator(".boards .empty").boundingBox()).y - 16;
    const end = await paste.boundingBox();
    if (end.y + end.height > y + height) throw new Error(`open-link: Open a link ends ${Math.ceil(end.y + end.height - y - height)} px below the image`);
    images["open-link"] = await page.screenshot({ clip: { x: 0, y, width: phone.width, height } });

    await context.close();

    mkdirSync(new URL(`../public/how-it-works/${lang}/`, import.meta.url), { recursive: true });
    for (const [name, size] of Object.entries(shots)) {
      const file = new URL(`../public${shotPath(lang, name)}`, import.meta.url);
      const png = sharp(images[name]).png({ palette: true, compressionLevel: 9, effort: 10 });
      const info = await png.toFile(fileURLToPath(file));
      const ok = info.width === size.width && info.height === size.height;
      if (!ok) failed = true;
      console.log(
        `${ok ? "ok  " : "SIZE"} public${shotPath(lang, name)}: ${info.width}×${info.height}` +
          `${ok ? "" : ` (should be ${size.width}×${size.height})`}, ${(info.size / 1000).toFixed(1)} KB`,
      );
    }
  }
} finally {
  await browser.close();
  server.close();
  await vite.close();
}
if (failed) {
  console.error("\nAn image has the wrong size: check `shots` in src/data/howItWorks.ts.");
  process.exit(1);
}
