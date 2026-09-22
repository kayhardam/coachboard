// Which locales exist lives in astro.config.mjs (read it via `astro:config/client`).
// This file holds the UI strings and what Astro's i18n config has no room for.

/** English is the source language: every key exists here. */
const en = {
  "a11y.skip": "Skip to content",
  "nav.label": "Main navigation",
  "nav.menu": "Menu",
  "nav.home": "Home",
  "nav.privacy": "Privacy",
  "footer.tagline":
    "The free digital coachboard for handball trainers. Draw a play, share a link or QR code, and your whole team has it on their phone.",
  "footer.site": "Site",
  "footer.madeBy": "Made by a handball trainer 🤝",
  "footer.language": "Language",
} as const;

export type UiKey = keyof typeof en;

/** Other languages may leave keys out; those fall back to English. */
const ui: Record<string, Partial<Record<UiKey, string>>> = { en };

export function t(locale: string, key: UiKey): string {
  return ui[locale]?.[key] ?? en[key];
}

/** Open Graph wants language_TERRITORY. */
export const ogLocale: Record<string, string> = {
  en: "en_GB",
};
