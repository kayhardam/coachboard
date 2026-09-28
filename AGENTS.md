# Handball Coachboard

Static Astro 7 site for handball trainers. The product is the tactics board at `/en/board/`; the content pages lead to it. `CLAUDE.md` is a symlink to this file.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. There is no page at `/` locally; open `/en/`. |
| `npm run verify` | What CI runs (`.github/workflows/ci.yml`, on pull requests and pushes to `main`): `astro check` + `svelte-check` → `vitest run` → `astro build` → `node scripts/check-links.mjs` → `node scripts/check-budget.mjs`. Must be green before every commit. |
| `npm run budget` | The size budgets against the current `dist/` (run `npm run build` first): a table of each measured size next to its budget. |
| `npm run check` / `test` / `build` | The separate steps. `astro check` doesn't type-check `.svelte` files, so `check` also runs `svelte-check --fail-on-warnings`. |
| `npx vitest run src/lib/board/format.test.ts` | One test file; add `-t "<test name>"` for one test. |
| `npm run e2e` | End-to-end tests (Playwright) in mobile Chromium and WebKit. Builds, then serves `dist/` with `wrangler dev` on port 8787. A separate CI job, not part of `verify`. First time: `npx playwright install chromium webkit`. |
| `npx playwright test e2e/board.spec.ts` | One e2e file; add `-g "<test name>"` for one test, `--project=iphone` or `--project=android` for one browser. |
| `node scripts/og-default.mjs` | Re-renders `public/og-default.png`. One-off; commit the PNG. |
| `node scripts/favicons.mjs` | Renders `public/favicon.ico` and `public/apple-touch-icon.png` from `public/favicon.svg` (the brand mark). One-off; commit the results. |

When starting the dev server as an agent, use background mode: `npx astro dev --background`, and manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.

## Code and tests

- Tests sit next to the code: `*.test.ts` in `src/`, `*.test.mjs` in `scripts/`.
- Vitest runs through Astro's Vite config (`getViteConfig` in `vitest.config.ts`), so a test can import a `.svelte` file and render it with `svelte/server` (see `Court.test.ts`).
- `src/lib/` is plain TypeScript with no `astro:` imports, so vitest can test it. Code that needs `astro:content` goes in `src/data/` and calls into `src/lib/`: `src/data/tactics.ts` loads the collection and runs `checkTactics()` from `src/lib/tactics.ts`.
- `src/data/categories.ts` must not import from `astro:` either, because `src/content.config.ts` imports it.
- End-to-end tests are in `e2e/*.spec.ts`, with shared steps in `e2e/helpers.ts`:
  - compare boards by the pieces the editor draws (`pieces()`), not by the link text: compression can give other bytes per browser;
  - don't use `click()` to prove a button is reachable, because Playwright scrolls it into view first; use `toBeInViewport()`;
  - a known bug gets a test with `test.fail()` and a pointer to its finding in `docs/metingen.md`, and the fix removes the marker.

## URLs and routing

- **Trailing slash everywhere.** `trailingSlash: "always"`: every internal link, canonical and sitemap entry ends in `/`. Build links with `getRelativeLocaleUrl(locale, "privacy/")` from `astro:i18n`, not by hand.
- **Every language has a prefix** (`/en/`, later `/nl/` and `/de/`). Pages live under `src/pages/[lang]/` and export `getStaticPaths = localeParams`. `404.astro` is the only page outside `[lang]`.
- **`/` has no page.** Cloudflare redirects it to `/en/` (`public/_redirects`); Astro's own root redirect is off.
- **Locales are configured once**, in the `locales` map in `astro.config.mjs` (it feeds both Astro's i18n and the sitemap's hreflang). `src/i18n/locales.ts` exposes them typed.
- **Only link to pages that exist.** `scripts/check-links.mjs` fails the build on a missing target or a page link without a trailing slash. It also checks own-origin URLs in `href`, `src` and `content`, so canonical, `og:image` and hreflang are covered.

## Layout, SEO and text

- Every page renders through `src/layouts/BaseLayout.astro` with a real `title` and `description`. It owns the whole `<head>`:
  - canonical and `og:url` from `site` + the page path;
  - absolute `og:image`, always a 1200×630 PNG: `/og-default.png` by default, a tactic's own `og.png` on its page;
  - `lang` and `og:locale` from the page's locale;
  - hreflang + `x-default` once `alternates` lists more than one translation;
  - `noindex` (for the 404) drops canonical and `og:url`.
- `BaseLayout` renders `Header`, `<main id="main">` and `Footer`. With `fullscreen` (the board page) the body fills the viewport and there is no footer.
- Menu and footer links come from `src/data/nav.ts`. Labels and short page texts come from `t(locale, key)` in `src/i18n/ui.ts`; `t(locale, key, { title })` fills `{title}` placeholders.
- The site owner's name and contact address are in `src/data/site.ts` (about and privacy pages).
- English is the source dictionary. Another language may leave keys out; they fall back to English per key.
- Long page text (privacy, about) is still English in the `.astro` file. A new locale needs a plan for translating it, or `/nl/privacy/` will show English.
- Astro's HTML compression drops a line break between text and an inline tag on the next line ("See the" + newline + `<a>` renders as "See the<a>"). Start the tag on the same line as the text before it.

## Styling

- **Global CSS is two files**, imported once by `BaseLayout`:
  - `src/styles/tokens.css`: custom properties;
  - `src/styles/base.css`: reset, typography, focus ring, `.container`, `.btn`, `.btn-primary`, `.btn-secondary`.
- **Everything else is a scoped `<style>`** in the component or page. No inline `style` attributes.
- **Mobile-first.** Base styles are for phones. Wider layouts go in `@media (min-width: 560px)` or `@media (min-width: 860px)`, and only those two.
- **Green behind or as text** uses `--color-accent-dark` (5.0:1 on white). `--color-accent` is for fills and icons only (3.3:1).
- **Touch targets** are at least `var(--tap)` (44px) high.
- **The narrow-screen menu** is a `<details>` element, without JavaScript. Content pages ship no JS: `scripts/check-budget.mjs` fails on any `<script>` (JSON-LD excepted), `<astro-island>` or modulepreload outside `/<lang>/board/`.
- **Icons** come from one set in `src/lib/icons.ts` (24×24, 2-unit stroke, round caps, `currentColor`), drawn with `Icon.astro` on content pages and inline in `BoardEditor`. No emoji anywhere in the UI.
  - An icon next to visible text is decorative (`aria-hidden`, which `Icon.astro` sets). An icon-only button needs `aria-label` and `title`.
  - Icons take their colour from the text: `--color-accent-dark` when they carry meaning. In cards they sit on a 44×44 tile with `--color-accent-soft` behind them.
  - Size an icon with `font-size` on its wrapper; it is 1.25em.

## The board

Code: `src/lib/board/` (plain TypeScript, unit-tested) and `src/components/board/` (Svelte 5).

- **Coordinates:** whole decimetres on a portrait court with the goal at the top. `x` runs 0–200 (sideline to sideline), `y` runs 0–400 from the goal line; a half court shows `y` 0–200.
- **`format.ts` is a contract.** Links look like `1.<payload>` and end up in QR codes and team chats, so version 1 must decode forever.
  - Never edit the files in `src/lib/board/fixtures/`; the tests decode them.
  - A change to the format gets a new prefix (`2.`) and its own reader in `decode()`, next to the v1 reader.
  - To add a fixture, write `{ link: await encode(board), board }` once and commit it.
  - The budget test keeps a full lineup (7+7 players, ball, 6 arrows) at ≤ 300 characters.
  - `isBoard()` is hand-written so the client bundle needs no Zod; the content schema reuses it.
- **`edit.ts` is pure:** every operation returns a new board. The editor keeps the board in `$state.raw`, and undo is a list of earlier boards.
- **`Court.svelte` stays pure SVG**, with no browser APIs, so Astro can render it without JS (the home page, the board's fallback, tactic pages and their thumbnails). Pieces carry `data-kind` and `data-index`; the editor finds them with event delegation. Colours are SVG attributes, not CSS variables, so `courtPng()` can render it to a PNG on the server.
- **`BoardEditor.svelte`:**
  - it runs `client:only` on `/[lang]/board/` only, the one page that ships JS;
  - its strings come in as a prop from `boardStrings()` in `ui.ts`;
  - it loads `#t=` first, then `localStorage` (`coachboard.board`), then the default lineup;
  - every change is written to both (300 ms debounce), so the address bar is always a shareable link;
  - a board that came from a `#t=` link reaches `localStorage` only after its first edit, so opening a shared play or a tactic doesn't replace your own saved board.
- **Testing in a browser:** `npm run e2e` for the core flow; by hand, the Chrome extension, or headless Chrome over the DevTools protocol with `Emulation.setTouchEmulationEnabled` and `Input.dispatchTouchEvent`. Call `Page.bringToFront` first; a background tab ignores touch input.

## Tactics content

- **One Markdown file per tactic and language:** `src/content/tactics/<lang>/<slug>.md`. The entry id is `<lang>/<slug>` and the page is `/<lang>/tactics/<category>/<slug>/`. A translation later gets the same file name in another language folder.
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
  - a `related` that points at itself or another language, or a file outside a language folder (`checkTactics()` in `src/lib/tactics.ts`, called by `src/data/tactics.ts`).
- **Diagrams:** draw the play at `/en/board/` in `npm run dev`, press "JSON" (dev only) and paste the output as `board:`. JSON is valid YAML. The existing files write it in YAML flow style, one player or arrow per line, which is easier to review. Tactic pages show `frames[0]`.
- **Categories:** `categorySlugs` in `src/data/categories.ts` is the only list. Their texts are the `category.<slug>.*` keys in `ui.ts`, and each has an icon of the same name in `icons.ts`. A category page exists only when that language has a tactic in it; otherwise its card says "Soon" and has no link, so no empty pages get indexed.
- **Links into the board:** "Open in the board" carries the diagram in `#t=`, encoded at build time.
- **Share image:** `src/pages/[lang]/tactics/[category]/[slug]/og.png.ts` renders the diagram with `courtPng()` (`svelte/server` + `sharp`) as a 1200×630 PNG next to the page. The only text in it is the player labels; without a font they drop out, and the build still passes.

## Hosting

Cloudflare Workers with static assets, deployed by Workers Builds (Git integration): build command `npm run build`, then `npx wrangler deploy` for production (`main`) and `npx wrangler preview` for a preview URL on other branches.

- **`wrangler.jsonc` must stay.** It makes the deploy a plain upload of `dist/`, with no Worker code and no Astro adapter. Without it, Wrangler reconfigures the project on every deploy: it runs `astro add cloudflare` and adds KV and Images bindings.
- It also sets `html_handling: "auto-trailing-slash"` (`/en/privacy` → `/en/privacy/`) and `not_found_handling: "404-page"` (serves `dist/404.html`).
- Its empty `previews` block must stay too: `wrangler preview` fails without it, so every branch build would fail while `npm run verify` stays green. `npx wrangler deploy --dry-run` passes without it, so it doesn't catch this.
- `public/_redirects` holds the root redirect. `public/_headers` gives `/_astro/*` (hashed files) a one-year immutable cache.
- `wrangler` is a devDependency, so these commands use the version in `package-lock.json`.
- Try a change to any of these locally with `npm run build && npx wrangler dev`; `npm run e2e` tests the redirects and the 404 page against it.

## Not yet

Don't add these without a plan:
- sponsor blocks, an "Install app" button or a "Works offline" claim before there is a PWA;
- `/blog`, `/premium` or `/sponsor`.

## Optimization work

- `docs/optimalisatieplan.md` (Dutch) lays out the optimization work in phases, one branch and one PR per phase. Its rules apply to every phase.
- **Size budgets** are the `BUDGETS` constant in `scripts/check-budget.mjs`, in KB of 1000 bytes, gzipped except PNGs: the board's JS and its lazy chunks, all JS in `_astro/`, CSS and HTML per page, and each PNG. Raise one only on purpose, with the reason in the PR and the new measurement in `docs/metingen.md`.
- Measure before and after any change that affects speed, size or behaviour, and record both in `docs/metingen.md` (Dutch). Later phases run Lighthouse on their PR's preview URL, with the command listed there. Compare SEO only on production: preview URLs send `X-Robots-Tag: noindex`.

## Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
