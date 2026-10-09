// One icon set for the whole site: 24×24 path data, drawn as a 2-unit stroke
// with round caps in currentColor (Icon.astro on content pages, inline <svg>
// in BoardEditor). Icons sit next to visible text and are decorative
// (aria-hidden); an icon-only button needs aria-label and title. No emoji.

// The icons BoardEditor draws. They are a separate object so the board's JS
// carries only these: a bundle keeps every key of an object it imports.
export const boardIcons = {
  // Board tools and actions
  move: "M12 3v18M3 12h18M12 3l-3 3m3-3 3 3m-3 15-3-3m3 3 3-3M3 12l3-3m-3 3 3 3m15-3-3-3m3 3-3 3",
  run: "M5 19 19 5m0 0h-8m8 0v8",
  pass: "M5 19 19 5m0 0h-8m8 0v8",
  dribble: "M4 18c2-1 1-4 3-5s3 1 5-1-0-4 2-5 3 0 5-3m0 0h-7m7 0v7",
  undo: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4",
  delete: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
  court: "M5 3h14v18H5zM9 3v3h6V3",
  share: "M12 3v12m0-12-4 4m4-4 4 4M5 13v7h14v-7",
  more: "M5 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 1 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 1 0 0-2z",
  // My boards
  plus: "M12 5v14M5 12h14",
  folder: "M3 6h6l2 2h10v11H3z",
  check: "m5 12 5 5 9-10",
  // The title (also on the home page, under How it works)
  draw: "M4 20h4L19 9l-4-4L4 16zm9-13 4 4",
} as const;

export const icons = {
  ...boardIcons,
  // Board actions the editor shows without an icon
  clear: "M19 20H9l-5-5 9-9 7 7-5 5m-7-7 7 7",
  courtFull: "M5 3h14v18H5zM5 12h14M9 3v3h6V3M9 21v-3h6v3",
  json: "M8 4H6v16h2m8-16h2v16h-2",
  qr: "M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h2v2h-2zm4 4h2v2h-2zm-4 2h2m2-6h2",

  // Tactic categories
  attack: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  defense: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3z",
  youth: "M12 21v-9m0 0C12 8 9.5 6 5 6c0 4 2.5 6 7 6zm0-2c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6",
  goalkeeping: "M3 20V5h18v15M3 10h18M3 15h18M9 5v15m6-15v15",

  // How it works, links
  link: "M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  phone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 16h2",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
} as const;

export type IconName = keyof typeof icons;
