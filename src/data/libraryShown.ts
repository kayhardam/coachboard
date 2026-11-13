// The library (tactics and drills) is out of sight for now (decision 34, Kay,
// 13 November 2026): its content isn't right yet. Its pages, items and URLs stay,
// so old links keep working. No `astro:` imports: astro.config.mjs and the e2e
// tests read this file too.

/**
 * Whether the library shows. Off: no way in from the menu, the home page, the
 * about page or More on the board, and every library page is noindex and out of
 * the sitemap. Turning it back on is this one line (and the AGENTS.md rules).
 */
export const libraryShown = false;

/** A library page: an item, an overview or a category page, in any language. Takes a path, not a URL. */
export const isLibraryPath = (path: string) => /^\/[a-z]{2}\/(tactics|drills)\//.test(path);
