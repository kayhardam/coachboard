import { describe, expect, it } from "vitest";
import play from "./fixtures/v2-play.json";
import drill from "./fixtures/v2-drill.json";
import { defaultBoard } from "./defaults";
import type { Board, Frame } from "./format";
import { followable, followArrows, legendOf, moveFor, MOVE, moves, READ, STILL, stillFor, TURN } from "./viewer";

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

describe("moves", () => {
  it("finds the move in every step of the crossing", () => {
    expect(crossing.frames.map((_, i) => moves(crossing, i))).toEqual([true, true, true, true]);
  });

  it("finds nothing in a step without arrows, before another step or at the end", () => {
    const lineup = defaultBoard;
    expect(moves(lineup, 0)).toBe(false);
    const still = { ...crossing.frames[1]!, arrows: [] };
    const two: Board = { ...crossing, frames: [still, { ...still, text: "Next." }] };
    expect(moves(two, 0)).toBe(false);
    expect(moves(two, 1)).toBe(false);
  });

  it("finds a player the next step has somewhere else, moved there by hand", () => {
    const first = { ...crossing.frames[1]!, arrows: [] };
    const moved = { ...first, players: first.players.map((p, i) => (i ? p : { ...p, at: [p.at[0] + 10, p.at[1]] as [number, number] })) };
    expect(moves({ ...crossing, frames: [first, moved] }, 0)).toBe(true);
  });
});

describe("legendOf", () => {
  it("lists the kinds of arrow on the board in every step, in a fixed order", () => {
    expect(legendOf(crossing).slice(2)).toEqual(["run", "pass", "dribble", "shot", "block"]);
  });

  it("starts with attack and defense, each only when the board has players of that team", () => {
    expect(legendOf(crossing).slice(0, 2)).toEqual(["attack", "defense"]);
    expect(legendOf(defaultBoard)).toEqual(["attack", "defense"]);
    const frame = defaultBoard.frames[0]!;
    const only = (team: string): Board => ({ ...defaultBoard, frames: [{ ...frame, players: frame.players.filter((p) => p.team === team) }] });
    expect(legendOf(only("a"))).toEqual(["attack"]);
    expect(legendOf(only("d"))).toEqual(["defense"]);
  });

  it("adds a passer and a cone when the board has them, after the teams", () => {
    expect(legendOf(pairs).slice(0, 4)).toEqual(["attack", "defense", "passer", "cone"]);
  });

  it("is empty for a board without players, arrows or cones", () => {
    expect(legendOf({ v: 2, court: "half", cones: [], frames: [empty] })).toEqual([]);
  });
});

describe("followable", () => {
  it("lists the players with a label, by index: the crossing's six attackers and its keeper", () => {
    expect(followable(crossing)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("lists only the keeper in the drill, whose lines have no labels", () => {
    expect(followable(pairs)).toEqual([8]);
  });

  it("lists nobody on a board without labels", () => {
    const unlabelled = { ...crossing, frames: crossing.frames.map((f) => ({ ...f, players: f.players.map(({ label: _, ...p }) => p) })) };
    expect(followable(unlabelled)).toEqual([]);
  });
});

describe("followArrows", () => {
  const LO = 1;
  const MO = 2;

  it("gives LO in the crossing their run, the pass they get, then their run and shot", () => {
    expect(crossing.frames.map((f) => followArrows(f, LO))).toEqual([[1], [0, 1], [1, 2], []]);
  });

  it("gives MO their dribble, their pass to LO and their run back, never the pass they don't get", () => {
    expect(crossing.frames.map((f) => followArrows(f, MO))).toEqual([[0], [1], [], [0]]);
  });

  it("gives a player who neither moves nor gets the ball nothing: the keeper", () => {
    expect(crossing.frames.map((f) => followArrows(f, 6))).toEqual([[], [], [], []]);
  });

  it("gives a pass to whoever stands at its end by then, as ballTrips() does: the passers in the drill", () => {
    const [first, second] = pairs.frames;
    expect(followArrows(first!, 6)).toEqual([0]);
    expect(followArrows(first!, 7)).toEqual([2]);
    // A bounce drawn before the run that takes a player to its end reaches nobody (ballTrips()).
    expect(followArrows(second!, 0)).toEqual([2, 4]);
    expect(followArrows(second!, 6)).toEqual([0]);
  });
});
