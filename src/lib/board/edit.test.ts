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
  addBall,
  addCone,
  addStep,
  ballsAfter,
  hasBall,
  removeSelected,
  removeStep,
  resetLineup,
  setCourt,
  setKind,
  setTeam,
  setText,
  setTitle,
} from "./edit";
import { isBoard, MAX_BALLS, MAX_CONES, MAX_PLAYERS, MAX_STEPS, MAX_TEXT, MAX_TITLE, type Board } from "./format";

const empty: Board = { v: 2, court: "half", cones: [], frames: [{ players: [], balls: [], arrows: [] }] };
const frame = (b: Board) => b.frames[0]!;
const withArrow = (pts: [number, number][]): Board => ({
  ...empty,
  frames: [{ players: [], balls: [], arrows: [{ kind: "run", pts }] }],
});
/** Two players; the first runs from where they stand, then passes. */
const owned = (): Board => {
  let board = addPlayer(addPlayer(empty, "a", [20, 100]), "a", [80, 100]);
  board = addArrow(board, 0, "run", [0, 0], [20, 60], 0);
  return addArrow(board, 0, "pass", [0, 0], [80, 100], 0);
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

  it("adds and moves a ball", () => {
    const placed = addBall(empty, 0, [10.4, 9.6]);
    expect(frame(placed).balls).toEqual([[10, 10]]);
    expect(frame(movePiece(placed, 0, { kind: "ball", index: 0 }, [20, 30])).balls).toEqual([[20, 30]]);
  });

  it("adds a ball next to the others, up to the limit, and moves or removes one alone", () => {
    const two: Board = { ...empty, frames: [{ players: [], balls: [[10, 10], [50, 50]], arrows: [] }] };
    expect(frame(addBall(two, 0, [30, 30])).balls).toEqual([[10, 10], [50, 50], [30, 30]]);
    expect(frame(movePiece(two, 0, { kind: "ball", index: 1 }, [60, 70])).balls).toEqual([[10, 10], [60, 70]]);
    expect(frame(removeSelected(two, 0, { kind: "ball", index: 0 })).balls).toEqual([[50, 50]]);
    let board = empty;
    for (let i = 0; i < MAX_BALLS + 2; i++) board = addBall(board, 0, [i * 10, 10]);
    expect(frame(board).balls).toHaveLength(MAX_BALLS);
    expect(isBoard(board)).toBe(true);
  });

  it("adds, moves and removes cones on the court, up to the limit", () => {
    const one = addCone(empty, [-5, 250.4]);
    expect(one.cones).toEqual([[0, 200]]);
    expect(empty.cones).toEqual([]);
    const two = addCone(one, [50, 50]);
    expect(movePiece(two, 0, { kind: "cone", index: 1 }, [60.6, 70]).cones).toEqual([[0, 200], [61, 70]]);
    expect(removeSelected(two, 0, { kind: "cone", index: 0 }).cones).toEqual([[50, 50]]);
    let board = empty;
    for (let i = 0; i < MAX_CONES + 2; i++) board = addCone(board, [i * 10, 10]);
    expect(board.cones).toHaveLength(MAX_CONES);
    expect(isBoard(board)).toBe(true);
  });

  it("adds and removes a player in every step, so the lineup stays one", () => {
    const board = twoSteps(addPlayer(empty, "a", [20, 20]));
    const added = addPlayer(board, "d", [40, 40]);
    expect(added.frames.map((f) => f.players.length)).toEqual([2, 2]);
    expect(isBoard(added)).toBe(true);
    const removed = removeSelected(added, 0, { kind: "player", index: 0 });
    expect(removed.frames.map((f) => f.players.map((p) => p.team))).toEqual([["d"], ["d"]]);
    expect(removed.frames[1]!.text).toBe("Step 2.");
  });

  it("moves a player onto the court", () => {
    const next = movePiece(defaultBoard, 0, { kind: "player", index: 0 }, [-20, 300]);
    expect(frame(next).players[0]!.at).toEqual([0, 200]);
  });

  it("removes the selected player, arrow or ball", () => {
    const board = withArrow([[0, 0], [50, 0]]);
    expect(frame(removeSelected(defaultBoard, 0, { kind: "player", index: 0 })).players).toHaveLength(12);
    expect(frame(removeSelected(board, 0, { kind: "arrow", index: 0 })).arrows).toHaveLength(0);
    expect(frame(removeSelected(defaultBoard, 0, { kind: "ball", index: 0 })).balls).toEqual([]);
  });
});

describe("arrows", () => {
  it("adds an arrow of at least 1 m", () => {
    expect(frame(addArrow(empty, 0, "pass", [10, 10], [40, 50])).arrows).toEqual([
      { kind: "pass", pts: [[10, 10], [40, 50]] },
    ]);
    expect(addArrow(empty, 0, "pass", [10, 10], [15, 15])).toBe(empty);
  });

  it("bends through the middle handle and snaps back to straight near the line", () => {
    const board = withArrow([[0, 0], [100, 0]]);
    const bent = moveHandle(board, 0, 0, 1, [50, 30]);
    expect(frame(bent).arrows[0]!.pts).toEqual([[0, 0], [50, 30], [100, 0]]);
    expect(frame(moveHandle(bent, 0, 0, 1, [60, 3])).arrows[0]!.pts).toEqual([[0, 0], [100, 0]]);
  });

  it("moves an end handle and keeps the bend", () => {
    const bent = moveHandle(withArrow([[0, 0], [100, 0]]), 0, 0, 1, [50, 30]);
    expect(frame(moveHandle(bent, 0, 0, 2, [120, 20])).arrows[0]!.pts).toEqual([
      [0, 0],
      [50, 30],
      [120, 20],
    ]);
  });

  it("shifts a whole arrow but not off the court", () => {
    const board = withArrow([[10, 10], [50, 20]]);
    expect(frame(moveArrow(board, 0, 0, [5, 5])).arrows[0]!.pts).toEqual([[15, 15], [55, 25]]);
    expect(frame(moveArrow(board, 0, 0, [-30, -30])).arrows[0]!.pts).toEqual([[0, 0], [40, 10]]);
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
    expect(frame(addArrow(board, 0, "run", [25, 105], [20, 60], 0)).arrows[0]!.pts[0]).toEqual([20, 100]);
  });

  it("follow their player, and the arrows after them follow too", () => {
    const moved = movePiece(owned(), 0, { kind: "player", index: 0 }, [30, 120]);
    expect(frame(moved).arrows.map((a) => a.pts)).toEqual([
      [[30, 120], [20, 60]],
      [[20, 60], [80, 100]],
    ]);
    const longer = moveHandle(owned(), 0, 0, 2, [20, 40]);
    expect(frame(longer).arrows[1]!.pts[0]).toEqual([20, 40]);
  });

  it("let go of the player when the arrow or its start is dragged", () => {
    const shifted = frame(moveArrow(owned(), 0, 0, [5, 0])).arrows[0]!;
    expect(shifted).toEqual({ kind: "run", pts: [[25, 100], [25, 60]] });
    const started = frame(moveHandle(owned(), 0, 0, 0, [10, 110])).arrows[0]!;
    expect(started).toEqual({ kind: "run", pts: [[10, 110], [20, 60]] });
  });

  it("can be given to a player", () => {
    const free = addArrow(addPlayer(empty, "a", [20, 100]), 0, "run", [10, 10], [60, 60]);
    expect(frame(attachArrow(free, 0, 0, 0)).arrows[0]).toEqual({ kind: "run", from: 0, pts: [[20, 100], [60, 60]] });
    expect(attachArrow(free, 0, 0, 5)).toBe(free);
  });

  it("go with their player, and the others keep theirs", () => {
    const board = addArrow(owned(), 0, "run", [0, 0], [80, 40], 1);
    const next = frame(removeSelected(board, 0, { kind: "player", index: 0 }));
    expect(next.arrows).toEqual([{ kind: "run", from: 0, pts: [[80, 100], [80, 40]] }]);
  });
});

describe("shots", () => {
  const shot = (): Board => {
    const board = addPlayer(empty, "a", [60, 100]);
    return { ...board, frames: [{ ...frame(board), arrows: [{ kind: "shot", from: 0, pts: [[60, 100], [90, 0]] }] }] };
  };

  it("end at a spot in the goal, the one nearest where the end goes", () => {
    expect(frame(moveHandle(shot(), 0, 0, 2, [104, 30])).arrows[0]!.pts[1]).toEqual([100, 0]);
    expect(frame(moveHandle(shot(), 0, 0, 2, [180, 30])).arrows[0]!.pts[1]).toEqual([110, 0]);
  });

  it("stay with their shooter", () => {
    expect(moveArrow(shot(), 0, 0, [10, 10])).toEqual(shot());
    expect(moveHandle(shot(), 0, 0, 0, [10, 10])).toEqual(shot());
    expect(moveHandle(shot(), 0, 0, 1, [70, 50])).toEqual(shot());
  });

  it("aim at the nearest goal on a full court", () => {
    const far = movePiece(setCourt(shot(), "full"), 0, { kind: "player", index: 0 }, [60, 300]);
    expect(frame(far).arrows[0]!.pts).toEqual([[60, 300], [90, 400]]);
  });
});

describe("whole board", () => {
  it("clears arrows and balls but keeps the players", () => {
    const board = addArrow(defaultBoard, 0, "run", [0, 0], [50, 50]);
    const next = clearArrows(board, 0);
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

describe("setKind", () => {
  it("changes the kind of an arrow in the first step only", () => {
    const board = twoSteps(owned());
    board.frames[1]!.arrows = [{ kind: "pass", from: 0, pts: [[20, 100], [80, 100]] }];
    const next = setKind(board, 0, 1, "bounce");
    expect(next.frames[0]!.arrows.map((a) => a.kind)).toEqual(["run", "bounce"]);
    expect(next.frames[1]!.arrows.map((a) => a.kind)).toEqual(["pass"]);
    expect(isBoard(next)).toBe(true);
  });

  it("moves the start of the player's next arrow when their arrow moves them, or no longer does", () => {
    const passed = setKind(owned(), 0, 0, "pass");
    expect(frame(passed).arrows[1]!.pts[0]).toEqual([20, 100]);
    expect(isBoard(passed)).toBe(true);
    const screened = setKind(passed, 0, 0, "block");
    expect(frame(screened).arrows[1]!.pts[0]).toEqual([20, 60]);
    expect(isBoard(screened)).toBe(true);
  });

  it("makes a straight shot into the goal, only for an arrow of a player", () => {
    let board = addArrow(owned(), 0, "run", [0, 0], [100, 40], 1);
    board = moveHandle(board, 0, 2, 1, [130, 70]);
    expect(frame(board).arrows[2]!.pts).toHaveLength(3);
    const shot = setKind(board, 0, 2, "shot");
    expect(frame(shot).arrows[2]).toEqual({ kind: "shot", from: 1, pts: [[80, 100], [100, 0]] });
    expect(isBoard(shot)).toBe(true);
    const loose = withArrow([[10, 10], [60, 60]]);
    expect(setKind(loose, 0, 0, "shot")).toBe(loose);
  });

  it("returns the same board for the same kind or a missing arrow", () => {
    const board = owned();
    expect(setKind(board, 0, 0, "run")).toBe(board);
    expect(setKind(board, 0, 5, "pass")).toBe(board);
  });
});

describe("setTeam", () => {
  it("puts a player in another team in every step; a passer loses their label", () => {
    const board = twoSteps({ ...owned(), frames: [{ ...frame(owned()), players: [{ team: "a", label: "LB", at: [20, 100] }, { team: "a", at: [80, 100] }] }] });
    expect(isBoard(board)).toBe(true);
    const defender = setTeam(board, 0, "d");
    expect(defender.frames.map((f) => f.players[0])).toEqual([
      { team: "d", label: "LB", at: [20, 100] },
      { team: "d", label: "LB", at: [20, 100] },
    ]);
    const passer = setTeam(board, 0, "p");
    expect(passer.frames.map((f) => f.players[0])).toEqual([
      { team: "p", at: [20, 100] },
      { team: "p", at: [20, 100] },
    ]);
    expect(frame(passer).arrows).toEqual(frame(board).arrows);
    expect(isBoard(defender) && isBoard(passer)).toBe(true);
  });

  it("returns the same board for the same team", () => {
    const board = owned();
    expect(setTeam(board, 0, "a")).toBe(board);
  });
});

describe("hasBall", () => {
  /** Three players in a row: 0 at the start has the ball, 1 and 2 wait. */
  const three = (): Board => {
    let board = empty;
    for (const x of [20, 100, 180]) board = addPlayer(board, "a", [x, 100]);
    return board;
  };
  const has = (b: Board) => [0, 1, 2].map((i) => hasBall(frame(b), i));

  it("follows a chain of passes in drawing order; who has the ball at the start has none", () => {
    let board = three();
    expect(has(board)).toEqual([false, false, false]);
    board = addArrow(board, 0, "pass", [0, 0], [100, 100], 0);
    expect(has(board)).toEqual([false, true, false]);
    board = addArrow(board, 0, "bounce", [0, 0], [180, 100], 1);
    expect(has(board)).toEqual([false, false, true]);
  });

  it("gives the ball to a player where their run ends by then, and takes it with a pass", () => {
    let board = addArrow(three(), 0, "run", [0, 0], [100, 40], 1);
    board = addArrow(board, 0, "pass", [0, 0], [100, 40], 0);
    expect(has(board)).toEqual([false, true, false]);
    // Pass and go: after their pass, a player has no ball.
    board = addArrow(board, 0, "pass", [0, 0], [180, 100], 1);
    expect(has(board)).toEqual([false, false, true]);
  });

  it("counts a pass without a player, and not a pass that ends elsewhere", () => {
    expect(has(addArrow(three(), 0, "pass", [100, 180], [180, 100]))).toEqual([false, false, true]);
    expect(has(addArrow(three(), 0, "pass", [0, 0], [140, 60], 0))).toEqual([false, false, false]);
  });

  it("takes the ball with a shot", () => {
    let board = addArrow(three(), 0, "pass", [0, 0], [100, 100], 0);
    board = addArrow(board, 0, "shot", [0, 0], [100, 0], 1);
    expect(has(board)).toEqual([false, false, false]);
  });
});

describe("steps", () => {
  // The default lineup: 1 LB at (30, 118), 2 CB at (100, 130) with the ball at (110, 122).
  const [LB, CB] = [1, 2];
  /** CB runs diagonally left with the ball, then New step. */
  const crossing = () => addStep(addArrow(structuredClone(defaultBoard), 0, "run", [0, 0], [75, 95], CB), 0);

  it("puts everyone where they end the step, without arrows or a sentence, and leaves the step alone", () => {
    const board = crossing();
    expect(board.frames).toHaveLength(2);
    const [one, two] = board.frames;
    expect(two!.players[CB]!.at).toEqual([75, 95]);
    expect(two!.players[LB]!.at).toEqual(one!.players[LB]!.at);
    expect(two!.arrows).toEqual([]);
    expect(two!.text).toBeUndefined();
    expect(one!.arrows).toHaveLength(1);
    expect(isBoard(board)).toBe(true);
  });

  it("takes the ball along with whoever has it, and to whoever receives a pass", () => {
    let board = crossing();
    // The ball goes with CB, as it lay beside him: (10, -8).
    expect(board.frames[1]!.balls).toEqual([[85, 87]]);
    board = addArrow(board, 1, "run", [0, 0], [115, 105], LB);
    board = addStep(board, 1);
    board = addArrow(board, 2, "pass", [0, 0], [115, 105], CB);
    expect(ballsAfter(board, board.frames[2]!)).toEqual([[125, 97]]);
    board = addStep(board, 2);
    expect(board.frames[3]!.balls).toEqual([[125, 97]]);
  });

  it("leaves a shot's ball in the goal and a loose pass's ball where it went, and a ball nobody has where it lies", () => {
    const shot = addArrow(structuredClone(defaultBoard), 0, "shot", [0, 0], [104, 0], CB);
    expect(ballsAfter(shot, shot.frames[0]!)).toEqual([[100, 0]]);
    const loose: Board = { ...empty, frames: [{ players: [{ team: "a", at: [20, 20] }], balls: [[150, 150]], arrows: [] }] };
    expect(ballsAfter(loose, loose.frames[0]!)).toEqual([[150, 150]]);
    const passed = addArrow(loose, 0, "pass", [150, 150], [150, 100]);
    expect(ballsAfter(passed, passed.frames[0]!)).toEqual([[150, 100]]);
  });

  it("keeps a ball beside its player on the court", () => {
    const board: Board = { ...empty, frames: [{ players: [{ team: "a", at: [185, 10] }], balls: [[199, 2]], arrows: [] }] };
    const moved = addArrow(board, 0, "run", [0, 0], [195, 5], 0);
    expect(ballsAfter(moved, moved.frames[0]!)).toEqual([[200, 0]]);
  });

  it("inserts the new step after the one it comes from, up to MAX_STEPS", () => {
    let board = crossing();
    board = setText(board, 1, "Two.");
    board = addStep(board, 0);
    expect(board.frames.map((f) => f.text)).toEqual([undefined, undefined, "Two."]);
    while (board.frames.length < MAX_STEPS) board = addStep(board, 0);
    expect(addStep(board, 0)).toBe(board);
  });

  it("edits only the step it is given", () => {
    const board = crossing();
    const moved = movePiece(board, 1, { kind: "player", index: LB }, [40, 140]);
    expect(moved.frames[1]!.players[LB]!.at).toEqual([40, 140]);
    expect(moved.frames[0]!.players[LB]!.at).toEqual([30, 118]);
    expect(clearArrows(board, 1).frames[0]!.arrows).toHaveLength(1);
  });

  it("lets the later steps follow a change, step by step", () => {
    let board = addStep(crossing(), 1);
    // CB's run in step 1 now ends elsewhere: in steps 2 and 3 he stands there, with the ball.
    board = moveHandle(board, 0, 0, 2, [60, 90]);
    expect(board.frames[1]!.players[CB]!.at).toEqual([60, 90]);
    expect(board.frames[2]!.players[CB]!.at).toEqual([60, 90]);
    expect(board.frames[1]!.balls).toEqual([[70, 82]]);
    // Without the run, he stays where he started.
    board = removeSelected(board, 0, { kind: "arrow", index: 0 });
    expect(board.frames[2]!.players[CB]!.at).toEqual([100, 130]);
    expect(isBoard(board)).toBe(true);
  });

  it("keeps the place of a player moved by hand in a later step (decision D5)", () => {
    let board = crossing();
    board = movePiece(board, 1, { kind: "player", index: CB }, [70, 110]);
    board = movePiece(board, 1, { kind: "ball", index: 0 }, [80, 100]);
    board = moveHandle(board, 0, 0, 2, [60, 90]);
    expect(board.frames[1]!.players[CB]!.at).toEqual([70, 110]);
    expect(board.frames[1]!.balls).toEqual([[80, 100]]);
  });

  it("removes a step, but keeps the last one", () => {
    const board = crossing();
    expect(removeStep(board, 1).frames).toEqual([board.frames[0]]);
    expect(removeStep(removeStep(board, 1), 0).frames).toHaveLength(1);
  });

  it("keeps a sentence per step as one trimmed line of at most MAX_TEXT characters", () => {
    const board = crossing();
    const said = setText(board, 1, "  LO kruist\nachter MO langs.  ");
    expect(said.frames[1]!.text).toBe("LO kruist achter MO langs.");
    expect(said.frames[0]!.text).toBeUndefined();
    expect(setText(said, 1, "LO kruist achter MO langs.")).toBe(said);
    expect(setText(said, 1, "  ").frames[1]!.text).toBeUndefined();
    expect(setText(board, 0, "x".repeat(MAX_TEXT + 5)).frames[0]!.text).toHaveLength(MAX_TEXT);
    expect(isBoard(said)).toBe(true);
  });
});
