// The tactics collection, checked and shaped for the pages.
import { getCollection, type CollectionEntry } from "astro:content";
import { locales } from "../i18n/locales";
import { categorySlugs } from "./categories";
import { checkTactics, parseId, tacticPath } from "../lib/tactics";

export interface Tactic {
  entry: CollectionEntry<"tactics">;
  lang: string;
  slug: string;
  /** Path after the locale prefix, e.g. "tactics/fast-break-second-wave/". */
  path: string;
}

/** Every tactic in every language. Throws, and so fails the build, on a bad entry. */
async function allTactics(): Promise<Tactic[]> {
  const entries = await getCollection("tactics");
  const errors = checkTactics(
    entries.map((e) => ({ id: e.id, related: e.data.related })),
    locales,
    categorySlugs,
  );
  if (errors.length > 0) {
    throw new Error(`Invalid tactics in src/content/tactics/:\n  - ${errors.join("\n  - ")}`);
  }
  return entries
    .map((entry) => {
      const { lang, slug } = parseId(entry.id);
      return { entry, lang, slug, path: tacticPath(slug) };
    })
    .sort((a, b) => a.entry.data.title.localeCompare(b.entry.data.title, a.lang));
}

/** The tactics in one language, sorted by title. */
export async function tacticsFor(lang: string): Promise<Tactic[]> {
  return (await allTactics()).filter((t) => t.lang === lang);
}

/** getStaticPaths() for a tactic's page and its share image. */
export async function tacticPaths() {
  return (await allTactics()).map((tactic) => ({
    params: { lang: tactic.lang, slug: tactic.slug },
    props: { tactic },
  }));
}
