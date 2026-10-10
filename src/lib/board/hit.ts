// Which piece a tap is for. The touch area Court draws round a piece is
// HIT_R (13 dm): at least 44 px on a half court on a 375 px phone, but less
// on the full court or a smaller phone. The editor then reaches further, to
// half a 44 px tap target, and where touch areas overlap the nearest piece wins.

import type { Board, Frame, Pt } from "./format";
import { HIT_R, POST_LEFT, POST_RIGHT } from "./geometry";

export interface Piece {
  kind: "player" | "ball" | "cone";
  index: number;
}

/** Half the minimum tap target (`--tap`, 44 px), in screen pixels. */
export const TAP_RADIUS = 22;

/** How far a tap reaches, in dm, at `scale` screen pixels per dm: HIT_R, or 22 px if that is further. */
export function reach(scale: number): number {
  return Math.max(HIT_R, TAP_RADIUS / scale);
}

/**
 * The player, ball or cone nearest to `at`, if it is within `radius` dm. On a
 * tie the piece drawn on top wins: a ball before a player before a cone, and
 * the later of two. Cones belong to the board, so they come in apart.
 */
export function nearestPiece(frame: Frame, at: Pt, radius: number, cones: Pt[] = []): Piece | null {
  let best: Piece | null = null;
  let bestDistance = radius;
  const consider = (piece: Piece, [x, y]: Pt) => {
    const distance = Math.hypot(x - at[0], y - at[1]);
    if (distance <= bestDistance) {
      best = piece;
      bestDistance = distance;
    }
  };
  cones.forEach((cone, index) => consider({ kind: "cone", index }, cone));
  frame.players.forEach((player, index) => consider({ kind: "player", index }, player.at));
  frame.balls.forEach((ball, index) => consider({ kind: "ball", index }, ball));
  return best;
}

/**
 * Who has the ball at `ball`: the nearest player within twice the reach of a
 * tap (`tap`, see reach()), so always further than a tap reaches. A pass
 * drawn from the ball is theirs. Nobody that near: undefined.
 */
export function holder(frame: Frame, ball: Pt, tap: number): number | undefined {
  return nearestPiece({ ...frame, balls: [] }, ball, 2 * tap)?.index;
}

/**
 * Whether `at` is in a goal: between the posts, and within `radius` dm (a
 * tap's reach) of the goal line, or beyond it. A pass of a player that ends
 * there is a shot.
 */
export function inGoal(board: Board, [x, y]: Pt, radius: number): boolean {
  return x >= POST_LEFT && x <= POST_RIGHT && (y <= radius || (board.court === "full" && y >= 400 - radius));
}
