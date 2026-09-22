import type { UiKey } from "../i18n/ui";

export interface NavItem {
  /** Path after the locale prefix, e.g. "privacy/". Empty for the home page. */
  path: string;
  label: UiKey;
}

// Only pages that exist: scripts/check-links.mjs fails the build otherwise.

/** Header menu and the footer's site column. */
export const nav: NavItem[] = [{ path: "", label: "nav.home" }];

/** Footer only. */
export const legal: NavItem[] = [{ path: "privacy/", label: "nav.privacy" }];
