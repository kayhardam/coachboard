import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import { addArrow, addStep, ballsAfter, BESIDE, endOf, movePiece } from "./edit";
import type { Board, Frame, Pt } from "./format";
import { pointAt } from "./geometry";
import { moment } from "./play";

// The default lineup: 1 LB (30, 118), 2 CB (100, 130) with the ball (110, 122)
// beside him, 3 RB (170, 118), 5 P (100, 66), 8 a defender (48, 58).
const [LB, CB, RB, P, D] = [1, 2, 3, 5, 8];

const lineup = () => structuredClone(defaultBoard);
const places = (f: Frame) => f.players.map((p) => p.at);
const beside = (p: Pt): Pt => [p[0] + BESIDE[0], p[1] + BESIDE[1]];
/** Halfway along a pass: on the arrow, still half the way from where the ball lay beside the passer. */
const halfway = (board: Board, arrow: number): Pt => {
  const a = board.frames[0]!.arrows[arrow]!;
  const [x, y] = pointAt(a, 0.5);
  const ball = board.frames[0]!.balls[0]!;
  return [x + (ball[0] - a.pts[0]![0]) / 2, y + (ball[1] - a.pts[0]![1]) / 2];
};

/** Moment 0 is the step; moment 1 is where the next step starts (or, after the last, where its arrows take everyone). */
function expectEnds(board: Board, step: number) {
  const frame = board.frames[step]!;
  const start = moment(board, step, 0);
  expect(places(start)).toEqual(places(frame));
  expect(start.balls).toEqual(frame.balls);
  const next = board.frames[step + 1];
  const end = moment(board, step, 1);
  if (next) {
    expect(places(end)).toEqual(places(next));
    expect(end.balls).toEqual(next.balls);
  } else {
    expect(places(end)).toEqual(frame.players.map((_, i) => endOf(frame, i)));
    expect(end.balls).toEqual(ballsAfter(board, frame));
  }
}

describe("playing a step", () => {
  it("moves a runner along their run, with the ball they have", () => {
    const board = addStep(addArrow(lineup(), 0, "run", [0, 0], [75, 95], CB), 0);
    expectEnds(board, 0);
    const half = moment(board, 0, 0.5);
    expect(half.players[CB]!.at).toEqual([87.5, 112.5]);
    expect(half.balls).toEqual([[97.5, 104.5]]);
    expect(half.players[LB]!.at).toEqual([30, 118]);
  });

  it("pass and go: first the pass, then the run", () => {
    let board = addArrow(lineup(), 0, "pass", [0, 0], [170, 118], CB);
    board = addStep(addArrow(board, 0, "run", [0, 0], [100, 90], CB), 0);
    expectEnds(board, 0);
    // The first half is the pass: CB stands, the ball is on its way.
    const quarter = moment(board, 0, 0.25);
    expect(quarter.players[CB]!.at).toEqual([100, 130]);
    expect(quarter.balls[0]).toEqual(halfway(board, 0));
    // The second half is the run: the ball lies beside RB.
    const later = moment(board, 0, 0.75);
    expect(later.players[CB]!.at).toEqual([100, 110]);
    expect(later.balls).toEqual([beside([170, 118])]);
  });

  it("takes the ball along a bounce", () => {
    const board = addStep(addArrow(lineup(), 0, "bounce", [0, 0], [170, 118], CB), 0);
    expectEnds(board, 0);
    expect(moment(board, 0, 0.5).balls[0]).toEqual(halfway(board, 0));
    expect(moment(board, 0, 0.5).players[CB]!.at).toEqual([100, 130]);
  });

  it("takes the ball into the goal with a shot, in the last step", () => {
    const board = addArrow(lineup(), 0, "shot", [0, 0], [104, 0], CB);
    expectEnds(board, 0);
    expect(moment(board, 0, 1).balls).toEqual([[100, 0]]);
    expect(moment(board, 0, 0.5).balls[0]).toEqual(halfway(board, 0));
  });

  it("takes the ball along a dribble", () => {
    const board = addStep(addArrow(lineup(), 0, "dribble", [0, 0], [100, 90], CB), 0);
    expectEnds(board, 0);
    const half = moment(board, 0, 0.5);
    expect(half.players[CB]!.at).toEqual([100, 110]);
    expect(half.balls).toEqual([[110, 102]]);
  });

  it("moves a screener along the screen", () => {
    const board = addStep(addArrow(lineup(), 0, "block", [0, 0], [120, 80], P), 0);
    expectEnds(board, 0);
    expect(moment(board, 0, 0.5).players[P]!.at).toEqual([110, 73]);
  });

  it("moves a defender moved by hand in the next step in a straight line", () => {
    let board = addStep(lineup(), 0);
    board = movePiece(board, 1, { kind: "player", index: D }, [68, 78]);
    expectEnds(board, 0);
    expect(moment(board, 0, 0.5).players[D]!.at).toEqual([58, 68]);
  });

  it("leaves a ball nobody has where it lies, and moves it with a pass without a player", () => {
    const board = lineup();
    board.frames[0]!.balls.push([150, 180]);
    const still = addStep(board, 0);
    expectEnds(still, 0);
    expect(moment(still, 0, 0.5).balls[1]).toEqual([150, 180]);
    const passed = addStep(addArrow(board, 0, "pass", [150, 180], [150, 140]), 0);
    expectEnds(passed, 0);
    expect(moment(passed, 0, 0.5).balls[1]).toEqual([150, 160]);
  });

  it("keeps the step's arrows and sentence, and changes nothing in the board", () => {
    const board = addStep(addArrow(lineup(), 0, "run", [0, 0], [75, 95], CB), 0);
    const before = JSON.stringify(board);
    const half = moment(board, 0, 0.5);
    expect(half.arrows).toEqual(board.frames[0]!.arrows);
    expect(JSON.stringify(board)).toBe(before);
  });

  it("passes in a row: the second waits for the ball, which reaches the first receiver", () => {
    let board = addArrow(lineup(), 0, "pass", [0, 0], [170, 118], CB);
    board = addStep(addArrow(board, 0, "pass", [0, 0], [100, 66], RB), 0);
    expectEnds(board, 0);
    // Two turns: first CB to RB, then RB to P.
    expect(moment(board, 0, 0.25).balls[0]).toEqual(halfway(board, 0));
    expect(moment(board, 0, 0.5).balls).toEqual([beside([170, 118])]);
    const second = board.frames[0]!.arrows[1]!;
    const [x, y] = pointAt(second, 0.5);
    expect(moment(board, 0, 0.75).balls).toEqual([[x + BESIDE[0] / 2, y + BESIDE[1] / 2]]);
  });

  it("a receiver who dribbles away waits for the ball first", () => {
    let board = addArrow(lineup(), 0, "pass", [0, 0], [170, 118], CB);
    board = addStep(addArrow(board, 0, "dribble", [0, 0], [170, 80], RB), 0);
    expectEnds(board, 0);
    expect(moment(board, 0, 0.25).players[RB]!.at).toEqual([170, 118]);
    expect(moment(board, 0, 0.5).balls).toEqual([beside([170, 118])]);
    const late = moment(board, 0, 0.75);
    expect(late.players[RB]!.at).toEqual([170, 99]);
    expect(late.balls).toEqual([beside([170, 99])]);
  });

  it("dribble, then pass: the ball goes with the dribbler, then along the pass", () => {
    let board = addArrow(lineup(), 0, "dribble", [0, 0], [100, 100], CB);
    board = addStep(addArrow(board, 0, "pass", [0, 0], [170, 118], CB), 0);
    expectEnds(board, 0);
    expect(moment(board, 0, 0.25).players[CB]!.at).toEqual([100, 115]);
    expect(moment(board, 0, 0.25).balls).toEqual([[110, 107]]);
    expect(moment(board, 0, 0.5).balls).toEqual([[110, 92]]);
  });

  it("a run and a pass to its end happen at the same time", () => {
    let board = addArrow(lineup(), 0, "run", [0, 0], [170, 90], RB);
    board = addStep(addArrow(board, 0, "pass", [0, 0], [170, 90], CB), 0);
    expectEnds(board, 0);
    const half = moment(board, 0, 0.5);
    expect(half.players[RB]!.at).toEqual([170, 104]);
    expect(half.balls[0]).toEqual(halfway(board, 1));
  });
});
