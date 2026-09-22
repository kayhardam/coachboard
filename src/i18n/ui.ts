// Which locales exist lives in astro.config.mjs (read it via `astro:config/client`).
// This file holds what Astro's i18n config has no room for.

/** Open Graph wants language_TERRITORY. */
export const ogLocale: Record<string, string> = {
  en: "en_GB",
};
