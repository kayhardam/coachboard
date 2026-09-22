// Editing operations on a board. Pure: each returns a new board and leaves
// the old one alone, so the editor's undo history is a list of boards. The
// first version edits frames[0] only.

import { defaultBoard } from "./defaults";
import {
  COURT_WIDTH,
  MAX_ARROWS,
  MAX_PLAYERS,
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

function withFrame(board: Board, change: (frame: Frame) => void): Board {
  const next = structuredClone(board);
  change(next.frames[0]!);
  return next;
}

export function addPlayer(board: Board, team: Player["team"], at: [number, number]): Board {
  if (board.frames[0]!.players.length >= MAX_PLAYERS) return board;
  return withFrame(board, (f) => {
    f.players.push({ team, at: clampPt(board, at) });
  });
}

export function placeBall(board: Board, at: [number, number]): Board {
  return withFrame(board, (f) => {
    f.ball = clampPt(board, at);
  });
}

/** Moves a player or the ball to `at`. */
export function movePiece(board: Board, piece: Selection, at: [number, number]): Board {
  return withFrame(board, (f) => {
    const pt = clampPt(board, at);
    if (piece.kind === "player" && f.players[piece.index]) f.players[piece.index]!.at = pt;
    if (piece.kind === "ball" && f.ball) f.ball = pt;
  });
}

/** Shifts a whole arrow by (dx, dy), keeping it on the court. */
export function moveArrow(board: Board, index: number, [dx, dy]: [number, number]): Board {
  const arrow = board.frames[0]!.arrows[index];
  if (!arrow) return board;
  const xs = arrow.pts.map((p) => p[0]);
  const ys = arrow.pts.map((p) => p[1]);
  const cx = Math.min(COURT_WIDTH - Math.max(...xs), Math.max(-Math.min(...xs), Math.round(dx)));
  const cy = Math.min(length(board) - Math.max(...ys), Math.max(-Math.min(...ys), Math.round(dy)));
  return withFrame(board, (f) => {
    f.arrows[index]!.pts = arrow.pts.map(([x, y]) => [x + cx, y + cy]);
  });
}

export function addArrow(
  board: Board,
  kind: Arrow["kind"],
  from: [number, number],
  to: [number, number],
): Board {
  const a = clampPt(board, from);
  const b = clampPt(board, to);
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < MIN_ARROW) return board;
  if (board.frames[0]!.arrows.length >= MAX_ARROWS) return board;
  return withFrame(board, (f) => {
    f.arrows.push({ kind, pts: [a, b] });
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
 * near the line.
 */
export function moveHandle(
  board: Board,
  index: number,
  handle: 0 | 1 | 2,
  at: [number, number],
): Board {
  const arrow = board.frames[0]!.arrows[index];
  if (!arrow) return board;
  const pt = clampPt(board, at);
  const start = arrow.pts[0]!;
  const end = arrow.pts[arrow.pts.length - 1]!;
  const bend = arrow.pts.length === 3 ? arrow.pts[1]! : null;

  let pts: Pt[];
  if (handle === 0) pts = bend ? [pt, bend, end] : [pt, end];
  else if (handle === 2) pts = bend ? [start, bend, pt] : [start, pt];
  else pts = toSegment(pt, start, end) < STRAIGHT_SNAP ? [start, end] : [start, pt, end];

  return withFrame(board, (f) => {
    f.arrows[index]!.pts = pts;
  });
}

export function removeSelected(board: Board, piece: Selection): Board {
  return withFrame(board, (f) => {
    if (piece.kind === "player") f.players.splice(piece.index, 1);
    if (piece.kind === "arrow") f.arrows.splice(piece.index, 1);
    if (piece.kind === "ball") delete f.ball;
  });
}

/** Keeps the players, removes arrows and the ball. */
export function clearArrows(board: Board): Board {
  return withFrame(board, (f) => {
    f.arrows = [];
    delete f.ball;
  });
}

export function resetLineup(): Board {
  return structuredClone(defaultBoard);
}

export function emptyCourt(board: Board): Board {
  return { v: 1, court: board.court, frames: [{ players: [], arrows: [] }] };
}

/** Switching to a half court pulls everything beyond the halfway line onto it. */
export function setCourt(board: Board, court: Board["court"]): Board {
  const next: Board = { ...structuredClone(board), court };
  return withFrame(next, (f) => {
    for (const p of f.players) p.at = clampPt(next, p.at);
    if (f.ball) f.ball = clampPt(next, f.ball);
    for (const a of f.arrows) a.pts = a.pts.map((p) => clampPt(next, p));
  });
}
