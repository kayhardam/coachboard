// The board's data model and its share-link format.
//
// Coordinates are whole decimetres on a portrait court with the goal at the
// top: x runs 0–200 from sideline to sideline, y runs 0–400 from the goal
// line. A half court shows y 0–200.
//
// A link is "<version>.<payload>". Version 1 must stay readable forever:
// links end up in QR codes and team chats. The links in ./fixtures/ are
// decoded by the tests and must never be edited. A new format gets a new
// version prefix and its own reader in decode().

export type Pt = [x: number, y: number];

export interface Player {
  /** Attack or defence. */
  team: "a" | "d";
  /** Up to 3 characters, e.g. "GK", "LB", "7". */
  label?: string;
  at: Pt;
}

/** Two points draw a straight arrow; three bend it through the middle one. */
export interface Arrow {
  kind: "run" | "pass" | "dribble";
  pts: Pt[];
}

export interface Frame {
  players: Player[];
  ball?: Pt;
  arrows: Arrow[];
}

/** The first version only edits frames[0]. */
export interface Board {
  v: 1;
  court: "half" | "full";
  frames: Frame[];
}

export const COURT_WIDTH = 200;
export const COURT_LENGTH = 400;

export const MAX_PLAYERS = 30;
export const MAX_ARROWS = 30;
const MAX_FRAMES = 20;
const MAX_LABEL = 3;
const MAX_PAYLOAD = 4000; // characters of base64url
const MAX_JSON = 64 * 1024; // bytes after inflating

// ===== Validation =====

const isCoord = (n: unknown, max: number) =>
  Number.isInteger(n) && (n as number) >= 0 && (n as number) <= max;

const isPt = (p: unknown): p is Pt =>
  Array.isArray(p) &&
  p.length === 2 &&
  isCoord(p[0], COURT_WIDTH) &&
  isCoord(p[1], COURT_LENGTH);

const isList = (x: unknown, max: number): x is unknown[] =>
  Array.isArray(x) && x.length <= max;

function isPlayer(x: unknown): x is Player {
  const p = x as Player;
  return (
    typeof p === "object" &&
    p !== null &&
    (p.team === "a" || p.team === "d") &&
    isPt(p.at) &&
    (p.label === undefined ||
      (typeof p.label === "string" && p.label.length >= 1 && p.label.length <= MAX_LABEL))
  );
}

function isArrow(x: unknown): x is Arrow {
  const a = x as Arrow;
  return (
    typeof a === "object" &&
    a !== null &&
    (a.kind === "run" || a.kind === "pass" || a.kind === "dribble") &&
    Array.isArray(a.pts) &&
    (a.pts.length === 2 || a.pts.length === 3) &&
    a.pts.every(isPt)
  );
}

function isFrame(x: unknown): x is Frame {
  const f = x as Frame;
  return (
    typeof f === "object" &&
    f !== null &&
    isList(f.players, MAX_PLAYERS) &&
    f.players.every(isPlayer) &&
    (f.ball === undefined || isPt(f.ball)) &&
    isList(f.arrows, MAX_ARROWS) &&
    f.arrows.every(isArrow)
  );
}

/** Hand-written so the board's client bundle doesn't need Zod. */
export function isBoard(x: unknown): x is Board {
  const b = x as Board;
  return (
    typeof b === "object" &&
    b !== null &&
    b.v === 1 &&
    (b.court === "half" || b.court === "full") &&
    isList(b.frames, MAX_FRAMES) &&
    b.frames.length >= 1 &&
    b.frames.every(isFrame)
  );
}

// ===== Version 1: compact arrays =====
//
//   [court, [frame, …]]                 court: 0 = half, 1 = full
//   frame  = [players, ball, arrows]
//   player = [team, x, y] | [team, x, y, label]   team: 0 = attack, 1 = defence
//   ball   = [x, y] | 0
//   arrow  = [kind, x1, y1, x2, y2(, x3, y3)]     kind: 0 = run, 1 = pass, 2 = dribble

const KINDS = ["run", "pass", "dribble"] as const;
const TEAMS = ["a", "d"] as const;
const COURTS = ["half", "full"] as const;

/** list[i] for a number i only: JSON "0" must not read as index 0. */
const pick = <T>(list: readonly T[], i: unknown): T | undefined =>
  typeof i === "number" ? list[i] : undefined;

function toV1(board: Board): unknown {
  return [
    COURTS.indexOf(board.court),
    board.frames.map((f) => [
      f.players.map((p) => {
        const row: (number | string)[] = [TEAMS.indexOf(p.team), ...p.at];
        if (p.label !== undefined) row.push(p.label);
        return row;
      }),
      f.ball ?? 0,
      f.arrows.map((a) => [KINDS.indexOf(a.kind), ...a.pts.flat()]),
    ]),
  ];
}

/** Throws on a wrong shape; the result still has to pass isBoard(). */
function fromV1(data: unknown): unknown {
  const [court, frames] = data as [unknown, unknown[][]];
  return {
    v: 1,
    court: pick(COURTS, court),
    frames: frames.map(([players, ball, arrows]) => {
      const frame: Frame = {
        players: (players as unknown[][]).map(([team, x, y, label]) => {
          const p = { team: pick(TEAMS, team), at: [x, y] } as Player;
          if (label !== undefined) p.label = label as string;
          return p;
        }),
        arrows: (arrows as number[][]).map(([kind, ...xy]) => ({
          kind: pick(KINDS, kind)!,
          pts: Array.from({ length: Math.ceil(xy.length / 2) }, (_, i) => [
            xy[2 * i],
            xy[2 * i + 1],
          ]) as Pt[],
        })),
      };
      if (ball !== 0) frame.ball = ball as unknown as Pt;
      return frame;
    }),
  };
}

// ===== Bytes =====

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[\w-]+$/.test(text)) return null;
  const bin = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function deflate(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Null when the data is corrupt or inflates past `max` bytes. */
async function inflate(bytes: Uint8Array<ArrayBuffer>, max: number): Promise<string | null> {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return chunks.map((c) => decoder.decode(c, { stream: true })).join("") + decoder.decode();
}

// ===== Links =====

/** The newest version this code reads, and the one encode() writes. */
const LATEST = 1;

/** Works in the browser and in Node 22, so the build can write links too. */
export async function encode(board: Board): Promise<string> {
  return `${LATEST}.${toBase64Url(await deflate(JSON.stringify(toV1(board))))}`;
}

/**
 * True for a link from a newer version of the board than this code, which a
 * tab opened before a deploy can still be running. False for a broken link of
 * a version this code knows.
 */
export function isNewerLink(link: string): boolean {
  const dot = link.indexOf(".");
  const version = link.slice(0, dot);
  return dot > 0 && /^[1-9]\d*$/.test(version) && Number(version) > LATEST;
}

/** The board in a link, or null for anything that isn't a valid one. */
export async function decode(link: string): Promise<Board | null> {
  try {
    const dot = link.indexOf(".");
    const payload = link.slice(dot + 1);
    if (dot < 1 || payload.length > MAX_PAYLOAD) return null;

    switch (link.slice(0, dot)) {
      case "1": {
        const bytes = fromBase64Url(payload);
        const json = bytes && (await inflate(bytes, MAX_JSON));
        if (!json) return null;
        const board = fromV1(JSON.parse(json));
        return isBoard(board) ? board : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
