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
  "nav.about": "About",
  "nav.contact": "Contact",
  "footer.tagline":
    "Tactics board for handball coaches.",
  "footer.site": "Site",
  "footer.madeBy": "Made by a handball coach",
  "footer.language": "Language",
  "home.title": "Handball Coachboard: draw and share handball tactics",
  "home.description":
    "Tactics board for handball coaches. Draw a play and share it with a link or QR code. Your players open it without an app or account.",
  "home.heading": "Draw a play. Share it with your team.",
  "home.lead":
    "A tactics board for handball coaches. Your players see the play on their phone, through a link or QR code.",
  "home.note": "No account or app needed",
  "home.browse": "Browse tactics",
  "home.howTitle": "How it works",
  "home.howLead": "",
  "home.step1Title": "Draw your play.",
  "home.step1Body":
    "Drag your players into place and draw runs, passes and dribbles.",
  "home.step2Title": "Share it.",
  "home.step2Body": "Send the link to your team's group chat, or show the QR code in the sports hall.",
  "home.step3Title": "Your players open it.",
  "home.step3Body": "They tap the link or scan the code, and see the play on their own phone.",
  "home.libraryTitle": "Browse the tactics",
  "home.libraryLead": "Attacks and defenses, worked out in detail. Open one in the board and adapt it for your own team.",
  "home.allTactics": "All tactics",
  "home.ctaTitle": "Draw your first play.",
  "home.ctaBody": "Open the board in your browser. No account needed.",
  "privacy.title": "Privacy | Handball Coachboard",
  "privacy.description":
    "Handball Coachboard sets no cookies and has no accounts. Read what happens to your drawing, what Cloudflare sees and what the statistics measure.",
  "privacy.heading": "Privacy",
  "about.title": "About | Handball Coachboard",
  "about.description":
    "Handball Coachboard is a tactics board for handball coaches, made by a handball coach. What it does, and how to get in touch.",
  "about.heading": "About Handball Coachboard",
  "category.attack.label": "Attack",
  "category.attack.desc": "Fast break, second wave",
  "category.attack.intro":
    "Every attack shows who runs where, who gets the ball and where the gap opens. Open one in the board and adapt it for your team.",
  "category.defense.label": "Defense",
  "category.defense.desc": "6-0 defense",
  "category.defense.intro":
    "Every defense shows who covers which attacker, when to step out and how to shift together. Open one in the board and adapt it for your team.",
  "category.youth.label": "Youth",
  "category.youth.desc": "Age-appropriate drills for U10 up to U16",
  "category.youth.intro":
    "Young players need the right thing at the right age: catching, throwing and running games from U10, then real handball principles from U12 upward. These drills keep everyone moving, keep the ball in hand, and build habits that still hold up at senior level.",
  "category.goalkeeping.label": "Goalkeeping",
  "category.goalkeeping.desc": "Positioning, reflex drills, fast-break starts",
  "category.goalkeeping.intro":
    "The keeper is the first attacker. These sessions work on angle and positioning in the goal, reflex saves from close range, reading the shooter, and launching the fast break with the first pass out.",
  "tactics.title": "Handball tactics with diagrams | Handball Coachboard",
  "tactics.description":
    "Handball tactics for attack and defense, each with a diagram and the steps. Open one in the tactics board and adapt it for your team.",
  "tactics.heading": "Tactics",
  "tactics.lead":
    "Attacks and defenses, each with a diagram and the steps. Open one in the board and adapt it for your own team.",
  "tactics.categories": "Categories",
  "tactics.all": "All tactics",
  "category.title": "{label}: handball tactics | Handball Coachboard",
  "category.others": "Other categories",
  "category.cta": "Draw your own attack or defense",
  "category.ctaBody": "Share your drawing with your team, as a link or QR code.",
  "tactic.title": "{title} | Handball Coachboard",
  "tactic.breadcrumb": "Breadcrumb",
  "tactic.open": "Open in the board",
  "tactic.openHint": "Adapt it, then share it with your team as a link or QR code.",
  "tactic.steps": "Step by step",
  "tactic.coachingPoints": "Coaching points",
  "tactic.related": "Related tactics",
  "notFound.title": "Page not found | Handball Coachboard",
  "notFound.description": "This page doesn't exist.",
  "notFound.heading": "Page not found",
  "notFound.body": "The page you were looking for doesn't exist or has moved.",
  "notFound.home": "Go to the home page",
  "board.title": "Handball tactics board | Handball Coachboard",
  "board.description":
    "Tactics board for handball, on your phone. Draw runs, passes and dribbles, and share the play with a link or QR code.",
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
  // The *Short keys are the visible labels under the action icons, where a
  // button has about 48 px at 360 px wide (e2e/layout.spec.ts checks they fit);
  // the full text stays the button's title.
  "board.undoShort": "Undo",
  "board.deleteShort": "Delete",
  "board.clear": "Clear",
  "board.clearArrows": "Clear arrows and ball",
  "board.resetLineup": "Default lineup",
  "board.emptyCourt": "Empty court",
  "board.fullCourt": "Full court",
  "board.halfCourt": "Half court",
  "board.fullCourtShort": "Full",
  "board.halfCourtShort": "Half",
  "board.share": "Share",
  "board.qr": "QR code",
  "board.qrHint": "Scan this code with your camera to open the board.",
  "board.qrFailed": "The QR code isn't loading. Check your connection and try again.",
  "board.close": "Close",
  "board.invalidLink": "This link doesn't work; ask for a new one. You're seeing your own board.",
  "board.invalidLinkDefault":
    "This link doesn't work; ask for a new one. You're seeing the default lineup.",
  "board.linkCopied": "Link copied.",
  "board.copyManually": "Copy this link:",
  "board.dismiss": "Dismiss",
  "board.home": "Home",
} as const;

export type UiKey = keyof typeof en;
export type BoardKey = Extract<UiKey, `board.${string}`>;
export type BoardStrings = Record<BoardKey, string>;

/** Dutch. Its type requires every key, so no English shows under /nl/. */
const nl: Record<UiKey, string> = {
  "a11y.skip": "Naar de inhoud",
  "nav.label": "Hoofdmenu",
  "nav.menu": "Menu",
  "nav.home": "Home",
  "nav.board": "Bord",
  "nav.tactics": "Tactieken",
  "cta.board": "Open het bord",
  "nav.privacy": "Privacy",
  "nav.about": "Over",
  "nav.contact": "Contact",
  "footer.tagline":
    "Tactiekbord voor handbaltrainers.",
  "footer.site": "Site",
  "footer.madeBy": "Gemaakt door een handbaltrainer",
  "footer.language": "Taal",
  "home.title": "Handball Coachboard: handbaltactieken tekenen en delen",
  "home.description":
    "Tactiekbord voor handbaltrainers. Teken een aanval en deel hem met een link of QR-code. Je spelers openen hem zonder app of account.",
  "home.heading": "Teken een aanval. Deel hem met je team.",
  "home.lead":
    "Een tactiekbord voor handbaltrainers. Je spelers zien de aanval op hun telefoon, via een link of QR-code.",
  "home.note": "Geen account of app nodig",
  "home.browse": "Bekijk tactieken",
  "home.howTitle": "Zo werkt het",
  "home.howLead": "",
  "home.step1Title": "Teken je aanval.",
  "home.step1Body":
    "Sleep je spelers op hun plek en teken loopacties, passes en dribbels.",
  "home.step2Title": "Deel hem.",
  "home.step2Body": "Stuur de link in de appgroep van je team, of laat de QR-code zien in de zaal.",
  "home.step3Title": "Je spelers openen hem.",
  "home.step3Body": "Ze tikken op de link of scannen de code, en zien de aanval op hun eigen telefoon.",
  "home.libraryTitle": "Blader door de tactieken",
  "home.libraryLead": "Uitgewerkte aanvallen en verdedigingen. Open er een in het bord en pas die aan voor je eigen team.",
  "home.allTactics": "Alle tactieken",
  "home.ctaTitle": "Teken je eerste aanval.",
  "home.ctaBody": "Open het bord in je browser, zonder account.",
  "privacy.title": "Privacy | Handball Coachboard",
  "privacy.description":
    "Handball Coachboard zet geen cookies en heeft geen accounts. Lees wat er met je tekening gebeurt, wat Cloudflare ziet en wat de statistieken meten.",
  "privacy.heading": "Privacy",
  "about.title": "Over | Handball Coachboard",
  "about.description":
    "Handball Coachboard is een tactiekbord voor handbaltrainers, gemaakt door een handbaltrainer. Wat het doet, en hoe je contact opneemt.",
  "about.heading": "Over Handball Coachboard",
  "category.attack.label": "Aanval",
  "category.attack.desc": "Break, tweede golf",
  "category.attack.intro":
    "Elke aanval laat zien wie waar loopt, wie de bal krijgt en waar het gat valt. Open er een in het bord en pas die aan voor je team.",
  "category.defense.label": "Verdediging",
  "category.defense.desc": "6-0-dekking",
  "category.defense.intro":
    "Elke verdediging laat zien wie welke aanvaller dekt, wanneer je uitstapt en hoe je samen schuift. Open er een in het bord en pas die aan voor je team.",
  "category.youth.label": "Jeugd",
  "category.youth.desc": "",
  "category.youth.intro":
    "Jonge spelers hebben het juiste op de juiste leeftijd nodig: vang-, gooi- en loopspelletjes in de E-jeugd, en echte handbalprincipes vanaf de D-jeugd. Deze oefeningen houden iedereen in beweging, met de bal in de hand, en bouwen gewoontes op die bij de senioren nog staan.",
  "category.goalkeeping.label": "Keepers",
  "category.goalkeeping.desc": "",
  "category.goalkeeping.intro":
    "De keeper is de eerste aanvaller. Deze trainingen werken aan hoek en positie in het doel, reflexreddingen van dichtbij, de schutter lezen, en de break starten met de eerste pass.",
  "tactics.title": "Handbaltactieken met tekeningen | Handball Coachboard",
  "tactics.description":
    "Handbaltactieken voor aanval en verdediging, elk met een tekening en de stappen. Open er een in het tactiekbord en pas die aan voor je team.",
  "tactics.heading": "Tactieken",
  "tactics.lead":
    "Uitgewerkte aanvallen en verdedigingen, elk met een tekening en de stappen. Open er een in het bord en pas die aan voor je eigen team.",
  "tactics.categories": "Onderwerpen",
  "tactics.all": "Alle tactieken",
  "category.title": "{label}: handbaltactieken | Handball Coachboard",
  "category.others": "Andere onderwerpen",
  "category.cta": "Teken je eigen aanval of verdediging",
  "category.ctaBody": "Deel je tekening met je team, als link of QR-code.",
  "tactic.title": "{title} | Handball Coachboard",
  "tactic.breadcrumb": "Kruimelpad",
  "tactic.open": "Open in het bord",
  "tactic.openHint": "Pas hem aan en deel hem met je team als link of QR-code.",
  "tactic.steps": "Stap voor stap",
  "tactic.coachingPoints": "Aandachtspunten",
  "tactic.related": "Verwante tactieken",
  "notFound.title": "Pagina niet gevonden | Handball Coachboard",
  "notFound.description": "Deze pagina bestaat niet.",
  "notFound.heading": "Pagina niet gevonden",
  "notFound.body": "De pagina die je zocht bestaat niet of is verhuisd.",
  "notFound.home": "Naar de startpagina",
  "board.title": "Tactiekbord voor handbal | Handball Coachboard",
  "board.description":
    "Tactiekbord voor handbal op je telefoon. Teken loopacties, passes en dribbels, en deel de aanval met een link of QR-code.",
  "board.heading": "Tactiekbord voor handbal",
  "board.court": "Handbalveld",
  "board.noscript": "Het bord heeft JavaScript nodig. Hier is de standaardopstelling.",
  "board.tools": "Gereedschap",
  "board.actions": "Acties",
  "board.tool.move": "Schuif",
  "board.tool.attack": "Aanval",
  "board.tool.defence": "Dekker",
  "board.tool.ball": "Bal",
  "board.tool.run": "Loop",
  "board.tool.pass": "Pass",
  "board.tool.dribble": "Dribbel",
  "board.undo": "Ongedaan maken",
  "board.delete": "Verwijderen",
  "board.undoShort": "Herstel",
  "board.deleteShort": "Weg",
  "board.clear": "Wissen",
  "board.clearArrows": "Pijlen en bal wissen",
  "board.resetLineup": "Standaardopstelling",
  "board.emptyCourt": "Leeg veld",
  "board.fullCourt": "Heel veld",
  "board.halfCourt": "Half veld",
  "board.fullCourtShort": "Heel",
  "board.halfCourtShort": "Half",
  "board.share": "Delen",
  "board.qr": "QR-code",
  "board.qrHint": "Scan deze code met je camera om het bord te openen.",
  "board.qrFailed": "De QR-code laadt niet. Controleer je internet en probeer het opnieuw.",
  "board.close": "Sluiten",
  "board.invalidLink": "Deze link werkt niet; vraag om een nieuwe. Je ziet je eigen bord.",
  "board.invalidLinkDefault":
    "Deze link werkt niet; vraag om een nieuwe. Je ziet de standaardopstelling.",
  "board.linkCopied": "Link gekopieerd.",
  "board.copyManually": "Kopieer deze link:",
  "board.dismiss": "Sluiten",
  "board.home": "Home",
};

/** A language may leave keys out; those fall back to English. Dutch has them all. */
const ui: Record<string, Partial<Record<UiKey, string>>> = { en, nl };

/** Fills `{name}` placeholders from vars. */
export function t(locale: string, key: UiKey, vars?: Record<string, string>): string {
  const text: string = ui[locale]?.[key] ?? en[key];
  return vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match) : text;
}

/** The board editor's strings, passed as a prop so no dictionary ships to the browser. */
export function boardStrings(locale: string): BoardStrings {
  const keys = (Object.keys(en) as UiKey[]).filter((k): k is BoardKey => k.startsWith("board."));
  return Object.fromEntries(keys.map((k) => [k, t(locale, k)])) as BoardStrings;
}

/** Open Graph wants language_TERRITORY. */
export const ogLocale: Record<string, string> = {
  en: "en_US",
  nl: "nl_NL",
};
