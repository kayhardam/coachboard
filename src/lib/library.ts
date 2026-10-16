// Pure helpers for the library collection (tactics, later drills).
// src/data/library.ts feeds them the entries; keeping astro:content out of
// here lets vitest test them.
//
// Entry ids come from the file path: src/content/library/en/6-0-defense-basics.md
// has id "en/6-0-defense-basics". The folder is the language, the file name
// the slug, and `related` lists full ids. A translation has the same file name
// in another language folder, so its URL differs only in the prefix.
import type { Board } from "./board/format";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ItemType = "tactic" | "drill";

export function parseId(id: string): { lang: string; slug: string } {
  const slash = id.indexOf("/");
  return slash < 0 ? { lang: "", slug: id } : { lang: id.slice(0, slash), slug: id.slice(slash + 1) };
}

/** The URL level of a type: tactics/ or drills/. */
export function typeDir(type: ItemType): string {
  return type === "tactic" ? "tactics" : "drills";
}

/**
 * Path after the locale prefix, for getRelativeLocaleUrl(). Only the type is in
 * the URL, not the category, so an item can change category without moving.
 */
export function itemPath(type: ItemType, slug: string): string {
  return `${typeDir(type)}/${slug}/`;
}

/** Every step has its sentence: the page shows it beside the step's drawing. */
export function stepsHaveText(board: Board): boolean {
  return board.frames.every((frame) => Boolean(frame.text?.trim()));
}

/** "6 meter" or "9 meter" with a plain space, which can break over two lines. */
export function breakableMeters(text: string): string[] {
  return [...text.matchAll(/\b[69] meter/g)].map((m) => m[0]);
}

/** The drawing without labels and sentences, with its keys in a fixed order. */
function drawing(board: Board): string {
  const sorted = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sorted)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, sorted(v)]),
          )
        : value;
  const { title: _title, ...rest } = board;
  return JSON.stringify(
    sorted({
      ...rest,
      frames: board.frames.map(({ text: _text, ...frame }) => ({
        ...frame,
        players: frame.players.map(({ label: _label, ...player }) => player),
      })),
    }),
  );
}

/** A translation draws the same: the same steps, places and arrows. Only labels and sentences differ. */
export function sameDrawing(a: Board, b: Board): boolean {
  return drawing(a) === drawing(b);
}

export interface ItemRef {
  id: string;
  type: ItemType;
  /** Indexes into the list of age groups, in the order the file gives them. */
  ages: number[];
  board: Board;
  related: { id: string }[];
}

/**
 * What the schema can't see: the file's folder, how entries point at each
 * other and how translations match. reference() already fails the build on a
 * related id that doesn't exist. `categories` share the URL level with the
 * items (tactics/attack/ and tactics/<slug>/, the same under drills/), so no
 * slug may equal one.
 */
export function checkLibrary(entries: ItemRef[], locales: readonly string[], categories: readonly string[] = []): string[] {
  const errors: string[] = [];
  const bySlug = new Map<string, ItemRef>();
  for (const entry of entries) {
    const { id, type, ages, board, related } = entry;
    const { lang, slug } = parseId(id);
    if (!locales.includes(lang)) {
      errors.push(`"${id}": put it in a language folder (${locales.join(", ")})`);
    }
    if (!SLUG.test(slug)) {
      errors.push(`"${id}": the file name must be lowercase-kebab-case, with no subfolders`);
    }
    if (categories.includes(slug)) {
      errors.push(`"${id}": the file name is a category; ${typeDir(type)}/${slug}/ is the category page`);
    }
    if (ages.some((age, i) => i > 0 && age !== ages[i - 1]! + 1)) {
      errors.push(`"${id}": list the age groups in order, without a gap`);
    }
    for (const r of related) {
      if (r.id === id) errors.push(`"${id}": lists itself as related`);
      else if (parseId(r.id).lang !== lang) errors.push(`"${id}": related "${r.id}" is in another language`);
    }
    const other = bySlug.get(slug);
    if (!other) {
      bySlug.set(slug, entry);
    } else if (other.type !== type) {
      errors.push(`"${id}": is a ${type}, but "${other.id}" is a ${other.type}; a translation has the same type`);
    } else if (!sameDrawing(other.board, board)) {
      errors.push(`"${id}": draws something else than "${other.id}"; a translation changes only labels and sentences`);
    }
  }
  return errors;
}
