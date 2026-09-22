// The locales configured in astro.config.mjs, typed for use in pages.
import { i18n } from "astro:config/client";

export const locales = i18n!.locales as string[];
export const defaultLocale = i18n!.defaultLocale;

/** getStaticPaths() for pages under src/pages/[lang]/. */
export function localeParams() {
  return locales.map((lang) => ({ params: { lang } }));
}
