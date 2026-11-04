import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { encode, sameBoard, settle, toBoard, type Board } from "./board/format";
import { sameDrawing } from "./library";
import { boardYaml, findLink, importLink, metres, playerName } from "./importLink";

const fixtures = new URL("./board/fixtures/", import.meta.url);
const fixtureFiles = readdirSync(fixtures).filter((f) => f.endsWith(".json"));
const fixture = (file: string) => JSON.parse(readFileSync(new URL(file, fixtures), "utf8")) as { link: string; board: unknown };

const library = new URL("../content/library/", import.meta.url);
/** The `board:` block of every item, as its file writes it. */
const itemBlocks = readdirSync(library).flatMap((lang) =>
  readdirSync(new URL(`${lang}/`, library)).map((file) => {
    const text = readFileSync(new URL(`${lang}/${file}`, library), "utf8");
    const block = text.slice(text.indexOf("\nboard:\n") + 1, text.indexOf("\n---", 4));
    return { id: `${lang}/${file}`, block };
  }),
);

/** One kind of line each, as the items write a board. */
const STYLE = [
  /^board:$/,
  /^  v: 2$/,
  /^  court: (half|full)$/,
  /^  cones: \[(\[\d+, \d+\](, \[\d+, \d+\])*)?\]$/,
  /^  frames:$/,
  /^    - text: ".*"$/,
  /^      players:$/,
  /^        - \{ team: [adp], (label: ([A-Za-z][A-Za-z0-9]*|"[^"]*"), )?at: \[\d+, \d+\] \}$/,
  /^      balls: \[(\[\d+, \d+\](, \[\d+, \d+\])*)?\]$/,
  /^      arrows: \[\]$/,
  /^      arrows:$/,
  /^        - \{ kind: (run|pass|dribble|block|shot|bounce), (from: \d+, )?pts: \[\[\d+, \d+\](, \[\d+, \d+\]){1,2}\] \}$/,
];
const offStyle = (yaml: string) => yaml.split("\n").filter((line) => !STYLE.some((re) => re.test(line)));

const board = (frame: Partial<Board["frames"][number]> = {}, cones: Board["cones"] = []): Board =>
  settle({
    v: 2,
    court: "half",
    cones,
    frames: [
      {
        text: "Een stap.",
        players: [
          { team: "a", label: "LO", at: [40, 120] },
          { team: "a", label: "RO", at: [160, 120] },
          { team: "d", at: [60, 60] },
          { team: "d", at: [140, 60] },
        ],
        balls: [[48, 112]],
        arrows: [],
        ...frame,
      },
    ],
  });

describe("findLink", () => {
  const link = "2.abc-_9";
  it.each([
    `https://handballcoachboard.com/nl/board/link/#t=${link}`,
    `https://handballcoachboard.com/nl/board/qr/#t=${link}`,
    `https://handballcoachboard.com/en/board/#t=${link}`,
    `https://handballcoachboard.com/nl/board/link/?v=4#t=${link}`,
    `https://coachboard.hardamkay.workers.dev/board/#t=${link}`,
    link,
    `  ${link}\n`,
  ])("takes the link out of %j", (input) => {
    expect(findLink(input)).toBe(link);
  });

  it("drops what a sentence in a mail puts around it", () => {
    expect(findLink(`(zie https://handballcoachboard.com/nl/board/link/#t=${link}).`)).toBe(link);
    expect(findLink(`Hier: ${link}.`)).toBe(link);
    expect(findLink(`<https://handballcoachboard.com/nl/board/#t=${link}>`)).toBe(link);
  });

  it("joins a link a mail broke over two lines", () => {
    expect(findLink("https://handballcoachboard.com/nl/board/link/#t=2.abc\n-_9")).toBe(link);
  });
});

describe("importLink", () => {
  it.each(fixtureFiles)("reads %s back as the same board, without its title", async (file) => {
    const { link, board: expected } = fixture(file);
    // A fixture isn't an item: it may lack sentences or have a ball problem, which errors lists.
    const { board } = await importLink(`https://handballcoachboard.com/nl/board/link/#t=${link}`);
    const { title: _title, ...rest } = toBoard(expected)!;
    expect(board!.title).toBeUndefined();
    expect(sameBoard(board!, rest)).toBe(true);
  });

  it("writes every fixture's block in the style of the items", async () => {
    for (const file of fixtureFiles) {
      const { yaml } = await importLink(fixture(file).link);
      expect(offStyle(yaml), file).toEqual([]);
    }
  });

  it("says when a link is broken", async () => {
    const { board, errors } = await importLink("https://handballcoachboard.com/nl/board/link/#t=2.nietsdaneenkapottelink");
    expect(board).toBeNull();
    expect(errors).toEqual(["Deze link werkt niet. Vraag om een nieuwe."]);
  });

  it("says when a link comes from a newer version", async () => {
    const { board, errors } = await importLink("https://handballcoachboard.com/nl/board/#t=3.abc");
    expect(board).toBeNull();
    expect(errors[0]).toMatch(/nieuwere versie van Coachboard/);
  });

  it("says when there is no link at all", async () => {
    expect((await importLink("https://handballcoachboard.com/nl/board/")).errors[0]).toMatch(/Geen link gevonden/);
  });

  it("puts a no-break space between a number and meter, and says so", async () => {
    const link = await encode({ ...board({ text: "LO loopt naar de 9 meter en de 6 meter." }), title: "Op 7 meter" });
    const { title, texts, meters, yaml } = await importLink(link);
    expect(meters).toEqual(["7 meter", "9 meter", "6 meter"]);
    expect(title).toBe("Op 7\u00a0meter");
    expect(texts).toEqual(["LO loopt naar de 9\u00a0meter en de 6\u00a0meter."]);
    expect(yaml).toContain('text: "LO loopt naar de 9\u00a0meter en de 6\u00a0meter."');
  });

  it('keeps a " or \\ in a sentence from breaking the block', async () => {
    const text = 'Roep "nu!" en speel C:\\bal.';
    const { yaml, texts } = await importLink(await encode(board({ text })));
    const line = yaml.split("\n").find((l) => l.startsWith("    - text: "))!;
    expect(JSON.parse(line.slice("    - text: ".length))).toBe(text);
    expect(texts).toEqual([text]);
    expect(offStyle(yaml)).toEqual([]);
  });

  it("names a step without a sentence, a pass without the ball and a ball in the goal", async () => {
    const b = board({
      text: "",
      arrows: [{ kind: "pass", from: 1, pts: [[160, 120], [40, 120]] }],
    });
    const { errors } = await importLink(await encode(b));
    expect(errors).toEqual(["Stap 1 heeft geen zin.", "Stap 1: de pass van RO, maar RO heeft de bal dan niet."]);

    const keeper: Board = settle({
      v: 2,
      court: "half",
      cones: [],
      frames: [
        {
          text: "De keeper stapt uit.",
          players: [{ team: "d", label: "K", at: [100, 10] }],
          balls: [[100, 0]],
          arrows: [{ kind: "run", from: 0, pts: [[100, 10], [80, 20]] }],
        },
        { text: "Klaar.", players: [{ team: "d", label: "K", at: [80, 20] }], balls: [[84, 12]], arrows: [] },
      ],
    });
    expect((await importLink(await encode(keeper))).errors).toEqual([
      "Stap 1: de bal in het doel gaat mee met K. Laat hem in de volgende stap in het doel liggen.",
    ]);
  });

  it("warns about players within 2 m, and on a cone within 1,4 m", async () => {
    const b = board({}, [[150, 112]]);
    b.frames[0]!.players[1]!.at = [150, 120];
    b.frames[0]!.players[3]!.at = [150, 104];
    const { warnings } = await importLink(await encode(b));
    expect(warnings).toEqual([
      "Stap 1: RO en de eerste verdediger van rechts staan 1,6 m van elkaar (minder dan 2 m).",
      "Stap 1: RO staat 0,8 m van een pion (minder dan 1,4 m).",
      "Stap 1: de eerste verdediger van rechts staat 0,8 m van een pion (minder dan 1,4 m).",
    ]);
  });

  it("warns about an arrow near a cone or through a player, but not a shot past the goalkeeper", async () => {
    const players: Board["frames"][number]["players"] = [
      { team: "a", label: "LO", at: [40, 120] },
      { team: "a", label: "RO", at: [160, 120] },
      { team: "a", label: "MO", at: [100, 128] },
      { team: "d", label: "K", at: [100, 8] },
    ];
    const pass = board({ players, arrows: [{ kind: "pass", from: 0, pts: [[40, 120], [160, 120]] }] }, [[70, 124]]);
    expect((await importLink(await encode(pass))).warnings).toEqual([
      "Stap 1: de pass van LO komt 0,4 m langs een pion (minder dan 0,8 m).",
      "Stap 1: de pass van LO komt 0,8 m langs MO (minder dan 1,2 m).",
    ]);

    const shot = board({ players, balls: [[100, 120]], arrows: [{ kind: "shot", from: 2, pts: [[100, 128], [100, 0]] }] });
    expect((await importLink(await encode(shot))).warnings).toEqual([]);
  });

  it("warns about a dribble shorter than 3 m and an arrow without a player", async () => {
    const b = board({
      arrows: [
        { kind: "dribble", from: 0, pts: [[40, 120], [40, 96]] },
        { kind: "pass", pts: [[100, 180], [160, 120]] },
      ],
    });
    const { warnings } = await importLink(await encode(b));
    expect(warnings).toEqual([
      "Stap 1: de dribbel van LO is 2,4 m lang (korter dan 3 m).",
      "Stap 1: een pass zonder speler. Is die per ongeluk losgesleept? Alleen een tweede keuze teken je zo.",
    ]);
  });

  it("never changes the drawing", async () => {
    const b = { ...board({ text: "Naar de 9 meter." }), title: "Titel" };
    const { board: read } = await importLink(await encode(b));
    expect(sameDrawing(read!, b)).toBe(true);
    expect(read!.frames[0]!.players.map((p) => p.label)).toEqual(b.frames[0]!.players.map((p) => p.label));
  });
});

describe("playerName", () => {
  const frame = board().frames[0]!;
  frame.players.push({ team: "d", at: [100, 60] }, { team: "a", at: [100, 150] }, { team: "a", at: [120, 150] }, { team: "p", at: [100, 190] });

  it("is the label, or the place from the nearer sideline", () => {
    expect(playerName(frame, 0)).toBe("LO");
    expect(playerName(frame, 2)).toBe("de eerste verdediger van links");
    expect(playerName(frame, 4)).toBe("de tweede verdediger van links");
    expect(playerName(frame, 3)).toBe("de eerste verdediger van rechts");
    expect(playerName(frame, 5)).toBe("de eerste van links");
    expect(playerName(frame, 6)).toBe("de eerste van rechts");
    expect(playerName(frame, 7)).toBe("het aanspeelpunt");
  });

  it("counts players on one line from the goal out", () => {
    const row = board({
      players: [
        { team: "a", at: [60, 150] },
        { team: "a", at: [60, 162] },
        { team: "a", at: [60, 174] },
      ],
      balls: [],
    }).frames[0]!;
    expect([0, 1, 2].map((i) => playerName(row, i))).toEqual(["de eerste van links", "de tweede van links", "de eerste van rechts"]);
  });
});

describe("boardYaml", () => {
  it("writes a board as the items do", () => {
    const b = settle({
      v: 2,
      court: "full",
      cones: [[70, 90], [130, 90]],
      frames: [
        {
          text: "Stap één.",
          players: [
            { team: "a", label: "7", at: [100, 128] },
            { team: "p", at: [40, 90] },
            { team: "d", label: "K", at: [100, 8] },
          ],
          balls: [[104, 120]],
          arrows: [
            { kind: "run", from: 0, pts: [[0, 0], [80, 110], [90, 96]] },
            { kind: "shot", from: 0, pts: [[0, 0], [90, 0]] },
            { kind: "pass", pts: [[40, 90], [60, 140]] },
          ],
        },
        {
          text: "Stap twee.",
          players: [
            { team: "a", label: "7", at: [90, 96] },
            { team: "p", at: [40, 90] },
            { team: "d", label: "K", at: [100, 8] },
          ],
          balls: [],
          arrows: [],
        },
      ],
    } satisfies Board);
    expect(boardYaml(b)).toBe(
      [
        "board:",
        "  v: 2",
        "  court: full",
        "  cones: [[70, 90], [130, 90]]",
        "  frames:",
        '    - text: "Stap één."',
        "      players:",
        '        - { team: a, label: "7", at: [100, 128] }',
        "        - { team: p, at: [40, 90] }",
        "        - { team: d, label: K, at: [100, 8] }",
        "      balls: [[104, 120]]",
        "      arrows:",
        "        - { kind: run, from: 0, pts: [[100, 128], [80, 110], [90, 96]] }",
        "        - { kind: shot, from: 0, pts: [[90, 96], [90, 0]] }",
        "        - { kind: pass, pts: [[40, 90], [60, 140]] }",
        '    - text: "Stap twee."',
        "      players:",
        '        - { team: a, label: "7", at: [90, 96] }',
        "        - { team: p, at: [40, 90] }",
        "        - { team: d, label: K, at: [100, 8] }",
        "      balls: []",
        "      arrows: []",
      ].join("\n"),
    );
  });

  it("has the style of every item's own block", () => {
    expect(itemBlocks.length).toBeGreaterThan(0);
    for (const { id, block } of itemBlocks) expect(offStyle(block), id).toEqual([]);
  });
});

describe("metres", () => {
  it("writes decimetres as metres with a comma", () => {
    expect(metres(16)).toBe("1,6 m");
    expect(metres(8.04)).toBe("0,8 m");
  });
});
