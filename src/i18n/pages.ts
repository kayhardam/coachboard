// Long page text (about, privacy) lives per language in src/i18n/pages/<page>/<lang>.astro;
// the page keeps the layout and the styles. Short texts stay in ui.ts.

/**
 * Picks the text for `lang` from an eager import.meta.glob() of a page's folder
 * (with `import: "default"`).
 * Throws, and so fails the build, when a language has no text: falling back to
 * English would put an English page under /nl/.
 */
export function pageText<T>(modules: Record<string, T>, lang: string): T {
  const match = Object.entries(modules).find(([path]) => path.endsWith(`/${lang}.astro`));
  if (!match) {
    const folder = Object.keys(modules)[0]?.replace(/\/[^/]+$/, "/") ?? "src/i18n/pages/<page>/";
    throw new Error(`No text for "${lang}" in ${folder}: add ${lang}.astro there.`);
  }
  return match[1];
}
