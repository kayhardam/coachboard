import { describe, expect, it } from "vitest";
import { defaultBoard } from "./defaults";
import type { Frame } from "./format";
import { HIT_R } from "./geometry";
import { holder, nearestPiece, reach } from "./hit";

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
    balls: [[100, 130]],
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

describe("nearestPiece with cones", () => {
  const frame: Frame = { players: [{ team: "a", at: [100, 100] }], balls: [], arrows: [] };

  it("finds a cone, and gives a tie to the player drawn over it", () => {
    expect(nearestPiece(frame, [140, 100], 20, [[150, 100]])).toEqual({ kind: "cone", index: 0 });
    expect(nearestPiece(frame, [100, 100], 20, [[100, 100]])).toEqual({ kind: "player", index: 0 });
  });
});

describe("holder", () => {
  const frame: Frame = {
    players: [
      { team: "a", at: [100, 100] },
      { team: "a", at: [130, 100] },
    ],
    balls: [[112, 100]],
    arrows: [],
  };

  it("is the player nearest the ball", () => {
    expect(holder(frame, [112, 100], HIT_R)).toBe(0);
    expect(holder(frame, [118, 100], HIT_R)).toBe(1);
  });

  it("reaches twice as far as a tap, so further than a tap ever does", () => {
    expect(holder(frame, [100, 100 + 2 * HIT_R], HIT_R)).toBe(0);
    expect(holder(frame, [100, 101 + 2 * HIT_R], HIT_R)).toBeUndefined();
    // A phone in landscape on the full court: a tap reaches about 27 dm.
    expect(holder(frame, [100, 150], 27)).toBe(0);
  });
});
