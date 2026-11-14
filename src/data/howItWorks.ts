// The drawings and screenshots of "How the board works" (/<lang>/how-it-works/).
// No astro: imports, so vitest and scripts/screenshots.mjs can load it.
import { decode, unescapeLink, type Board } from "../lib/board/format";

/**
 * Features 1–6 draw these boards with Court (6 with StepStrip), at build time.
 * To replace one: open it in the board, change it, tap Share and paste the
 * whole link over the old one. The board in `steps` is also the one in the
 * screenshots of 7 and 8 (scripts/screenshots.mjs).
 */
export const drawings = {
  nl: {
    lineup:
      "https://handballcoachboard.com/nl/board/#t=2.bY2xDoAwCET_hfmGglpxdjFRY-JK-v-_IaXWyQS4x_VSLIEIZi7HRgUB1wtnh_uDnlmPCgzaQ3_bh5eZgnMUCzgl8OCtY9sXiSe3cxOFCDwxKiaFNl-aTFI9ntUD9QT7RyJxh6iU8gA",
    arrows:
      "https://handballcoachboard.com/nl/board/#t=2.bY-xDsMwCET_xfMNhsYJmbtEaqpKWRH__xs54yRTJfA9H9jGXlEK3Cn7VgIJvwu-NxwP3D3vvYOgfFL_JheGu0HmDFFIrZAX06axXzVLtOchBlWwYzI0gw1fhzTtnizGhv6E8CLVyPkFjYctp9KLg5-LiBM",
    shot: "https://handballcoachboard.com/nl/board/#t=2.bY2xCoAwDET_JfMNTawaZxfBiuAa-v-_YZqqk5D0Xi8HZwlEMHMpG1UEnA8cL1wfvJm1NGDQHvq7_viYKXiKYQGnBB58Nff_InFye-qiEIEnsmJUaPelyyjN41k90CrmOLWSjAHijUS11hs",
    kinds:
      "https://handballcoachboard.com/nl/board/#t=2.bY7BDcAwCAN34e0HENJmF8T-azQxeVYCTkbYIhUiyNTCT--xK9MV9iqmEysIs6cZq7l4dT0KxbHZWRiMZooJZwSFY3QQVSDgmwOz4-z8IFJVHw",
    labels:
      "https://handballcoachboard.com/nl/board/#t=2.bY07DsAwCEPvwuwhpj86d6nUSpW6otz_GiW_rRLwjGMFTxCBe-A-JaOIrZPs4n2GGJHjLoKQq_K3Y0S5G7jWooIpgVO0zW3ftT6FvTYYVBGJ2bAYrPnasGjxuFkEygnGR6r1jkjO-QM",
    steps:
      "https://handballcoachboard.com/nl/board/#t=2.rVBND4IwDP0rzc6N2SrgPHvRCCHxuuyAShQlYID4--068OTRpN1769de5zSqQzdO1TDVHbCNl3tTM1foHOfyvfIopJxJsZDTlyw1uzwQg-oo-NP5YHPOosnEDKHRGs2a3SbxviVJcTiLYJEIuSKxmFq0MU4RUgoxs7FcEJ4wPIjIi36DKTdbUUUz92EZkJWhkZ2fQ_O4TXCt4Vy18K46KMpVWCGqlLb_isy4OqDjWagXSfL10L_g2tctC_D-Aw",
  },
  en: {
    lineup:
      "https://handballcoachboard.com/en/board/#t=2.bY2xDoAwCET_hfmGglZx1cFBB-PiQPr_vyGl6mQC3ON6KZZABDOX_aKCgPmB5YXzgzdzVGXQugX8tg8vMwUPUSzglMCdt_ZtnySe3B6aKETgiV6RFdp8aZKlejyqB-oJ9o9E4g5RKeUG",
    arrows:
      "https://handballcoachboard.com/en/board/#t=2.bY8xEsMwCAT_ovoKQSwbt3GRIikyaVww_P8bPiHbVWZAtzqQhLyiFLhTPnsJJDxP2C743XD1fLsKyuud8De5MNwNMmeIQmqFPJg2jf2qWaI9DzGogh2ToRls-DqkafdkMTb0J4QXqUbOL2g8bDmWnhz8XEQc",
    shot: "https://handballcoachboard.com/en/board/#t=2.bY2xDoAwCET_hfmGglVx1cFBB-PiQPr_vyGl6mQCvdfjkrMEIpi57BcVBMwPLC-cH7yZoyqD1i3gd_3xMVPwEMMCTgnc-Wpu_0ni5PbQRCECT2RFr9DmS5NeqsejeqBWjHGqJRkdxBuJSik3",
    kinds:
      "https://handballcoachboard.com/en/board/#t=2.bY7BDcAwCAN34e0HENJmF8T-azQxeVYCTkbYIhUiyNTCT--xK9MV9iqmEysIs6cZq7l4dT0KxbHZWRiMZooJZwSFY3QQVSDgmwOz4-z8IFJVHw",
    labels:
      "https://handballcoachboard.com/en/board/#t=2.bY2xDoAwCET_hfmGHlrF1cVBB-PiQPr_vyFtdTMB3nG9FE8QgXvguKWgivkl-Ypr_cQXOSsJ2fYmfjtGlLuBUysqmBI4RNvY90XbU9hTh0EVkRgN2WDd146s1eNsEagnGB-ptjsipZQH",
    steps:
      "https://handballcoachboard.com/en/board/#t=2.rVCxDsIgEP2VC_PFwNlWXNvBQQfj4kAYUKs1qSWx9P89oHVyNOF4j-Pd8Q4jUTRTgOcAbrjB2HkfBBrD6cNZWEyknkmzkNOXLJpjRIVit0_kZ_DGyxiNqkpLESopUa05dJHPW0pXnK4yaCRCVhQaS4065ylDSTGnNpoF8QnFjYhs8q-w5GKdbNHMbRwGrlMYl4EfLfPQtXBxfQ_3t39BU6_iDNlmqvuvy4rVEQ33Qjl7Sh8_ggvw8K5nA9Z-AA",
  },
} as const;

export type DrawingName = keyof (typeof drawings)["nl"];

/** A drawing's board, read from its link as the board reads it. Fails the build on a link that doesn't read. */
export async function drawing(lang: string, name: DrawingName): Promise<Board> {
  const links: Record<DrawingName, string> = lang in drawings ? drawings[lang as keyof typeof drawings] : drawings.en;
  const link = links[name];
  const board = await decode(unescapeLink(link.slice(link.indexOf("#t=") + 3)) ?? "");
  if (!board) throw new Error(`how-it-works: the ${lang} drawing "${name}" doesn't read`);
  return board;
}

/**
 * Features 7–10 are screenshots of the board, made by `npm run screenshots`
 * (scripts/screenshots.mjs) into public/how-it-works/<lang>/<name>.png: a
 * 360 px wide phone at 2×. The page gives each image these sizes, so nothing
 * moves while it loads; the script fails on a PNG of another size.
 */
export const shots = {
  play: { width: 720, height: 224 },
  viewer: { width: 720, height: 1280 },
  "my-boards": { width: 720, height: 1280 },
  "open-link": { width: 720, height: 680 },
} as const;

export type ShotName = keyof typeof shots;

/** Where a screenshot is served. */
export const shotPath = (lang: string, name: ShotName) => `/how-it-works/${lang}/${name}.png`;
