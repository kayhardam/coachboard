# Handball Coachboard

Static Astro 7 site for handball coaches. The product is the tactics board at `/en/board/`; the content pages lead to it. `CLAUDE.md` is a symlink to this file. `e2e/`, `src/components/board/` and `src/lib/board/` have an `AGENTS.md` of their own (with the same symlink), for the rules that only matter there.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. There is no page at `/` locally; open `/nl/` or `/en/`. |
| `npm run verify` | What CI runs (`.github/workflows/ci.yml`, on pull requests and pushes to `main`): `astro check` + `svelte-check` → `vitest run` → `astro build` → `node scripts/check-links.mjs` → `node scripts/check-budget.mjs`. Must be green before every commit. |
| `npm run budget` | The size budgets against the current `dist/` (run `npm run build` first): a table of each measured size next to its budget. |
| `npm run check` / `test` / `build` | The separate steps. `astro check` doesn't type-check `.svelte` files, so `check` also runs `svelte-check --fail-on-warnings`. |
| `npx vitest run src/lib/board/format.test.ts` | One test file; add `-t "<test name>"` for one test. |
| `npm run e2e` | End-to-end tests (Playwright) in mobile Chromium and WebKit. Builds, then serves `dist/` with `wrangler dev` on port 8787. Outside CI it reuses a server already on that port and skips the build, so stop a `wrangler dev` of your own first. A separate CI job, not part of `verify`. First time: `npx playwright install chromium webkit`. |
| `npx playwright test e2e/board.spec.ts` | One e2e file; add `-g "<test name>"` for one test, `--project=iphone` or `--project=android` for one browser. |
| `E2E_BASE_URL=https://handballcoachboard.com npx playwright test e2e/security.spec.ts` | An e2e file against a deployed site instead of `wrangler dev`. Run `npm run build` on the deployed commit first: the page list comes from `dist/`. |
| `node scripts/og-default.mjs nl` | Re-renders a language's default share image (`public/og-default-nl.png`; `en` is `og-default.png`). One-off, with local fonts; commit the PNG. |
| `node scripts/favicons.mjs` | Renders `public/favicon.ico` and `public/apple-touch-icon.png` from `public/favicon.svg` (the brand mark). One-off; commit the results. |

Commit only when `npm run verify` exits with code 0. Check the exit code itself, not the output: a pipe through `tail` or `head` hides a failure.

Astro needs Node 22.23.4 or newer (`engines` in `package.json`). CI runs on a fixed `ubuntu-24.04`; moving to a newer runner happens on purpose, in its own PR.

When starting the dev server as an agent, use background mode: `npx astro dev --background`, and manage it with `npx astro dev stop`, `npx astro dev status` and `npx astro dev logs`.

## Code and tests

- Tests sit next to the code: `*.test.ts` in `src/`, `*.test.mjs` in `scripts/`.
- Vitest runs through Astro's Vite config (`getViteConfig` in `vitest.config.ts`), so a test can import a `.svelte` file and render it with `svelte/server` (see `Court.test.ts`).
- `src/lib/` is plain TypeScript with no `astro:` imports, so vitest can test it. Code that needs `astro:content` goes in `src/data/` and calls into `src/lib/`: `src/data/library.ts` loads the collection and runs `checkLibrary()` from `src/lib/library.ts`.
- `src/data/categories.ts` must not import from `astro:` either, because `src/content.config.ts` imports it.
- End-to-end tests are in `e2e/*.spec.ts`, with shared steps in `e2e/helpers.ts`. Their rules (the tap budget, the beacon stub, how to find buttons) are in `e2e/AGENTS.md`.

## URLs and routing

- **Trailing slash everywhere.** `trailingSlash: "always"`: every internal link, canonical and sitemap entry ends in `/`. Build links with `getRelativeLocaleUrl(locale, "privacy/")` from `astro:i18n`, not by hand.
- **Every language has a prefix** (`/en/`, `/nl/`, later `/de/`). Pages live under `src/pages/[lang]/` and export `getStaticPaths = localeParams`. `404.astro` is the only page outside `[lang]`.
- **`/` has no page.** Cloudflare redirects it to `/nl/` with a 302 (`public/_redirects`), because the first users are Dutch; Astro's own root redirect is off. `x-default` points at the English page, not at `/`.
- **Locales are configured once**, in the `locales` map in `astro.config.mjs` (it feeds both Astro's i18n and the sitemap's hreflang). `src/i18n/locales.ts` exposes them typed.
- **Only link to pages that exist.** `scripts/check-links.mjs` fails the build on a missing target or a page link without a trailing slash. It also checks own-origin URLs in `href`, `src` and `content`, so canonical, `og:image` and hreflang are covered.

## Layout, SEO and text

- Every page renders through `src/layouts/BaseLayout.astro` with a real `title` and `description`. It owns the whole `<head>`:
  - canonical and `og:url` from `site` + the page path;
  - absolute `og:image`, always a 1200×630 PNG: the language's default (`/og-default.png` for English, `/og-default-<lang>.png` for the others) or a library item's own `og.png` on its page. Their middle 630×630 square must work on its own: chat apps crop to it;
  - `lang` and `og:locale` from the page's locale;
  - hreflang for each language in `languages` (every language unless the page passes fewer, as library item and category pages do) + `x-default` to the English page. Translations share the path after the prefix. A page in one language (a Dutch-only item) has no hreflang, and `e2e/i18n.spec.ts` expects it that way;
  - `noindex` (the 404, `board/link/`, `board/qr/`) drops canonical, `og:url` and hreflang.
- `BaseLayout` renders `Header`, `<main id="main">` and `Footer`. With `fullscreen` (the board pages) the body fills the viewport and there is no site header or footer: the board has its own title bar. The footer has the language links on every content page; a language the page doesn't exist in links to its home page.
- `404.astro` is one page for the whole site (the host serves `dist/404.html` for any missing path), so it shows the text in every language.
- Menu and footer links come from `src/data/nav.ts`. Labels and short page texts come from `t(locale, key)` in `src/i18n/ui.ts`; `t(locale, key, { title })` fills `{title}` placeholders.
- The site owner's name, website and contact address are in `src/data/site.ts` (about and privacy pages).
- English is the source dictionary. A language may leave keys out (they fall back to English per key), but a launched one shouldn't: Dutch is typed `Record<UiKey, string>`, so `npm run check` fails on a missing key.
- Long page text (about, privacy) lives per language in `src/i18n/pages/<page>/<lang>.astro`; the page in `src/pages/[lang]/` keeps the layout and styles (with `:global()`, since scoped styles don't reach a child component). `pageText()` fails the build for a language without its file, so no English shows under `/nl/`.
- Board labels must fit: a tool has about 40 px for its label on a 360 px phone, and Share's label sits in the title bar beside the title. Undo and More show only their icon, except in landscape (`.label`). `e2e/layout.spec.ts` fails on a label cut off by its ellipsis, per language, in portrait, landscape and wide.
- Astro's HTML compression drops a line break between text and an inline tag on the next line ("See the" + newline + `<a>` renders as "See the<a>"). Start the tag on the same line as the text before it.

## Copy

New or changed site text is agreed with Kay first. Take it over literally. If a text you need isn't agreed yet, ask. If an agreed text breaks a rule below, say so instead of changing it.

- Say what the board does, in a coach's words. No slogans. One thought per sentence.
- The site's full name is "Handball Coachboard". In running text and on kayhardam.dev, "Coachboard" is its short name.
- Promise only what exists and what has been measured. No "always" or "never" about what is free, about accounts, or about what we see.
- "Gratis"/"free" appears in one place: the "Free, without an account" block on the about page (`src/i18n/pages/about/<lang>.astro`). Elsewhere, say what the board does; "no account or app needed" is fine.
- Text that appears on every board says "the board" (`het bord`), not "the attack": a board can show a defense too.
- Tactics and drills: the steps say who does what; the coaching points are what you call out in the sports hall. The home and about pages mention drills (`oefeningen`).
- Privacy: don't say we collect no personal data. Cloudflare processes IP addresses, and an email is personal data too.
- Dutch: "6-0-dekking", not "6-0-verdediging". `handbaltrainer` is right in Dutch.
- New library items (tactics and drills) are written in Dutch only. English versions follow once the first user who needs English shows up. UI strings stay in both languages.
- English follows the Dutch, with American spelling, like the URLs (`/defense/`). A coach is a "coach", never a "trainer". "Teken een aanval" is "draw a play"; overviews and categories say "attack". Balwinst = steal, opbouwers = back court players, cirkelloper = pivot, hoek = wing, de 6 meter = the goal area, de 9 meter = the free-throw line. Sper = screen: the attacking action (an attacker, usually the pivot, sets it); "blok" is defensive (blocking a shot), so the arrow is never "blok". In code it stays `block` (the link format).

## Styling

- **Global CSS is two files**, imported once by `BaseLayout`:
  - `src/styles/tokens.css`: custom properties;
  - `src/styles/base.css`: reset, typography, focus ring, `.container`, `.btn`, `.btn-primary`, `.btn-secondary`.
- **Everything else is a scoped `<style>`** in the component or page. No inline `style` attributes.
- **Mobile-first.** Base styles are for phones. Wider layouts go in `@media (min-width: 560px)` or `@media (min-width: 860px)`, and only those two. The exceptions are on the board (`BoardEditor.css`, `BoardPage.astro` and the viewer's `BoardViewer.css`):
  - a phone in landscape: `@media (orientation: landscape) and (max-height: 559px)`;
  - wide screens: `@media (min-width: 860px) and (min-height: 560px)`, so a large phone in landscape (863 px wide) keeps the landscape layout;
  - container queries where a bar's own width decides, not the screen's: the title shows only its pencil below 60 px of room (on the title button); New step shows only its plus in a step bar under 340 px with four steps, or under 420 px with six (`.steps`, inside `@media not` the wide layout); the viewer's Edit a copy under 344 px of title bar, and its controls drop their arrows under 420 px and tighten under 345 px. One height query: `@container editor (max-height: 334px)` gives a landscape sentence two lines.
- **Green behind or as text** uses `--color-accent-dark` (5.0:1 on white). `--color-accent` is for fills and icons only (3.3:1).
- **Touch targets** are at least `var(--tap)` (44px) high.
- **The narrow-screen menu** is a `<details>` element, without JavaScript. Content pages ship no JS: `scripts/check-budget.mjs` fails on any `<script>` (JSON-LD excepted), `<astro-island>` or modulepreload outside the board pages (see "Board pages" under The board). On those, the only script from another origin it allows is the statistics beacon, once.
- **Icons** come from one set in `src/lib/icons.ts` (24×24, 2-unit stroke, round caps, `currentColor`), drawn with `Icon.astro` on content pages and inline in `BoardEditor`. No emoji anywhere in the UI.
  - An icon next to visible text is decorative (`aria-hidden`, which `Icon.astro` sets). An icon-only button needs `aria-label` and `title`.
  - Icons take their colour from the text: `--color-accent-dark` when they carry meaning. In cards they sit on a 44×44 tile with `--color-accent-soft` behind them.
  - Size an icon with `font-size` on its wrapper; it is 1.25em.
  - `BoardEditor` imports only `boardIcons`, so the board's JS carries only those (a bundle keeps every key of an object it imports). A new icon for the board goes in `boardIcons`; `icons` spreads it for `Icon.astro`.

## The board

Code: `src/lib/board/` (plain TypeScript, unit-tested) and `src/components/board/` (Svelte 5).

- **Coordinates:** whole decimetres on a portrait court with the goal at the top. `x` runs 0–200 (sideline to sideline), `y` runs 0–400 from the goal line; a half court shows `y` 0–200.
- **`format.ts` is a contract.** Links look like `2.<payload>` (and `1.<payload>` before phase 11) and end up in QR codes and team chats, so every version must decode forever.
  - Never edit the files in `src/lib/board/fixtures/`; the tests decode them. `v1-*` hold a version 1 board, `v2-*` a version 2 board; `export/` holds an exported file of My boards (`src/lib/board/AGENTS.md`).
  - `encode()` writes version 2 (`LATEST`); `decode()` has a reader per version. The version 1 reader is unchanged: `toBoard()` turns what it reads into a version 2 board with the same drawing. `toBoard()` also reads boards saved by earlier versions (`localStorage`, `#own=`), so use it, not `isBoard()`, for anything that may be older.
  - A new format gets a new prefix (`3.`) and its own reader in `decode()`, next to the others. Raise `LATEST` with it: `encode()` writes that version, and `isNewerLink()` treats anything above it as a link from newer code.
  - **Any change an older reader would refuse is a new format**: a higher limit, a new kind of arrow or team, the `-1` of A+, a change to what `settle()` or `isBoard()` accept. Inside the same prefix, a tab opened before the deploy shows "broken link" instead of reloading. My boards keeps what it can't read, so an old tab or a rollback doesn't delete newer boards (`src/lib/board/AGENTS.md`); ship a change to that one deploy before a new format needs it. Version 2 keeps room for a player off the court in a step (A+): a `-1` in place of a position, refused for now.
  - To add a fixture, write `{ link: await encode(board), board }` once and commit it. Keep fixtures well inside the limits, so a tighter limit never means editing one.
  - **The model:** one lineup for all steps (`isBoard()` checks every step has the same players, teams and labels), `balls` as a list, `cones` per board, a `title` and a `text` per step. A player's team is `a`, `d` or `p` (a passer, aanspeelpunt, without a label).
  - **Arrows of a player:** an arrow with `from` belongs to that player and starts where they are by then: where they stand, or where their last run, dribble or block in that step ended, in drawing order. The link keeps the player instead of the start point. `settle()` puts the starts in place; edit operations and readers call it, and `isBoard()` rejects a board that isn't settled. A shot always has a player and ends in the goal nearest the shooter, on the left, in the middle or on the right (the link keeps only the side). A bounce is a pass; the board draws where it touches the floor.
  - **Limits:** `MAX_STEPS`, `MAX_TEXT`, `MAX_TITLE`, `MAX_BALLS` and `MAX_CONES` (decision 3, in `docs/metingen.md`, phase 11). The largest play within them must fit in QR version `QR_VERSION` (`format.test.ts`, `largestBoard()`: the steps, title and sentences at their limits, with one ball and no cones). A limit grows only as a new format (see above), and never gets tighter: that breaks shared boards. `decode()` reads up to `MAX_PAYLOAD` (10,000 characters): the most the limits allow, eight steps of noise, is about 8,000, and `format.test.ts` proves it opens.
  - The budget test keeps a full lineup (7+7 players, ball, 6 arrows) at ≤ 300 characters.
  - `isBoard()` is hand-written so the client bundle needs no Zod; the content schema reuses it.
- **`edit.ts` is pure:** every operation returns a new board. Where pieces go within a step (`endOf()`, `ballTrips()`, `ballsAfter()`) is in `moves.ts`, which `edit.ts` and `play.ts` both use, so a page that only plays a board needs none of the editing operations. The editor keeps the board in `$state.raw`, and undo is a list of earlier boards. The editor edits one step at a time: every operation on pieces, arrows and balls takes the step (`step`); adding or removing a player, changing a team, cones and the court size go to every step. A change in a step carries on into the later ones (`follow()`): a player (or ball) who stood where they ended the step before moves along, one moved there by hand keeps their place. The steps:
  - `addStep()` (New step) inserts a step after the given one: everyone where they end it (`endOf()`), the balls where they end it (`ballsAfter()`: with whoever has one, within 26 dm; with a pass, bounce or shot to its end, beside whoever stands there; after a shot, in the goal), no arrows, no sentence. Up to `MAX_STEPS`;
  - `removeStep()` keeps at least one; `setText()` keeps a sentence as one trimmed line of at most `MAX_TEXT`, like `setTitle()`. An arrow drawn from a player gets `from`; dragging the whole arrow lets go of the player, and its start handle, let go on a player, gives the arrow to them. An arrow of a player has no start handle (a drag there moves the player).
- **`Court.svelte` stays pure SVG**, with no browser APIs, so Astro can render it without JS (the home page, the board's fallback, the steps on tactic pages and their thumbnails). Pieces carry `data-kind` and `data-index`; the editor finds them with event delegation. Colours are SVG attributes, not CSS variables, so `courtPng()` can render it to a PNG on the server. From step 2 on (`frame`), it draws where the players who moved stood in the step before: a thin grey dotted line and ring (`.trails`), without a head, so it doesn't look like a pass or a bounce; under the arrows and players, without `data-kind` and with `pointer-events="none"`, so it can't be tapped.
- **Board pages:** three per language, each with the statistics beacon:
  - `/<lang>/board/`: the editor (`src/components/board/BoardPage.astro`, used by `src/pages/[lang]/board.astro`, which adds the workers.dev redirect). Old links to `/board/#t=…` and "Open in the board" from the library open here (decision 12);
  - `/<lang>/board/link/` and `/<lang>/board/qr/`: the viewer (`src/components/board/ViewerPage.astro`), where Share and the QR code point, so the statistics count opened shared boards per channel (the beacon drops `?` and `#`, so only a path can tell them apart). They are `noindex` and left out of the sitemap (`filter` in `astro.config.mjs`);
  - these are the only pages that ship JS. `isBoard` in `scripts/check-budget.mjs` and `e2e/security.spec.ts` lists them; `isViewer` gives the viewer's pages their own budgets.
- **`BoardEditor.svelte`:**
  - it runs `client:only` on the editor's page only;
  - its JS is its own entry chunk plus the chunk it shares with the viewer: the `board` group in `codeSplitting` in `astro.config.mjs` (client build only) holds the Svelte runtime, Astro's Svelte renderer, `Court.svelte` and what reads and plays a board (`format`, `geometry`, `moves`, `play`, `newer`, `viewerIcons`). The editor's own modules stay out of it, so the viewer never loads them. A module both use must fall in the group, or it becomes a chunk of its own and costs a request and import lists. What must load later stays out of it;
  - every board page preloads the JS it loads at once: Astro writes no `modulepreload` for an island, so the `modulepreload` integration in `astro.config.mjs` (`scripts/modulepreload.mjs`) adds one per file to the `<head>` after the build, and `e2e/layout.spec.ts` checks it. Without them the browser found the board's JS only after the island's inline script ran (after the CSS), and its chunk a round trip later (phase 15-1 in `docs/metingen.md`);
  - the QR code loads later: `src/lib/board/qr.ts` re-exports only `renderSVG` from `uqr`, so the lazy chunk drops the rest of `uqr`. Import it through that module, never `import("uqr")` directly; the editor fetches it once the board is up, so it still works offline;
  - the title bar, the tools, the steps, Play, the layouts and what saves when: `src/components/board/AGENTS.md`; My boards, export and import: `src/lib/board/AGENTS.md`.
- **`BoardViewer.svelte`** (phase 15, decisions K1–K13 in the product plan; it runs `client:only` on the viewer's pages): its behavior is in `src/components/board/AGENTS.md`.
- **Statistics:** Cloudflare Web Analytics, on the board pages only (`src/components/Beacon.astro`, token and URLs in `src/data/analytics.ts`). The privacy page names it and says what it sends.
  - It sits last in `<body>` as `type="module"`, the form of Cloudflare's snippet: deferred like `defer`, and fetched with CORS (Cloudflare sends `Access-Control-Allow-Origin: *`; the stub in `e2e/helpers.ts` does too). The editor loads through `<astro-island>` and a dynamic import, which never wait for it; `e2e/analytics.spec.ts` holds the beacon back and checks the board still works.
  - `"spa": false` in `data-cf-beacon`: otherwise, in Chromium, the beacon counts every `history.replaceState()` (each edit) as a page view.
  - Never send board data to it: no `#t=` in a path, no custom events.
- **Moved from workers.dev:** a `<script>` in `board.astro` sends the board on `coachboard.hardamkay.workers.dev` (that exact host, not the preview URLs) to the same path on `site`, keeping `#t=`.
  - Without `#t=`, it brings that origin's saved board along as `#own=<URI-encoded JSON>`. `localStorage` belongs to one origin, so a server redirect would leave it behind.
  - The editor keeps an `#own=` board (read with `toBoard()`: it is a version 1 board) as your own and saves it, but only when the new domain has no boards yet and it isn't an untouched default lineup; otherwise it ignores it.
  - Content pages don't redirect (they ship no JS); their canonical already points at the domain.
  - `e2e/move.spec.ts` serves the three hosts from `wrangler dev` with `context.route()`.
- **Testing in a browser:** `npm run e2e` for the core flow; by hand, the Chrome extension, or headless Chrome over the DevTools protocol with `Emulation.setTouchEmulationEnabled` and `Input.dispatchTouchEvent`. Call `Page.bringToFront` first; a background tab ignores touch input.
- **Measuring against a local build** (`wrangler dev`, a copy of the repo): block the statistics beacon, so no test traffic reaches the real dashboard. Lighthouse: add `--blocked-url-patterns="*cloudflareinsights.com*"` to every run. Your own Playwright scripts: route every other host (`context.route((url) => url.hostname !== "127.0.0.1", …)`), answer `beacon.min.js` with an empty script (CORS `*`) and abort the rest, as `stubBeacon()` in `e2e/helpers.ts` does for the tests.

## Library content

Tactics and drills (phase 16; decisions L1–L13 in the product plan, and Kay's decisions of 22 and 23 October 2026 for 16-3).

- **One collection, `library`, one Markdown file per item and language:** `src/content/library/<lang>/<slug>.md`, with its `type` (`tactic` or `drill`) in the frontmatter. The entry id is `<lang>/<slug>`; a tactic's page is `/<lang>/tactics/<slug>/`, a drill's `/<lang>/drills/<slug>/`. A translation gets the same file name in another language folder, with the same type. Path segments and slugs are English in every language (`/nl/tactics/<slug>/`).
- **Only the type is in the URL, not the category,** so an item can change category without moving. Category pages share the level (`/<lang>/tactics/attack/`), so `checkLibrary()` fails the build on a slug that equals a category. The same under `drills/`.
- **A page that moves keeps its old URL working:** a 301 in `public/_redirects` (with and without the trailing slash, and its `og.png`) and a test in `e2e/routing.spec.ts`. The tactic pages moved from `tactics/<category>/<slug>/` in phase 10.
- **The schema** is in `src/content.config.ts` (a `discriminatedUnion` on `type`):
  - `title`: at most `MAX_TITLE`, because "Open in the board" gives it to the board;
  - `category`: one of `categorySlugs`;
  - `ages`: a run of `AGES` without a gap, youngest first; the page shows the first and the last ("C-jeugd t/m senioren");
  - `level`: one of `LEVELS` (basic, intermediate, advanced);
  - `summary`: at least 50 characters, and also the meta description;
  - `coachingPoints`: at most 6 points, like every list (more goes in the Markdown body);
  - `related`: at most 3 full ids in the same language, e.g. `en/fast-break-second-wave`, of any type ("See also");
  - `board`: checked with `isBoard()`, with a sentence in every step (`frames[i].text`, `stepsHaveText()`) and no `title` of its own.
  - a drill also has `goal` (one or two sentences), `organization` (`players`, `equipment`, `space`: one sentence each) and the lists `rules`, `easier`, `harder` and `mistakes`;
  - The Markdown body is optional extra text below the steps.
- **The build fails** on:
  - an invalid board, a step without its sentence, a board with a title, an unknown category, age group or level (the schema);
  - from `checkLibrary()` in `src/lib/library.ts`, called by `src/data/library.ts`: a `related` that doesn't exist (`reference()` only logs it) or points at itself or another language, a file outside a language folder, a slug that is a category, age groups out of order or with a gap, a translation of another type, or a translation that draws something else (`sameDrawing()`: the same steps, places and arrows; only labels and sentences differ);
  - from `checkBalls()` in `src/lib/library.ts`: a pass, bounce, shot or dribble of a player who doesn't have the ball then (at the start of the step, or received earlier in it, in drawing order), and a ball in a goal that would go along with a player who moves (keep it in the goal in the next step). A pass without a player needs no ball;
  - a number and "meter" with a plain space ("6 meter", "7 meter") anywhere in an item, its frontmatter or its Markdown body: write a no-break space (U+00A0), so it never breaks over two lines (`checkMeters()`).
- **Text and drawing belong together** (Kay, 15 October 2026): each step's sentence is in the drawing, and a sentence or summary that says someone moves has that move drawn in its step. Agreed text goes over word for word.
- **The arrow follows the verb in the sentence** (Kay, 22 October 2026): loopt is a run, dribbelt a dribble; the ball goes along with whoever has it.
- **Check every drawing** before showing it: every ball stays with whoever has it (with Play in the editor and Next in the viewer, and the balls in the next step); no arrow through a player or over a cone, and no two arrows on top of each other; no player over a cone; no two players closer than 2 m unless the sentence asks for it; the English draws the same.
- **Pairs** (27 October 2026): a tactic and a drill of the same concept point at each other with `related` ("See also"), in both directions, in the same PR (Kruising MO–LO ↔ Kruisen in tweetallen).
- **Choices in one step** (Kay, 23 October 2026): draw only the first choice as an arrow of the player, the others as arrows without a player (no `from`). Play plays only the player's arrow.
- **Drawings:** draw the item at `/<lang>/board/` in `npm run dev`, a step per sentence, press "JSON (dev)" in More and paste the output as `board:` (a version 2 board without its title). A translation keeps the drawing and uses its language's labels and sentences (the Dutch items have LH, LO, MO and so on). JSON is valid YAML. The files write it in YAML flow style, one player or arrow per line, which is easier to review.
- **The page** (`src/components/LibraryItem.astro`): title, meta (`itemMeta()`: category · ages · level), summary, "Open in the board", then the strip (`StepStrip.astro`): every step as a static drawing (`Court` with `frame`, no JS) under its sentence, in an `<ol>`. One column on a phone, two from 560 px, `auto-fill` from 860 px; the sentences of a row share their height (`subgrid`), so the drawings beside each other stand level. A drawing is at most 420 px wide and never taller than the screen (`svh`, less the sticky site header and a sentence of three lines), so in landscape a step fits on the screen with its sentence; `e2e/library.spec.ts` checks 844 × 390 and 740 × 360. Then the coaching points, the body and "See also". A drill (`DrillFacts.astro`, which only `drills/[slug].astro` imports and passes into the slots `setup` and `lists`, so its styles and print stay on drill pages) has its goal and setup (a definition list) between the summary and "Open in the board", its steps under "How to run it", and below them the rules, coaching points, mistakes and the easier and harder variations (side by side from 560 px), each only when it has points (`drillSections()` in `src/lib/library.ts`). Cards (`LibraryCards.astro`), category pages and share images show `frames[0]` (step 1).
- **Print** (phase 16-2): `@media print` in the scoped styles of `LibraryItem.astro` (`@page` A4 with 12 mm margins; header, footer, skip link, breadcrumb, "Open in the board" and "See also" left out; the meta at 12 pt, grey text black) and `StepStrip.astro` (two steps a row, `break-inside: avoid`, the number's circle with `print-color-adjust: exact`, drawings of 82 mm). The rules stay inline on item pages, out of the shared CSS. Page 1 holds the title and four steps, also with the wider font of Linux or Windows: the gaps are tight in print (sections 4 mm apart, the steps 3 mm, line height 1.35 for the sentences and the summary), and the coaching points don't split (`break-inside: avoid` on the list). Text is 16 px (12 pt) on screen already, so keep any new text on an item page at least that size: `e2e/print.spec.ts` fails on smaller text outside the drawings, on steps that aren't side by side or narrower than 80 mm, on coaching points that may split, and (in Chromium, with the page's own font and with a wide one, Verdana or DejaVu Sans) on a PDF that isn't portrait A4 on two pages, or with step 4 off page 1, for every tactic. The tactic print test takes its list from the content (`libraryItems()`), like the drill tests. A drill has its title, meta, summary, goal, setup and at least steps 1 and 2 on page 1, and at most its own number of pages (`DRILL_PAGES` in `e2e/print.spec.ts`, measured with the wide font), with both fonts; every list stays together (`break-inside: avoid`). The player labels in a drawing scale with it (8.1 pt at 82 mm; L10).
- **Categories:** `categorySlugs` in `src/data/categories.ts` is the only list, like `AGES` and `LEVELS`. Their texts are the `category.<slug>.*`, `age.*` and `level.*` keys in `ui.ts` (a drill category has its own card line and intro, `drillCategory.<slug>.*`: `categoryInfo(locale, slug, type)`), and each category has an icon of the same name in `icons.ts`. A category page and its card exist only when that language has an item of that type in it, so no empty pages get indexed. The overview and category pages of both types are `LibraryIndex.astro` and `LibraryCategory.astro` (`typeText()` gives each type its texts); `e2e/library.spec.ts` counts the cards on `/<lang>/drills/` from the content.
- **Links into the board:** "Open in the board" carries the drawing with the item's title and every step's sentence in `#t=`, encoded at build time. The editor opens it on step 1, as a received board.
- **Share image:** `src/pages/[lang]/tactics/[slug]/og.png.ts` (and the same under `drills/`) renders step 1 with `courtPng()` (`svelte/server` + `sharp`) as a 1200×630 PNG next to the page. The only text in it is the player labels; without a font they drop out, and the build still passes.

## Hosting

Cloudflare Workers with static assets, deployed by Workers Builds (Git integration): build command `npm run build`, then `npx wrangler deploy` for production (`main`) and `npx wrangler preview` for a preview URL on other branches. Production is https://handballcoachboard.com; the domain is registered at Cloudflare Registrar.

- **Never deploy by hand.** Production and previews only go out through Workers Builds, after a merge or push. Check a config change with `npx wrangler deploy --dry-run`.

- **`wrangler.jsonc` must stay.** It makes the deploy a plain upload of `dist/`, with no Worker code and no Astro adapter. Without it, Wrangler reconfigures the project on every deploy: it runs `astro add cloudflare` and adds KV and Images bindings.
- It also sets `html_handling: "auto-trailing-slash"` (`/en/privacy` → `/en/privacy/`) and `not_found_handling: "404-page"` (serves `dist/404.html`).
- Its `routes` entry attaches `handballcoachboard.com` as a Custom Domain. Keep it there and don't manage the domain only in the dashboard: a deploy whose config lacks it removes the domain again.
- `workers_dev` stays `true`: `coachboard.hardamkay.workers.dev` keeps serving the links and QR codes shared before the move, and its board page redirects to the domain (see "Moved from workers.dev" under The board).
- Its empty `previews` block must stay too: `wrangler preview` fails without it, so every branch build would fail while `npm run verify` stays green. `npx wrangler deploy --dry-run` passes without it, so it doesn't catch this.
- `public/_redirects` holds the root redirect and the 301s for moved pages. `public/_headers` gives `/_astro/*` (hashed files) a one-year immutable cache, and every response the security headers: `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Cross-Origin-Opener-Policy: same-origin` and HSTS (one year, without `includeSubDomains` or `preload`).
- **Set in the Cloudflare dashboard**, not in this repo:
  - Always Use HTTPS on;
  - Email Address Obfuscation off, so Cloudflare doesn't rewrite the contact address or inject a script the CSP would block;
  - a Redirect Rule from `www.handballcoachboard.com` to the bare domain (a Custom Domain matches one exact hostname);
  - Email Routing forwards `contact@handballcoachboard.com` (`contactEmail` in `src/data/site.ts`) to the owner's own address;
  - the TXT record that verifies the domain in Google Search Console: leave it, or the verification lapses;
  - Web Analytics (RUM) set to "Enable with JS Snippet installation", not automatic: an injected beacon would land on every page, above the CSP `<meta>`. Its token is `analyticsToken` in `src/data/analytics.ts`.
- **The CSP is split in two.** Astro writes a `<meta>` CSP into every page (`security.csp` in `astro.config.mjs`), with `default-src 'self'` and a hash for each inline script it emits. Browsers ignore `frame-ancestors` in a `<meta>`, so that one is the header.
  - `style-src` still allows `'unsafe-inline'`. Nothing injects a `<style>` at runtime any more (the editor's CSS is a stylesheet), but without it Astro adds a hash for every inline `<style>`, about 0.6 KB of HTML per page. Dropping it is a separate step. Scripts stay hash-only; never add `'unsafe-inline'` to `script-src`.
  - Anything from another origin (a script, font, image or `fetch`) is blocked until its origin is added. `e2e/security.spec.ts` fails on any CSP violation, and on any script from another origin in the page, which also catches one injected above the `<meta>` (a CSP `<meta>` only covers what comes after it).
  - The board pages add the statistics beacon per page with `Astro.csp` in `BoardPage.astro` and `ViewerPage.astro`: its script URL in `script-src` and `connect-src 'self' https://cloudflareinsights.com`. That must run before `BaseLayout` renders `<head>`, so not in `Beacon.astro`; and a script resource replaces Astro's default `'self'`, so `'self'` is inserted too. Content pages keep the plain CSP.
  - CSP isn't applied in `npm run dev`; check with `npm run build && npx wrangler dev` or `npm run e2e`.
  - Deployed, Cloudflare leaves the `_headers` off the 404 page (`wrangler dev` adds them), so only the `<meta>` CSP reaches it.
- Dependabot (`.github/dependabot.yml`) opens update PRs weekly for npm and GitHub Actions: minor and patch grouped, each major on its own. Nothing merges automatically. Merge when CI is green on the current main. If main has moved since the last run, comment `@dependabot rebase` first.
- `wrangler` is a devDependency, so these commands use the version in `package-lock.json`.
- Try a change to any of these locally with `npm run build && npx wrangler dev`; `npm run e2e` tests the redirects, the headers and the 404 page against it.

## Not yet

Don't add these without a plan:
- sponsor blocks, an "Install app" button or a "Works offline" claim before there is a PWA;
- `/blog`, `/premium` or `/sponsor`.

## How we work

Less process, the same quality: the automatic checks are the safety net.

- **Done means merged.** A phase is done when its last planned PR lands on `main`. Tests on real phones, in the hall or with the team feed "Na de tests" in the product plan; they never hold a phase open.
- **Automatic, always:** `npm run verify` (with the size budgets and the content checks in `checkLibrary()`) before every commit, and the e2e tests in CI.
- **Plans fit on one page:** goal, approach, files, risks, and what Kay decides. Build after Kay's approval.
- **Lighthouse** runs only when the JS or CSS of the board pages changes: one run per mode on the PR's preview URL, with the pinned commands in `docs/metingen.md`: simulated throttling (the default) and real throttling (`--throttling-method=devtools`). Real throttling, and the time until the board is ready to use or the shared board is on screen, decide. Compare SEO only on production: preview URLs send `X-Robots-Tag: noindex`.
- **`docs/metingen.md`** (Dutch) gets an entry only when a budget or measured behaviour (a Lighthouse result, the tap budget) changes, and that entry is short.
- **Look at production when a phase merges:** opens of `/board/link/` and `/board/qr/` per channel, and which library pages get found. Note something only when it changes a decision.
- **A PR for text or content** says what, why, and how to test (at most 3 lines), with the preview link. No screenshots, PDFs or tables of measurements.
- **Size budgets are a safety net:** the `BUDGETS` constant in `scripts/check-budget.mjs`, in KB of 1000 bytes, gzipped except PNGs: the board's JS and its lazy chunks, all JS in `_astro/`, CSS and HTML per page (the editor's page has its own CSS budget, `boardCss`, for the editor's stylesheet; the viewer's pages have `viewerJs` and `viewerCss`; a library item, a page with its own `og.png`, has `libraryHtml`, because it draws every step), and each PNG. Raising one takes one sentence of reason, in the comment beside it and in the PR. CI (Linux) builds the JS about 0.14 KB larger than macOS.
- **Budgets follow the measurement.** After a merge that changes a measured size, set each affected budget to the new measurement plus its fixed margin: 1 KB for `allJs`, 0.4 KB for the other JS budgets, 0.2 KB for CSS and HTML. Two follow a worst case instead: `libraryHtml` the largest item the schema allows (L7), and `png` the largest share image, with room for a new one. Plans estimate no bytes and build no throwaway prototypes; the budget script is the arbiter. Raising a budget still takes its one sentence of reason.
- **Dependabot:** merge when CI is green (see Hosting).
- `docs/optimalisatieplan.md` (Dutch) holds the earlier optimization phases; "How we work" goes before its rules.

## Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
