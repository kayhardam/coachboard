// A shared Coachboard link as a library item's drawing: the `board:` block of
// its Markdown file, with what the specialist has to fix (errors) or check
// (warnings), in Dutch, so Kay can pass them on. Pure; scripts/import-link.mjs
// is the shell around it (`npm run import-link -- "<link>"`).
//
// The link is read with decode() only, so it opens exactly as on the board.
// Nothing here changes the drawing: a sentence or the title only gets a
// no-break space between a number and "meter" (checkMeters()).

import { decode, isBoard, isNewerLink, type Arrow, type ArrowKind, type Board, type Frame, type Pt } from "./board/format";
import { pointAt } from "./board/geometry";
import { endOf } from "./board/moves";
import { ballProblems, breakableMeters, stepsHaveText } from "./library";

/** Two players closer than this (dm) stand on top of each other, unless the sentence asks for it. */
export const PLAYER_GAP = 20;
/** An arrow closer than this to a cone runs over it. */
export const CONE_GAP = 8;
/** An arrow closer than this to a player who isn't at its start or end runs through them. */
export const ARROW_GAP = 12;
/** A player closer than this to a cone stands on it. */
export const PLAYER_CONE_GAP = 14;
/** A dribble shorter than this is too short to see as one. */
export const MIN_DRIBBLE = 30;

export interface Imported {
  /** The board without its title, the sentences with their no-break spaces; null when the link can't be read. */
  board: Board | null;
  /** The `board:` block, as the items write it. */
  yaml: string;
  title: string;
  /** The sentence of each step. */
  texts: string[];
  /** Each "<number> meter" that got a no-break space. */
  meters: string[];
  errors: string[];
  warnings: string[];
}

const NBSP = " ";
const B64 = /[A-Za-z0-9_-]/;

/**
 * The link in what was pasted: everything after `#t=` of a board, viewer or
 * QR address, or the link on its own ("2.…"). Spaces and line breaks a mail
 * put in it go, and so does whatever follows it in a sentence (a full stop,
 * a bracket) or comes before it.
 */
export function findLink(input: string): string {
  let s = input.replace(/\s+/g, "");
  const hash = s.indexOf("#t=");
  if (hash >= 0) s = s.slice(hash + 3);
  else s = s.replace(/^[^0-9]+/, "");
  let end = s.length;
  while (end > 0 && !B64.test(s[end - 1]!)) end--;
  return s.slice(0, end);
}

/** A number and "meter" with a no-break space between them. */
const withMeters = (text: string) => text.replace(/\b(\d+) meter/g, `$1${NBSP}meter`);

// ===== Words =====

/** Each kind of arrow with its article, in the words of the board's Dutch tools. */
const KIND: Record<ArrowKind, [article: string, noun: string]> = {
  run: ["de", "loop"],
  pass: ["de", "pass"],
  dribble: ["de", "dribbel"],
  block: ["de", "sper"],
  shot: ["het", "schot"],
  bounce: ["de", "stuit"],
};
const kindOf = (kind: ArrowKind) => KIND[kind].join(" ");
const ORDINAL = ["eerste", "tweede", "derde", "vierde", "vijfde", "zesde", "zevende", "achtste", "negende", "tiende"];
const ordinal = (n: number) => ORDINAL[n - 1] ?? `${n}e`;

/** A distance in decimetres as metres with a comma: "1,6 m". */
export const metres = (dm: number) => `${(dm / 10).toFixed(1).replace(".", ",")} m`;
/** A limit in metres, without a needless ",0": "2 m", "0,8 m". */
const limit = (dm: number) => `${String(dm / 10).replace(".", ",")} m`;

/**
 * How a coach names a player in a step: their label, or, without one, their
 * place among the players of their team without a label, counted from the
 * nearer sideline ("de eerste van links", "de tweede verdediger van rechts");
 * players on one line count from the goal out.
 */
export function playerName(frame: Frame, i: number): string {
  const p = frame.players[i]!;
  if (p.label) return p.label;
  const [the, noun] = p.team === "a" ? ["de", "aanvaller"] : p.team === "d" ? ["de", "verdediger"] : ["het", "aanspeelpunt"];
  const peers = frame.players
    .map((q, j) => ({ q, j }))
    .filter(({ q }) => q.team === p.team && !q.label)
    .sort((a, b) => a.q.at[0] - b.q.at[0] || a.q.at[1] - b.q.at[1]);
  if (peers.length === 1) return `${the} ${noun}`;
  const fromLeft = peers.findIndex(({ j }) => j === i) + 1;
  const fromRight = peers.length + 1 - fromLeft;
  const [n, side] = fromLeft <= fromRight ? [fromLeft, "links"] : [fromRight, "rechts"];
  // An attacker without a label is just "de eerste van links", as in the items.
  return p.team === "a" ? `de ${ordinal(n)} van ${side}` : `${the} ${ordinal(n)} ${noun} van ${side}`;
}

// ===== Geometry =====

const SAMPLES = 64;
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
const curvePoints = (a: Arrow) => Array.from({ length: SAMPLES + 1 }, (_, k) => pointAt(a, k / SAMPLES));
const nearest = (a: Arrow, pt: Pt) => Math.min(...curvePoints(a).map((q) => dist(q, pt)));
const curveLength = (a: Arrow) => {
  const q = curvePoints(a);
  return q.slice(1).reduce((sum, p, k) => sum + dist(p, q[k]!), 0);
};

// ===== Checks =====

function errorsOf(board: Board): string[] {
  const errors: string[] = [];
  if (!isBoard(board)) errors.push("De tekening klopt niet: het bord keurt hem af.");
  if (!stepsHaveText(board)) {
    board.frames.forEach((f, s) => {
      if (!f.text?.trim()) errors.push(`Stap ${s + 1} heeft geen zin.`);
    });
  }
  for (const p of ballProblems(board)) {
    const frame = board.frames[p.step]!;
    const who = playerName(frame, p.player);
    errors.push(
      p.problem === "noBall"
        ? `Stap ${p.step + 1}: ${kindOf(p.kind)} van ${who}, maar ${who} heeft de bal dan niet.`
        : `Stap ${p.step + 1}: de bal in het doel gaat mee met ${who}. Laat hem in de volgende stap in het doel liggen.`,
    );
  }
  return errors;
}

function warningsOf(board: Board): string[] {
  const warnings: string[] = [];
  const last = board.frames.length - 1;
  /** Players too close to each other or on a cone, where they stand; with `moved`, only pairs and players of whom one moved. */
  const places = (frame: Frame, at: Pt[], where: string, moved = (_i: number) => true) => {
    at.forEach((a, i) => {
      for (let j = i + 1; j < at.length; j++) {
        if (!moved(i) && !moved(j)) continue;
        const d = dist(a, at[j]!);
        if (d < PLAYER_GAP) {
          warnings.push(`${where}: ${playerName(frame, i)} en ${playerName(frame, j)} staan ${metres(d)} van elkaar (minder dan ${limit(PLAYER_GAP)}).`);
        }
      }
      for (const cone of moved(i) ? board.cones : []) {
        const d = dist(a, cone);
        if (d < PLAYER_CONE_GAP) {
          warnings.push(`${where}: ${playerName(frame, i)} staat ${metres(d)} van een pion (minder dan ${limit(PLAYER_CONE_GAP)}).`);
        }
      }
    });
  };
  board.frames.forEach((frame, s) => {
    const step = `Stap ${s + 1}`;
    places(frame, frame.players.map((p) => p.at), step);
    // At the end of the last step, only who moved: the others were checked where they stand.
    const ends = frame.players.map((_, i) => endOf(frame, i));
    if (s === last) places(frame, ends, `${step}, aan het eind`, (i) => dist(ends[i]!, frame.players[i]!.at) > 0);
    for (const a of frame.arrows) {
      const kind = KIND[a.kind][1];
      const of = `${kindOf(a.kind)} ${a.from === undefined ? "zonder speler" : `van ${playerName(frame, a.from)}`}`;
      if (a.from === undefined) {
        warnings.push(`${step}: een ${kind} zonder speler. Is die per ongeluk losgesleept? Alleen een tweede keuze teken je zo.`);
      }
      for (const cone of board.cones) {
        const d = nearest(a, cone);
        if (d < CONE_GAP) warnings.push(`${step}: ${of} komt ${metres(d)} langs een pion (minder dan ${limit(CONE_GAP)}).`);
      }
      // A shot always goes past the goalkeeper.
      if (a.kind !== "shot") {
        const start = a.pts[0]!;
        const end = a.pts.at(-1)!;
        frame.players.forEach((p, i) => {
          if (i === a.from) return;
          // Whoever stands at its start or end (the receiver, the defender of a screen) belongs there.
          const spots = [p.at, endOf(frame, i)];
          if (spots.some((q) => dist(q, start) < ARROW_GAP || dist(q, end) < ARROW_GAP)) return;
          const d = nearest(a, p.at);
          if (d < ARROW_GAP) warnings.push(`${step}: ${of} komt ${metres(d)} langs ${playerName(frame, i)} (minder dan ${limit(ARROW_GAP)}).`);
        });
      }
      if (a.kind === "dribble") {
        const d = curveLength(a);
        if (d < MIN_DRIBBLE) warnings.push(`${step}: ${of} is ${metres(d)} lang (korter dan ${limit(MIN_DRIBBLE)}).`);
      }
    }
  });
  return warnings;
}

// ===== The block =====

/** A label as YAML: plain when it can't be read as anything but text ("LO"), quoted otherwise ("7"). */
const label = (s: string) => (/^[A-Za-z][A-Za-z0-9]*$/.test(s) && !/^(y|n|yes|no|on|off|true|false|null)$/i.test(s) ? s : JSON.stringify(s));
const pt = ([x, y]: Pt) => `[${x}, ${y}]`;
const pts = (list: Pt[]) => `[${list.map(pt).join(", ")}]`;

/** The `board:` block in YAML flow style, one player or arrow per line, as the items write it. JSON.stringify quotes each sentence. */
export function boardYaml(board: Board): string {
  const lines = ["board:", `  v: ${board.v}`, `  court: ${board.court}`, `  cones: ${pts(board.cones)}`, "  frames:"];
  for (const f of board.frames) {
    lines.push(`    - text: ${JSON.stringify(f.text ?? "")}`, "      players:");
    for (const p of f.players) {
      lines.push(`        - { team: ${p.team}, ${p.label === undefined ? "" : `label: ${label(p.label)}, `}at: ${pt(p.at)} }`);
    }
    lines.push(`      balls: ${pts(f.balls)}`);
    if (!f.arrows.length) lines.push("      arrows: []");
    else {
      lines.push("      arrows:");
      for (const a of f.arrows) {
        lines.push(`        - { kind: ${a.kind}, ${a.from === undefined ? "" : `from: ${a.from}, `}pts: ${pts(a.pts)} }`);
      }
    }
  }
  return lines.join("\n");
}

/** Reads a shared link (in any form findLink() takes) into the drawing of an item. */
export async function importLink(input: string): Promise<Imported> {
  const link = findLink(input);
  const read = /^\d+\.[A-Za-z0-9_-]+$/.test(link) ? await decode(link) : null;
  if (!read) {
    const error = !link
      ? "Geen link gevonden. Plak de link van Delen, of alles na #t=."
      : isNewerLink(link)
        ? "Deze link komt van een nieuwere versie van Coachboard. Haal de nieuwste code op en probeer het opnieuw."
        : "Deze link werkt niet. Vraag om een nieuwe.";
    return { board: null, yaml: "", title: "", texts: [], meters: [], errors: [error], warnings: [] };
  }
  const meters = [read.title ?? "", ...read.frames.map((f) => f.text ?? "")].flatMap(breakableMeters);
  const { title: _title, ...rest } = read;
  const board: Board = { ...rest, frames: read.frames.map((f) => (f.text === undefined ? f : { ...f, text: withMeters(f.text) })) };
  return {
    board,
    yaml: boardYaml(board),
    title: withMeters(read.title ?? ""),
    texts: board.frames.map((f) => f.text ?? ""),
    meters,
    errors: errorsOf(board),
    warnings: warningsOf(board),
  };
}
