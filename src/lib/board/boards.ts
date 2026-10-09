// My boards: the boards you keep on this device, in localStorage. Plain
// functions over the list, plus reading and writing it; the storage is passed
// in, so tests can use their own.
//
// A board enters the list at its first real change (the editor decides when
// that is), not when it opens: a received link, a tactic or a new board stays
// out until you change it.

import { MAX_TITLE, toBoard, type Board } from "./format";

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
 * Changes the list as it is in `storage` now: reads it again, applies
 * `change` and writes the result. Every change goes through here, so a board
 * another tab saved in the meantime stays. Returns the list as written.
 */
export function update(storage: Storage, change: (store: Store) => Store): Store {
  const store = change(read(storage));
  write(storage, store);
  return store;
}

/**
 * Saves one board under `id` and, with `open`, makes it the board last
 * opened. Only that board changes; it keeps its folder. A new board goes first.
 */
export function saveBoard(storage: Storage, id: string, board: Board, open = true, at = Date.now()): Store {
  return update(storage, ({ current, boards }) => {
    const folder = boards.find((s) => s.id === id)?.folder;
    return { current: open ? id : current, boards: put(boards, folder ? { id, board, folder, at } : { id, board, at }) };
  });
}

/** Deletes one board (see update()). */
export function deleteBoard(storage: Storage, id: string): Store {
  return update(storage, ({ current, boards }) => ({ current: current === id ? null : current, boards: remove(boards, id) }));
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

/**
 * A copy of `s` under a new id, its title followed by `suffix` (" (copy)"),
 * the title cut short so the whole stays within MAX_TITLE. A board without a
 * title stays without one.
 */
export function copyOf(s: Saved, suffix: string, at = Date.now()): Saved {
  const board = structuredClone(s.board);
  if (board.title) board.title = board.title.slice(0, MAX_TITLE - suffix.length).trimEnd() + suffix;
  return { ...s, id: newId(), board, at };
}

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
 * The goalkeeper and the six defenders, and the ball, never moved.
 */
const ATTACK = [
  "8,48,45,118,100,130,155,118,192,48,100,78",
  "8,48,35,118,100,130,165,118,192,48,100,66",
  "8,48,30,118,100,130,170,118,192,48,100,66",
];
const DEFENCE = "100,8,22,30,48,58,80,66,120,66,152,58,178,30";

/**
 * True for a default lineup nobody changed, as any version could have saved
 * it: nothing to keep. Labels can't be changed on the board, so the places of
 * six attackers, then the goalkeeper and six defenders, are enough.
 */
export function isUntouchedDefault(board: Board): boolean {
  const [frame, ...more] = board.frames;
  const { players, balls, arrows, text } = frame!;
  if (more.length || board.court !== "half" || board.title || board.cones.length || arrows.length || text) return false;
  const teams = players.map((p) => p.team).join("");
  const places = players.map((p) => p.at).join();
  return balls.join() === "110,122" && teams === "aaaaaaddddddd" && ATTACK.some((a) => places === `${a},${DEFENCE}`);
}
