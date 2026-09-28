// Checks the built site against size budgets. Run after `astro build`:
//   node scripts/check-budget.mjs
//
// - Content pages (every page except <lang>/board/) ship no JavaScript: no
//   <script> other than JSON-LD, no <astro-island>, no modulepreload.
// - The board's JS: the files its page loads plus everything they import
//   statically. Dynamic imports count as its lazy JS.
// - All JS: every .js file in _astro/, so code moved into a lazy chunk still counts.
// - CSS and HTML per page, and every PNG.
//
// Sizes are in KB of 1000 bytes; JS, CSS and HTML are gzipped (zlib default
// level), as in the baseline in docs/metingen.md. PNGs are counted raw.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

// Raise a budget only on purpose, and give the reason in the pull request.
// Baseline (docs/metingen.md, phase 3 and 4a) plus about 15%.
export const BUDGETS = {
  boardJs: 32_500, // 28.3 KB
  lazyJs: 10_000, // 0 KB
  allJs: 32_500, // 28.3 KB
  css: 2_000, // 1.6 KB per page
  html: 6_500, // 5.5 KB on the board, the largest page
  png: 60_000, // 50.5 KB for og-default.png, the largest
};

const TAG = /<(script|astro-island|link)\b([^>]*)>/gi;
const ATTR = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const STATIC_IMPORT = /(?:\bfrom|\bimport)\s*["']([^"']+\.js)["']/g;
// Vite writes dynamic imports with backticks: import(`./chunk.js`).
const DYNAMIC_IMPORT = /\bimport\s*\(\s*["'`]([^"'`]+\.js)["'`]\s*\)/g;

function* files(dir, ext) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path, ext);
    else if (entry.name.endsWith(ext)) yield path;
  }
}

function attrs(source) {
  const result = {};
  for (const [, name, dq, sq, bare] of source.matchAll(ATTR)) {
    result[name.toLowerCase()] = dq ?? sq ?? bare;
  }
  return result;
}

const gzipped = (path) => gzipSync(readFileSync(path)).length;

const isBoard = (page) => /^[^/]+\/board\/index\.html$/.test(page);

/**
 * @param {string} dist     directory with the built site
 * @param {typeof BUDGETS} budgets
 * @returns {{ rows: { budget: string, item: string, measured: number, limit: number, unit: string }[], errors: string[] }}
 */
export function checkBudget(dist, budgets = BUDGETS) {
  const rows = [];
  const errors = [];

  /** Adds a row, and an error when the measured value is over its limit. */
  function measure(budget, item, measured, limit, unit = "KB") {
    rows.push({ budget, item, measured, limit, unit });
    if (measured > limit) {
      errors.push(`${budget} ${item}: ${format(measured, unit)} is over the budget of ${format(limit, unit)}`);
    }
  }

  /** The file a site-relative URL points to, or null (with an error) when it is missing. */
  function resolve(url, where) {
    if (!url.startsWith("/") || url.startsWith("//")) return null;
    const path = join(dist, decodeURIComponent(url.split(/[?#]/)[0]));
    if (existsSync(path)) return path;
    errors.push(`${where}: ${url} is missing`);
    return null;
  }

  /** The .js files a set of entry files imports, statically and dynamically. */
  function importGraph(entries, where) {
    const eager = new Set();
    const lazy = new Set();
    const visit = (file, set) => {
      if (eager.has(file) || set.has(file)) return;
      set.add(file);
      const code = readFileSync(file, "utf8");
      for (const [pattern, target] of [
        [STATIC_IMPORT, set],
        [DYNAMIC_IMPORT, lazy],
      ]) {
        for (const [, spec] of code.matchAll(pattern)) {
          if (!spec.startsWith(".")) continue;
          const path = join(dirname(file), spec);
          if (existsSync(path)) visit(path, target);
          else errors.push(`${where}: ${relative(dist, file)} imports missing ${spec}`);
        }
      }
    };
    for (const entry of entries) visit(entry, eager);
    for (const file of eager) lazy.delete(file);
    return { eager, lazy };
  }

  const sum = (paths) => [...paths].reduce((total, path) => total + gzipped(path), 0);

  const pages = [...files(dist, ".html")].map((file) => relative(dist, file).split(sep).join("/")).sort();
  let contentPages = 0;
  let contentScripts = 0;

  for (const page of pages) {
    const file = join(dist, page);
    const url = `/${page.replace(/(^|\/)index\.html$/, "$1")}`;
    const html = readFileSync(file, "utf8");
    const board = isBoard(page);
    const scripts = [];
    const stylesheets = [];
    const forbid = (found) => {
      contentScripts++;
      errors.push(`${url}: content pages ship no JS, found ${found}`);
    };

    for (const [, tag, source] of html.matchAll(TAG)) {
      const a = attrs(source);
      const name = tag.toLowerCase();
      if (name === "script") {
        if (a.type?.toLowerCase() === "application/ld+json") continue;
        if (!board) forbid(`<script${source}>`);
        if (a.src) scripts.push(a.src);
      } else if (name === "astro-island") {
        if (!board) forbid("<astro-island>");
        for (const key of ["component-url", "renderer-url"]) if (a[key]) scripts.push(a[key]);
      } else {
        const rel = (a.rel ?? "").toLowerCase().split(/\s+/);
        if (rel.includes("modulepreload")) {
          if (!board) forbid(`<link rel="modulepreload">`);
          if (a.href) scripts.push(a.href);
        }
        if (rel.includes("stylesheet") && a.href) stylesheets.push(a.href);
      }
    }

    if (!board) {
      contentPages++;
    } else {
      const entries = scripts.map((src) => resolve(src, url)).filter(Boolean);
      const { eager, lazy } = importGraph(new Set(entries), url);
      measure("JS (gzip)", url, sum(eager), budgets.boardJs);
      measure("Lazy JS (gzip)", url, sum(lazy), budgets.lazyJs);
    }

    const css = stylesheets.map((href) => resolve(href, url)).filter(Boolean);
    measure("CSS (gzip)", url, sum(new Set(css)), budgets.css);
    measure("HTML (gzip)", url, gzipped(file), budgets.html);
  }

  // Each script found is already an error with its page; this row is the summary.
  rows.push({ budget: "Scripts", item: `${contentPages} content pages`, measured: contentScripts, limit: 0, unit: "" });

  const astro = join(dist, "_astro");
  const allJs = existsSync(astro) ? sum(files(astro, ".js")) : 0;
  measure("All JS (gzip)", "/_astro/", allJs, budgets.allJs);

  for (const file of [...files(dist, ".png")].sort()) {
    const url = `/${relative(dist, file).split(sep).join("/")}`;
    measure("PNG", url, statSync(file).size, budgets.png);
  }

  const order = ["JS (gzip)", "Lazy JS (gzip)", "All JS (gzip)", "Scripts", "CSS (gzip)", "HTML (gzip)", "PNG"];
  rows.sort((a, b) => order.indexOf(a.budget) - order.indexOf(b.budget));
  return { rows, errors };
}

/** Bytes as KB with one decimal; a count stays a count. */
export function format(value, unit) {
  return unit === "KB" ? `${(value / 1000).toFixed(1)} KB` : String(value);
}

/** The rows as an aligned plain-text table. */
export function table(rows) {
  const lines = [["Budget", "Item", "Measured", "Budget", ""]];
  for (const { budget, item, measured, limit, unit } of rows) {
    lines.push([budget, item, format(measured, unit), format(limit, unit), measured > limit ? "OVER" : "ok"]);
  }
  const widths = lines[0].map((_, i) => Math.max(...lines.map((line) => line[i].length)));
  const right = [false, false, true, true, false];
  return lines
    .map((line) =>
      line
        .map((cell, i) => (right[i] ? cell.padStart(widths[i]) : cell.padEnd(widths[i])))
        .join("  ")
        .trimEnd(),
    )
    .join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = fileURLToPath(new URL("../dist/", import.meta.url));
  const { rows, errors } = checkBudget(dist);
  console.log(table(rows));

  if (errors.length > 0) {
    console.error(`\nBudget check failed (${errors.length}):\n  ${errors.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`\nBudget OK: ${rows.length} checks.`);
}
