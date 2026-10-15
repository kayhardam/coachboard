import { describe, expect, it } from "vitest";
import play from "./fixtures/v2-play.json";
import drill from "./fixtures/v2-drill.json";
import { defaultBoard } from "./defaults";
import type { Board, Frame } from "./format";
import { legendOf, moveFor, MOVE, READ, STILL, stillFor, TURN } from "./viewer";

const empty: Frame = { players: [], balls: [], arrows: [] };
// The fixtures as boards: JSON imports type their strings as string, not as a kind.
const crossing = play.board as unknown as Board;
const pairs = drill.board as unknown as Board;

describe("stillFor", () => {
  it("shows a step without a sentence, or with a short one, for the editor's 1.2 s", () => {
    expect(stillFor(empty)).toBe(STILL);
    expect(stillFor({ ...empty, text: "Go." })).toBe(STILL);
  });

  it("gives a longer sentence time to read it", () => {
    const text = "x".repeat(100);
    expect(stillFor({ ...empty, text })).toBe(100 * READ);
  });
});

describe("moveFor", () => {
  it("takes the editor's second for one turn, or none", () => {
    expect(moveFor(empty)).toBe(MOVE);
    expect(moveFor(crossing.frames[0]!)).toBe(MOVE);
  });

  it("gives each turn its time: the shot after the run in step 3 of the crossing", () => {
    expect(moveFor(crossing.frames[2]!)).toBe(2 * TURN);
  });
});

describe("legendOf", () => {
  it("lists the kinds of arrow on the board in every step, in a fixed order", () => {
    expect(legendOf(crossing)).toEqual(["run", "pass", "dribble", "shot", "block"]);
  });

  it("adds a passer and a cone when the board has them", () => {
    expect(legendOf(pairs).slice(0, 2)).toEqual(["passer", "cone"]);
  });

  it("is empty for a board without arrows, passers or cones", () => {
    expect(legendOf(defaultBoard)).toEqual([]);
  });
});
