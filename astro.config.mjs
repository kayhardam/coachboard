// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { fileURLToPath } from "node:url";
import { addModulePreloads } from "./scripts/modulepreload.mjs";

// URL prefix → hreflang. Adding a language starts here.
const locales = { en: "en", nl: "nl" };
const defaultLocale = "en";

// https://astro.build/config
export default defineConfig({
  site: "https://handballcoachboard.com",
  trailingSlash: "always",
  i18n: {
    locales: Object.keys(locales),
    defaultLocale,
    routing: { prefixDefaultLocale: true },
  },
  // A CSP <meta> on every page, with hashes for Astro's inline scripts.
  // frame-ancestors can't go in a <meta>; it is in public/_headers.
  security: {
    csp: {
      directives: ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"],
      // The board editor injects its CSS as a <style> at runtime (css="injected"),
      // whose hash Astro can't know. 'unsafe-inline' for styles only; scripts keep
      // their hashes. Astro then leaves out the style hashes.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  // No code blocks in the content; Shiki's inline styles would trip the CSP warning.
  markdown: { syntaxHighlight: false },
  vite: {
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              // One chunk the editor and the viewer share: the Svelte runtime,
              // Astro's Svelte renderer, the court and what reads and plays a
              // board (decision K1, phase 15). The editor's own code stays in
              // its entry chunk, and so does the viewer's: the viewer never
              // loads the editor. A module both use must fall in this group, or
              // it becomes a chunk of its own: another request, and import and
              // export lists. The QR code (uqr, src/lib/board/qr.ts) stays out,
              // so it keeps loading later, and so does the inline script in board.astro.
              codeSplitting: {
                groups: [
                  {
                    name: "board",
                    test: /node_modules\/(svelte|clsx|esm-env|@astrojs\/svelte)\/|src\/components\/board\/Court\.svelte|src\/lib\/(viewerIcons|board\/(format|geometry|moves|play|newer))\./,
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  integrations: [
    // The pages for shared boards (/<lang>/board/link/ and /qr/) are noindex.
    sitemap({ i18n: { defaultLocale, locales }, filter: (page) => !/\/board\/(link|qr)\/$/.test(page) }),
    svelte(),
    // The board pages fetch their JS while the page parses, not after the
    // island's script runs (scripts/modulepreload.mjs).
    {
      name: "modulepreload",
      hooks: {
        "astro:build:done": ({ dir, logger }) => {
          const pages = addModulePreloads(fileURLToPath(dir));
          logger.info(`modulepreload added to ${pages.length} pages`);
        },
      },
    },
  ],
});
