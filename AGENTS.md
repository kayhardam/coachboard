# Handball Coachboard

Static Astro 7 site for handball coaches. The product is the tactics board at `/en/board/`; the content pages lead to it. `CLAUDE.md` is a symlink to this file.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. There is no page at `/` locally; open `/nl/` or `/en/`. |
| `npm run verify` | What CI runs (`.github/workflows/ci.yml`, on pull requests and pushes to `main`): `astro check` + `svelte-check` → `vitest run` → `astro build` → `node scripts/check-links.mjs` → `node scripts/check-budget.mjs`. Must be green before every commit. |
| `npm run budget` | The size budgets against the current `dist/` (run `npm run build` first): a table of each measured size next to its budget. |
| `npm run check` / `test` / `build` | The separate steps. `astro check` doesn't type-check `.svelte` files, so `check` also runs `svelte-check --fail-on-warnings`. |
| `npx vitest run src/lib/board/format.test.ts` | One test file; add `-t "<test name>"` for one test. |
| `npm run e2e` | End-to-end tests (Playwright) in mobile Chromium and WebKit. Builds, then serves `dist/` with `wrangler dev` on port 8787. A separate CI job, not part of `verify`. First time: `npx playwright install chromium webkit`. |
| `npx playwright test e2e/board.spec.ts` | One e2e file; add `-g "<test name>"` for one test, `--project=iphone` or `--project=android` for one browser. |
| `E2E_BASE_URL=https://handballcoachboard.com npx playwright test e2e/security.spec.ts` | An e2e file against a deployed site instead of `wrangler dev`. Run `npm run build` on the deployed commit first: the page list comes from `dist/`. |
| `node scripts/og-default.mjs nl` | Re-renders a language's default share image (`public/og-default-nl.png`; `en` is `og-default.png`). One-off, with local fonts; commit the PNG. |
| `node scripts/favicons.mjs` | Renders `public/favicon.ico` and `public/apple-touch-icon.png` from `public/favicon.svg` (the brand mark). One-off; commit the results. |

Commit only when `npm run verify` exits with code 0. Check the exit code itself, not the output: a pipe through `tail` or `head` hides a failure.

When starting the dev server as an agent, use background mode: `npx astro dev --background`, and manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.

## Code and tests

- Tests sit next to the code: `*.test.ts` in `src/`, `*.test.mjs` in `scripts/`.
- Vitest runs through Astro's Vite config (`getViteConfig` in `vitest.config.ts`), so a test can import a `.svelte` file and render it with `svelte/server` (see `Court.test.ts`).
- `src/lib/` is plain TypeScript with no `astro:` imports, so vitest can test it. Code that needs `astro:content` goes in `src/data/` and calls into `src/lib/`: `src/data/tactics.ts` loads the collection and runs `checkTactics()` from `src/lib/tactics.ts`.
- `src/data/categories.ts` must not import from `astro:` either, because `src/content.config.ts` imports it.
- End-to-end tests are in `e2e/*.spec.ts`, with shared steps in `e2e/helpers.ts`:
  - compare boards by the pieces the editor draws (`pieces()`), not by the link text: compression can give other bytes per browser;
  - don't use `click()` to prove a button is reachable, because Playwright scrolls it into view first; use `toBeInViewport()`;
  - a known bug gets a test with `test.fail()` and a pointer to its finding in `docs/metingen.md`, and the fix removes the marker;
  - `e2e/tasks.spec.ts` is the tap budget: it counts the actions (taps, drags, key presses) of the shortest route for each measured task, in every language, and requires exactly `TAP_BUDGET`. A longer or a shorter route fails until the budget changes on purpose, with the reason in the PR and the new count in `docs/metingen.md` ("UX-metingen"). A task on two devices (T4: laptop and phone) runs both in one test, each in its own context with its own storage;
  - find board buttons by their text in the page's language: `t(lang, "board.share")` from `src/i18n/ui.ts`, as `e2e/tasks.spec.ts` does;
  - `e2e/i18n.spec.ts` checks hreflang, the sitemap and the language links; `allPages()` reads the pages from `dist/`, and `security.spec.ts` fails if a language's board pages are missing from it;
  - import `test` and `expect` from `./helpers`, not from `@playwright/test`: its `test` answers the statistics beacon with an empty script and its endpoint with 204, so no test sends data to the real dashboard (also not with `E2E_BASE_URL`). A context a test makes itself with `browser.newContext()` (a second device, like T4's laptop) needs `stubBeacon()` from `./helpers` for the same. `e2e/analytics.spec.ts` runs the real beacon (it needs network) and checks what it sends.

## URLs and routing

- **Trailing slash everywhere.** `trailingSlash: "always"`: every internal link, canonical and sitemap entry ends in `/`. Build links with `getRelativeLocaleUrl(locale, "privacy/")` from `astro:i18n`, not by hand.
- **Every language has a prefix** (`/en/`, `/nl/`, later `/de/`). Pages live under `src/pages/[lang]/` and export `getStaticPaths = localeParams`. `404.astro` is the only page outside `[lang]`.
- **`/` has no page.** Cloudflare redirects it to `/nl/` with a 302 (`public/_redirects`), because the first users are Dutch; Astro's own root redirect is off. `x-default` points at the English page, not at `/`.
- **Locales are configured once**, in the `locales` map in `astro.config.mjs` (it feeds both Astro's i18n and the sitemap's hreflang). `src/i18n/locales.ts` exposes them typed.
- **Only link to pages that exist.** `scripts/check-links.mjs` fails the build on a missing target or a page link without a trailing slash. It also checks own-origin URLs in `href`, `src` and `content`, so canonical, `og:image` and hreflang are covered.

## Layout, SEO and text

- Every page renders through `src/layouts/BaseLayout.astro` with a real `title` and `description`. It owns the whole `<head>`:
  - canonical and `og:url` from `site` + the page path;
  - absolute `og:image`, always a 1200×630 PNG: the language's default (`/og-default.png` for English, `/og-default-<lang>.png` for the others) or a tactic's own `og.png` on its page. Their middle 630×630 square must work on its own: chat apps crop to it;
  - `lang` and `og:locale` from the page's locale;
  - hreflang for each language in `languages` (every language unless the page passes fewer, as tactic and category pages do) + `x-default` to the English page. Translations share the path after the prefix;
  - `noindex` (the 404, `board/link/`, `board/qr/`) drops canonical, `og:url` and hreflang.
- `BaseLayout` renders `Header`, `<main id="main">` and `Footer`. With `fullscreen` (the board pages) the body fills the viewport and there is no site header or footer: the board has its own title bar. The footer has the language links on every content page; a language the page doesn't exist in links to its home page.
- `404.astro` is one page for the whole site (the host serves `dist/404.html` for any missing path), so it shows the text in every language.
- Menu and footer links come from `src/data/nav.ts`. Labels and short page texts come from `t(locale, key)` in `src/i18n/ui.ts`; `t(locale, key, { title })` fills `{title}` placeholders.
- The site owner's name and contact address are in `src/data/site.ts` (about and privacy pages).
- English is the source dictionary. A language may leave keys out (they fall back to English per key), but a launched one shouldn't: Dutch is typed `Record<UiKey, string>`, so `npm run check` fails on a missing key.
- Long page text (about, privacy) lives per language in `src/i18n/pages/<page>/<lang>.astro`; the page in `src/pages/[lang]/` keeps the layout and styles (with `:global()`, since scoped styles don't reach a child component). `pageText()` fails the build for a language without its file, so no English shows under `/nl/`.
- Board labels must fit: a tool has about 40 px for its label on a 360 px phone, and Share's label sits in the title bar beside the title. Undo and More show only their icon, except in landscape (`.label`). `e2e/layout.spec.ts` fails on a label cut off by its ellipsis, per language, in portrait, landscape and wide.
- Astro's HTML compression drops a line break between text and an inline tag on the next line ("See the" + newline + `<a>` renders as "See the<a>"). Start the tag on the same line as the text before it.

## Copy

New or changed site text is agreed with Kay first. Take it over literally. If a text you need isn't agreed yet, ask. If an agreed text breaks a rule below, say so instead of changing it.

- Say what the board does, in a coach's words. No slogans. One thought per sentence.
- Promise only what exists and what has been measured. No "always" or "never" about what is free, about accounts, or about what we see.
- "Gratis"/"free" appears in one place: the "Free, without an account" block on the about page (`src/i18n/pages/about/<lang>.astro`). Elsewhere, say what the board does; "no account or app needed" is fine.
- Text that appears on every board says "the board" (`het bord`), not "the attack": a board can show a defense too.
- Tactics: the steps say who does what; the coaching points are what you call out in the sports hall. Mention drills (`oefeningen`) only once there are drills.
- Privacy: don't say we collect no personal data. Cloudflare processes IP addresses, and an email is personal data too.
- Dutch: "6-0-dekking", not "6-0-verdediging". `handbaltrainer` is right in Dutch.
- English follows the Dutch, with American spelling, like the URLs (`/defense/`). A coach is a "coach", never a "trainer". "Teken een aanval" is "draw a play"; overviews and categories say "attack". Balwinst = steal, opbouwers = back court players, cirkelloper = pivot, hoek = wing, de 6 meter = the goal area. Sper = screen: the attacking action (an attacker, usually the pivot, sets it); "blok" is defensive (blocking a shot), so the arrow is never "blok". In code it stays `block` (the link format).

## Styling

- **Global CSS is two files**, imported once by `BaseLayout`:
  - `src/styles/tokens.css`: custom properties;
  - `src/styles/base.css`: reset, typography, focus ring, `.container`, `.btn`, `.btn-primary`, `.btn-secondary`.
- **Everything else is a scoped `<style>`** in the component or page. No inline `style` attributes.
- **Mobile-first.** Base styles are for phones. Wider layouts go in `@media (min-width: 560px)` or `@media (min-width: 860px)`, and only those two. The exceptions are on the board (`BoardEditor.css` and `BoardPage.astro`):
  - a phone in landscape: `@media (orientation: landscape) and (max-height: 559px)`;
  - wide screens: `@media (min-width: 860px) and (min-height: 560px)`, so a large phone in landscape (863 px wide) keeps the landscape layout;
  - the title shows only its pencil below 60 px of room: `@container (max-width: 60px)` on the title button.
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
  - Never edit the files in `src/lib/board/fixtures/`; the tests decode them. `v1-*` hold a version 1 board, `v2-*` a version 2 board; `export/` holds an exported file of My boards (see below).
  - `encode()` writes version 2 (`LATEST`); `decode()` has a reader per version. The version 1 reader is unchanged: `toBoard()` turns what it reads into a version 2 board with the same drawing. `toBoard()` also reads boards saved by earlier versions (`localStorage`, `#own=`), so use it, not `isBoard()`, for anything that may be older.
  - A new format gets a new prefix (`3.`) and its own reader in `decode()`, next to the others. Raise `LATEST` with it: `encode()` writes that version, and `isNewerLink()` treats anything above it as a link from newer code. Version 2 keeps room for a player off the court in a step (A+): a `-1` in place of a position, refused for now.
  - To add a fixture, write `{ link: await encode(board), board }` once and commit it. Keep fixtures well inside the limits, so a tighter limit never means editing one.
  - **The model:** one lineup for all steps (`isBoard()` checks every step has the same players, teams and labels), `balls` as a list, `cones` per board, a `title` and a `text` per step. A player's team is `a`, `d` or `p` (a passer, aanspeelpunt, without a label).
  - **Arrows of a player:** an arrow with `from` belongs to that player and starts where they are by then: where they stand, or where their last run, dribble or block in that step ended, in drawing order. The link keeps the player instead of the start point. `settle()` puts the starts in place; edit operations and readers call it, and `isBoard()` rejects a board that isn't settled. A shot always has a player and ends in the goal nearest the shooter, on the left, in the middle or on the right (the link keeps only the side). A bounce is a pass; the board draws where it touches the floor.
  - **Limits:** `MAX_STEPS`, `MAX_TEXT`, `MAX_TITLE`, `MAX_BALLS` and `MAX_CONES` (decision 3, in `docs/metingen.md`, phase 11). The largest board within them must fit in QR version `QR_VERSION` (`format.test.ts`, which builds that board from the limits). A limit can grow later; a tighter one breaks shared boards.
  - The budget test keeps a full lineup (7+7 players, ball, 6 arrows) at ≤ 300 characters.
  - `isBoard()` is hand-written so the client bundle needs no Zod; the content schema reuses it.
- **`edit.ts` is pure:** every operation returns a new board. The editor keeps the board in `$state.raw`, and undo is a list of earlier boards. The editor edits `frames[0]`; adding or removing a player does so in every step. An arrow drawn from a player gets `from`; dragging the whole arrow lets go of the player, and its start handle, let go on a player, gives the arrow to them. An arrow of a player has no start handle (a drag there moves the player).
- **`Court.svelte` stays pure SVG**, with no browser APIs, so Astro can render it without JS (the home page, the board's fallback, tactic pages and their thumbnails). Pieces carry `data-kind` and `data-index`; the editor finds them with event delegation. Colours are SVG attributes, not CSS variables, so `courtPng()` can render it to a PNG on the server.
- **Board pages:** `src/components/board/BoardPage.astro` renders the editor, its fallback and the statistics beacon, for three pages per language:
  - `/<lang>/board/`: the editor (`src/pages/[lang]/board.astro`, which adds the workers.dev redirect);
  - `/<lang>/board/link/` and `/<lang>/board/qr/`: where Share and the QR code point, so the statistics count opened shared boards per channel (the beacon drops `?` and `#`, so only a path can tell them apart). They are `noindex` and left out of the sitemap (`filter` in `astro.config.mjs`);
  - these are the only pages that ship JS. `isBoard` in `scripts/check-budget.mjs` and `e2e/security.spec.ts` lists them.
- **`BoardEditor.svelte`:**
  - it runs `client:only` on the board pages only;
  - its JS is one chunk with the Svelte runtime and Astro's Svelte renderer: the `board` group in `codeSplitting` in `astro.config.mjs` (client build only). The group names what goes in, so a new dependency of the board must fall in it, or it becomes a chunk of its own and costs more. What must load later stays out of it;
  - the QR code loads later: `src/lib/board/qr.ts` re-exports only `renderSVG` from `uqr`, so the lazy chunk drops the rest of `uqr`. Import it through that module, never `import("uqr")` directly; the editor fetches it once the board is up, so it still works offline;
  - its CSS is a stylesheet, `BoardEditor.css`, imported by `BoardPage.astro` only, so Astro links it on the board pages only and it stays out of the board's JS. Svelte doesn't scope it: every rule starts at `.editor`, or at `.qr` or `.boards` for the dialogs next to it (the QR code, My boards). Keep its styles out of the `.svelte` file: a `<style>` there would go into the bundle of every page, or into the JS with `css="injected"`;
  - a title bar takes the site header's place: Home, the title (tap to edit, `setTitle()` in `edit.ts`), Undo, Share and More. More (a `<details>`) holds My boards and New board first, then the QR code, the court size and the three ways to clear, flat, so the T1 route with your own board stays two taps to a new board (in landscape in two columns: seven items don't fit in 320 px of height). Delete shows only with a selection, over the top right of the court's box (in landscape: below the right panel), so it never moves or covers the court;
  - six tools, keys 1–6 (not while typing in a field): Move, Arrow, Attack, Defend, Ball, Cone. Arrow is the tool on opening: a tap picks a piece, a drag draws, from a player their run, from the ball a pass of the player nearest it (`holder()` in `hit.ts`, within twice a tap's reach, so always further than a tap reaches; nobody that near: a pass without a player). A new player, ball or cone isn't selected;
  - smart arrows (decision 6, Kay, 9 October 2026): who receives a pass or bounce has the ball (`hasBall()` in `edit.ts`: it ends where they stand or where their run ends by then, in drawing order), and a drag from them is their pass; who has the ball at the start still runs, and who passed runs again (pass and go). A drag released near a player, at their spot or their run's end, ends there. A pass of a player released in a goal (`inGoal()` in `hit.ts`: between the posts, within a tap's reach of the goal line) is a shot; a pass without a player stays a pass. With Arrow a press on a player goes before a handle on them, so a chain of passes costs no tap; Move keeps the handle;
  - one bar over the court (one block, `strip` in the editor): the kinds for a selected arrow (`setKind()`), the teams for a selected player (`setTeam()`), and on a new board (first visit, New board, the open board deleted) the starting lineups (`setup()` in `defaults.ts`) until its first edit. Picking a lineup saves nothing. In portrait and landscape it sits over the bottom of the court's box, wide at the top of the free column. The lineups have no visible heading: it would become the LCP, after the JS;
  - the court fits the space the bars leave (letterboxed), in three layouts: portrait (title bar, court, tools); a phone in landscape (tools panel left, title panel right, both with labels); wide (title bar across, tools column left, a free column right for the steps). `e2e/layout.spec.ts` checks that every button stays on screen and is at least 44 px high;
  - the static fallback in `BoardPage.astro` reserves the bars' space with the same tokens (`--board-title`, `--board-bar`, `--board-gap`, `--board-tools`, `--board-panel`, `--board-wide-side` in `tokens.css`), so the court doesn't move when the editor replaces it, and has the title bar's Home link, for the way back without JavaScript. Change the editor's box and the fallback's together; `e2e/layout.spec.ts` allows 1 px;
  - its strings come in as a prop from `boardStrings()` in `ui.ts`, the paths for Share and the QR code as `links`, and the default lineup in the page's language as `lineup` (`defaultBoardFor(lang)` in `src/lib/board/defaults.ts`: LW, LB, CB, RB, RW, P, GK in English; LH, LO, MO, RO, RH, CL, K in Dutch). Astro passes props as `$state`, a proxy that `structuredClone()` can't copy, so the editor copies `lineup` once with JSON;
  - **My boards** (`src/lib/board/boards.ts`) keeps your boards in one `localStorage` key, `coachboard.boards`: the list (id, board, folder, date) and the board last opened. Every change goes through `update()`, which reads the list again first, so two tabs don't undo each other's work. Without the key, the board earlier versions kept (`coachboard.board`) becomes the first board, once, unless it is an untouched default lineup (`isUntouchedDefault()`, every lineup any version could have saved); the old key stays, for a rollback;
  - **Export all boards** writes one file of links (`exportFile()` in `boards.ts`): `{ "coachboard": 1, "boards": [{ "link", "folder"?, "at" }] }`, each link the full URL of the board page (`…/board/#t=2.…`), the date as ISO. No second format: `importFile()` reads every link with `decode()`. The file is a contract like the link: an export must import forever (`fixtures/export/export-1.json`). Export first saves the board on the court if its save (300 ms) is still waiting, under its own id, so the file has the latest change and no copy is made. It shows only when there are boards;
  - **Import boards** only adds: each board gets a new id and keeps its folder and date from the file; the board on the court and the board last opened stay. A board that is already there, in any folder, is left out: `sameBoard()` in `format.ts` compares boards, not link text, because compression can give other bytes per browser. The notice counts only the boards added;
  - a board enters My boards at its first **real** change: when its link (`encode()`) differs from the board as it was opened. So the first visit, New board, a received link, a QR code and "Open in the board" save nothing until you draw. A board in the list gets a new date only when it changes;
  - every change is written to the address bar (300 ms debounce), so it is always a shareable link. Next to it, not in it, the tab's history keeps the id of the board (`history.state.board`): a reload or Back opens that board from My boards, so a reload never makes a copy, while a link, a QR code or a tactic opens without an id and stays a received board. Without the id (a browser that lost the tab's history), a link that draws the board last opened is that board;
  - it loads that board first, then `#t=` (a received board), then the board last opened, then `#own=` (see below), then the default lineup;
  - opening another board (from the list, New board, a pasted link) first saves the board it leaves, if its save is still waiting, and starts a new undo history;
  - a link from a newer version (`isNewerLink()`) reloads the page, on opening and in an open tab, because a tab opened before a deploy runs the old code. The same link reloads a tab only once (`coachboard.reloaded` in `sessionStorage`); after that, or without storage, it gets the notice for a broken link. A broken link of a known version (`1.…` or `2.…`) doesn't reload.
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

## Tactics content

- **One Markdown file per tactic and language:** `src/content/tactics/<lang>/<slug>.md`. The entry id is `<lang>/<slug>` and the page is `/<lang>/tactics/<slug>/`. A translation gets the same file name in another language folder. Path segments and slugs are English in every language (`/nl/tactics/<slug>/`).
- **Only the type is in the URL, not the category,** so a tactic can change category without moving. Category pages share the level (`/<lang>/tactics/attack/`), so `checkTactics()` fails the build on a slug that equals a category. Later, drills get `/<lang>/drills/<slug>/`.
- **A page that moves keeps its old URL working:** a 301 in `public/_redirects` (with and without the trailing slash, and its `og.png`) and a test in `e2e/routing.spec.ts`. The tactic pages moved from `tactics/<category>/<slug>/` in phase 10.
- **The schema** is in `src/content.config.ts`:
  - `title`, `theme`, `level`;
  - `summary`: at least 50 characters, and also the meta description;
  - `category`: one of `categorySlugs`;
  - `steps` (at least one), `coachingPoints`;
  - `related`: full ids in the same language, e.g. `en/fast-break-second-wave`;
  - `board`: checked with `isBoard()`.
  - The Markdown body is optional extra text below the steps.
- **The build fails** on:
  - an invalid board or an unknown category (the schema);
  - a `related` id that doesn't exist (`reference()`);
  - a `related` that points at itself or another language, a file outside a language folder, or a slug that is a category (`checkTactics()` in `src/lib/tactics.ts`, called by `src/data/tactics.ts`).
- **Diagrams:** draw the play at `/<lang>/board/` in `npm run dev`, press "JSON" (dev only) and paste the output as `board:` (a version 2 board: `v: 2`, `cones`, `balls`). A translation keeps the board and uses its language's labels (the Dutch tactics have LH, LO, MO and so on). JSON is valid YAML. The existing files write it in YAML flow style, one player or arrow per line, which is easier to review. Tactic pages show `frames[0]`.
- **Categories:** `categorySlugs` in `src/data/categories.ts` is the only list. Their texts are the `category.<slug>.*` keys in `ui.ts`, and each has an icon of the same name in `icons.ts`. A category page and its card exist only when that language has a tactic in it, so no empty pages get indexed.
- **Links into the board:** "Open in the board" carries the diagram in `#t=`, encoded at build time.
- **Share image:** `src/pages/[lang]/tactics/[slug]/og.png.ts` renders the diagram with `courtPng()` (`svelte/server` + `sharp`) as a 1200×630 PNG next to the page. The only text in it is the player labels; without a font they drop out, and the build still passes.

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
  - The board pages add the statistics beacon per page with `Astro.csp` in `BoardPage.astro`: its script URL in `script-src` and `connect-src 'self' https://cloudflareinsights.com`. That must run before `BaseLayout` renders `<head>`, so not in `Beacon.astro`; and a script resource replaces Astro's default `'self'`, so `'self'` is inserted too. Content pages keep the plain CSP.
  - CSP isn't applied in `npm run dev`; check with `npm run build && npx wrangler dev` or `npm run e2e`.
  - Deployed, Cloudflare leaves the `_headers` off the 404 page (`wrangler dev` adds them), so only the `<meta>` CSP reaches it.
- Dependabot (`.github/dependabot.yml`) opens update PRs weekly for npm and GitHub Actions: minor and patch grouped, each major on its own. Nothing merges automatically; each PR goes through CI and its preview URL.
- `wrangler` is a devDependency, so these commands use the version in `package-lock.json`.
- Try a change to any of these locally with `npm run build && npx wrangler dev`; `npm run e2e` tests the redirects, the headers and the 404 page against it.

## Not yet

Don't add these without a plan:
- sponsor blocks, an "Install app" button or a "Works offline" claim before there is a PWA;
- `/blog`, `/premium` or `/sponsor`.

## Optimization work

- `docs/optimalisatieplan.md` (Dutch) lays out the optimization work in phases, one branch and one PR per phase. Its rules apply to every phase.
- **Size budgets** are the `BUDGETS` constant in `scripts/check-budget.mjs`, in KB of 1000 bytes, gzipped except PNGs: the board's JS and its lazy chunks, all JS in `_astro/`, CSS and HTML per page (the board pages have their own CSS budget, `boardCss`, for the editor's stylesheet), and each PNG. Raise one only on purpose, with the reason in the PR and the new measurement in `docs/metingen.md`.
- Measure before and after any change that affects speed, size or behaviour, and record both in `docs/metingen.md` (Dutch). Later phases run Lighthouse on their PR's preview URL, with the command listed there. Compare SEO only on production: preview URLs send `X-Robots-Tag: noindex`.

## Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
