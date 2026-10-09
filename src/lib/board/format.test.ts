import { encode as qrCode } from "uqr";
import { describe, expect, it } from "vitest";
import { defaultBoard, defaultBoardFor } from "./defaults";
import {
  decode,
  encode,
  isBoard,
  isNewerLink,
  MAX_BALLS,
  MAX_CONES,
  MAX_STEPS,
  MAX_TEXT,
  MAX_TITLE,
  sameBoard,
  settle,
  toBoard,
  type Board,
  type BoardV1,
  type Pt,
} from "./format";

interface Fixture {
  link: string;
  board: Board | BoardV1;
}

const fixtures = import.meta.glob<Fixture>("./fixtures/*.json", {
  eager: true,
  import: "default",
});
const fullLineup = toBoard(fixtures["./fixtures/v1-full-lineup.json"]!.board)!;

/** Packs any JSON the way encode() does, to build hostile links. */
async function linkFromJson(json: string, version = 1): Promise<string> {
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `${version}.${btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}`;
}

describe("fixtures", () => {
  it("exist for both versions", () => {
    const names = Object.keys(fixtures);
    expect(names.filter((n) => n.includes("/v1-")).length).toBeGreaterThanOrEqual(3);
    expect(names.filter((n) => n.includes("/v2-")).length).toBeGreaterThanOrEqual(3);
  });

  // A version 1 fixture keeps its version 1 board; it opens as this version's board.
  it.each(Object.entries(fixtures))("%s decodes to its board", async (_, fixture) => {
    expect(await decode(fixture.link)).toEqual(toBoard(fixture.board));
    expect(toBoard(fixture.board)).not.toBeNull();
  });
});

describe("version 1 boards", () => {
  const v1 = fixtures["./fixtures/v1-default.json"]!.board as BoardV1;

  it("keep their drawing: the same players, the ball in the list, arrows without a player", () => {
    const board = toBoard(v1)!;
    expect(board).toEqual({
      v: 2,
      court: v1.court,
      cones: [],
      frames: v1.frames.map((f) => ({ players: f.players, balls: f.ball ? [f.ball] : [], arrows: f.arrows })),
    });
    expect(board.frames[0]!.arrows.every((a) => a.from === undefined)).toBe(true);
  });

  it("are read from older saved boards too", () => {
    expect(toBoard(JSON.parse(JSON.stringify(v1)))).toEqual(toBoard(v1));
  });

  it("with other players in a later step are not valid", async () => {
    expect(await decode(await linkFromJson("[0,[[[[0,10,10]],0,[]],[[[1,10,10]],0,[]]]]"))).toBeNull();
    expect(await decode(await linkFromJson("[0,[[[[0,10,10]],0,[]],[[[0,10,10],[0,20,20]],0,[]]]]"))).toBeNull();
    expect(await decode(await linkFromJson("[0,[[[[0,10,10]],0,[]],[[[0,40,40]],0,[]]]]"))).not.toBeNull();
  });

  it(`with more than ${MAX_STEPS} steps are not valid`, async () => {
    const steps = (n: number) => `[0,[${Array(n).fill("[[[0,10,10]],0,[]]").join(",")}]]`;
    expect(await decode(await linkFromJson(steps(MAX_STEPS)))).not.toBeNull();
    expect(await decode(await linkFromJson(steps(MAX_STEPS + 1)))).toBeNull();
  });
});

describe("encode and decode", () => {
  it.each(Object.entries(fixtures))("%s survives a roundtrip", async (_, { board }) => {
    const current = toBoard(board)!;
    expect(await decode(await encode(current))).toEqual(current);
  });

  it("writes version 2", async () => {
    expect(await encode(defaultBoard)).toMatch(/^2\./);
  });

  it("keeps the default lineup valid", () => {
    expect(isBoard(defaultBoard)).toBe(true);
  });

  it("fits a full lineup in the QR budget of 300 characters", async () => {
    const frame = fullLineup.frames[0]!;
    expect(frame.players).toHaveLength(14);
    expect(frame.balls).toHaveLength(1);
    expect(frame.arrows).toHaveLength(6);
    expect((await encode(fullLineup)).length).toBeLessThanOrEqual(300);
  });

  it("keeps the title, the sentences, cones, passers and every kind of arrow", async () => {
    const board: Board = {
      v: 2,
      court: "full",
      title: "Kruisen in tweetallen",
      cones: [[70, 120], [130, 120]],
      frames: [
        {
          players: [
            { team: "a", label: "LO", at: [60, 150] },
            { team: "p", at: [40, 90] },
            { team: "d", at: [100, 300] },
          ],
          balls: [[60, 144], [140, 144]],
          arrows: [
            { kind: "run", from: 0, pts: [[60, 150], [70, 125], [70, 120]] },
            { kind: "bounce", from: 1, pts: [[40, 90], [70, 120]] },
            { kind: "block", pts: [[10, 10], [20, 20]] },
            { kind: "shot", from: 0, pts: [[70, 120], [110, 0]] },
            { kind: "shot", from: 2, pts: [[100, 300], [90, 400]] },
            { kind: "dribble", from: 2, pts: [[100, 300], [100, 350]] },
          ],
          text: "De eersten lopen naar hun pion.",
        },
        {
          players: [
            { team: "a", label: "LO", at: [70, 120] },
            { team: "p", at: [40, 90] },
            { team: "d", at: [100, 350] },
          ],
          balls: [],
          arrows: [{ kind: "pass", from: 1, pts: [[40, 90], [70, 120]] }],
        },
      ],
    };
    expect(isBoard(board)).toBe(true);
    expect(await decode(await encode(board))).toEqual(board);
  });
});

describe("arrows of a player", () => {
  // Version 2 JSON: one attacker at (20, 100); a run to (20, 60), then a pass, a shot.
  const json = (arrows: string) => `[0,"",[[0]],[],[[[20,100],[],[${arrows}],""]]]`;

  it("start where their player is by then: after a run, at its end", async () => {
    const board = await decode(await linkFromJson(json("[0,0,20,60],[1,0,80,100],[4,0,0]"), 2));
    expect(board!.frames[0]!.arrows).toEqual([
      { kind: "run", from: 0, pts: [[20, 100], [20, 60]] },
      { kind: "pass", from: 0, pts: [[20, 60], [80, 100]] },
      { kind: "shot", from: 0, pts: [[20, 60], [90, 0]] },
    ]);
  });

  it("need not be settled by hand: a board with a wrong start isn't valid", () => {
    const board = toBoard(defaultBoard)!;
    board.frames[0]!.arrows.push({ kind: "run", from: 0, pts: [[0, 0], [30, 30]] });
    expect(isBoard(board)).toBe(false);
  });
});

describe("decode rejects", () => {
  const valid = fixtures["./fixtures/v1-default.json"]!.link;

  it.each([
    ["an empty string", ""],
    ["text without a version", "hello"],
    ["an empty payload", "1."],
    ["an unknown version", `3.${valid.slice(2)}`],
    ["no version", valid.slice(1)],
    ["characters outside base64url", "1.abc+/def"],
    ["a truncated payload", valid.slice(0, -12)],
    ["an oversized payload", `1.${"A".repeat(5000)}`],
  ])("%s", async (_, link) => {
    expect(await decode(link)).toBeNull();
  });

  it.each([
    ["JSON that isn't the v1 shape", '{"court":0}'],
    ["a board without frames", "[0,[]]"],
    ["an unknown court", "[2,[[[],0,[]]]]"],
    ["a court index as a string", '["0",[[[],0,[]]]]'],
    ["a player outside the court", "[0,[[[[0,201,10]],0,[]]]]"],
    ["a coordinate that isn't a whole number", "[0,[[[[0,10.5,10]],0,[]]]]"],
    ["a label longer than 3 characters", '[0,[[[[0,10,10,"LONG"]],0,[]]]]'],
    ["an arrow with one point", "[0,[[[],0,[[0,10,10]]]]]"],
    ["an arrow with an odd coordinate count", "[0,[[[],0,[[0,10,10,20]]]]]"],
    ["an unknown arrow kind", "[0,[[[],0,[[3,10,10,20,20]]]]]"],
    ["too many players", `[0,[[[${Array(31).fill("[0,10,10]").join(",")}],0,[]]]]`],
    ["text that isn't JSON", "not json"],
  ])("%s", async (_, json) => {
    expect(await decode(await linkFromJson(json))).toBeNull();
  });

  it("nothing that is valid (control for the cases above)", async () => {
    expect(await decode(await linkFromJson(`[0,[[[[0,10,10]],0,[]]]${" ".repeat(1000)}]`))).toEqual({
      v: 2,
      court: "half",
      cones: [],
      frames: [{ players: [{ team: "a", at: [10, 10] }], balls: [], arrows: [] }],
    });
  });

  // Version 2: one attacker and one defender, in one step.
  const step = (positions = "30,118,48,58", balls = "", arrows = "", text = '""') =>
    `[${"[" + positions + "]"},[${balls}],[${arrows}],${text}]`;
  const v2 = (steps = [step()], { title = '""', lineup = '[0,"LB"],[1]', cones = "" } = {}) =>
    `[0,${title},[${lineup}],[${cones}],[${steps.join(",")}]]`;

  it.each([
    ["JSON that isn't the v2 shape", '{"court":0}'],
    ["a board without steps", v2([])],
    ["positions that don't match the lineup", v2([step("30,118")])],
    ["a player off the court (reserved for later)", v2([step("-1,48,58")])],
    ["a passer with a label", v2(undefined, { lineup: '[2,"X"],[1]' })],
    ["an unknown team", v2(undefined, { lineup: "[3],[1]" })],
    ["an unknown arrow kind", v2([step(undefined, "", "[6,0,40,40]")])],
    ["an arrow of a player who isn't there", v2([step(undefined, "", "[0,2,40,40]")])],
    ["an arrow without an end", v2([step(undefined, "", "[0,0]")])],
    ["a shot without a player", v2([step(undefined, "", "[4,10,10,1]")])],
    ["a shot at an unknown side", v2([step(undefined, "", "[4,0,3]")])],
    ["a shot whose side is text", v2([step(undefined, "", '[4,0,"1"]')])],
    [`more than ${MAX_STEPS} steps`, v2(Array(MAX_STEPS + 1).fill(step()))],
    [`a sentence over ${MAX_TEXT} characters`, v2([step(undefined, "", "", `"${"a".repeat(MAX_TEXT + 1)}"`)])],
    ["a sentence with a line break", v2([step(undefined, "", "", '"one\\ntwo"')])],
    [`a title over ${MAX_TITLE} characters`, v2(undefined, { title: `"${"a".repeat(MAX_TITLE + 1)}"` })],
    [`more than ${MAX_BALLS} balls`, v2([step(undefined, Array(MAX_BALLS + 1).fill("10,10").join(","))])],
    [`more than ${MAX_CONES} cones`, v2(undefined, { cones: Array(MAX_CONES + 1).fill("10,10").join(",") })],
    ["a cone off the court", v2(undefined, { cones: "10,500" })],
  ])("version 2: %s", async (_, json) => {
    expect(await decode(await linkFromJson(json, 2))).toBeNull();
  });

  it("nothing that is valid in version 2 (control for the cases above)", async () => {
    const steps = Array(MAX_STEPS).fill(step(undefined, Array(MAX_BALLS).fill("10,10").join(","), "[0,0,40,40],[4,1,2]", `"${"a".repeat(MAX_TEXT)}"`));
    const json = v2(steps, { title: `"${"a".repeat(MAX_TITLE)}"`, cones: Array(MAX_CONES).fill("10,10").join(",") });
    const board = await decode(await linkFromJson(json, 2));
    expect(board?.frames).toHaveLength(MAX_STEPS);
    expect(board?.frames[0]!.arrows.map((a) => a.kind)).toEqual(["run", "shot"]);
  });

  it("a valid board that inflates past 64 KB", async () => {
    const padded = `[0,[[[[0,10,10]],0,[]]]${" ".repeat(70_000)}]`;
    const link = await linkFromJson(padded);
    expect(link.length).toBeLessThan(4000);
    expect(await decode(link)).toBeNull();
  });
});

describe("sameBoard", () => {
  const board = () => structuredClone(fixtures["./fixtures/v2-play.json"]!.board as Board);

  it("is true for the same board, whatever the order of its keys", () => {
    const b = board();
    // Every object with its keys the other way round, as a board read back from storage may have them.
    const reverse = (x: unknown): unknown =>
      Array.isArray(x)
        ? x.map(reverse)
        : x && typeof x === "object"
          ? Object.fromEntries(Object.entries(x).reverse().map(([k, v]) => [k, reverse(v)]))
          : x;
    const reordered = reverse(b) as Board;
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(b));
    expect(sameBoard(b, reordered)).toBe(true);
  });

  it("is true for a version 1 board and the version 2 board it reads as", () => {
    const v1 = fixtures["./fixtures/v1-full-lineup.json"]!.board;
    expect(sameBoard(toBoard(v1)!, fullLineup)).toBe(true);
  });

  it("is false after any change", () => {
    const changes: ((b: Board) => void)[] = [
      (b) => (b.title = "Anders"),
      (b) => (b.frames[0]!.text = "Anders"),
      (b) => (b.frames[0]!.players[0]!.at = [1, 1]),
      (b) => b.frames[0]!.arrows.pop(),
      (b) => b.cones.push([10, 10]),
      (b) => (b.court = b.court === "half" ? "full" : "half"),
    ];
    for (const change of changes) {
      const b = board();
      change(b);
      expect(sameBoard(board(), b)).toBe(false);
    }
  });
});

describe("isNewerLink", () => {
  const valid = fixtures["./fixtures/v1-default.json"]!.link;

  it.each([
    ["version 3", `3.${valid.slice(2)}`],
    ["a broken link of version 3", "3.not-a-board"],
    ["a two-digit version", "10.abc"],
  ])("is true for %s", (_, link) => {
    expect(isNewerLink(link)).toBe(true);
  });

  it.each([
    ["a valid version 1 link", valid],
    ["a broken version 1 link", "1.not-a-board"],
    ["a broken version 2 link", "2.not-a-board"],
    ["version 0", "0.abc"],
    ["a version with a leading zero", "02.abc"],
    ["a version that isn't a number", "abc.def"],
    ["a negative version", "-2.abc"],
    ["no version", ".abc"],
    ["text without a dot", "22"],
    ["an empty string", ""],
  ])("is false for %s", (_, link) => {
    expect(isNewerLink(link)).toBe(false);
  });

  it("is false for what encode() writes", async () => {
    expect(isNewerLink(await encode(fullLineup))).toBe(false);
  });
});

/**
 * The QR version the largest board within the limits must fit in (decision 3;
 * docs/metingen.md, phase 11). The scan test read every code up to version 30
 * from phone to phone; the room above 24 is margin for busy boards and older
 * phones.
 */
const QR_VERSION = 24;

// Words for sentences that don't repeat, so compression finds no help between
// steps: about as long a link as real Dutch sentences (docs/metingen.md, phase 9).
const WORDS = (
  "bal pass loop schot blok stuit hoek cirkel paal doel lijn veld rij pion speler verdediger aanval " +
  "opbouwer midden links rechts snel kort lang breed diep terug vooruit draai dreig kruis vang speel " +
  "neem zet wacht sprint stop wissel ruimte tempo moment kans druk balans voet hand arm schouder hoofd " +
  "ogen kijk roep wijs teken trek duw houd laat volg leid open dicht eerst daarna dan meteen samen " +
  "alleen weer nog altijd vaak soms naar van met door over onder achter voor naast tussen langs bij " +
  "uit binnen buiten hoog laag ver dichtbij vrij gedekt actief rustig scherp zacht hard strak los vast mee tegen"
).split(" ");

/**
 * The largest board within the limits, drawn the way a coach draws a play: the
 * default lineup, MAX_STEPS steps with a pass and one to three runs each (every
 * third one bent), runners ending where their run ends, two defenders shifting,
 * a title of MAX_TITLE and sentences of MAX_TEXT characters. Not the most the
 * format allows (30 arrows a step would make a far bigger code), but the most a
 * play needs.
 */
function largestBoard(): Board {
  let seed = 7;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const sentence = (n: number) => {
    let s = "";
    while (s.length < n) s += (s ? " " : "") + WORDS[Math.floor(random() * WORDS.length)];
    s = s.slice(0, n - 1).trimEnd();
    return (s.charAt(0).toUpperCase() + s.slice(1)).padEnd(n - 1, "e") + ".";
  };
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
  const board = defaultBoardFor("nl");
  board.title = sentence(MAX_TITLE);
  const frames: Board["frames"] = [];
  let players = board.frames[0]!.players;
  let ball: Pt = [110, 122];
  let holder = 2;
  for (let s = 0; s < MAX_STEPS; s++) {
    const order = [1, 3, 5, 0, 4, 2];
    const pick = order[(s * 5 + 1) % 6]!;
    const receiver = pick === holder ? (holder + 1) % 6 : pick;
    const arrows: Board["frames"][number]["arrows"] = [{ kind: "pass", from: holder, pts: [players[holder]!.at, players[receiver]!.at] }];
    const next = structuredClone(players);
    const runners = [0, 1, 2, 3, 4, 5].filter((i) => i !== receiver).slice(s % 3, (s % 3) + 1 + (s % 3));
    for (const i of runners) {
      const [x, y] = players[i]!.at;
      const to: Pt = [clamp(x + ((s * 37 + i * 23) % 50) - 25, 4, 196), clamp(y - 10 - ((s * 13 + i * 7) % 30), 30, 190)];
      const bend: Pt = [clamp((x + to[0]) / 2 + 12, 4, 196), clamp((y + to[1]) / 2, 30, 190)];
      arrows.push({ kind: "run", from: i, pts: s % 3 === 2 ? [[x, y], bend, to] : [[x, y], to] });
      next[i]!.at = to;
    }
    for (const d of [7 + (s % 6), 7 + ((s + 3) % 6)]) {
      const [x, y] = players[d]!.at;
      next[d]!.at = [clamp(x + (s % 2 ? 6 : -6), 4, 196), clamp(y + (s % 2 ? 4 : -4), 4, 120)];
    }
    frames.push({ players, balls: [ball], arrows, text: sentence(MAX_TEXT) });
    players = next;
    ball = [clamp(players[receiver]!.at[0] + 6, 0, 200), clamp(players[receiver]!.at[1] - 4, 0, 200)];
    holder = receiver;
  }
  return settle({ ...board, frames });
}

describe("the largest board within the limits", () => {
  it(`fits in a QR code of version ${QR_VERSION} on /nl/board/qr/`, async () => {
    const board = largestBoard();
    expect(isBoard(board)).toBe(true);
    expect(board.frames).toHaveLength(MAX_STEPS);
    expect(board.frames.every((f) => f.text!.length === MAX_TEXT)).toBe(true);
    const url = `https://handballcoachboard.com/nl/board/qr/#t=${await encode(board)}`;
    // The QR dialog's settings (BoardEditor.svelte): error correction L.
    expect(qrCode(url, { ecc: "L" }).version).toBeLessThanOrEqual(QR_VERSION);
  });
});
