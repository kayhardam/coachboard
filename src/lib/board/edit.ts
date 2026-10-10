// Editing operations on a board. Pure: each returns a new board and leaves
// the old one alone, so the editor's undo history is a list of boards. The
// editor edits one step at a time; every step keeps the same players.

import {
  COURT_WIDTH,
  MAX_ARROWS,
  MAX_BALLS,
  MAX_CONES,
  MAX_PLAYERS,
  MAX_STEPS,
  MAX_TEXT,
  MAX_TITLE,
  MOVES,
  settle,
  type Arrow,
  type Board,
  type Frame,
  type Player,
  type Pt,
} from "./format";

/** A piece in the current frame, or a cone (cones belong to the board). */
export interface Selection {
  kind: "player" | "ball" | "arrow" | "cone";
  index: number;
}

/** Shorter drags don't make an arrow. */
export const MIN_ARROW = 10;
/** A bend closer than this to the straight line snaps back to straight. */
export const STRAIGHT_SNAP = 5;

const length = (board: Board) => (board.court === "full" ? 400 : 200);

/** Rounded to whole decimetres and kept on the visible court. */
export function clampPt(board: Board, [x, y]: [number, number]): Pt {
  const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Math.round(v)));
  return [clamp(x, COURT_WIDTH), clamp(y, length(board))];
}

/** Changes step `step` of a copy, puts every arrow of a player back on that player, and lets the later steps follow. */
function withFrame(board: Board, step: number, change: (frame: Frame) => void): Board {
  const next = structuredClone(board);
  change(next.frames[step]!);
  return follow(board, settle(next), step);
}

/**
 * After a change in step `step`, the later steps follow: a player who in the
 * next step stood where they ended this one (as New step puts them) moves to
 * where they end it now, and so does a ball. A player or ball moved there by
 * hand keeps their place. Step by step, so the change carries on.
 */
function follow(old: Board, next: Board, step: number): Board {
  for (let j = step + 1; j < next.frames.length; j++) {
    const [was, before, now, after] = [old.frames[j - 1]!, old.frames[j]!, next.frames[j - 1]!, next.frames[j]!];
    after.players.forEach((p, i) => {
      if (same(before.players[i]!.at, endOf(was, i))) p.at = endOf(now, i);
    });
    const [ballsWas, ballsNow] = [ballsAfter(old, was), ballsAfter(next, now)];
    after.balls.forEach((b, i) => {
      if (ballsWas[i] && ballsNow[i] && same(b, ballsWas[i]!)) after.balls[i] = ballsNow[i]!;
    });
  }
  return settle(next);
}

const same = (a: Pt, b: Pt) => a[0] === b[0] && a[1] === b[1];

/** Where `player` is after their runs, dribbles and blocks in `frame`: where their next arrow starts. */
export function endOf(frame: Frame, player: number): Pt {
  let at = frame.players[player]!.at;
  for (const a of frame.arrows) if (a.from === player && MOVES.includes(a.kind)) at = a.pts.at(-1)!;
  return [...at];
}

/**
 * Whether `player` has the ball by the end of `frame`'s arrows: in drawing
 * order, they received a pass or bounce (it ends where they stand, or where
 * their run, dribble or screen ends by then) and haven't passed, bounced or
 * shot since. Who has the ball at the start doesn't count: a drag from them
 * stays a run, and the pass comes from the ball.
 */
export function hasBall(frame: Frame, player: number): boolean {
  const at = frame.players.map((p) => p.at);
  let has = false;
  for (const a of frame.arrows) {
    const end = a.pts.at(-1)!;
    const on = (p: Pt) => p[0] === end[0] && p[1] === end[1];
    if (a.from === player && !MOVES.includes(a.kind)) has = false;
    else if ((a.kind === "pass" || a.kind === "bounce") && (on(frame.players[player]!.at) || on(at[player]!))) has = true;
    if (a.from !== undefined && MOVES.includes(a.kind)) at[a.from] = end;
  }
  return has;
}

/** Adds a player in every step (one lineup), at the same spot. */
export function addPlayer(board: Board, team: Player["team"], at: [number, number]): Board {
  if (board.frames[0]!.players.length >= MAX_PLAYERS) return board;
  const next = structuredClone(board);
  for (const f of next.frames) f.players.push({ team, at: clampPt(board, at) });
  return next;
}

/** Adds a ball at `at`, up to MAX_BALLS. */
export function addBall(board: Board, step: number, at: [number, number]): Board {
  if (board.frames[step]!.balls.length >= MAX_BALLS) return board;
  return withFrame(board, step, (f) => {
    f.balls.push(clampPt(board, at));
  });
}

/** Adds a cone at `at`, up to MAX_CONES. Cones belong to the board: every step shows them. */
export function addCone(board: Board, at: [number, number]): Board {
  if (board.cones.length >= MAX_CONES) return board;
  return { ...structuredClone(board), cones: [...board.cones, clampPt(board, at)] };
}

/** Moves a player, a ball or a cone to `at`; the arrows of a player go along. */
export function movePiece(board: Board, step: number, piece: Selection, at: [number, number]): Board {
  const pt = clampPt(board, at);
  if (piece.kind === "cone") {
    if (!board.cones[piece.index]) return board;
    return { ...structuredClone(board), cones: board.cones.map((c, i) => (i === piece.index ? pt : c)) };
  }
  return withFrame(board, step, (f) => {
    if (piece.kind === "player" && f.players[piece.index]) f.players[piece.index]!.at = pt;
    if (piece.kind === "ball" && f.balls[piece.index]) f.balls[piece.index] = pt;
  });
}

/**
 * Changes the kind of an arrow in step `step`. A shot needs a player and is
 * straight: it loses its bend and ends in the goal (settle()). An arrow
 * without a player can't become a shot. The same kind returns the same board.
 */
export function setKind(board: Board, step: number, index: number, kind: Arrow["kind"]): Board {
  const arrow = board.frames[step]!.arrows[index];
  if (!arrow || arrow.kind === kind || (kind === "shot" && arrow.from === undefined)) return board;
  return withFrame(board, step, (f) => {
    const a = f.arrows[index]!;
    a.kind = kind;
    if (kind === "shot") a.pts = [a.pts[0]!, a.pts.at(-1)!];
  });
}

/**
 * Puts a player in another team, in every step (one lineup). A passer has no
 * label, so it loses theirs. The same team returns the same board.
 */
export function setTeam(board: Board, index: number, team: Player["team"]): Board {
  const player = board.frames[0]!.players[index];
  if (!player || player.team === team) return board;
  const next = structuredClone(board);
  for (const f of next.frames) {
    const p = f.players[index]!;
    p.team = team;
    if (team === "p") delete p.label;
  }
  return settle(next);
}

/**
 * Shifts a whole arrow by (dx, dy), keeping it on the court. An arrow of a
 * player lets go of them; a shot stays with its shooter.
 */
export function moveArrow(board: Board, step: number, index: number, [dx, dy]: [number, number]): Board {
  const arrow = board.frames[step]!.arrows[index];
  if (!arrow || arrow.kind === "shot") return board;
  const xs = arrow.pts.map((p) => p[0]);
  const ys = arrow.pts.map((p) => p[1]);
  const cx = Math.min(COURT_WIDTH - Math.max(...xs), Math.max(-Math.min(...xs), Math.round(dx)));
  const cy = Math.min(length(board) - Math.max(...ys), Math.max(-Math.min(...ys), Math.round(dy)));
  return withFrame(board, step, (f) => {
    f.arrows[index] = { kind: arrow.kind, pts: arrow.pts.map(([x, y]) => [x + cx, y + cy]) };
  });
}

/**
 * Draws an arrow from `from` to `to`. With `player`, the arrow belongs to that
 * player and starts where they are by then (endOf()), whatever `from` is.
 */
export function addArrow(
  board: Board,
  step: number,
  kind: Arrow["kind"],
  from: [number, number],
  to: [number, number],
  player?: number,
): Board {
  const frame = board.frames[step]!;
  const a = player === undefined ? clampPt(board, from) : endOf(frame, player);
  const b = clampPt(board, to);
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < MIN_ARROW) return board;
  if (frame.arrows.length >= MAX_ARROWS) return board;
  return withFrame(board, step, (f) => {
    f.arrows.push(player === undefined ? { kind, pts: [a, b] } : { kind, from: player, pts: [a, b] });
  });
}

/** Gives an arrow to a player: it then starts where they are by then. A shot keeps its shooter. */
export function attachArrow(board: Board, step: number, index: number, player: number): Board {
  const arrow = board.frames[step]!.arrows[index];
  if (!arrow || arrow.kind === "shot" || !board.frames[step]!.players[player]) return board;
  return withFrame(board, step, (f) => {
    f.arrows[index]!.from = player;
  });
}

/** Distance from p to the segment a–b. */
function toSegment(p: Pt, a: Pt, b: Pt): number {
  const [vx, vy] = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

/**
 * Drags one of an arrow's handles: 0 = start, 1 = bend, 2 = end. The bend
 * point makes the arrow curve through it, or straightens it when it's back
 * near the line. Dragging the start lets go of the arrow's player. A shot
 * only moves its end, to another spot in the goal.
 */
export function moveHandle(
  board: Board,
  step: number,
  index: number,
  handle: 0 | 1 | 2,
  at: [number, number],
): Board {
  const arrow = board.frames[step]!.arrows[index];
  if (!arrow || (arrow.kind === "shot" && handle !== 2)) return board;
  const pt = clampPt(board, at);
  const start = arrow.pts[0]!;
  const end = arrow.pts[arrow.pts.length - 1]!;
  const bend = arrow.pts.length === 3 ? arrow.pts[1]! : null;

  let pts: Pt[];
  if (handle === 0) pts = bend ? [pt, bend, end] : [pt, end];
  else if (handle === 2) pts = bend ? [start, bend, pt] : [start, pt];
  else pts = toSegment(pt, start, end) < STRAIGHT_SNAP ? [start, end] : [start, pt, end];

  return withFrame(board, step, (f) => {
    const moved = f.arrows[index]!;
    moved.pts = pts;
    if (handle === 0) delete moved.from;
  });
}

/** Removes a player from every step (one lineup), with their arrows; or an arrow, a ball or a cone. */
export function removeSelected(board: Board, step: number, piece: Selection): Board {
  if (piece.kind === "cone") return { ...structuredClone(board), cones: board.cones.filter((_, i) => i !== piece.index) };
  if (piece.kind !== "player") {
    return withFrame(board, step, (f) => {
      if (piece.kind === "arrow") f.arrows.splice(piece.index, 1);
      if (piece.kind === "ball") f.balls.splice(piece.index, 1);
    });
  }
  const next = structuredClone(board);
  for (const f of next.frames) {
    f.players.splice(piece.index, 1);
    f.arrows = f.arrows.filter((a) => a.from !== piece.index);
    for (const a of f.arrows) if (a.from !== undefined && a.from > piece.index) a.from--;
  }
  return next;
}

/** Keeps the players, removes the arrows and balls of step `step`. */
export function clearArrows(board: Board, step: number): Board {
  return withFrame(board, step, (f) => {
    f.arrows = [];
    f.balls = [];
  });
}

/** A fresh copy of `lineup`, the default lineup in the editor's language. */
export function resetLineup(lineup: Board): Board {
  return structuredClone(lineup);
}

export function emptyCourt(board: Board): Board {
  return { v: 2, court: board.court, cones: [], frames: [{ players: [], balls: [], arrows: [] }] };
}

/** Switching to a half court pulls everything beyond the halfway line onto it, in every step. */
export function setCourt(board: Board, court: Board["court"]): Board {
  const next: Board = { ...structuredClone(board), court };
  const clamp = (pts: Pt[]) => pts.map((p) => clampPt(next, p));
  next.cones = clamp(next.cones);
  for (const f of next.frames) {
    for (const p of f.players) p.at = clampPt(next, p.at);
    f.balls = clamp(f.balls);
    for (const a of f.arrows) a.pts = clamp(a.pts);
  }
  return settle(next);
}

/** Text as typed, as one line of at most `max` characters, spaces trimmed. */
function oneLine(text: string, max: number): string {
  let line = text.replace(/[\0-\x1f\x7f]/g, " ").trim().slice(0, max);
  // Don't cut a character that takes two code units (an emoji) in half.
  if (/[\ud800-\udbff]$/.test(line)) line = line.slice(0, -1);
  return line.trimEnd();
}

/**
 * The board's title as typed: one line, at most MAX_TITLE characters, spaces
 * trimmed. An empty title removes it. The same title returns the same board,
 * so the editor makes no undo step for it.
 */
export function setTitle(board: Board, text: string): Board {
  const title = oneLine(text, MAX_TITLE);
  if ((board.title ?? "") === title) return board;
  const next = { ...board };
  if (title) next.title = title;
  else delete next.title;
  return next;
}

// ===== Steps =====

/** Within this many dm of a ball, a player has it at the start of a step: holder() in hit.ts at its least reach. */
const HOLD = 26;
/** Where a received ball lies beside its receiver, as in the default lineup. */
export const BESIDE: Pt = [10, -8];

/**
 * A ball's way through a step: who has it at the start (`has`, with the ball
 * `by` beside them) and the passes, bounces or shots it goes with, by index
 * in the step's arrows, each with who receives it (`to`).
 */
export interface Trip {
  start: Pt;
  has?: number;
  by: Pt;
  passes: { arrow: number; to?: number }[];
}

/**
 * The way of each ball of `frame` through it. A ball goes along with whoever
 * has it (the nearest player within HOLD), and with a pass, bounce or shot of
 * theirs to its end, where whoever stands there by then has it. A player who
 * passes, bounces or shoots without a ball within HOLD takes the nearest ball
 * nobody has: on a full court on a phone, the editor gives a pass from the
 * ball to a player up to twice a tap's reach away (holder() in hit.ts),
 * further than HOLD. A ball nobody has also goes with a pass without a player
 * that starts on it.
 */
export function ballTrips(frame: Frame): Trip[] {
  const at = frame.players.map((p) => p.at);
  /** The player standing on `pt`, or nearest to it within `r`. */
  const near = (pt: Pt, r: number) => {
    let best: number | undefined;
    at.forEach((p, i) => {
      const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]);
      if (d <= r) [best, r] = [i, d];
    });
    return best;
  };
  const balls = frame.balls.map((b) => {
    const has = near(b, HOLD);
    return { at: b, has, trip: { start: b, has, by: has === undefined ? [0, 0] : [b[0] - at[has]![0], b[1] - at[has]![1]], passes: [] } as Trip };
  });
  frame.arrows.forEach((a, arrow) => {
    const end = a.pts.at(-1)!;
    if (MOVES.includes(a.kind)) {
      if (a.from !== undefined) at[a.from] = end;
      return;
    }
    const from = a.from;
    const free = balls.filter((b) => b.has === undefined);
    const dist = (b: { at: Pt }) => Math.hypot(b.at[0] - at[from!]![0], b.at[1] - at[from!]![1]);
    const ball =
      from === undefined
        ? free.find((b) => same(b.at, a.pts[0]!))
        : (balls.find((b) => b.has === from) ?? free.sort((p, q) => dist(p) - dist(q))[0]);
    if (!ball) return;
    ball.at = end;
    ball.has = near(end, 0);
    ball.trip.passes.push({ arrow, to: ball.has });
  });
  return balls.map((b) => b.trip);
}

/**
 * Where each ball of `frame` (a step of `board`) is at its end (ballTrips()):
 * beside whoever has it, or where it went if nobody has it.
 */
export function ballsAfter(board: Board, frame: Frame): Pt[] {
  return ballTrips(frame).map(({ start, has, by, passes }) => {
    const last = passes.at(-1);
    const owner = last ? last.to : has;
    const [x, y] = owner === undefined ? (last ? frame.arrows[last.arrow]!.pts.at(-1)! : start) : endOf(frame, owner);
    const [dx, dy] = owner === undefined ? [0, 0] : last ? BESIDE : by;
    return clampPt(board, [x + dx, y + dy]);
  });
}

/**
 * New step: adds a step after `step`, in which everyone stands where they end
 * `step` (endOf()) and each ball lies where it ends (ballsAfter()), without
 * arrows or a sentence. Defenders without arrows stay: you drag them yourself.
 */
export function addStep(board: Board, step: number): Board {
  if (board.frames.length >= MAX_STEPS) return board;
  const f = board.frames[step]!;
  const next = structuredClone(board);
  next.frames.splice(step + 1, 0, {
    players: f.players.map((p, i) => ({ ...p, at: endOf(f, i) })),
    balls: ballsAfter(board, f),
    arrows: [],
  });
  return next;
}

/** Removes step `step`; a board keeps at least one. */
export function removeStep(board: Board, step: number): Board {
  if (board.frames.length < 2) return board;
  return { ...structuredClone(board), frames: board.frames.filter((_, i) => i !== step) };
}

/**
 * The sentence of step `step` as typed: one line, at most MAX_TEXT characters,
 * spaces trimmed (as setTitle()). An empty one removes it; the same one returns
 * the same board.
 */
export function setText(board: Board, step: number, text: string): Board {
  const line = oneLine(text, MAX_TEXT);
  const frame = board.frames[step]!;
  if ((frame.text ?? "") === line) return board;
  const next = structuredClone(board);
  if (line) next.frames[step]!.text = line;
  else delete next.frames[step]!.text;
  return next;
}
