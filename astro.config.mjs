// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
  integrations: [sitemap({ i18n: { defaultLocale, locales } })],
});
