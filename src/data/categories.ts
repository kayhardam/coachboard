// The library's categories, age groups and levels. Each list here is the only
// one: the content schema, the routes and the cards all read it. No astro: imports here, because
// src/content.config.ts imports this file.
import { t } from "../i18n/ui";
import type { IconName } from "../lib/icons";

export const categorySlugs = ["attack", "defense", "goalkeeping"] as const;

export type Category = (typeof categorySlugs)[number];

export interface CategoryInfo {
  slug: Category;
  icon: IconName;
  label: string;
  /** Short line on category cards. */
  desc: string;
  /** Intro on the category page; doubles as its meta description. */
  intro: string;
}

export function categoryInfo(locale: string, slug: Category): CategoryInfo {
  return {
    slug,
    icon: slug, // src/lib/icons.ts has an icon for each category
    label: t(locale, `category.${slug}.label`),
    desc: t(locale, `category.${slug}.desc`),
    intro: t(locale, `category.${slug}.intro`),
  };
}

/** Age groups, youngest first. An item lists a run of them without a gap (checkLibrary()). */
export const AGES = ["u8", "u10", "u12", "u14", "u16", "u18", "senior"] as const;

export type Age = (typeof AGES)[number];

export const LEVELS = ["basic", "intermediate", "advanced"] as const;

export type Level = (typeof LEVELS)[number];

/** "C-jeugd t/m senioren": the first and the last age group, capitalized. */
export function agesLabel(locale: string, ages: readonly Age[]): string {
  const first = t(locale, `age.${ages[0]!}`);
  const last = t(locale, `age.${ages[ages.length - 1]!}`);
  const label = ages.length === 1 ? first : t(locale, "age.range", { from: first, to: last });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function levelLabel(locale: string, level: Level): string {
  return t(locale, `level.${level}`);
}

/** The line under an item's title: "Verdediging · C-jeugd t/m senioren · Basis". */
export function itemMeta(locale: string, item: { category: Category; ages: readonly Age[]; level: Level }): string {
  return [categoryInfo(locale, item.category).label, agesLabel(locale, item.ages), levelLabel(locale, item.level)].join(" · ");
}
