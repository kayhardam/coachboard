import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { AGES, LEVELS, categorySlugs } from "./data/categories";
import { isBoard, MAX_TITLE, type Board } from "./lib/board/format";
import { stepsHaveText } from "./lib/library";

// One Markdown file per item and language: src/content/library/<lang>/<slug>.md.
// `type` says what it is; drills follow in phase 16-3. The Markdown body is
// optional extra explanation below the steps.
const tactic = z.object({
  type: z.literal("tactic"),
  /** Also the board's title in "Open in the board", so no longer than the board allows. */
  title: z.string().min(1).max(MAX_TITLE),
  category: z.enum(categorySlugs),
  /** A run of age groups without a gap, youngest first (checkLibrary()). */
  ages: z.array(z.enum(AGES)).min(1),
  level: z.enum(LEVELS),
  /** Shown under the title and used as the meta description. */
  summary: z.string().min(50),
  coachingPoints: z.array(z.string().min(1)).default([]),
  /** Full ids in the same language, e.g. "en/fast-break-second-wave". */
  related: z.array(reference("library")).max(3).default([]),
  /** The same guard as the board, so every drawing opens there too. Each step's sentence is in it. */
  board: z
    .custom<Board>(
      isBoard,
      'Not a valid board. Draw it at /en/board/ in `npm run dev`, press "JSON (dev)" and paste the output.',
    )
    .refine(stepsHaveText, "Every step needs its sentence: tap the sentence on the board and type it.")
    .refine((board) => board.title === undefined, "Leave the board's title out: the page's `title` is the title."),
});

const library = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/library" }),
  schema: z.discriminatedUnion("type", [tactic]),
});

export const collections = { library };
