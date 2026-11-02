// The lite board's own choices (the MVP under /[lang]/lite/): which tools its
// dock offers and which kinds of arrow its bar offers. Pure, so it is tested
// without a browser. The board's model, links and playing stay in
// src/lib/board/: a lite link is a normal "2." link and every old link opens.

import type { ArrowKind } from "../board/format";

/** The tools of the lite editor's dock, in order. Cones stay out: they render, but the dock doesn't add them. */
export const LITE_TOOLS = ["move", "arrow", "attack", "defence", "ball"] as const;
export type LiteTool = (typeof LITE_TOOLS)[number];

/** The kinds of arrow the lite editor's bar sets on a selected arrow, in order. */
export const LITE_KINDS = ["run", "pass", "dribble", "shot"] as const satisfies readonly ArrowKind[];

/**
 * The URL a lite board shares: the lite viewer's page with the link in the
 * fragment, as the board's own Share and QR code build theirs. `link` is
 * already encoded ("2.…"); it goes in as it is.
 */
export function shareUrl(origin: string, viewerPath: string, link: string): string {
  return `${origin}${viewerPath}#t=${link}`;
}
