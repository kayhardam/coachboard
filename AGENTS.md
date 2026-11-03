# Handball Coachboard

Static Astro 7 site for handball coaches. The product is the tactics board at `/en/board/`; the content pages lead to it. `CLAUDE.md` is a symlink to this file. `e2e/`, `src/components/board/`, `src/lib/board/` and `src/content/` have an `AGENTS.md` of their own (with the same symlink), for the rules that only matter there; `docs/hosting.md` has the hosting rules in full. Rules only: what happened and why is in `docs/` (the product plan, `docs/metingen.md`) and in the PRs.

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

Commit only as `Kay Hardam <102677416+kayhardam@users.noreply.github.com>`, never with a personal address: the repo is public and every commit keeps its author. Check `git config user.email` before the first commit, also in a cloud session, where the account's own address is the default.

Astro needs Node 22.23.4 or newer (`engines` in `package.json`). CI runs on a fixed `ubuntu-24.04`; moving to a newer runner happens on purpose, in its own PR.

When starting the dev server as an agent, use background mode: `npx astro dev --background`, and manage it with `npx astro dev stop`, `npx astro dev status` and `npx astro dev logs`.

## Code and tests

- Tests sit next to the code: `*.test.ts` in `src/`, `*.test.mjs` in `scripts/`.
- Vitest runs through Astro's Vite config (`getViteConfig` in `vitest.config.ts`), so a test can import a `.svelte` file and render it with `svelte/server` (see `Court.test.ts`).
- `src/lib/` is plain TypeScript with no `astro:` imports, so vitest can test it. Code that needs `astro:content` goes in `src/data/` and calls into `src/lib/`: `src/data/library.ts` loads the collection and runs `checkLibrary()` from `src/lib/library.ts`.
- `src/data/categories.ts` must not import from `astro:` either, because `src/content.config.ts` imports it.
- End-to-end tests are in `e2e/*.spec.ts`, with shared steps in `e2e/helpers.ts`. Their rules (the tap budget, how to find buttons) are in `e2e/AGENTS.md`.

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
- A library item's `<title>` (and so its `og:title`) names its type: `tactic.title` and `drill.title` in `ui.ts` ("{title} – handball tactic | Handball Coachboard" and "{title} – handball drill | Handball Coachboard" in English; the Dutch ones are in `ui.ts`), through `typeText()`. The H1, the cards and the title in the board stay the item's own title. `e2e/library.spec.ts` checks every item.
- Each home page has one JSON-LD `WebSite` block (`src/pages/[lang]/index.astro`), from which Google takes the site name: `siteName` and `shortName` from `src/data/site.ts`, the root as `url`, `inLanguage`, and the owner as `creator` (a `Person`, the link back from kayhardam.dev). A `<script type="application/ld+json">` with `set:html` and `<` escaped; no `offers`, price or ratings (see Copy). `e2e/i18n.spec.ts` parses it.
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
- **The narrow-screen menu** is a `<details>` element, without JavaScript. Content pages ship no JS: `scripts/check-budget.mjs` fails on any `<script>` (JSON-LD excepted), `<astro-island>` or modulepreload outside the board pages (see "Board pages" under The board), and on any script from another origin, on every page.
- **Icons** come from one set in `src/lib/icons.ts` (24×24, 2-unit stroke, round caps, `currentColor`), drawn with `Icon.astro` on content pages and inline in `BoardEditor`. No emoji anywhere in the UI.
  - An icon next to visible text is decorative (`aria-hidden`, which `Icon.astro` sets). An icon-only button needs `aria-label` and `title`.
  - Icons take their colour from the text: `--color-accent-dark` when they carry meaning. In cards they sit on a 44×44 tile with `--color-accent-soft` behind them.
  - Size an icon with `font-size` on its wrapper; it is 1.25em.
  - `BoardEditor` imports only `boardIcons`, so the board's JS carries only those (a bundle keeps every key of an object it imports). A new icon for the board goes in `boardIcons`; `icons` spreads it for `Icon.astro`.

## The board

Code: `src/lib/board/` (plain TypeScript, unit-tested) and `src/components/board/` (Svelte 5).

- **Coordinates:** whole decimetres on a portrait court with the goal at the top. `x` runs 0–200 (sideline to sideline), `y` runs 0–400 from the goal line; a half court shows `y` 0–200.
- **`format.ts` is a contract.** Links look like `2.<payload>` (older ones `1.<payload>`) and end up in QR codes and team chats, so every version must decode forever; `docs/link-format.md` describes them.
  - Never edit the files in `src/lib/board/fixtures/`; the tests decode them. `v1-*` hold a version 1 board, `v2-*` a version 2 board; `export/` holds an exported file of My boards (`src/lib/board/AGENTS.md`).
  - `encode()` writes version 2 (`LATEST`); `decode()` has a reader per version. The version 1 reader is unchanged: `toBoard()` turns what it reads into a version 2 board with the same drawing. `toBoard()` also reads boards saved by earlier versions (`localStorage`, `#own=`), so use it, not `isBoard()`, for anything that may be older.
  - A new format gets a new prefix (`3.`) and its own reader in `decode()`, next to the others. Raise `LATEST` with it: `encode()` writes that version, and `isNewerLink()` treats anything above it as a link from newer code.
  - **Any change an older reader would refuse is a new format**: a higher limit, a new kind of arrow or team, the `-1` of A+, a change to what `settle()` or `isBoard()` accept. Inside the same prefix, a tab opened before the deploy shows "broken link" instead of reloading. My boards keeps what it can't read, so an old tab or a rollback doesn't delete newer boards (`src/lib/board/AGENTS.md`); ship a change to that one deploy before a new format needs it. Version 2 keeps room for a player off the court in a step (A+): a `-1` in place of a position, refused for now.
  - To add a fixture, write `{ link: await encode(board), board }` once and commit it. Keep fixtures well inside the limits, so a tighter limit never means editing one.
  - **The model:** one lineup for all steps (`isBoard()` checks every step has the same players, teams and labels), `balls` as a list, `cones` per board, a `title` and a `text` per step. A player's team is `a`, `d` or `p` (a passer, aanspeelpunt, without a label).
  - **Arrows of a player:** an arrow with `from` belongs to that player and starts where they are by then: where they stand, or where their last run, dribble or block in that step ended, in drawing order. The link keeps the player instead of the start point. `settle()` puts the starts in place; edit operations and readers call it, and `isBoard()` rejects a board that isn't settled. A shot always has a player and ends in the goal nearest the shooter, on the left, in the middle or on the right (the link keeps only the side). A bounce is a pass; the board draws where it touches the floor.
  - **Limits:** `MAX_STEPS`, `MAX_TEXT`, `MAX_TITLE`, `MAX_BALLS` and `MAX_CONES`. The largest play within them must fit in QR version `QR_VERSION` (`format.test.ts`, `largestBoard()`: the steps, title and sentences at their limits, with one ball and no cones). A limit grows only as a new format (see above), and never gets tighter: that breaks shared boards. `decode()` reads up to `MAX_PAYLOAD` (10,000 characters): more than the limits allow (`format.test.ts` proves the largest opens).
  - The budget test keeps a full lineup (7+7 players, ball, 6 arrows) at ≤ 300 characters.
  - `isBoard()` is hand-written so the client bundle needs no Zod; the content schema reuses it.
- **`edit.ts` is pure:** every operation returns a new board. Where pieces go within a step (`endOf()`, `ballTrips()`, `ballsAfter()`) is in `moves.ts`, which `edit.ts` and `play.ts` both use, so a page that only plays a board needs none of the editing operations. The editor keeps the board in `$state.raw`, and undo is a list of earlier boards. The editor edits one step at a time: every operation on pieces, arrows and balls takes the step (`step`); adding or removing a player, changing a team, cones and the court size go to every step. A change in a step carries on into the later ones (`follow()`): a player (or ball) who stood where they ended the step before moves along, one moved there by hand keeps their place. The steps:
  - `addStep()` (New step) inserts a step after the given one: everyone where they end it (`endOf()`), the balls where they end it (`ballsAfter()`: with whoever has one, within 26 dm; with a pass, bounce or shot to its end, beside whoever stands there; after a shot, in the goal), no arrows, no sentence. Up to `MAX_STEPS`;
  - `removeStep()` keeps at least one; `setText()` keeps a sentence as one trimmed line of at most `MAX_TEXT`, like `setTitle()`. An arrow drawn from a player gets `from`; dragging the whole arrow lets go of the player, and its start handle, let go on a player, gives the arrow to them. An arrow of a player has no start handle (a drag there moves the player). Players stay clear of each other: `movePiece()` and `addPlayer()` keep a player `TOUCH` (1.8 m) from the others (`clearOf()`), and the editor ends a drawn run `CLEAR` (2 m) before a player who stays (`runEnd()`; `src/components/board/AGENTS.md`).
- **`Court.svelte` stays pure SVG**, with no browser APIs, so Astro can render it without JS (the home page, the board's fallback, the steps on tactic pages and their thumbnails). Pieces carry `data-kind` and `data-index`; the editor finds them with event delegation. Colours are SVG attributes, not CSS variables, so `courtPng()` can render it to a PNG on the server. From step 2 on (`frame`), it draws where the players who moved stood in the step before: a thin grey dotted line and ring (`.trails`), without a head, so it doesn't look like a pass or a bounce; under the arrows and players, without `data-kind` and with `pointer-events="none"`, so it can't be tapped.
- **Board pages:** three per language:
  - `/<lang>/board/`: the editor (`src/components/board/BoardPage.astro`, used by `src/pages/[lang]/board.astro`, which adds the workers.dev redirect). Old links to `/board/#t=…` and "Open in the board" from the library open here;
  - `/<lang>/board/link/` and `/<lang>/board/qr/`: the viewer (`src/components/board/ViewerPage.astro`), where Share and the QR code point: a path per channel, so Cloudflare's request counts can tell opened links from scanned codes. They are `noindex` and left out of the sitemap (`filter` in `astro.config.mjs`);
  - these are the only pages that ship JS. `isBoard` in `scripts/check-budget.mjs` and `e2e/security.spec.ts` lists them; `isViewer` gives the viewer's pages their own budgets.
- **`BoardEditor.svelte`:**
  - it runs `client:only` on the editor's page only;
  - its JS is its own entry chunk plus the chunk it shares with the viewer: the `board` group in `codeSplitting` in `astro.config.mjs` (client build only) holds the Svelte runtime, Astro's Svelte renderer, `Court.svelte` and what reads and plays a board (`format`, `geometry`, `moves`, `play`, `newer`, `viewerIcons`). The editor's own modules stay out of it, so the viewer never loads them. A module both use must fall in the group, or it becomes a chunk of its own and costs a request and import lists. What must load later stays out of it;
  - every board page preloads the JS it loads at once: Astro writes no `modulepreload` for an island, so the `modulepreload` integration in `astro.config.mjs` (`scripts/modulepreload.mjs`) adds one per file to the `<head>` after the build, and `e2e/layout.spec.ts` checks it. Without them the board's JS starts a round trip or two later;
  - the QR code loads later: `src/lib/board/qr.ts` re-exports only `renderSVG` from `uqr`, so the lazy chunk drops the rest of `uqr`. Import it through that module, never `import("uqr")` directly; the editor fetches it once the board is up, so it still works offline;
  - the title bar, the tools, the steps, Play, the layouts and what saves when: `src/components/board/AGENTS.md`; My boards, export and import: `src/lib/board/AGENTS.md`.
- **`BoardViewer.svelte`** runs `client:only` on the viewer's pages; its behavior is in `src/components/board/AGENTS.md`.
- **Statistics:** none in the page. The site loads no script from another origin; what we see is Cloudflare's server-side totals (requests, visitors) and Search Console. Never send board data anywhere: no `#t=` in a path, no custom events.
- **Moved from workers.dev:** a `<script>` in `board.astro` sends the board on `coachboard.hardamkay.workers.dev` (that exact host, not the preview URLs) to the same path on `site`, keeping `#t=`.
  - Without `#t=`, it brings that origin's saved board along as `#own=<URI-encoded JSON>`. `localStorage` belongs to one origin, so a server redirect would leave it behind.
  - The editor keeps an `#own=` board (read with `toBoard()`: it is a version 1 board) as your own and saves it, but only when the new domain has no boards yet and it isn't an untouched default lineup; otherwise it ignores it.
  - Content pages don't redirect (they ship no JS); their canonical already points at the domain.
  - `e2e/move.spec.ts` serves the three hosts from `wrangler dev` with `context.route()`.
- **Testing in a browser:** `npm run e2e` for the core flow; by hand, the Chrome extension, or headless Chrome over the DevTools protocol with `Emulation.setTouchEmulationEnabled` and `Input.dispatchTouchEvent`. Call `Page.bringToFront` first; a background tab ignores touch input.
- **Measuring against a local build** (`wrangler dev`, a copy of the repo): nothing in a page talks to another host, so Lighthouse and your own Playwright scripts need no blocking; `e2e/security.spec.ts` fails on any request for a script from another origin.

## Library content

Tactics and drills: one Markdown file per item and language in `src/content/library/<lang>/<slug>.md`. Every rule for writing, drawing, checking and printing them is in `src/content/AGENTS.md` (read it before touching an item, the schema in `src/content.config.ts`, `src/lib/library.ts` or the item pages).

## Hosting

Cloudflare Workers with static assets, deployed by Workers Builds from Git: `main` is production (https://handballcoachboard.com), every other branch gets a preview URL. The full rules are in `docs/hosting.md`; read it before touching `wrangler.jsonc`, `public/_headers`, `public/_redirects`, the CSP in `astro.config.mjs` or a page's `Astro.csp`. The ones that bite on every change:

- **Never deploy by hand.** Production and previews only go out through Workers Builds, after a merge or push.
- **`wrangler.jsonc` must stay** as it is: a plain upload of `dist/`, the Custom Domain in `routes`, `workers_dev` on (old links on `coachboard.hardamkay.workers.dev` keep working), the empty `previews` block.
- **The CSP is a `<meta>` Astro writes** (`security.csp`), hash-only for scripts, the same on every page; `frame-ancestors` and the other security headers come from `public/_headers`. Nothing from another origin, ever: `e2e/security.spec.ts` and `scripts/check-budget.mjs` fail on it.
- **Dependabot** opens update PRs weekly; nothing merges automatically. Merge when CI is green on the current `main`; if `main` moved since the run, comment `@dependabot rebase` first.

## Not yet

Don't add these without a plan:
- sponsor blocks, an "Install app" button or a "Works offline" claim before there is a PWA;
- `/blog`, `/premium` or `/sponsor`.

## How we work

Less process, the same quality: the automatic checks are the safety net.

- **Done means merged.** A step is done when its PR lands on `main`. Tests on real phones, in the hall or with the team feed the product plan; they never hold a step open.
- **Automatic, always:** `npm run verify` (with the size budgets and the content checks in `checkLibrary()`) before every commit, and the e2e tests in CI.
- **Plans fit on one page:** goal, approach, files, risks, and what Kay decides. Build after Kay's approval.
- **Lighthouse** runs only when a change can move the time until the board is ready: a raised JS or CSS ceiling for a board page, the preloads, the static fallback, a font. A change that stays under the ceilings needs no run. One run per mode on the PR's preview URL, with the pinned commands in `docs/metingen.md`: simulated throttling (the default) and real throttling (`--throttling-method=devtools`). Real throttling, and the time until the board is ready to use or the shared board is on screen, decide. Compare SEO only on production: preview URLs send `X-Robots-Tag: noindex`.
- **`docs/metingen.md`** (Dutch) gets an entry only when measured behaviour changes: a Lighthouse result that moves, a tap budget that changes. A raised size ceiling is recorded in the comment beside it and in the PR, not there. Entries are short.
- **Look at production when a phase merges:** Cloudflare's totals (requests and visitors) and which library pages get found (Search Console). Note something only when it changes a decision.
- **A PR for text or content** says what, why, and how to test (at most 3 lines), with the preview link. No screenshots, PDFs or tables of measurements.
- **Size budgets are a safety net:** the `BUDGETS` constant in `scripts/check-budget.mjs`, in KB of 1000 bytes, gzipped except PNGs: the board's JS and its lazy chunks, all JS in `_astro/`, CSS and HTML per page (the editor's page has its own CSS budget, `boardCss`, for the editor's stylesheet; the viewer's pages have `viewerJs` and `viewerCss`; a library item, a page with its own `og.png`, has `libraryHtml`, because it draws every step), and each PNG. CI (Linux) builds the JS about 0.14 KB larger than macOS.
- **Budgets are ceilings with room.** Each is the size measured on Linux plus room, rounded: about 10% for JS, 15% for CSS and HTML. Two follow a worst case instead: `libraryHtml` the largest item the schema allows, and `png` the largest share image, with room for a new one. A merge that stays under a ceiling changes nothing: no budget edit, no entry in `docs/metingen.md`. Going over takes a raised ceiling with one sentence of reason, in the comment beside it and in the PR; a change that makes a measured task slower or the board heavier to load still needs Kay's yes first. Once a quarter, or after a merge that cut a size, set each ceiling to the new measurement plus its room, in one PR. Plans estimate no bytes and build no throwaway prototypes; the budget script is the arbiter.
- **The tap budget is a maximum** (`TAP_BUDGET` in `e2e/tasks.spec.ts`, `e2e/AGENTS.md`): a route that needs one more action fails until the budget goes up on purpose, with the reason in the PR and the new count in `docs/metingen.md`; a route that got shorter passes, and its budget goes down in the same PR.
- **Dependabot:** merge when CI is green (see Hosting).
- `docs/optimalisatieplan.md` (Dutch) holds the earlier phases and the checks before a step starts ("Voor je begint"); How we work goes before its rules.

## Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
