import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addModulePreloads, eagerScripts, withPreloads } from "./modulepreload.mjs";

let dist;

function build(files) {
  dist = mkdtempSync(join(tmpdir(), "modulepreload-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), content);
  }
  return dist;
}

const head = (links = "") => `<html><head><meta charset="utf-8">${links}</head><body>`;
const island = `<astro-island component-url="/_astro/Editor.js" renderer-url="/_astro/renderer.js"></astro-island>`;
const chunks = {
  "_astro/Editor.js": `export{a as default}from"./board.js";`,
  "_astro/renderer.js": `import"./board.js";`,
  "_astro/board.js": `const a=1;export{a};const q=()=>import("./qr.js");`,
  "_astro/qr.js": "export const qr=1;",
};
const preload = (name) => `<link rel="modulepreload" href="/_astro/${name}">`;

afterEach(() => rmSync(dist, { recursive: true, force: true }));

describe("eagerScripts", () => {
  it("follows an island's component and renderer and their static imports, not dynamic ones", () => {
    build(chunks);
    expect(eagerScripts(`${head()}${island}`, dist)).toEqual(["/_astro/Editor.js", "/_astro/board.js", "/_astro/renderer.js"]);
  });

  it("follows a module script of this site, not one from another origin or an inline one", () => {
    build({ "_astro/page.js": `import"./board.js";`, "_astro/board.js": "" });
    const html = `${head()}<script type="module" src="/_astro/page.js"></script>
      <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js"></script>
      <script type="module" src="//cdn.example.com/x.js"></script><script>x()</script>`;
    expect(eagerScripts(html, dist)).toEqual(["/_astro/page.js", "/_astro/board.js"]);
  });

  it("leaves out a file that isn't built", () => {
    build({});
    expect(eagerScripts(`${head()}${island}`, dist)).toEqual([]);
  });
});

describe("withPreloads", () => {
  it("adds one preload per eager script at the end of the head", () => {
    build(chunks);
    const html = withPreloads(`${head()}${island}`, dist);
    expect(html).toBe(`${head(preload("Editor.js") + preload("board.js") + preload("renderer.js"))}${island}`);
  });

  it("doesn't add a preload twice", () => {
    build(chunks);
    const once = withPreloads(`${head()}${island}`, dist);
    expect(withPreloads(once, dist)).toBe(once);
  });

  it("leaves a page without JS alone", () => {
    build(chunks);
    const html = `${head()}<script type="application/ld+json">{}</script><p>About</p>`;
    expect(withPreloads(html, dist)).toBe(html);
  });
});

describe("addModulePreloads", () => {
  it("changes only the pages that load JS", () => {
    build({ ...chunks, "en/board/index.html": `${head()}${island}`, "en/about/index.html": `${head()}<p>About</p>` });
    expect(addModulePreloads(dist)).toEqual(["en/board/index.html"]);
    expect(readFileSync(join(dist, "en/board/index.html"), "utf8")).toContain(preload("board.js"));
    expect(readFileSync(join(dist, "en/about/index.html"), "utf8")).not.toContain("modulepreload");
  });
});
