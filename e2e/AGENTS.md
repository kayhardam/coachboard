# End-to-end tests

Read with the root `AGENTS.md`, when a file in this folder is read; `CLAUDE.md` here is a symlink to this file.

The tests are in `e2e/*.spec.ts`, with shared steps in `e2e/helpers.ts`.

- compare boards by the pieces the editor draws (`pieces()`), not by the link text: compression can give other bytes per browser;
- don't use `click()` to prove a button is reachable, because Playwright scrolls it into view first; use `toBeInViewport()`;
- a known bug gets a test with `test.fail()` and a pointer to its finding in `docs/metingen.md`, and the fix removes the marker;
- `e2e/tasks.spec.ts` is the tap budget: it counts the actions (taps, drags, key presses) of the shortest route for each measured task, in every language, and requires exactly `TAP_BUDGET`. A longer or a shorter route fails until the budget changes on purpose, with the reason in the PR and the new count in `docs/metingen.md` ("UX-metingen"). A task on two devices (T4: laptop and phone) runs both in one test, each in its own context with its own storage. Typing a whole sentence or title counts as one action (`type()` in the route); a key press such as Enter counts on its own;
- find board buttons by their text in the page's language: `t(lang, "board.share")` from `src/i18n/ui.ts`, as `e2e/tasks.spec.ts` does;
- open the editor with `openBoard()` and a shared board in the viewer with `openViewer()` (`e2e/helpers.ts`). The viewer's pages need a board in `#t=`: without one they send you to the editor;
- `e2e/i18n.spec.ts` checks hreflang, the sitemap and the language links; `allPages()` reads the pages from `dist/`, and `security.spec.ts` fails if a language's board pages are missing from it;
- import `test` and `expect` from `./helpers`, not from `@playwright/test`: its `test` answers the statistics beacon with an empty script and its endpoint with 204, so no test sends data to the real dashboard (also not with `E2E_BASE_URL`). A context a test makes itself with `browser.newContext()` (a second device, like T4's laptop) needs `stubBeacon()` from `./helpers` for the same. `e2e/analytics.spec.ts` runs the real beacon (it needs network) and checks what it sends.
