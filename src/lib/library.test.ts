import { describe, expect, it } from "vitest";
import type { Board } from "./board/format";
import { breakableMeters, checkLibrary, checkMeters, itemPath, parseId, sameDrawing, stepsHaveText, type ItemRef } from "./library";

const board = (label = "LB", text = "One step."): Board => ({
  v: 2,
  court: "half",
  cones: [],
  frames: [
    {
      text,
      players: [{ team: "a", label, at: [48, 122] }, { team: "d", at: [48, 58] }],
      balls: [[48, 122]],
      arrows: [{ kind: "run", from: 0, pts: [[48, 122], [60, 100]] }],
    },
  ],
});

const entry = (id: string, ...related: string[]): ItemRef => ({
  id,
  type: "tactic",
  ages: [3, 4],
  board: board(),
  related: related.map((r) => ({ id: r })),
});

describe("parseId", () => {
  it("splits the language folder from the slug", () => {
    expect(parseId("en/6-0-defense-basics")).toEqual({ lang: "en", slug: "6-0-defense-basics" });
  });

  it("has no language for a file outside a folder", () => {
    expect(parseId("loose")).toEqual({ lang: "", slug: "loose" });
  });
});

describe("itemPath", () => {
  it("puts the slug right under its type, with a trailing slash", () => {
    expect(itemPath("tactic", "fast-break")).toBe("tactics/fast-break/");
    expect(itemPath("drill", "crossing-in-pairs")).toBe("drills/crossing-in-pairs/");
  });
});

describe("stepsHaveText", () => {
  it("wants a sentence in every step", () => {
    expect(stepsHaveText(board())).toBe(true);
    expect(stepsHaveText(board("LB", " "))).toBe(false);
    const two = board();
    two.frames.push({ ...two.frames[0]!, text: undefined });
    expect(stepsHaveText(two)).toBe(false);
  });
});

describe("breakableMeters", () => {
  it("finds any number and meter with a plain space, not with a no-break space", () => {
    expect(breakableMeters("de 7 meter, 16 meters en 9 meter")).toEqual(["7 meter", "16 meter"]);
    expect(breakableMeters("net buiten de 6 meter, voor de 9 meter")).toEqual(["6 meter"]);
  });
});

describe("checkMeters", () => {
  it("checks the frontmatter and the Markdown body", () => {
    expect(
      checkMeters([
        { id: "nl/a", data: { summary: "Net buiten de 6 meter." }, body: "Neem de 7 meter." },
        { id: "nl/b", data: { board: { frames: [{ text: "Vanaf 9 meter." }] } } },
        { id: "nl/c", data: { summary: "Op de 9 meter." }, body: "Bij de 7 meter." },
      ]),
    ).toEqual([
      '"nl/a": write "7 meter" with a no-break space (U+00A0)',
      '"nl/b": write "9 meter" with a no-break space (U+00A0)',
    ]);
  });
});

describe("sameDrawing", () => {
  it("ignores labels, sentences and key order", () => {
    const nl = board("LO", "Eén stap.");
    nl.frames[0]!.arrows = [{ pts: [[48, 122], [60, 100]], from: 0, kind: "run" }];
    expect(sameDrawing(board(), nl)).toBe(true);
  });

  it("sees a moved player or arrow", () => {
    const moved = board();
    moved.frames[0]!.players[1]!.at = [50, 58];
    expect(sameDrawing(board(), moved)).toBe(false);
  });
});

describe("checkLibrary", () => {
  const locales = ["en", "nl"];

  it("accepts related items in the same language", () => {
    expect(checkLibrary([entry("en/a", "en/b"), entry("en/b"), entry("nl/a", "nl/b")], locales)).toEqual([]);
  });

  it("rejects an unknown or missing language folder", () => {
    expect(checkLibrary([entry("fr/a"), entry("loose")], locales)).toHaveLength(2);
  });

  it("rejects a slug that isn't kebab-case or sits in a subfolder", () => {
    expect(checkLibrary([entry("en/Fast_Break"), entry("en/attack/a")], locales)).toHaveLength(2);
  });

  it("rejects a slug that is a category, whose page has the same URL", () => {
    const drill = { ...entry("en/defense"), type: "drill" as const };
    expect(checkLibrary([entry("en/attack"), entry("en/attack-drill"), drill], locales, ["attack", "defense"])).toEqual([
      '"en/attack": the file name is a category; tactics/attack/ is the category page',
      '"en/defense": the file name is a category; drills/defense/ is the category page',
    ]);
  });

  it("rejects age groups out of order or with a gap", () => {
    expect(checkLibrary([{ ...entry("en/a"), ages: [3, 5] }, { ...entry("en/b"), ages: [4, 3] }], locales)).toEqual([
      '"en/a": list the age groups in order, without a gap',
      '"en/b": list the age groups in order, without a gap',
    ]);
  });

  it("rejects an item related to itself", () => {
    expect(checkLibrary([entry("en/a", "en/a")], locales)).toEqual(['"en/a": lists itself as related']);
  });

  it("rejects a related item in another language", () => {
    expect(checkLibrary([entry("en/a", "nl/b"), entry("nl/b")], locales)).toEqual([
      '"en/a": related "nl/b" is in another language',
    ]);
  });

  it("rejects a translation of another type", () => {
    expect(checkLibrary([entry("en/a"), { ...entry("nl/a"), type: "drill" }], locales)).toEqual([
      '"nl/a": is a drill, but "en/a" is a tactic; a translation has the same type',
    ]);
  });

  it("rejects a translation that draws something else", () => {
    const other = board("LO");
    other.frames[0]!.arrows[0]!.pts[1] = [62, 100];
    expect(checkLibrary([entry("en/a"), { ...entry("nl/a"), board: other }], locales)).toEqual([
      '"nl/a": draws something else than "en/a"; a translation changes only labels and sentences',
    ]);
  });
});
