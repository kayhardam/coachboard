import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import type { Frame } from "./format";
import { HIT_R } from "./geometry";
import { nearestPiece, reach } from "./hit";

describe("reach", () => {
  it("is the drawn touch area when that is at least 44 px", () => {
    expect(reach(1.75)).toBe(HIT_R); // half court, iPhone 15: 45 px
  });

  it("grows to 22 px on screen when the court is small", () => {
    expect(reach(1.1)).toBeCloseTo(20); // full court, iPhone 15
    expect(reach(1.1) * 1.1 * 2).toBeCloseTo(44);
  });
});

describe("nearestPiece", () => {
  const frame: Frame = {
    players: [
      { team: "a", at: [100, 100] },
      { team: "d", at: [120, 100] },
      { team: "d", at: [150, 100] },
    ],
    ball: [100, 130],
    arrows: [],
  };

  it("finds nothing out of reach", () => {
    expect(nearestPiece(frame, [100, 160], 20)).toBeNull();
  });

  it("picks the nearest where touch areas overlap", () => {
    expect(nearestPiece(frame, [108, 100], 20)).toEqual({ kind: "player", index: 0 });
    expect(nearestPiece(frame, [112, 100], 20)).toEqual({ kind: "player", index: 1 });
    expect(nearestPiece(frame, [100, 118], 20)).toEqual({ kind: "ball", index: 0 });
  });

  it("gives a tie to the piece drawn on top", () => {
    expect(nearestPiece(frame, [110, 100], 20)).toEqual({ kind: "player", index: 1 });
    expect(nearestPiece(frame, [100, 115], 20)).toEqual({ kind: "ball", index: 0 });
  });

  it("reaches exactly as far as the radius", () => {
    expect(nearestPiece(frame, [150, 120], 20)).toEqual({ kind: "player", index: 2 });
    expect(nearestPiece(frame, [150, 120.5], 20)).toBeNull();
  });

  it("gives the pivot in the default lineup a tap on its edge beside a defender", () => {
    const lineup = defaultBoard.frames[0]!;
    const pivot = lineup.players.findIndex((p) => p.label === "P");
    expect(lineup.players[pivot]!.at).toEqual([100, 66]);
    expect(lineup.players).toContainEqual({ team: "d", at: [80, 66] });
    // [91, 66] is PLAYER_R from the pivot and 11 dm from the defender.
    for (const radius of [reach(1.75), reach(1.1)]) {
      expect(nearestPiece(lineup, [91, 66], radius)).toEqual({ kind: "player", index: pivot });
    }
  });
});
