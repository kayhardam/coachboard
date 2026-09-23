import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categorySlugs } from "./data/categories";
import { isBoard, type Board } from "./lib/board/format";

// One Markdown file per tactic and language: src/content/tactics/<lang>/<slug>.md.
// The Markdown body is optional extra explanation below the steps.
const tactics = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tactics" }),
  schema: z.object({
    title: z.string().min(1),
    category: z.enum(categorySlugs),
    theme: z.string().min(1),
    level: z.string().min(1),
    /** Shown under the title and used as the meta description. */
    summary: z.string().min(50),
    steps: z.array(z.string().min(1)).min(1),
    coachingPoints: z.array(z.string().min(1)).default([]),
    /** Full ids in the same language, e.g. "en/fast-break-second-wave". */
    related: z.array(reference("tactics")).default([]),
    /** The same guard as the board, so every diagram opens there too. */
    board: z.custom<Board>(
      isBoard,
      'Not a valid board. Draw it at /en/board/ in `npm run dev`, press "JSON" and paste the output.',
    ),
  }),
});

export const collections = { tactics };
