import type { UiKey } from "../i18n/ui";
import { libraryShown } from "./libraryShown";

export interface NavItem {
  /** Path after the locale prefix, e.g. "privacy/". Empty for the home page. */
  path: string;
  label: UiKey;
  /** Fragment without "#". Kept out of getRelativeLocaleUrl(), which would add a slash after it. */
  hash?: string;
}

// Only pages that exist: scripts/check-links.mjs fails the build otherwise.

/** The library's overviews: in the header menu and in More on the board, only while the library shows. */
export const libraryNav: NavItem[] = libraryShown
  ? [
      { path: "tactics/", label: "nav.tactics" },
      { path: "drills/", label: "nav.drills" },
    ]
  : [];

/** Header menu. */
export const nav: NavItem[] = [
  { path: "", label: "nav.home" },
  { path: "board/", label: "nav.board" },
  ...libraryNav,
];

/** The header's call to action. */
export const boardPath = "board/";

/** Where Share and the QR code point (BoardPage.astro); the privacy page names them. */
export const sharePaths = {
  link: "board/link/",
  qr: "board/qr/",
};

/** The page that explains the board: in the footer, on the home and about pages, and at the bottom of More on the board. */
export const howItWorks: NavItem = { path: "how-it-works/", label: "nav.howItWorks" };

/** Footer only. */
export const footerOnly: NavItem[] = [
  howItWorks,
  { path: "about/", label: "nav.about" },
  { path: "about/", label: "nav.contact", hash: "contact" },
  { path: "privacy/", label: "nav.privacy" },
];
