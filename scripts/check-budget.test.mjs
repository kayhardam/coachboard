import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { BUDGETS, checkBudget, table } from "./check-budget.mjs";

let dist;

function build(files, budgets = BUDGETS) {
  dist = mkdtempSync(join(tmpdir(), "check-budget-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), content);
  }
  return checkBudget(dist, budgets);
}

const gz = (text) => gzipSync(text).length;
const row = (rows, budget, item) => rows.find((r) => r.budget === budget && (item === undefined || r.item === item));

const island = `<astro-island component-url="/_astro/Editor.js" renderer-url="/_astro/renderer.js"></astro-island>`;
const editor = `import{a}from"./client.js";export default a;`;
const renderer = `import"./client.js";`;
const client = "export const a=1;";

afterEach(() => rmSync(dist, { recursive: true, force: true }));

describe("checkBudget", () => {
  it("accepts content pages without scripts and allows JSON-LD", () => {
    const { rows, errors } = build({
      "en/index.html": `<script type="application/ld+json">{"@type":"WebSite"}</script>`,
      "en/about/index.html": "<p>About</p>",
    });
    expect(errors).toEqual([]);
    expect(row(rows, "Scripts")).toMatchObject({ item: "2 content pages", measured: 0 });
  });

  it.each([
    ["an inline script", "<script>console.log(1)</script>"],
    ["a script file", `<script type="module" src="/_astro/x.js"></script>`],
    ["an island", island],
    ["a modulepreload", `<link rel="modulepreload" href="/_astro/x.js">`],
  ])("fails on %s on a content page", (_, html) => {
    const { rows, errors } = build({ "en/about/index.html": html, "_astro/x.js": "" });
    expect(errors).toEqual([expect.stringMatching(/^\/en\/about\/: content pages ship no JS/)]);
    expect(row(rows, "Scripts").measured).toBe(1);
  });

  it("allows scripts on the board in any language", () => {
    const files = {
      "_astro/Editor.js": editor,
      "_astro/renderer.js": renderer,
      "_astro/client.js": client,
    };
    for (const lang of ["en", "nl"]) files[`${lang}/board/index.html`] = `<script>x()</script>${island}`;
    const { rows, errors } = build(files);
    expect(errors).toEqual([]);
    expect(row(rows, "Scripts").measured).toBe(0);
    expect(rows.filter((r) => r.budget === "JS (gzip)").map((r) => r.item)).toEqual(["/en/board/", "/nl/board/"]);
  });

  it("counts the board's static imports once and its dynamic imports as lazy JS", () => {
    const qr = "export const qr=2;";
    const lazyEditor = `${editor}const q=()=>import("./qr.js");`;
    const { rows, errors } = build({
      "en/board/index.html": island,
      "_astro/Editor.js": lazyEditor,
      "_astro/renderer.js": renderer,
      "_astro/client.js": client,
      "_astro/qr.js": qr,
    });
    expect(errors).toEqual([]);
    expect(row(rows, "JS (gzip)").measured).toBe(gz(lazyEditor) + gz(renderer) + gz(client));
    expect(row(rows, "Lazy JS (gzip)").measured).toBe(gz(qr));
  });

  it("finds a dynamic import written with backticks, as Vite writes it", () => {
    const qr = "export const qr=2;";
    const lazyEditor = `${editor}const q=()=>import(\`./qr.js\`);`;
    const { rows } = build({
      "en/board/index.html": island,
      "_astro/Editor.js": lazyEditor,
      "_astro/renderer.js": renderer,
      "_astro/client.js": client,
      "_astro/qr.js": qr,
    });
    expect(row(rows, "Lazy JS (gzip)").measured).toBe(gz(qr));
  });

  it("counts every .js file in _astro in the total, even one no page loads", () => {
    const { rows } = build({ "_astro/a.js": "one", "_astro/chunks/b.js": "two" });
    expect(row(rows, "All JS (gzip)").measured).toBe(gz("one") + gz("two"));
  });

  it("measures CSS, HTML and PNG per file", () => {
    const html = `<link rel="stylesheet" href="/_astro/a.css"><link rel="stylesheet" href="/_astro/a.css">`;
    const { rows } = build({
      "en/index.html": html,
      "_astro/a.css": "body{margin:0}",
      "og.png": "x".repeat(1234),
    });
    expect(row(rows, "CSS (gzip)", "/en/").measured).toBe(gz("body{margin:0}"));
    expect(row(rows, "HTML (gzip)", "/en/").measured).toBe(gz(html));
    expect(row(rows, "PNG", "/og.png").measured).toBe(1234);
  });

  it("fails a budget just over its limit and passes at the limit", () => {
    const files = {
      "en/board/index.html": island,
      "_astro/Editor.js": editor,
      "_astro/renderer.js": renderer,
      "_astro/client.js": client,
      "og.png": "x".repeat(100),
    };
    const js = gz(editor) + gz(renderer) + gz(client);
    const html = gz(island);
    const at = { boardJs: js, lazyJs: 0, allJs: js, css: 0, html, png: 100 };
    expect(build(files, at).errors).toEqual([]);
    rmSync(dist, { recursive: true, force: true });

    const over = { boardJs: js - 1, lazyJs: 0, allJs: js - 1, css: 0, html: html - 1, png: 99 };
    const { errors } = build(files, over);
    expect(errors.map((e) => e.split(":")[0])).toEqual([
      "JS (gzip) /en/board/",
      "HTML (gzip) /en/board/",
      "All JS (gzip) /_astro/",
      "PNG /og.png",
    ]);
  });

  it("reports a missing script, stylesheet or import instead of counting it as 0", () => {
    const { errors } = build({
      "en/board/index.html": `${island}<link rel="stylesheet" href="/_astro/gone.css">`,
      "_astro/Editor.js": `import"./gone.js";`,
    });
    expect(errors).toEqual([
      "/en/board/: /_astro/renderer.js is missing",
      "/en/board/: _astro/Editor.js imports missing ./gone.js",
      "/en/board/: /_astro/gone.css is missing",
    ]);
  });
});

describe("table", () => {
  it("lines up the measured value next to its budget and marks what is over", () => {
    const text = table([
      { budget: "JS (gzip)", item: "/en/board/", measured: 28_300, limit: 32_500, unit: "KB" },
      { budget: "Scripts", item: "9 content pages", measured: 1, limit: 0, unit: "" },
    ]);
    expect(text.split("\n")).toEqual([
      "Budget     Item             Measured   Budget",
      "JS (gzip)  /en/board/        28.3 KB  32.5 KB  ok",
      "Scripts    9 content pages         1        0  OVER",
    ]);
  });
});
