// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// URL prefix → hreflang. Adding a language starts here.
const locales = { en: "en" };
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
  integrations: [sitemap({ i18n: { defaultLocale, locales } }), svelte()],
});
