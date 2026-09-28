// Which piece a tap is for. The touch area Court draws round a piece is
// HIT_R (13 dm): at least 44 px on a half court on a 375 px phone, but less
// on the full court or a smaller phone. The editor then reaches further, to
// half a 44 px tap target, and where touch areas overlap the nearest piece wins.

import type { Frame, Pt } from "./format";
import { HIT_R } from "./geometry";

export interface Piece {
  kind: "player" | "ball";
  index: number;
}

/** Half the minimum tap target (`--tap`, 44 px), in screen pixels. */
export const TAP_RADIUS = 22;

/** How far a tap reaches, in dm, at `scale` screen pixels per dm: HIT_R, or 22 px if that is further. */
export function reach(scale: number): number {
  return Math.max(HIT_R, TAP_RADIUS / scale);
}

/**
 * The player or ball nearest to `at`, if it is within `radius` dm. On a tie
 * the piece drawn on top wins: the ball, then the later player.
 */
export function nearestPiece(frame: Frame, at: Pt, radius: number): Piece | null {
  let best: Piece | null = null;
  let bestDistance = radius;
  const consider = (piece: Piece, [x, y]: Pt) => {
    const distance = Math.hypot(x - at[0], y - at[1]);
    if (distance <= bestDistance) {
      best = piece;
      bestDistance = distance;
    }
  };
  frame.players.forEach((player, index) => consider({ kind: "player", index }, player.at));
  if (frame.ball) consider({ kind: "ball", index: 0 }, frame.ball);
  return best;
}
