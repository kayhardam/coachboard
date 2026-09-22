// Which locales exist lives in astro.config.mjs (read it via `astro:config/client`).
// This file holds the UI strings and what Astro's i18n config has no room for.

/** English is the source language: every key exists here. */
const en = {
  "a11y.skip": "Skip to content",
  "nav.label": "Main navigation",
  "nav.menu": "Menu",
  "nav.home": "Home",
  "nav.board": "Board",
  "nav.tactics": "Tactics",
  "cta.board": "Open the board",
  "nav.privacy": "Privacy",
  "footer.tagline":
    "The free digital coachboard for handball trainers. Draw a play, share a link or QR code, and your whole team has it on their phone.",
  "footer.site": "Site",
  "footer.madeBy": "Made by a handball trainer",
  "footer.language": "Language",
  "home.title": "Handball Coachboard: draw and share handball tactics",
  "home.description":
    "The free digital coachboard for handball trainers. Draw a play, share a link or QR code, and your whole team has it on their phone.",
  "home.heading": "Draw tactics. Share them. Win training.",
  "home.lead":
    "The free digital coachboard for handball trainers. Draw a play, share a link or QR code, and your whole team has it on their phone.",
  "home.note": "Free · No account · Built for phones",
  "privacy.title": "Privacy | Handball Coachboard",
  "privacy.description":
    "Handball Coachboard sets no cookies and collects no personal data. What the hosting provider sees, and how statistics would work.",
  "privacy.heading": "Privacy",
  "category.attack.label": "Attack",
  "category.attack.desc": "Fast breaks, build-up, powerplay, circulation",
  "category.attack.intro":
    "Attacking handball is about creating a gap and arriving in it at full speed. These plays cover the fast break and second wave, positional build-up against a set defense, crossing and circulation patterns, and what to do with a one-player advantage.",
  "category.defense.label": "Defense",
  "category.defense.desc": "6-0, 5-1, 3-2-1, man-to-man",
  "category.defense.intro":
    "A defense wins games when six players move as one line. Start with the 6-0, then add the offensive systems (5-1, 3-2-1 and man-to-man) once your team shifts together, communicates every switch, and never loses sight of the pivot.",
  "category.youth.label": "Youth",
  "category.youth.desc": "Age-appropriate drills for U10 up to U16",
  "category.youth.intro":
    "Young players need the right thing at the right age: catching, throwing and running games from U10, then real handball principles from U12 upward. These drills keep everyone moving, keep the ball in hand, and build habits that still hold up at senior level.",
  "category.goalkeeping.label": "Goalkeeping",
  "category.goalkeeping.desc": "Positioning, reflex drills, fast-break starts",
  "category.goalkeeping.intro":
    "The keeper is the first attacker. These sessions work on angle and positioning in the goal, reflex saves from close range, reading the shooter, and launching the fast break with the first pass out.",
  "notFound.title": "Page not found | Handball Coachboard",
  "notFound.description": "This page doesn't exist.",
  "notFound.heading": "Page not found",
  "notFound.body": "The page you were looking for doesn't exist or has moved.",
  "notFound.home": "Go to the home page",
  "board.title": "Handball tactics board: draw and share plays | Handball Coachboard",
  "board.description":
    "Free handball tactics board for your phone. Drag players, draw runs, passes and dribbles, and share the play as a link or QR code.",
  "board.heading": "Handball tactics board",
  "board.court": "Handball court",
  "board.noscript": "The board needs JavaScript. Here is the default lineup.",
  "board.tools": "Tools",
  "board.actions": "Actions",
  "board.tool.move": "Move",
  "board.tool.attack": "Attack",
  "board.tool.defence": "Defend",
  "board.tool.ball": "Ball",
  "board.tool.run": "Run",
  "board.tool.pass": "Pass",
  "board.tool.dribble": "Dribble",
  "board.undo": "Undo",
  "board.delete": "Delete",
  "board.clear": "Clear",
  "board.clearArrows": "Clear arrows and ball",
  "board.resetLineup": "Default lineup",
  "board.emptyCourt": "Empty court",
  "board.fullCourt": "Full court",
  "board.halfCourt": "Half court",
  "board.share": "Share",
  "board.qr": "QR code",
  "board.qrHint": "Scan with your phone's camera to open this play.",
  "board.close": "Close",
  "board.invalidLink": "This link couldn't be opened. Showing the default lineup.",
  "board.linkCopied": "Link copied.",
  "board.copyManually": "Copy this link:",
  "board.dismiss": "Dismiss",
} as const;

export type UiKey = keyof typeof en;
export type BoardKey = Extract<UiKey, `board.${string}`>;
export type BoardStrings = Record<BoardKey, string>;

/** Other languages may leave keys out; those fall back to English. */
const ui: Record<string, Partial<Record<UiKey, string>>> = { en };

export function t(locale: string, key: UiKey): string {
  return ui[locale]?.[key] ?? en[key];
}

/** The board editor's strings, passed as a prop so no dictionary ships to the browser. */
export function boardStrings(locale: string): BoardStrings {
  const keys = (Object.keys(en) as UiKey[]).filter((k): k is BoardKey => k.startsWith("board."));
  return Object.fromEntries(keys.map((k) => [k, t(locale, k)])) as BoardStrings;
}

/** Open Graph wants language_TERRITORY. */
export const ogLocale: Record<string, string> = {
  en: "en_GB",
};
