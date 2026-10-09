import { deflateRawSync, inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  byDate,
  copyOf,
  deleteBoard,
  exportFile,
  folders,
  importFile,
  isUntouchedDefault,
  newOnly,
  OLD_KEY,
  put,
  read,
  remove,
  renameFolder,
  saveBoard,
  STORE_KEY,
  update,
  withFolder,
  write,
  type Saved,
} from "./boards";
import { defaultBoard, defaultBoardFor } from "./defaults";
import { encode, toBoard, type Board } from "./format";
import exportV1 from "./fixtures/export/export-1.json";
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

  it("brings the earlier board along once: after deleting every board it doesn't come back", () => {
    const s = storage({ [OLD_KEY]: JSON.stringify(edited("nl")) });
    const { boards } = read(s);
    expect(boards).toHaveLength(1);
    expect(read(s).boards).toEqual(boards); // read again: the same board, not a second one
    deleteBoard(s, boards[0]!.id);
    expect(read(s)).toEqual({ current: null, boards: [] });
    expect(s.map.get(OLD_KEY)).toBe(JSON.stringify(edited("nl"))); // still there, for a rollback
  });

  it("looks at the earlier board once, also when it was an untouched default lineup", () => {
    const s = storage({ [OLD_KEY]: JSON.stringify(defaultBoardFor("nl")) });
    expect(read(s).boards).toEqual([]);
    s.setItem(OLD_KEY, JSON.stringify(edited("nl"))); // an old tab saves after all
    expect(read(s).boards).toEqual([]);
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

  it("is false with an attacker where a defender stood", () => {
    const board = defaultBoardFor("nl");
    board.frames[0]!.players[7]!.team = "a";
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

describe("two tabs", () => {
  it("each save reads the list again and replaces only its own board", () => {
    const s = storage();
    saveBoard(s, "a", edited(), true, 1);
    saveBoard(s, "b", edited(), true, 2);
    // Both tabs have this list open; each changes its own board.
    const tab1 = read(s);
    const tab2 = read(s);
    expect(tab1).toEqual(tab2);
    saveBoard(s, "a", edited("nl"), true, 3); // tab 1
    update(s, (store) => ({ ...store, boards: store.boards.map((b) => (b.id === "b" ? withFolder(b, "Dinsdag") : b)) })); // tab 2
    saveBoard(s, "b", defaultBoardFor("nl"), true, 4); // tab 2 again: keeps its folder
    saveBoard(s, "c", edited(), true, 5); // tab 1, a new board, from its old list
    const { boards, current } = read(s);
    expect(boards.find((b) => b.id === "a")).toEqual({ id: "a", board: edited("nl"), at: 3 });
    expect(boards.find((b) => b.id === "b")).toEqual({ id: "b", board: defaultBoardFor("nl"), folder: "Dinsdag", at: 4 });
    expect(boards.map((b) => b.id).sort()).toEqual(["a", "b", "c"]);
    expect(current).toBe("c");
  });

  it("saves a board without opening it, for the board the editor leaves", () => {
    const s = storage();
    saveBoard(s, "a", edited(), true, 1);
    saveBoard(s, "b", edited("nl"), false, 2);
    expect(read(s).current).toBe("a");
    expect(read(s).boards.map((b) => b.id).sort()).toEqual(["a", "b"]);
  });

  it("a delete in one tab keeps what the other tab saved", () => {
    const s = storage();
    saveBoard(s, "a", edited(), true, 1);
    saveBoard(s, "b", edited(), true, 2);
    saveBoard(s, "b", edited("nl"), true, 3); // tab 2
    deleteBoard(s, "a"); // tab 1, which still had the old b
    expect(read(s)).toEqual({ current: "b", boards: [{ id: "b", board: edited("nl"), at: 3 }] });
  });
});

describe("copyOf", () => {
  it("adds the suffix to the title under a new id", () => {
    const s = { ...saved("a", 1, "Dinsdag"), board: { ...edited(), title: "Kruising MO–LO" } };
    const copy = copyOf(s, " (kopie)", 5);
    expect(copy.id).not.toBe("a");
    expect(copy).toMatchObject({ folder: "Dinsdag", at: 5, board: { title: "Kruising MO–LO (kopie)" } });
    expect(s.board.title).toBe("Kruising MO–LO");
  });

  it("cuts a long title short, so the whole stays within 40 characters", () => {
    const s = { ...saved("a", 1), board: { ...edited(), title: "Opwarmen in drie rijen met twee ballen xx" } };
    expect(copyOf(s, " (copy)").board.title).toBe("Opwarmen in drie rijen met twee b (copy)");
  });

  it("leaves a board without a title without one", () => {
    expect(copyOf(saved("a", 1), " (copy)").board).not.toHaveProperty("title");
  });
});

describe("export and import", () => {
  const BASE = "https://handballcoachboard.com/nl/board/#t=";
  const titled = (title: string): Board => ({ ...edited(), title });
  const list = (): Saved[] => [
    { id: "a", board: titled("Kruising MO–LO"), folder: "Training dinsdag", at: Date.parse("2026-10-08T17:12:00Z") },
    { id: "b", board: edited("nl"), at: Date.parse("2026-10-09T09:30:00Z") },
  ];
  const strip = ({ board, folder, at }: Saved) => ({ board, folder, at });

  it("exports each board as a full link, with its folder and date, the most recently changed first", async () => {
    const file = JSON.parse(await exportFile(list(), BASE));
    expect(file.coachboard).toBe(1);
    expect(file.boards).toEqual([
      { link: BASE + (await encode(edited("nl"))), at: "2026-10-09T09:30:00.000Z" },
      { link: BASE + (await encode(titled("Kruising MO–LO"))), folder: "Training dinsdag", at: "2026-10-08T17:12:00.000Z" },
    ]);
  });

  it("imports what it exported: the same boards, folders and dates, under new ids", async () => {
    const found = await importFile(await exportFile(list(), BASE));
    expect(found.map(strip)).toEqual(byDate(list()).map(strip));
    expect(found.map((s) => s.id)).not.toContain("a");
    expect(new Set(found.map((s) => s.id)).size).toBe(2);
  });

  it("reads the export of phase 12b-3, with a version 1 link in it", async () => {
    const found = await importFile(JSON.stringify(exportV1));
    expect(found).toHaveLength(3);
    expect(found.map((s) => s.folder)).toEqual(["Training dinsdag", undefined, "Training dinsdag"]);
    expect(found.map((s) => new Date(s.at).toISOString())).toEqual(exportV1.boards.map((b) => b.at));
    expect(found.every((s) => s.board.v === 2)).toBe(true);
  });

  it("reads a link with or without the URL before it", async () => {
    const link = await encode(edited());
    const file = { boards: [{ link }, { link: BASE + link }, { link: BASE + encodeURIComponent(link) }] };
    expect((await importFile(JSON.stringify(file))).map((s) => s.board)).toEqual([edited(), edited(), edited()]);
  });

  it("leaves out what doesn't read and keeps the rest", async () => {
    const good = { link: BASE + (await encode(edited())) };
    const file = { boards: [{ link: BASE + "2.broken" }, { link: BASE + "3.AAAA" }, { link: "%E0%A4%A" }, { link: 4 }, null, good] };
    expect(await importFile(JSON.stringify(file))).toHaveLength(1);
  });

  it("finds no boards in a file that isn't an export", async () => {
    for (const text of ["", "not json", "null", "[]", '{"boards": "x"}', '{"boards": []}', "{}"]) {
      expect(await importFile(text)).toEqual([]);
    }
  });

  it("cleans a folder name as the editor does, and dates a board without a date when it is imported", async () => {
    const link = BASE + (await encode(edited()));
    const file = { boards: [{ link, folder: "  Dinsdag\n" + "x".repeat(60) }, { link, folder: "   " }, { link, at: "gisteren" }] };
    const [a, b, c] = await importFile(JSON.stringify(file), 1234);
    expect(a!.folder).toBe(("Dinsdag " + "x".repeat(60)).slice(0, 40));
    expect(b!.folder).toBeUndefined();
    expect(c!.at).toBe(1234);
  });

  it("leaves out the boards that are already there, in any folder, and the second of two in one file", async () => {
    const mine: Saved[] = [{ id: "x", board: edited(), folder: "Dinsdag", at: 1 }];
    const found: Saved[] = [
      { id: "1", board: edited(), at: 2 },
      { id: "2", board: titled("Nieuw"), folder: "Donderdag", at: 3 },
      { id: "3", board: titled("Nieuw"), at: 4 },
    ];
    expect(newOnly(mine, found).map((s) => s.id)).toEqual(["2"]);
    expect(newOnly([...mine, ...found], found)).toEqual([]);
    expect(newOnly([], found).map((s) => s.id)).toEqual(["1", "2"]);
  });

  it("knows a board again when another browser compressed its link to other bytes", async () => {
    const link = await encode(titled("Kruising"));
    const json = JSON.stringify(toV2Json(link));
    const other = "2." + deflateRawSync(json, { level: 1 }).toString("base64url");
    expect(other).not.toBe(link);
    const [found] = await importFile(JSON.stringify({ boards: [{ link: BASE + other }] }));
    expect(newOnly([{ id: "x", board: titled("Kruising"), at: 1 }], [found!])).toEqual([]);
  });
});

/** The JSON inside a version 2 link. */
function toV2Json(link: string): unknown {
  const bytes = Buffer.from(link.slice(2), "base64url");
  return JSON.parse(inflateRawSync(bytes).toString());
}
