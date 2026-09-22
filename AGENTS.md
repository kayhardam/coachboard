# Handball Coachboard

Static Astro 7 site for handball trainers. The product is the tactics board at `/en/board/`; the content pages lead to it. `CLAUDE.md` is a symlink to this file.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. There is no page at `/` locally; open `/en/`. |
| `npm run verify` | What CI runs: `astro check` + `svelte-check` → `vitest run` → `astro build` → `node scripts/check-links.mjs`. Must be green before every commit. |
| `npm run check` / `test` / `build` | The separate steps. `astro check` doesn't type-check `.svelte` files, so `check` also runs `svelte-check --fail-on-warnings`. |
| `node scripts/og-default.mjs` | Re-renders `public/og-default.png`. One-off; commit the PNG. |

When starting the dev server as an agent, use background mode: `npx astro dev --background`, and manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.

## URLs and routing

- **Trailing slash everywhere.** `trailingSlash: "always"`: every internal link, canonical and sitemap entry ends in `/`. Build links with `getRelativeLocaleUrl(locale, "privacy/")` from `astro:i18n`, not by hand.
- **Every language has a prefix** (`/en/`, later `/nl/` and `/de/`). Pages live under `src/pages/[lang]/` and export `getStaticPaths = localeParams`. `404.astro` is the only page outside `[lang]`.
- **`/` has no page.** Cloudflare redirects it to `/en/` (`public/_redirects`); Astro's own root redirect is off.
- **Locales are configured once**, in the `locales` map in `astro.config.mjs` (it feeds both Astro's i18n and the sitemap's hreflang). `src/i18n/locales.ts` exposes them typed.
- **Only link to pages that exist.** `scripts/check-links.mjs` fails the build on a missing target or a page link without a trailing slash. It also checks own-origin URLs in `href`, `src` and `content`, so canonical, `og:image` and hreflang are covered.

## Layout, SEO and text

- Every page renders through `src/layouts/BaseLayout.astro` with a real `title` and `description`. It owns the whole `<head>`:
  - canonical and `og:url` from `site` + the page path;
  - absolute `og:image` (default `/og-default.png`, 1200×630);
  - `lang` and `og:locale` from the page's locale;
  - hreflang + `x-default` once `alternates` lists more than one translation;
  - `noindex` (for the 404) drops canonical and `og:url`.
- `BaseLayout` renders `Header`, `<main id="main">` and `Footer`.
- Menu and footer links come from `src/data/nav.ts`. Labels and short page texts come from `t(locale, key)` in `src/i18n/ui.ts`.
- English is the source dictionary. Another language may leave keys out; they fall back to English per key.
- Long page text (privacy) is still English in the `.astro` file. A new locale needs a plan for translating it, or `/nl/privacy/` will show English.
- Astro's HTML compression drops a line break between text and an inline tag on the next line ("See the" + newline + `<a>` renders as "See the<a>"). Start the tag on the same line as the text before it.

## Styling

- **Global CSS is two files**, imported once by `BaseLayout`:
  - `src/styles/tokens.css`: custom properties;
  - `src/styles/base.css`: reset, typography, focus ring, `.container`, `.btn`, `.btn-primary`, `.btn-secondary`.
- **Everything else is a scoped `<style>`** in the component or page. No inline `style` attributes.
- **Mobile-first.** Base styles are for phones. Wider layouts go in `@media (min-width: 560px)` or `@media (min-width: 860px)`, and only those two.
- **Green behind or as text** uses `--color-accent-dark` (5.0:1 on white). `--color-accent` is for fills and icons only (3.3:1).
- **Touch targets** are at least `var(--tap)` (44px) high.
- **The narrow-screen menu** is a `<details>` element, without JavaScript. Content pages ship no JS.

## The board

Code: `src/lib/board/` (plain TypeScript, unit-tested) and `src/components/board/` (Svelte 5).

- **Coordinates:** whole decimetres on a portrait court with the goal at the top. `x` runs 0–200 (sideline to sideline), `y` runs 0–400 from the goal line; a half court shows `y` 0–200.
- **`format.ts` is a contract.** Links look like `1.<payload>` and end up in QR codes and team chats, so version 1 must decode forever.
  - Never edit the files in `src/lib/board/fixtures/`; the tests decode them.
  - A change to the format gets a new prefix (`2.`) and its own reader in `decode()`, next to the v1 reader.
  - To add a fixture, write `{ link: await encode(board), board }` once and commit it.
  - The budget test keeps a full lineup (7+7 players, ball, 6 arrows) at ≤ 300 characters.
  - `isBoard()` is hand-written so the client bundle needs no Zod; Fase 2's content schema reuses it.
- **`edit.ts` is pure:** every operation returns a new board. The editor keeps the board in `$state.raw`, and undo is a list of earlier boards.
- **`Court.svelte` stays pure SVG**, with no browser APIs, so Astro can render it without JS (the home page, the board's fallback, and tactic pages later). Pieces carry `data-kind` and `data-index`; the editor finds them with event delegation. Colours are SVG attributes, not CSS variables, so a server-side PNG render works too.
- **`BoardEditor.svelte`:**
  - it runs `client:only` on `/[lang]/board/` only, the one page that ships JS;
  - its strings come in as a prop from `boardStrings()` in `ui.ts`;
  - it loads `#t=` first, then `localStorage` (`coachboard.board`), then the default lineup;
  - every change is written to both (300 ms debounce), so the address bar is always a shareable link.
- **Testing in a browser:** the Chrome extension, or headless Chrome over the DevTools protocol with `Emulation.setTouchEmulationEnabled` and `Input.dispatchTouchEvent`. Call `Page.bringToFront` first; a background tab ignores touch input.

## Hosting

Cloudflare Pages via Git integration: build `npm run build`, output `dist`. `public/_redirects` holds the root redirect. `public/_headers` gives `/_astro/*` (hashed files) a one-year immutable cache.

## Not yet

Don't add these without a plan:
- links to `/tactics/` or `/about/` before those pages exist;
- sponsor blocks, an "Install app" button or a "Works offline" claim before there is a PWA;
- `/blog`, `/premium` or `/sponsor`.

## Astro documentation

Full documentation: https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
