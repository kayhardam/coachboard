import { describe, expect, it } from "vitest";
import { isBoard } from "../lib/board/format";
import { drawing, drawings, type DrawingName } from "./howItWorks";

const names = Object.keys(drawings.nl) as DrawingName[];

describe("the drawings of How the board works", () => {
  it("has the same drawings in every language", () => {
    expect(Object.keys(drawings.en)).toEqual(names);
  });

  for (const lang of Object.keys(drawings)) {
    for (const name of names) {
      it(`${lang} ${name} reads as a board`, async () => {
        expect(isBoard(await drawing(lang, name))).toBe(true);
      });
    }

    it(`${lang} kinds has all six kinds of arrow`, async () => {
      const kinds = (await drawing(lang, "kinds")).frames[0]!.arrows.map((a) => a.kind);
      expect(new Set(kinds)).toEqual(new Set(["run", "pass", "bounce", "dribble", "shot", "block"]));
    });

    it(`${lang} arrows has a run and a pass`, async () => {
      const kinds = (await drawing(lang, "arrows")).frames[0]!.arrows.map((a) => a.kind);
      expect(kinds).toEqual(expect.arrayContaining(["run", "pass"]));
    });

    it(`${lang} shot has a shot`, async () => {
      const kinds = (await drawing(lang, "shot")).frames[0]!.arrows.map((a) => a.kind);
      expect(kinds).toContain("shot");
    });

    it(`${lang} labels has 7 and 11`, async () => {
      const labels = (await drawing(lang, "labels")).frames[0]!.players.map((p) => p.label);
      expect(labels).toEqual(expect.arrayContaining(["7", "11"]));
    });

    it(`${lang} steps has two steps, each with its sentence, and a title`, async () => {
      const board = await drawing(lang, "steps");
      expect(board.frames).toHaveLength(2);
      for (const frame of board.frames) expect(frame.text).toBeTruthy();
      expect(board.title).toBeTruthy();
    });
  }

  it("fails on a link that doesn't read", async () => {
    const saved = drawings.nl.lineup;
    (drawings.nl as Record<string, string>).lineup = "https://handballcoachboard.com/nl/board/#t=2.broken";
    try {
      await expect(drawing("nl", "lineup")).rejects.toThrow(/doesn't read/);
    } finally {
      (drawings.nl as Record<string, string>).lineup = saved;
    }
  });
});
