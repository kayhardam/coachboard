// Afspelen (decision D4, phase 14-3): where the pieces are between one step
// and the next, as they move along their arrows. Pure, so it is tested
// without a browser. A moment is only to watch: its places aren't whole
// decimetres, so the editor keeps it out of the board, like a drawing arrow,
// and it never reaches a link, My boards or Undo.

import { ballsAfter, ballTrips, BESIDE, endOf } from "./edit";
import { MOVES, type Board, type Frame, type Pt } from "./format";
import { pointAt } from "./geometry";

const same = (a: Pt, b: Pt) => a[0] === b[0] && a[1] === b[1];
/** `a` moved by `k` times `d`. */
const shift = (a: Pt, d: Pt, k = 1): Pt => [a[0] + d[0] * k, a[1] + d[1] * k];
const lerp = (a: Pt, b: Pt, t: number) => shift(a, [b[0] - a[0], b[1] - a[1]], t);

/**
 * Step `step` at `t` (0 to 1) of the way to the next step: at 0 exactly the
 * step, at 1 exactly where the next one starts (after the last step: where
 * its arrows take everyone). Each player's arrows share the time in drawing
 * order: along a run, dribble or screen they move; during a pass, bounce or
 * shot they stand, and the ball goes along it from where it lay. A ball goes
 * with whoever has it, and lies beside its receiver after a pass. A player or
 * ball that the next step has somewhere else (moved there by hand) goes in a
 * straight line.
 */
export function moment(board: Board, step: number, t: number): Frame {
  const frame = board.frames[step]!;
  const next = board.frames[step + 1];
  const after = ballsAfter(board, frame);
  const ends = frame.players.map((_, i) => next?.players[i]!.at ?? endOf(frame, i));
  const balls = next?.balls ?? after;
  if (t >= 1) return { ...frame, players: frame.players.map((p, i) => ({ ...p, at: ends[i]! })), balls };
  /** How far along arrow `j` is: it has its share of its player's time; one without a player takes the whole step. */
  const along = (j: number) => {
    const a = frame.arrows[j]!;
    const own = frame.arrows.filter((b) => b.from === a.from);
    const n = a.from === undefined ? 1 : own.length;
    return Math.min(1, Math.max(0, t * n - (a.from === undefined ? 0 : own.indexOf(a))));
  };
  const place = (i: number): Pt => {
    let at = frame.players[i]!.at;
    if (!same(endOf(frame, i), ends[i]!)) return lerp(at, ends[i]!, t);
    frame.arrows.forEach((a, j) => {
      if (a.from === i && MOVES.includes(a.kind) && along(j) > 0) at = pointAt(a, along(j));
    });
    return at;
  };
  return {
    ...frame,
    players: frame.players.map((p, i) => ({ ...p, at: place(i) })),
    balls: ballTrips(frame).map(({ start, has, by, passes }, b) => {
      const target = balls[b] ?? start;
      if (!same(after[b]!, target)) return lerp(start, target, t);
      let at = has === undefined ? start : shift(place(has), by);
      for (const { arrow, to } of passes) {
        const a = frame.arrows[arrow]!;
        const k = along(arrow);
        if (!k) break;
        // On its way it starts where it lay (beside the passer) and ends on the arrow's end.
        at = k < 1 ? shift(pointAt(a, k), [at[0] - a.pts[0]![0], at[1] - a.pts[0]![1]], 1 - k) : to === undefined ? a.pts.at(-1)! : shift(place(to), BESIDE);
      }
      return at;
    }),
  };
}
