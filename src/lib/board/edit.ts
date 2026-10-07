// Editing operations on a board. Pure: each returns a new board and leaves
// the old one alone, so the editor's undo history is a list of boards. The
// editor edits frames[0] only; the other steps keep the same players.

import {
  COURT_WIDTH,
  MAX_ARROWS,
  MAX_PLAYERS,
  MAX_TITLE,
  MOVES,
  settle,
  type Arrow,
  type Board,
  type Frame,
  type Player,
  type Pt,
} from "./format";

/** A piece in the current frame. */
export interface Selection {
  kind: "player" | "ball" | "arrow";
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

/** Changes frames[0] of a copy, then puts every arrow of a player back on that player. */
function withFrame(board: Board, change: (frame: Frame) => void): Board {
  const next = structuredClone(board);
  change(next.frames[0]!);
  return settle(next);
}

/** Where `player` is after their runs, dribbles and blocks in `frame`: where their next arrow starts. */
export function endOf(frame: Frame, player: number): Pt {
  let at = frame.players[player]!.at;
  for (const a of frame.arrows) if (a.from === player && MOVES.includes(a.kind)) at = a.pts.at(-1)!;
  return [...at];
}

/** Adds a player in every step (one lineup), at the same spot. */
export function addPlayer(board: Board, team: Player["team"], at: [number, number]): Board {
  if (board.frames[0]!.players.length >= MAX_PLAYERS) return board;
  const next = structuredClone(board);
  for (const f of next.frames) f.players.push({ team, at: clampPt(board, at) });
  return next;
}

/** Puts the first ball at `at`, or adds one if there is none. */
export function placeBall(board: Board, at: [number, number]): Board {
  return withFrame(board, (f) => {
    f.balls[0] = clampPt(board, at);
  });
}

/** Moves a player or a ball to `at`; the arrows of a player go along. */
export function movePiece(board: Board, piece: Selection, at: [number, number]): Board {
  return withFrame(board, (f) => {
    const pt = clampPt(board, at);
    if (piece.kind === "player" && f.players[piece.index]) f.players[piece.index]!.at = pt;
    if (piece.kind === "ball" && f.balls[piece.index]) f.balls[piece.index] = pt;
  });
}

/**
 * Shifts a whole arrow by (dx, dy), keeping it on the court. An arrow of a
 * player lets go of them; a shot stays with its shooter.
 */
export function moveArrow(board: Board, index: number, [dx, dy]: [number, number]): Board {
  const arrow = board.frames[0]!.arrows[index];
  if (!arrow || arrow.kind === "shot") return board;
  const xs = arrow.pts.map((p) => p[0]);
  const ys = arrow.pts.map((p) => p[1]);
  const cx = Math.min(COURT_WIDTH - Math.max(...xs), Math.max(-Math.min(...xs), Math.round(dx)));
  const cy = Math.min(length(board) - Math.max(...ys), Math.max(-Math.min(...ys), Math.round(dy)));
  return withFrame(board, (f) => {
    f.arrows[index] = { kind: arrow.kind, pts: arrow.pts.map(([x, y]) => [x + cx, y + cy]) };
  });
}

/**
 * Draws an arrow from `from` to `to`. With `player`, the arrow belongs to that
 * player and starts where they are by then (endOf()), whatever `from` is.
 */
export function addArrow(
  board: Board,
  kind: Arrow["kind"],
  from: [number, number],
  to: [number, number],
  player?: number,
): Board {
  const frame = board.frames[0]!;
  const a = player === undefined ? clampPt(board, from) : endOf(frame, player);
  const b = clampPt(board, to);
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < MIN_ARROW) return board;
  if (frame.arrows.length >= MAX_ARROWS) return board;
  return withFrame(board, (f) => {
    f.arrows.push(player === undefined ? { kind, pts: [a, b] } : { kind, from: player, pts: [a, b] });
  });
}

/** Gives an arrow to a player: it then starts where they are by then. A shot keeps its shooter. */
export function attachArrow(board: Board, index: number, player: number): Board {
  const arrow = board.frames[0]!.arrows[index];
  if (!arrow || arrow.kind === "shot" || !board.frames[0]!.players[player]) return board;
  return withFrame(board, (f) => {
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
  index: number,
  handle: 0 | 1 | 2,
  at: [number, number],
): Board {
  const arrow = board.frames[0]!.arrows[index];
  if (!arrow || (arrow.kind === "shot" && handle !== 2)) return board;
  const pt = clampPt(board, at);
  const start = arrow.pts[0]!;
  const end = arrow.pts[arrow.pts.length - 1]!;
  const bend = arrow.pts.length === 3 ? arrow.pts[1]! : null;

  let pts: Pt[];
  if (handle === 0) pts = bend ? [pt, bend, end] : [pt, end];
  else if (handle === 2) pts = bend ? [start, bend, pt] : [start, pt];
  else pts = toSegment(pt, start, end) < STRAIGHT_SNAP ? [start, end] : [start, pt, end];

  return withFrame(board, (f) => {
    const moved = f.arrows[index]!;
    moved.pts = pts;
    if (handle === 0) delete moved.from;
  });
}

/** Removes a player from every step (one lineup), with their arrows; or an arrow or a ball. */
export function removeSelected(board: Board, piece: Selection): Board {
  if (piece.kind !== "player") {
    return withFrame(board, (f) => {
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

/** Keeps the players, removes arrows and balls. */
export function clearArrows(board: Board): Board {
  return withFrame(board, (f) => {
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

/**
 * The board's title as typed: one line, at most MAX_TITLE characters, spaces
 * trimmed. An empty title removes it. The same title returns the same board,
 * so the editor makes no undo step for it.
 */
export function setTitle(board: Board, text: string): Board {
  let title = text.replace(/[\0-\x1f\x7f]/g, " ").trim().slice(0, MAX_TITLE);
  // Don't cut a character that takes two code units (an emoji) in half.
  if (/[\ud800-\udbff]$/.test(title)) title = title.slice(0, -1);
  title = title.trimEnd();
  if ((board.title ?? "") === title) return board;
  const next = { ...board };
  if (title) next.title = title;
  else delete next.title;
  return next;
}
