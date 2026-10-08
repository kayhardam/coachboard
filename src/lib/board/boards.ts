// My boards: the boards you keep on this device, in localStorage. Plain
// functions over the list, plus reading and writing it; the storage is passed
// in, so tests can use their own.
//
// A board enters the list at its first real change (the editor decides when
// that is), not when it opens: a received link, a tactic or a new board stays
// out until you change it.

import { defaultBoardFor } from "./defaults";
import { toBoard, type Board, type Pt } from "./format";

/** A board you keep. `at` is when it last changed (ms since 1970). */
export interface Saved {
  id: string;
  board: Board;
  folder?: string;
  at: number;
}

/** What localStorage holds: the list, and the board last opened in the editor. */
export interface Store {
  current: string | null;
  boards: Saved[];
}

export const STORE_KEY = "coachboard.boards";
/** The one board versions before My boards kept. It stays, so a rollback still finds it. */
export const OLD_KEY = "coachboard.board";
export const MAX_FOLDER = 40;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * The list in `storage`. Without one yet, the board an earlier version kept
 * becomes the first, unless it is an untouched default lineup (that version
 * saved the lineup on the first visit). That happens once: the new list is
 * written at once, so the old board doesn't come back when you later delete
 * every board. Boards that don't read are left out. Throws when there is no
 * storage.
 */
export function read(storage: Storage): Store {
  const raw = storage.getItem(STORE_KEY);
  if (raw === null) {
    let old: Board | null = null;
    try {
      old = toBoard(JSON.parse(storage.getItem(OLD_KEY) ?? "null"));
    } catch {
      // Not JSON: nothing to bring along.
    }
    const boards = old && !isUntouchedDefault(old) ? [{ id: newId(), board: old, at: Date.now() }] : [];
    const store = { current: boards[0]?.id ?? null, boards };
    write(storage, store);
    return store;
  }
  try {
    const data = JSON.parse(raw) as Partial<Store>;
    const boards = (Array.isArray(data.boards) ? data.boards : []).flatMap((s: Saved) => {
      const board = toBoard(s?.board);
      if (!board || typeof s.id !== "string" || typeof s.at !== "number") return [];
      return [typeof s.folder === "string" && s.folder ? { id: s.id, board, folder: s.folder, at: s.at } : { id: s.id, board, at: s.at }];
    });
    return { current: typeof data.current === "string" ? data.current : null, boards };
  } catch {
    return { current: null, boards: [] };
  }
}

export function write(storage: Storage, store: Store) {
  storage.setItem(STORE_KEY, JSON.stringify(store));
}

/**
 * Saves one board: reads the list again first and replaces only that board
 * (or puts it first), so a board another tab saved in the meantime stays.
 * Makes it the board last opened. Returns the list as it is now.
 */
export function saveBoard(storage: Storage, entry: Saved): Store {
  const store = { current: entry.id, boards: put(read(storage).boards, entry) };
  write(storage, store);
  return store;
}

/** Deletes one board, from the list as it is now (see saveBoard()). */
export function deleteBoard(storage: Storage, id: string): Store {
  const { current, boards } = read(storage);
  const store = { current: current === id ? null : current, boards: remove(boards, id) };
  write(storage, store);
  return store;
}

/** The list with `entry` in place of the board with its id, or first if it is new. */
export function put(boards: Saved[], entry: Saved): Saved[] {
  return boards.some((s) => s.id === entry.id)
    ? boards.map((s) => (s.id === entry.id ? entry : s))
    : [entry, ...boards];
}

export const remove = (boards: Saved[], id: string) => boards.filter((s) => s.id !== id);

/** The boards with the most recently changed first. */
export const byDate = (boards: Saved[]) => boards.slice().sort((a, b) => b.at - a.at);

/** The folders in use, the one with the most recently changed board first. */
export const folders = (boards: Saved[]) => [...new Set(byDate(boards).flatMap((s) => (s.folder ? [s.folder] : [])))];

/** `s` in `folder`: one line, trimmed, at most MAX_FOLDER characters; none when empty. */
export function withFolder(s: Saved, folder: string): Saved {
  const name = folder.replace(/[\0-\x1f\x7f]/g, " ").trim().slice(0, MAX_FOLDER).trimEnd();
  const { folder: _, ...rest } = s;
  return name ? { ...rest, folder: name } : rest;
}

/** Every board in folder `from` moved to `to`: a folder's new name. */
export const renameFolder = (boards: Saved[], from: string, to: string) =>
  boards.map((s) => (s.folder === from ? withFolder(s, to) : s));

// ===== The default lineup, untouched =====

/**
 * Where the attackers of the default lineup stood in each version that could
 * have saved it: LW, LB, CB, RB, RW, P. Since 22 September 2026, 2 October
 * (pivot into the defence, backs wider) and 2 October again (backs at 3.0 m).
 */
const ATTACK: Pt[][] = [
  [[8, 48], [45, 118], [100, 130], [155, 118], [192, 48], [100, 78]],
  [[8, 48], [35, 118], [100, 130], [165, 118], [192, 48], [100, 66]],
  [[8, 48], [30, 118], [100, 130], [170, 118], [192, 48], [100, 66]],
];

/** The players as text, to compare lineups. */
const lineupOf = (board: Board) => JSON.stringify(board.frames[0]!.players.map((p) => [p.team, p.label, p.at]));

/**
 * True for a default lineup nobody changed, in English or Dutch, as any
 * version could have saved it: nothing to keep.
 */
export function isUntouchedDefault(board: Board): boolean {
  const [frame, ...more] = board.frames;
  if (more.length || board.court !== "half" || board.title || board.cones.length) return false;
  if (frame!.arrows.length || frame!.text || JSON.stringify(frame!.balls) !== "[[110,122]]") return false;
  const lineup = lineupOf(board);
  return ["en", "nl"].some((lang) =>
    ATTACK.some((attack) => {
      const lineupBoard = defaultBoardFor(lang);
      attack.forEach((at, i) => (lineupBoard.frames[0]!.players[i]!.at = at));
      return lineupOf(lineupBoard) === lineup;
    }),
  );
}
