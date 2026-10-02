import type { Board } from "./format";

/** Half court: six attackers against a 6-0 defence and its goalkeeper. */
export const defaultBoard: Board = {
  v: 1,
  court: "half",
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
      ball: [110, 122],
      arrows: [],
    },
  ],
};
