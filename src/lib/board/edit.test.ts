import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import {
  addArrow,
  addPlayer,
  attachArrow,
  clampPt,
  clearArrows,
  emptyCourt,
  endOf,
  moveArrow,
  moveHandle,
  movePiece,
  placeBall,
  removeSelected,
  resetLineup,
  setCourt,
  setTitle,
} from "./edit";
import { isBoard, MAX_PLAYERS, MAX_TITLE, type Board } from "./format";

const empty: Board = { v: 2, court: "half", cones: [], frames: [{ players: [], balls: [], arrows: [] }] };
const frame = (b: Board) => b.frames[0]!;
const withArrow = (pts: [number, number][]): Board => ({
  ...empty,
  frames: [{ players: [], balls: [], arrows: [{ kind: "run", pts }] }],
});
/** Two players; the first runs from where they stand, then passes. */
const owned = (): Board => {
  let board = addPlayer(addPlayer(empty, "a", [20, 100]), "a", [80, 100]);
  board = addArrow(board, "run", [0, 0], [20, 60], 0);
  return addArrow(board, "pass", [0, 0], [80, 100], 0);
};
/** The same players in a second step. */
const twoSteps = (board: Board): Board => ({
  ...board,
  frames: [board.frames[0]!, { ...structuredClone(board.frames[0]!), arrows: [], text: "Step 2." }],
});

describe("clampPt", () => {
  it("rounds to whole decimetres and keeps points on the visible court", () => {
    expect(clampPt(empty, [10.4, 20.6])).toEqual([10, 21]);
    expect(clampPt(empty, [-5, 250])).toEqual([0, 200]);
    expect(clampPt({ ...empty, court: "full" }, [250, 250])).toEqual([200, 250]);
  });
});

describe("pieces", () => {
  it("adds a player without touching the original board", () => {
    const next = addPlayer(empty, "d", [50.2, 60.7]);
    expect(frame(next).players).toEqual([{ team: "d", at: [50, 61] }]);
    expect(frame(empty).players).toEqual([]);
    expect(isBoard(next)).toBe(true);
  });

  it("stops adding players at the limit", () => {
    let board = empty;
    for (let i = 0; i < MAX_PLAYERS + 3; i++) board = addPlayer(board, "a", [i, i]);
    expect(frame(board).players).toHaveLength(MAX_PLAYERS);
  });

  it("places and moves the ball", () => {
    const placed = placeBall(empty, [10, 10]);
    expect(frame(placed).balls).toEqual([[10, 10]]);
    expect(frame(movePiece(placed, { kind: "ball", index: 0 }, [20, 30])).balls).toEqual([[20, 30]]);
  });

  it("puts the first ball elsewhere and leaves a second ball alone", () => {
    const two: Board = { ...empty, frames: [{ players: [], balls: [[10, 10], [50, 50]], arrows: [] }] };
    expect(frame(placeBall(two, [30, 30])).balls).toEqual([[30, 30], [50, 50]]);
    expect(frame(movePiece(two, { kind: "ball", index: 1 }, [60, 70])).balls).toEqual([[10, 10], [60, 70]]);
    expect(frame(removeSelected(two, { kind: "ball", index: 0 })).balls).toEqual([[50, 50]]);
  });

  it("adds and removes a player in every step, so the lineup stays one", () => {
    const board = twoSteps(addPlayer(empty, "a", [20, 20]));
    const added = addPlayer(board, "d", [40, 40]);
    expect(added.frames.map((f) => f.players.length)).toEqual([2, 2]);
    expect(isBoard(added)).toBe(true);
    const removed = removeSelected(added, { kind: "player", index: 0 });
    expect(removed.frames.map((f) => f.players.map((p) => p.team))).toEqual([["d"], ["d"]]);
    expect(removed.frames[1]!.text).toBe("Step 2.");
  });

  it("moves a player onto the court", () => {
    const next = movePiece(defaultBoard, { kind: "player", index: 0 }, [-20, 300]);
    expect(frame(next).players[0]!.at).toEqual([0, 200]);
  });

  it("removes the selected player, arrow or ball", () => {
    const board = withArrow([[0, 0], [50, 0]]);
    expect(frame(removeSelected(defaultBoard, { kind: "player", index: 0 })).players).toHaveLength(12);
    expect(frame(removeSelected(board, { kind: "arrow", index: 0 })).arrows).toHaveLength(0);
    expect(frame(removeSelected(defaultBoard, { kind: "ball", index: 0 })).balls).toEqual([]);
  });
});

describe("arrows", () => {
  it("adds an arrow of at least 1 m", () => {
    expect(frame(addArrow(empty, "pass", [10, 10], [40, 50])).arrows).toEqual([
      { kind: "pass", pts: [[10, 10], [40, 50]] },
    ]);
    expect(addArrow(empty, "pass", [10, 10], [15, 15])).toBe(empty);
  });

  it("bends through the middle handle and snaps back to straight near the line", () => {
    const board = withArrow([[0, 0], [100, 0]]);
    const bent = moveHandle(board, 0, 1, [50, 30]);
    expect(frame(bent).arrows[0]!.pts).toEqual([[0, 0], [50, 30], [100, 0]]);
    expect(frame(moveHandle(bent, 0, 1, [60, 3])).arrows[0]!.pts).toEqual([[0, 0], [100, 0]]);
  });

  it("moves an end handle and keeps the bend", () => {
    const bent = moveHandle(withArrow([[0, 0], [100, 0]]), 0, 1, [50, 30]);
    expect(frame(moveHandle(bent, 0, 2, [120, 20])).arrows[0]!.pts).toEqual([
      [0, 0],
      [50, 30],
      [120, 20],
    ]);
  });

  it("shifts a whole arrow but not off the court", () => {
    const board = withArrow([[10, 10], [50, 20]]);
    expect(frame(moveArrow(board, 0, [5, 5])).arrows[0]!.pts).toEqual([[15, 15], [55, 25]]);
    expect(frame(moveArrow(board, 0, [-30, -30])).arrows[0]!.pts).toEqual([[0, 0], [40, 10]]);
  });
});

describe("arrows of a player", () => {
  it("start where the player is by then: the next arrow after a run starts at its end", () => {
    const board = owned();
    expect(frame(board).arrows).toEqual([
      { kind: "run", from: 0, pts: [[20, 100], [20, 60]] },
      { kind: "pass", from: 0, pts: [[20, 60], [80, 100]] },
    ]);
    expect(endOf(frame(board), 0)).toEqual([20, 60]);
    expect(endOf(frame(board), 1)).toEqual([80, 100]);
    expect(isBoard(board)).toBe(true);
  });

  it("start at the player, wherever the drag began", () => {
    const board = addPlayer(empty, "a", [20, 100]);
    expect(frame(addArrow(board, "run", [25, 105], [20, 60], 0)).arrows[0]!.pts[0]).toEqual([20, 100]);
  });

  it("follow their player, and the arrows after them follow too", () => {
    const moved = movePiece(owned(), { kind: "player", index: 0 }, [30, 120]);
    expect(frame(moved).arrows.map((a) => a.pts)).toEqual([
      [[30, 120], [20, 60]],
      [[20, 60], [80, 100]],
    ]);
    const longer = moveHandle(owned(), 0, 2, [20, 40]);
    expect(frame(longer).arrows[1]!.pts[0]).toEqual([20, 40]);
  });

  it("let go of the player when the arrow or its start is dragged", () => {
    const shifted = frame(moveArrow(owned(), 0, [5, 0])).arrows[0]!;
    expect(shifted).toEqual({ kind: "run", pts: [[25, 100], [25, 60]] });
    const started = frame(moveHandle(owned(), 0, 0, [10, 110])).arrows[0]!;
    expect(started).toEqual({ kind: "run", pts: [[10, 110], [20, 60]] });
  });

  it("can be given to a player", () => {
    const free = addArrow(addPlayer(empty, "a", [20, 100]), "run", [10, 10], [60, 60]);
    expect(frame(attachArrow(free, 0, 0)).arrows[0]).toEqual({ kind: "run", from: 0, pts: [[20, 100], [60, 60]] });
    expect(attachArrow(free, 0, 5)).toBe(free);
  });

  it("go with their player, and the others keep theirs", () => {
    const board = addArrow(owned(), "run", [0, 0], [80, 40], 1);
    const next = frame(removeSelected(board, { kind: "player", index: 0 }));
    expect(next.arrows).toEqual([{ kind: "run", from: 0, pts: [[80, 100], [80, 40]] }]);
  });
});

describe("shots", () => {
  const shot = (): Board => {
    const board = addPlayer(empty, "a", [60, 100]);
    return { ...board, frames: [{ ...frame(board), arrows: [{ kind: "shot", from: 0, pts: [[60, 100], [90, 0]] }] }] };
  };

  it("end at a spot in the goal, the one nearest where the end goes", () => {
    expect(frame(moveHandle(shot(), 0, 2, [104, 30])).arrows[0]!.pts[1]).toEqual([100, 0]);
    expect(frame(moveHandle(shot(), 0, 2, [180, 30])).arrows[0]!.pts[1]).toEqual([110, 0]);
  });

  it("stay with their shooter", () => {
    expect(moveArrow(shot(), 0, [10, 10])).toEqual(shot());
    expect(moveHandle(shot(), 0, 0, [10, 10])).toEqual(shot());
    expect(moveHandle(shot(), 0, 1, [70, 50])).toEqual(shot());
  });

  it("aim at the nearest goal on a full court", () => {
    const far = movePiece(setCourt(shot(), "full"), { kind: "player", index: 0 }, [60, 300]);
    expect(frame(far).arrows[0]!.pts).toEqual([[60, 300], [90, 400]]);
  });
});

describe("whole board", () => {
  it("clears arrows and balls but keeps the players", () => {
    const board = addArrow(defaultBoard, "run", [0, 0], [50, 50]);
    const next = clearArrows(board);
    expect(frame(next).arrows).toEqual([]);
    expect(frame(next).balls).toEqual([]);
    expect(frame(next).players).toHaveLength(13);
  });

  it("resets to a fresh copy of the default lineup", () => {
    const reset = resetLineup(defaultBoard);
    expect(reset).toEqual(defaultBoard);
    expect(reset).not.toBe(defaultBoard);
  });

  it("empties the court but keeps its size", () => {
    expect(emptyCourt({ ...defaultBoard, court: "full" })).toEqual({
      v: 2,
      court: "full",
      cones: [],
      frames: [{ players: [], balls: [], arrows: [] }],
    });
  });

  it("pulls everything onto a half court when switching from full", () => {
    const full: Board = {
      v: 2,
      court: "full",
      cones: [[50, 390]],
      frames: [
        {
          players: [{ team: "a", at: [100, 380] }],
          balls: [[100, 300]],
          arrows: [{ kind: "run", pts: [[10, 150], [10, 350]] }],
        },
        { players: [{ team: "a", at: [100, 390] }], balls: [], arrows: [] },
      ],
    };
    const half = setCourt(full, "half");
    expect(half.court).toBe("half");
    expect(half.cones).toEqual([[50, 200]]);
    expect(half.frames.map((f) => f.players[0]!.at)).toEqual([[100, 200], [100, 200]]);
    expect(frame(half).balls).toEqual([[100, 200]]);
    expect(frame(half).arrows[0]!.pts).toEqual([[10, 150], [10, 200]]);
    expect(setCourt(half, "full").court).toBe("full");
  });
});

describe("title", () => {
  it("is set, trimmed, and stays a valid board", () => {
    const next = setTitle(defaultBoard, "  Kruising MO–LO ");
    expect(next.title).toBe("Kruising MO–LO");
    expect(isBoard(next)).toBe(true);
    expect(defaultBoard.title).toBeUndefined();
  });

  it("is removed when it is empty", () => {
    const titled = setTitle(defaultBoard, "Wissel");
    expect("title" in setTitle(titled, "   ")).toBe(false);
  });

  it("keeps the same board when nothing changes, so there is no undo step", () => {
    const titled = setTitle(defaultBoard, "Wissel");
    expect(setTitle(titled, " Wissel ")).toBe(titled);
    expect(setTitle(defaultBoard, "")).toBe(defaultBoard);
  });

  it("is one line of at most MAX_TITLE characters", () => {
    const long = setTitle(defaultBoard, "x".repeat(MAX_TITLE + 10));
    expect(long.title).toHaveLength(MAX_TITLE);
    expect(setTitle(defaultBoard, "a\tb\nc").title).toBe("a b c");
    expect(isBoard(setTitle(defaultBoard, "a\u0000b"))).toBe(true);
  });

  it("doesn't cut an emoji in half at the limit", () => {
    const title = setTitle(defaultBoard, "x".repeat(MAX_TITLE - 1) + "🤾").title!;
    expect(title).toBe("x".repeat(MAX_TITLE - 1));
  });
});
