# Hosting

How the site is hosted and deployed, and what must stay as it is. The rules that bite on every change are in the root `AGENTS.md` (Hosting); this is the full set, for a change to `wrangler.jsonc`, `public/_headers`, `public/_redirects`, the CSP or the Cloudflare dashboard.

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
  - Web Analytics (RUM) off, or at most "Enable with JS Snippet installation": the automatic setup injects a beacon into every page, above the CSP `<meta>`, and the site loads no script from another origin.
- **The CSP is split in two.** Astro writes a `<meta>` CSP into every page (`security.csp` in `astro.config.mjs`), with `default-src 'self'` and a hash for each inline script it emits. Browsers ignore `frame-ancestors` in a `<meta>`, so that one is the header.
  - `style-src` still allows `'unsafe-inline'`. Nothing injects a `<style>` at runtime any more (the editor's CSS is a stylesheet), but without it Astro adds a hash for every inline `<style>`, about 0.6 KB of HTML per page. Dropping it is a separate step. Scripts stay hash-only; never add `'unsafe-inline'` to `script-src`.
  - Anything from another origin (a script, font, image or `fetch`) is blocked until its origin is added. `e2e/security.spec.ts` fails on any CSP violation, and on any script from another origin in the page, which also catches one injected above the `<meta>` (a CSP `<meta>` only covers what comes after it).
  - Every page has the same CSP. A page that needs more (`Astro.csp.insertScriptResource()`, `insertDirective()`) must call it before `BaseLayout` renders `<head>`; a script resource replaces Astro's default `'self'`, so insert `'self'` first.
  - CSP isn't applied in `npm run dev`; check with `npm run build && npx wrangler dev` or `npm run e2e`.
  - Deployed, Cloudflare leaves the `_headers` off the 404 page (`wrangler dev` adds them), so only the `<meta>` CSP reaches it.
- Dependabot (`.github/dependabot.yml`) opens update PRs weekly for npm and GitHub Actions: minor and patch grouped, each major on its own. Nothing merges automatically. Merge when CI is green on the current main. If main has moved since the last run, comment `@dependabot rebase` first.
- `wrangler` is a devDependency, so these commands use the version in `package-lock.json`.
- Try a change to any of these locally with `npm run build && npx wrangler dev`; `npm run e2e` tests the redirects, the headers and the 404 page against it.
