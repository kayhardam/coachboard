import { describe, expect, it } from "vitest";
import { defaultBoard, defaultBoardFor, setup, SETUPS } from "./defaults";
import { isBoard } from "./format";
import { PLAYER_R } from "./geometry";

const labels = (locale: string) => defaultBoardFor(locale).frames[0]!.players.map((p) => p.label ?? "");

describe("defaultBoardFor", () => {
  it("labels the lineup in English by default", () => {
    expect(defaultBoardFor("en")).toEqual(defaultBoard);
    expect(defaultBoardFor("fr")).toEqual(defaultBoard);
  });

  it("labels the lineup in Dutch, on the same positions", () => {
    const nl = defaultBoardFor("nl");
    expect(isBoard(nl)).toBe(true);
    expect(labels("nl").filter(Boolean)).toEqual(["LH", "LO", "MO", "RO", "RH", "CL", "K"]);
    expect(nl.frames[0]!.players.map((p) => [p.team, p.at])).toEqual(
      defaultBoard.frames[0]!.players.map((p) => [p.team, p.at]),
    );
  });

  it("returns a fresh copy each time", () => {
    const board = defaultBoardFor("nl");
    board.frames[0]!.players[0]!.label = "X";
    expect(labels("nl")[0]).toBe("LH");
    expect(defaultBoard.frames[0]!.players[0]!.label).toBe("LW");
  });
});

describe("setup", () => {
  const lineup = defaultBoardFor("nl");

  it("makes a valid board for every starting lineup, and leaves the lineup alone", () => {
    for (const id of SETUPS) expect(isBoard(setup(id, lineup)), id).toBe(true);
    expect(lineup).toEqual(defaultBoardFor("nl"));
    expect(setup("6-0", lineup)).toEqual(lineup);
  });

  it("moves the defence and the pivot against a 5-1 or a 3-2-1, with nobody on top of another", () => {
    for (const id of ["5-1", "3-2-1"] as const) {
      const players = setup(id, lineup).frames[0]!.players;
      expect(players.map((p) => p.label)).toEqual(lineup.frames[0]!.players.map((p) => p.label));
      // The pivot just in front of the middle defender, 20 dm apart, both in the middle.
      expect(players.find((p) => p.label === "CL")!.at).toEqual([100, 82]);
      expect(players).toContainEqual({ team: "d", at: [100, 62] });
      expect(players.filter((p) => p.team === "a" && p.label !== "CL")).toEqual(
        lineup.frames[0]!.players.filter((p) => p.team === "a" && p.label !== "CL"),
      );
      for (const [i, p] of players.entries()) {
        for (const q of players.slice(i + 1)) {
          expect(Math.hypot(p.at[0] - q.at[0], p.at[1] - q.at[1]), `${id}: ${p.at} and ${q.at}`).toBeGreaterThan(PLAYER_R);
        }
      }
    }
  });

  it("sets out lines of three without labels, a cone in front of each, the keeper and one ball", () => {
    for (const [id, lines] of [["2-lines", 2], ["3-lines", 3]] as const) {
      const board = setup(id, lineup);
      const players = board.frames[0]!.players;
      expect(players.filter((p) => p.team === "a" && p.label === undefined)).toHaveLength(3 * lines);
      expect(players.filter((p) => p.team === "d")).toEqual([{ team: "d", label: "K", at: [100, 8] }]);
      expect(board.cones).toHaveLength(lines);
      expect(board.frames[0]!.balls).toHaveLength(1);
    }
  });
});
