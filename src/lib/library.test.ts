import { describe, expect, it } from "vitest";
import { settle, type Board, type Pt } from "./board/format";
import { breakableMeters, checkBalls, checkLibrary, checkMeters, drillSections, itemPath, parseId, sameDrawing, stepsHaveText, type ItemRef } from "./library";

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

describe("drillSections", () => {
  it("lists rules, coaching points, mistakes, easier and harder in that order, leaving out an empty list", () => {
    const drill = { harder: ["Wider."], rules: ["A point."], coachingPoints: [], mistakes: ["Too late."], easier: ["Narrower."] };
    expect(drillSections(drill)).toEqual([
      { key: "rules", points: ["A point."] },
      { key: "mistakes", points: ["Too late."] },
      { key: "easier", points: ["Narrower."] },
      { key: "harder", points: ["Wider."] },
    ]);
    expect(drillSections({ rules: [], coachingPoints: [], mistakes: [], easier: [], harder: [] })).toEqual([]);
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

  it("checks a drill's goal, setup and lists too", () => {
    const nb = (text: string) => text.replace(" meter", "\u00a0meter");
    const fields = {
      goal: "Uitstappen op 9 meter.",
      organization: { players: "Drie.", equipment: "Twee pionnen.", space: "Een baan van 6 meter breed." },
      rules: ["Na 4 meter wissel je."],
      mistakes: ["Te laat op 6 meter."],
      easier: ["Een baan van 4 meter."],
    };
    expect(checkMeters([{ id: "nl/d", data: fields }])).toEqual(
      ["9 meter", "6 meter", "4 meter", "6 meter", "4 meter"].map((m) => `"nl/d": write "${m}" with a no-break space (U+00A0)`),
    );
    const fixed = JSON.parse(JSON.stringify(fields), (_, v) => (typeof v === "string" ? nb(v) : v));
    expect(checkMeters([{ id: "nl/d", data: fixed }])).toEqual([]);
  });

describe("checkBalls", () => {
  /** One step: a back with the ball beside them, a receiver, a goalkeeper, and `arrows`. */
  const step = (arrows: Board["frames"][number]["arrows"], balls: Pt[] = [[58, 114]]): Board["frames"][number] => ({
    players: [
      { team: "a", label: "LB", at: [48, 122] },
      { team: "a", label: "CB", at: [100, 132] },
      { team: "d", label: "GK", at: [100, 10] },
    ],
    balls,
    arrows,
  });
  const drawn = (...frames: Board["frames"]): Board => settle({ v: 2, court: "half", cones: [], frames });

  it("accepts a pass, a dribble and a shot by whoever has the ball, also after receiving it", () => {
    expect(
      checkBalls(
        drawn(
          step([
            { kind: "dribble", from: 0, pts: [[48, 122], [60, 110]] },
            { kind: "pass", from: 0, pts: [[60, 110], [100, 132]] },
            { kind: "dribble", from: 1, pts: [[100, 132], [100, 110]] },
            { kind: "shot", from: 1, pts: [[100, 110], [90, 0]] },
          ]),
        ),
      ),
    ).toEqual([]);
  });

  it("accepts a run with the ball: it goes along", () => {
    expect(checkBalls(drawn(step([{ kind: "run", from: 0, pts: [[48, 122], [80, 110]] }])))).toEqual([]);
  });

  it("rejects a dribble, pass or shot of a player who doesn't have the ball, though another ball is free", () => {
    expect(
      checkBalls(
        drawn(
          step([
            { kind: "dribble", from: 1, pts: [[100, 132], [100, 110]] },
            { kind: "pass", from: 1, pts: [[100, 110], [48, 122]] },
          ], [[58, 114], [150, 180]]),
          step([{ kind: "shot", from: 1, pts: [[100, 132], [90, 0]] }]),
        ),
      ),
    ).toEqual([
      "step 1: the dribble of CB has no ball",
      "step 1: the pass of CB has no ball",
      "step 2: the shot of CB has no ball",
    ]);
  });

  it("accepts a pass without a player and without a ball: another choice in the same step", () => {
    expect(
      checkBalls(
        drawn(
          step([
            { kind: "shot", from: 0, pts: [[48, 122], [90, 0]] },
            { kind: "pass", pts: [[48, 122], [100, 132]] },
          ]),
        ),
      ),
    ).toEqual([]);
  });

  it("rejects a pass after the ball has gone", () => {
    expect(
      checkBalls(
        drawn(
          step([
            { kind: "pass", from: 0, pts: [[48, 122], [100, 132]] },
            { kind: "bounce", from: 0, pts: [[48, 122], [100, 132]] },
          ]),
        ),
      ),
    ).toEqual(["step 1: the bounce of LB has no ball"]);
  });

  it("wants a ball in the goal kept there when the goalkeeper moves", () => {
    const run = step([{ kind: "run", from: 2, pts: [[100, 10], [90, 16]] }], [[110, 0]]);
    const after = (ball: Pt) => ({ ...step([], [ball]), players: run.players.map((p, i) => (i === 2 ? { ...p, at: [90, 16] as Pt } : p)) });
    expect(checkBalls(drawn(run, after([110, 0])))).toEqual([]);
    expect(checkBalls(drawn(run, after([100, 6])))).toEqual([
      "step 1: the ball in the goal goes along with GK; keep it in the goal in the next step",
    ]);
    expect(checkBalls(drawn(run))).toEqual([
      "step 1: the ball in the goal goes along with GK; keep it in the goal in the next step",
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

  it("rejects a dribble or shot without a ball", () => {
    const shot = board();
    shot.frames[0]!.arrows = [{ kind: "shot", from: 1, pts: [[48, 58], [100, 0]] }];
    expect(checkLibrary([{ ...entry("en/a"), board: settle(shot) }], locales)).toEqual(['"en/a": step 1: the shot of player 2 has no ball']);
  });

  it("rejects a drill whose translation draws something else", () => {
    const other = board("LO");
    other.frames[0]!.players[1]!.at = [50, 58];
    const drill = { ...entry("en/a"), type: "drill" as const };
    expect(checkLibrary([drill, { ...drill, id: "nl/a", board: other }], locales)).toEqual([
      '"nl/a": draws something else than "en/a"; a translation changes only labels and sentences',
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
