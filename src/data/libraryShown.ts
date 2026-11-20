// The library (tactics and drills) shows again (plan step 2, November 2026): it
// was out of sight from 13 November 2026 (decision 34) until its content was
// checked. Off, its pages, items and URLs stay, so old links keep working. No
// `astro:` imports: astro.config.mjs and the e2e tests read this file too.

/**
 * Whether the library shows. Off: no way in from the menu, the home page, the
 * about page or More on the board, and every library page is noindex and out of
 * the sitemap. Either way is this one line (and the AGENTS.md rules).
 */
export const libraryShown = true;

/** A library page: an item, an overview or a category page, in any language. Takes a path, not a URL. */
export const isLibraryPath = (path: string) => /^\/[a-z]{2}\/(tactics|drills)\//.test(path);
