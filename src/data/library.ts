// The library collection (tactics, later drills), checked and shaped for the pages.
import { getCollection, type CollectionEntry } from "astro:content";
import { locales } from "../i18n/locales";
import { AGES, categorySlugs } from "./categories";
import { checkLibrary, checkMeters, itemPath, parseId, type ItemType } from "../lib/library";

export type { ItemType };

export interface Item {
  entry: CollectionEntry<"library">;
  type: ItemType;
  lang: string;
  slug: string;
  /** Path after the locale prefix, e.g. "tactics/fast-break-second-wave/". */
  path: string;
}

/** Every item in every language. Throws, and so fails the build, on a bad entry. */
async function allItems(): Promise<Item[]> {
  const entries = await getCollection("library");
  const errors = checkLibrary(
    entries.map((e) => ({
      id: e.id,
      type: e.data.type,
      ages: e.data.ages.map((age) => AGES.indexOf(age)),
      board: e.data.board,
      related: e.data.related,
    })),
    locales,
    categorySlugs,
  );
  errors.push(...checkMeters(entries));
  if (errors.length > 0) {
    throw new Error(`Invalid items in src/content/library/:\n  - ${errors.join("\n  - ")}`);
  }
  return entries
    .map((entry) => {
      const { lang, slug } = parseId(entry.id);
      const { type } = entry.data;
      return { entry, type, lang, slug, path: itemPath(type, slug) };
    })
    .sort((a, b) => a.entry.data.title.localeCompare(b.entry.data.title, a.lang));
}

/** The items of a type in one language, sorted by title. */
export async function itemsFor(lang: string, type: ItemType): Promise<Item[]> {
  return (await allItems()).filter((item) => item.lang === lang && item.type === type);
}

/** The items in one language, of every type, for "See also". */
export async function allItemsFor(lang: string): Promise<Item[]> {
  return (await allItems()).filter((item) => item.lang === lang);
}

/** getStaticPaths() for the pages of a type and their share images. */
export async function itemPaths(type: ItemType) {
  return (await allItems())
    .filter((item) => item.type === type)
    .map((item) => ({ params: { lang: item.lang, slug: item.slug }, props: { item } }));
}

/** The languages an item exists in: a translation has the same slug (and type, checkLibrary()). */
export async function itemLanguages(slug: string): Promise<string[]> {
  return (await allItems()).filter((item) => item.slug === slug).map((item) => item.lang);
}

/** The languages that have a page for a category of a type: those with an item in it. */
export async function categoryLanguages(type: ItemType, category: string): Promise<string[]> {
  const langs = (await allItems())
    .filter((item) => item.type === type && item.entry.data.category === category)
    .map((item) => item.lang);
  return [...new Set(langs)];
}

/** The categories with at least one item of a type in a language, in the order of categorySlugs. */
export async function usedCategories(lang: string, type: ItemType) {
  const items = await itemsFor(lang, type);
  return categorySlugs.filter((c) => items.some((item) => item.entry.data.category === c));
}

/**
 * getStaticPaths() for the category pages of a type. Only categories with at
 * least one item get a page, so search engines never index an empty one.
 */
export async function categoryPaths(type: ItemType) {
  const paths = [];
  for (const lang of locales) {
    const items = await itemsFor(lang, type);
    const used = await usedCategories(lang, type);
    for (const category of used) {
      paths.push({
        params: { lang, category },
        props: {
          type,
          items: items.filter((item) => item.entry.data.category === category),
          others: used.filter((c) => c !== category),
        },
      });
    }
  }
  return paths;
}
