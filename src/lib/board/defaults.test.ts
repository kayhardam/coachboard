import { describe, expect, it } from "vitest";
import { defaultBoard, defaultBoardFor } from "./defaults";
import { isBoard } from "./format";

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
