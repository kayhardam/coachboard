import { describe, expect, it } from "vitest";
import {
  byDate,
  folders,
  isUntouchedDefault,
  OLD_KEY,
  put,
  read,
  remove,
  renameFolder,
  STORE_KEY,
  withFolder,
  write,
  type Saved,
} from "./boards";
import { defaultBoard, defaultBoardFor } from "./defaults";
import { toBoard, type Board } from "./format";
import v1Default from "./fixtures/v1-default.json";
import v1FullLineup from "./fixtures/v1-full-lineup.json";

/** A storage of our own: localStorage doesn't exist in Node. */
function storage(items: Record<string, string> = {}) {
  const map = new Map(Object.entries(items));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    map,
  };
}

/** The default lineup with LB moved: a board someone changed. */
function edited(lang = "en"): Board {
  const board = defaultBoardFor(lang);
  board.frames[0]!.players[1]!.at = [40, 100];
  return board;
}

const saved = (id: string, at: number, folder?: string): Saved =>
  folder ? { id, board: edited(), folder, at } : { id, board: edited(), at };

describe("read", () => {
  it("is empty without storage of either version", () => {
    expect(read(storage())).toEqual({ current: null, boards: [] });
  });

  it("brings the board of an earlier version along as the first board, and opens it", () => {
    const old = edited("nl");
    const store = read(storage({ [OLD_KEY]: JSON.stringify(old) }));
    expect(store.boards).toHaveLength(1);
    expect(store.boards[0]!.board).toEqual(old);
    expect(store.current).toBe(store.boards[0]!.id);
  });

  it("reads a version 1 board of an earlier version as a version 2 board", () => {
    const store = read(storage({ [OLD_KEY]: JSON.stringify(v1FullLineup.board) }));
    expect(store.boards[0]!.board).toEqual(toBoard(v1FullLineup.board));
  });

  it("leaves an untouched default lineup of an earlier version out", () => {
    for (const old of [defaultBoardFor("en"), defaultBoardFor("nl"), v1Default.board]) {
      expect(read(storage({ [OLD_KEY]: JSON.stringify(old) }))).toEqual({ current: null, boards: [] });
    }
  });

  it("leaves a broken board of an earlier version out", () => {
    expect(read(storage({ [OLD_KEY]: "{not json" })).boards).toEqual([]);
    expect(read(storage({ [OLD_KEY]: '{"v":2}' })).boards).toEqual([]);
  });

  it("ignores the earlier version once the list exists", () => {
    const list = { current: "a", boards: [saved("a", 1)] };
    const store = read(storage({ [STORE_KEY]: JSON.stringify(list), [OLD_KEY]: JSON.stringify(edited("nl")) }));
    expect(store).toEqual(list);
  });

  it("reads what write() wrote", () => {
    const s = storage();
    const list = { current: "b", boards: [saved("a", 1, "Training dinsdag"), saved("b", 2)] };
    write(s, list);
    expect(read(s)).toEqual(list);
  });

  it("leaves out boards that don't read, and keeps the rest", () => {
    const good = saved("a", 1);
    const raw = { current: "a", boards: [good, { id: "b", at: 2, board: { v: 2 } }, { board: edited(), at: 3 }, null] };
    expect(read(storage({ [STORE_KEY]: JSON.stringify(raw) }))).toEqual({ current: "a", boards: [good] });
  });

  it("reads a broken list as empty", () => {
    expect(read(storage({ [STORE_KEY]: "[" }))).toEqual({ current: null, boards: [] });
    expect(read(storage({ [STORE_KEY]: "null" }))).toEqual({ current: null, boards: [] });
  });
});

describe("isUntouchedDefault", () => {
  it("is true for the default lineup in English and Dutch", () => {
    expect(isUntouchedDefault(defaultBoard)).toBe(true);
    expect(isUntouchedDefault(defaultBoardFor("nl"))).toBe(true);
  });

  it("is true for the default lineups of earlier versions", () => {
    expect(isUntouchedDefault(toBoard(v1Default.board)!)).toBe(true);
    // 2 October: the pivot in the defence, the backs at 3.5 m.
    const middle = defaultBoardFor("en");
    middle.frames[0]!.players[1]!.at = [35, 118];
    middle.frames[0]!.players[3]!.at = [165, 118];
    expect(isUntouchedDefault(middle)).toBe(true);
  });

  it("is false after any change", () => {
    const changes: ((b: Board) => void)[] = [
      (b) => (b.frames[0]!.players[1]!.at = [40, 100]),
      (b) => (b.frames[0]!.balls = []),
      (b) => b.frames[0]!.arrows.push({ kind: "run", from: 1, pts: [[30, 118], [30, 90]] }),
      (b) => (b.title = "Kruising"),
      (b) => (b.frames[0]!.text = "Uitleg"),
      (b) => (b.court = "full"),
      (b) => b.cones.push([10, 10]),
      (b) => b.frames.push(structuredClone(b.frames[0]!)),
      (b) => b.frames[0]!.players.pop(),
    ];
    for (const change of changes) {
      const board = defaultBoardFor("nl");
      change(board);
      expect(isUntouchedDefault(board)).toBe(false);
    }
  });

  it("is false for labels of one language mixed with another", () => {
    const board = defaultBoardFor("nl");
    board.frames[0]!.players[0]!.label = "LW";
    expect(isUntouchedDefault(board)).toBe(false);
  });
});

describe("the list", () => {
  it("puts a new board first, and a known one in its place", () => {
    const [a, b] = [saved("a", 1), saved("b", 2)];
    expect(put([a], b).map((s) => s.id)).toEqual(["b", "a"]);
    const newer = { ...a, at: 3 };
    expect(put([b, a], newer)).toEqual([b, newer]);
  });

  it("removes a board by its id", () => {
    expect(remove([saved("a", 1), saved("b", 2)], "a").map((s) => s.id)).toEqual(["b"]);
  });

  it("sorts the most recently changed first, without changing the list", () => {
    const list = [saved("a", 1), saved("b", 3), saved("c", 2)];
    expect(byDate(list).map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(list.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});

describe("folders", () => {
  it("lists each folder once, the most recently changed first", () => {
    const list = [saved("a", 1, "Dinsdag"), saved("b", 2), saved("c", 3, "Donderdag"), saved("d", 4, "Dinsdag")];
    expect(folders(list)).toEqual(["Dinsdag", "Donderdag"]);
  });

  it("puts a board in a folder as one trimmed line, and out of it when empty", () => {
    expect(withFolder(saved("a", 1), "  Training\tdinsdag ").folder).toBe("Training dinsdag");
    expect(withFolder(saved("a", 1, "Dinsdag"), "  ")).not.toHaveProperty("folder");
    expect(withFolder(saved("a", 1), "x".repeat(50)).folder).toHaveLength(40);
  });

  it("renames a folder for every board in it", () => {
    const list = [saved("a", 1, "Dinsdag"), saved("b", 2, "Donderdag"), saved("c", 3, "Dinsdag")];
    expect(renameFolder(list, "Dinsdag", "Training dinsdag").map((s) => s.folder)).toEqual([
      "Training dinsdag",
      "Donderdag",
      "Training dinsdag",
    ]);
  });
});
