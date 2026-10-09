import type { Board } from "./format";

/** Half court: six attackers against a 6-0 defence and its goalkeeper, labelled in English. */
export const defaultBoard: Board = {
  v: 2,
  court: "half",
  cones: [],
  frames: [
    {
      players: [
        { team: "a", label: "LW", at: [8, 48] },
        { team: "a", label: "LB", at: [30, 118] },
        { team: "a", label: "CB", at: [100, 130] },
        { team: "a", label: "RB", at: [170, 118] },
        { team: "a", label: "RW", at: [192, 48] },
        { team: "a", label: "P", at: [100, 66] },
        { team: "d", label: "GK", at: [100, 8] },
        { team: "d", at: [22, 30] },
        { team: "d", at: [48, 58] },
        { team: "d", at: [80, 66] },
        { team: "d", at: [120, 66] },
        { team: "d", at: [152, 58] },
        { team: "d", at: [178, 30] },
      ],
      balls: [[110, 122]],
      arrows: [],
    },
  ],
};

/**
 * The labels of the default lineup per language, in the order of defaultBoard's
 * labelled players: left wing, left back, centre back, right back, right wing,
 * pivot, goalkeeper. A language without its own falls back to English.
 */
const labels: Record<string, string[]> = {
  nl: ["LH", "LO", "MO", "RO", "RH", "CL", "K"],
};

/** A fresh copy of the default lineup with the labels of `locale`. */
export function defaultBoardFor(locale: string): Board {
  const board = structuredClone(defaultBoard);
  const own = labels[locale];
  if (own) {
    let i = 0;
    for (const player of board.frames[0]!.players) {
      if (player.label !== undefined) player.label = own[i++]!;
    }
  }
  return board;
}

/** The starting lineups a new board offers. */
export const SETUPS = ["6-0", "5-1", "3-2-1", "2-lines", "3-lines"] as const;
export type SetupId = (typeof SETUPS)[number];

/** Where the six court defenders stand, per defence (the goalkeeper stays put). The middle one stands beside the pivot, not on them. */
const defences: Record<"5-1" | "3-2-1", [number, number][]> = {
  "5-1": [[16, 32], [50, 60], [118, 58], [150, 60], [184, 32], [100, 98]],
  "3-2-1": [[22, 30], [118, 58], [178, 30], [52, 84], [148, 84], [100, 104]],
};

/** Lines of three attackers without labels, a cone in front of each line, a ball with the first on the left. */
function lines(xs: number[], keeper: Board["frames"][0]["players"][0]): Board {
  const players = xs.flatMap((x) => [120, 145, 170].map((y) => ({ team: "a" as const, at: [x, y] as [number, number] })));
  return {
    v: 2,
    court: "half",
    cones: xs.map((x) => [x, 95] as [number, number]),
    frames: [{ players: [...players, keeper], balls: [[xs[0]! + 10, 120]], arrows: [] }],
  };
}

/** A starting lineup, made from the default lineup in the page's language (its labels stay). */
export function setup(id: SetupId, lineup: Board): Board {
  const board = structuredClone(lineup);
  const players = board.frames[0]!.players;
  if (id === "5-1" || id === "3-2-1") {
    const spots = defences[id];
    let i = 0;
    for (const p of players) if (p.team === "d" && p.label === undefined) p.at = [...spots[i++]!];
    return board;
  }
  const keeper = players.find((p) => p.team === "d" && p.label !== undefined)!;
  if (id === "2-lines") return lines([60, 140], keeper);
  if (id === "3-lines") return lines([40, 100, 160], keeper);
  return board;
}
