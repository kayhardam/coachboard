// Pure helpers for the tactics collection. src/data/tactics.ts feeds them the
// entries; keeping astro:content out of here lets vitest test them.
//
// Entry ids come from the file path: src/content/tactics/en/6-0-defense-basics.md
// has id "en/6-0-defense-basics". The folder is the language, the file name
// the slug, and `related` lists full ids.

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function parseId(id: string): { lang: string; slug: string } {
  const slash = id.indexOf("/");
  return slash < 0 ? { lang: "", slug: id } : { lang: id.slice(0, slash), slug: id.slice(slash + 1) };
}

/** Path after the locale prefix, for getRelativeLocaleUrl(). */
export function tacticPath(category: string, slug: string): string {
  return `tactics/${category}/${slug}/`;
}

export interface TacticRef {
  id: string;
  related: { id: string }[];
}

/**
 * What the schema can't see: the file's folder and how entries point at each
 * other. reference() already fails the build on a related id that doesn't exist.
 */
export function checkTactics(entries: TacticRef[], locales: readonly string[]): string[] {
  const errors: string[] = [];
  for (const { id, related } of entries) {
    const { lang, slug } = parseId(id);
    if (!locales.includes(lang)) {
      errors.push(`"${id}": put it in a language folder (${locales.join(", ")})`);
    }
    if (!SLUG.test(slug)) {
      errors.push(`"${id}": the file name must be lowercase-kebab-case, with no subfolders`);
    }
    for (const r of related) {
      if (r.id === id) errors.push(`"${id}": lists itself as related`);
      else if (parseId(r.id).lang !== lang) errors.push(`"${id}": related "${r.id}" is in another language`);
    }
  }
  return errors;
}
