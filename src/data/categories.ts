// The tactic categories. categorySlugs is the only list: the content schema,
// the routes and the cards all read it. No astro: imports here, because
// src/content.config.ts imports this file.
import { t } from "../i18n/ui";

export const categorySlugs = ["attack", "defense", "youth", "goalkeeping"] as const;

export type Category = (typeof categorySlugs)[number];

export interface CategoryInfo {
  slug: Category;
  label: string;
  /** Short line on category cards. */
  desc: string;
  /** Intro on the category page; doubles as its meta description. */
  intro: string;
}

export function categoryInfo(locale: string, slug: Category): CategoryInfo {
  return {
    slug,
    label: t(locale, `category.${slug}.label`),
    desc: t(locale, `category.${slug}.desc`),
    intro: t(locale, `category.${slug}.intro`),
  };
}
