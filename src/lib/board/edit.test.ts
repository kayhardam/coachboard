import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import {
  addArrow,
  addPlayer,
  clampPt,
  clearArrows,
  emptyCourt,
  moveArrow,
  moveHandle,
  movePiece,
  placeBall,
  removeSelected,
  resetLineup,
  setCourt,
} from "./edit";
import { isBoard, MAX_PLAYERS, type Board } from "./format";

const empty: Board = { v: 1, court: "half", frames: [{ players: [], arrows: [] }] };
const frame = (b: Board) => b.frames[0]!;
const withArrow = (pts: [number, number][]): Board => ({
  ...empty,
  frames: [{ players: [], arrows: [{ kind: "run", pts }] }],
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
    expect(frame(placed).ball).toEqual([10, 10]);
    expect(frame(movePiece(placed, { kind: "ball", index: 0 }, [20, 30])).ball).toEqual([20, 30]);
  });

  it("moves a player onto the court", () => {
    const next = movePiece(defaultBoard, { kind: "player", index: 0 }, [-20, 300]);
    expect(frame(next).players[0]!.at).toEqual([0, 200]);
  });

  it("removes the selected player, arrow or ball", () => {
    const board = withArrow([[0, 0], [50, 0]]);
    expect(frame(removeSelected(defaultBoard, { kind: "player", index: 0 })).players).toHaveLength(12);
    expect(frame(removeSelected(board, { kind: "arrow", index: 0 })).arrows).toHaveLength(0);
    expect(frame(removeSelected(defaultBoard, { kind: "ball", index: 0 })).ball).toBeUndefined();
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

describe("whole board", () => {
  it("clears arrows and the ball but keeps the players", () => {
    const board = addArrow(defaultBoard, "run", [0, 0], [50, 50]);
    const next = clearArrows(board);
    expect(frame(next).arrows).toEqual([]);
    expect(frame(next).ball).toBeUndefined();
    expect(frame(next).players).toHaveLength(13);
  });

  it("resets to a fresh copy of the default lineup", () => {
    const reset = resetLineup(defaultBoard);
    expect(reset).toEqual(defaultBoard);
    expect(reset).not.toBe(defaultBoard);
  });

  it("empties the court but keeps its size", () => {
    expect(emptyCourt({ ...defaultBoard, court: "full" })).toEqual({
      v: 1,
      court: "full",
      frames: [{ players: [], arrows: [] }],
    });
  });

  it("pulls everything onto a half court when switching from full", () => {
    const full: Board = {
      v: 1,
      court: "full",
      frames: [
        {
          players: [{ team: "a", at: [100, 380] }],
          ball: [100, 300],
          arrows: [{ kind: "run", pts: [[10, 150], [10, 350]] }],
        },
      ],
    };
    const half = setCourt(full, "half");
    expect(half.court).toBe("half");
    expect(frame(half).players[0]!.at).toEqual([100, 200]);
    expect(frame(half).ball).toEqual([100, 200]);
    expect(frame(half).arrows[0]!.pts).toEqual([[10, 150], [10, 200]]);
    expect(setCourt(half, "full").court).toBe("full");
  });
});
