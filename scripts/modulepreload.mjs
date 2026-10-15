// Adds a <link rel="modulepreload"> to the <head> of each built page for every
// JS file it loads at once: an island's component and renderer, a module
// script, and what they import statically. Runs after `astro build` (the
// integration in astro.config.mjs).
//
// Astro writes none for islands. Without them the browser finds the board's
// JS only when the island's inline script runs, after the CSS, and then its
// imports one round trip later. With them it fetches all of it while the page
// parses (docs/metingen.md, phase 15-1). Content pages load no JS, so they
// stay as they are; dynamic imports (the QR code) still load later.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const ENTRY = /<astro-island\b[^>]*>|<script\b[^>]*\btype="module"[^>]*>/gi;
const URL_ATTR = /\b(?:component-url|renderer-url|src)="(\/[^/"][^"]*\.js)"/g;
const PRELOAD = /<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/gi;
// The same pattern as scripts/check-budget.mjs: a static import of a chunk.
const STATIC_IMPORT = /(?:\bfrom|\bimport)\s*["']([^"']+\.js)["']/g;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

/**
 * The site paths of the JS files a page loads at once, entries first, then
 * their static imports. A file that isn't in `dist` is left out (and its imports).
 */
export function eagerScripts(html, dist) {
  const found = [];
  const visit = (url) => {
    const file = join(dist, url);
    if (found.includes(url) || !existsSync(file)) return;
    found.push(url);
    for (const [, spec] of readFileSync(file, "utf8").matchAll(STATIC_IMPORT)) {
      if (spec.startsWith(".")) visit("/" + relative(dist, join(dirname(file), spec)).split(sep).join("/"));
    }
  };
  for (const [tag] of html.matchAll(ENTRY)) for (const [, url] of tag.matchAll(URL_ATTR)) visit(url);
  return found;
}

/** `html` with a modulepreload for each eager script it doesn't preload yet, at the end of <head>. */
export function withPreloads(html, dist) {
  const have = new Set([...html.matchAll(PRELOAD)].map(([, href]) => href));
  const links = eagerScripts(html, dist)
    .filter((url) => !have.has(url))
    .map((url) => `<link rel="modulepreload" href="${url}">`)
    .join("");
  return links ? html.replace("</head>", `${links}</head>`) : html;
}

/** Adds the preloads to every page in `dist`; returns the pages it changed, relative to `dist`. */
export function addModulePreloads(dist) {
  const changed = [];
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, "utf8");
    const next = withPreloads(html, dist);
    if (next !== html) {
      writeFileSync(file, next);
      changed.push(relative(dist, file).split(sep).join("/"));
    }
  }
  return changed;
}
