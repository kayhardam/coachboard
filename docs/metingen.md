# Metingen

Hier staan alle metingen van het optimalisatieplan (`docs/optimalisatieplan.md`). Elke fase voegt haar metingen van vóór en na toe, met datum en commit.

## Nulmeting (Fase 3, 26 september 2026)

### Meetomgeving

- Code: `main` @ `d2e32b8`, na een schone `npm ci`.
- `npm run verify` groen: 7 testbestanden met 71 tests, 10 pagina's, 125 interne links.
- Node 22.22.2, npm 10.9.7, Astro 7.3.3, Svelte 5.57.1, Vite 8.3.0, uqr 0.1.3.
- Lighthouse 13.5.0 (via `npx`, niet in `package.json`), Chrome 153.0.8010.53 headless, op een Mac.

### Groottes per pagina (`dist/`)

**Methode:** een eenmalig Node-script na `npm run build`. Het vaste budgetscript komt in Fase 4b.

- **HTML:** het HTML-bestand zelf, inline scripts inbegrepen.
- **CSS:** de bestanden uit `<link rel="stylesheet">`.
- **JS:** de bestanden uit `<script src>` en de `component-url`/`renderer-url` van `astro-island`, plus alles wat die statisch importeren.
- **Eenheden:** in KB (1000 bytes). Gzip met Node `zlib` op standaardniveau. Cloudflare comprimeert zelf (gzip of brotli), dus de echte overdracht kan iets afwijken.

| Pagina | HTML raw | HTML gzip | CSS raw | CSS gzip | JS raw | JS gzip | Inline script in HTML (raw) |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/404.html` | 8,0 | 2,4 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/` | 22,6 | 4,8 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/about/` | 9,6 | 2,8 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/privacy/` | 10,5 | 3,2 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/board/` | 25,2 | 5,5 | 5,3 | 1,6 | **74,0** | **28,2** | 4,5 |
| `/en/tactics/` | 28,6 | 4,7 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/tactics/attack/` | 20,0 | 4,3 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/tactics/attack/fast-break-second-wave/` | 21,1 | 4,8 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/tactics/defense/` | 19,9 | 4,3 | 5,3 | 1,6 | 0 | 0 | 0 |
| `/en/tactics/defense/6-0-defense-basics/` | 28,6 | 5,2 | 5,3 | 1,6 | 0 | 0 | 0 |

Alle pagina's delen één CSS-bestand (`BaseLayout.*.css`).

JavaScript van het bord:

| Bestand | Inhoud | Raw | Gzip |
|---|---|--:|--:|
| `client.*.js` | Svelte-runtime | 40,0 | 15,4 |
| `BoardEditor.*.js` | editor, met de QR-bibliotheek `uqr` (ongeveer 4 KB gzip) | 33,2 | 12,3 |
| `client.svelte.*.js` | Astro's Svelte-renderer (de loader) | 0,9 | 0,5 |
| **Totaal** | | **74,0** | **28,2** |

OG-afbeeldingen (PNG, 1200×630):

| Bestand | Grootte |
|---|--:|
| `/og-default.png` | 50,5 KB |
| `/en/tactics/attack/fast-break-second-wave/og.png` | 45,5 KB |
| `/en/tactics/defense/6-0-defense-basics/og.png` | 37,2 KB |

### Lighthouse mobiel (productie)

**Methode:** gemeten op `https://coachboard.hardamkay.workers.dev`, drie runs per URL. De tabel toont de mediaan.

- Standaardinstellingen voor mobiel: gesimuleerde throttling (150 ms RTT, ongeveer 1,6 Mbit/s, 4× CPU-vertraging) en een scherm van 412×823 (Moto G Power).
- Commando per run:

```sh
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx -y lighthouse@13.5.0 <url> --form-factor=mobile --output=json \
  --output-path=<bestand>.json --chrome-flags="--headless=new" --quiet
```

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |
| `/en/board/` | 100 | 100 | 100 | 100 | 0,81 s | 0 | 0 ms |
| `/en/tactics/defense/6-0-defense-basics/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |

Per run (Performance, LCP):

- `/en/`: 99, 100, 100 (0,83, 0,83, 0,81 s)
- `/en/board/`: 100, 100, 100 (0,91, 0,80, 0,81 s)
- tactiekpagina: 100, 100, 100 (0,83, 0,83, 0,82 s)

Wat Lighthouse verder liet zien:

- **Overdracht.** Contentpagina's: 3 verzoeken, 8,5 tot 8,8 KB (HTML, CSS, favicon). Het bord: 6 verzoeken, 40,5 KB.
- **LCP-element.** Op `/en/` en de tactiekpagina is dat de introtekst (`p.lead`), op het bord het logo in de header. Het veld zelf is SVG en telt voor LCP niet mee.
- **Render-blocking CSS.** Lighthouse markeert het CSS-bestand, maar schat de winst op 0 ms. Hier valt niets te halen.

Grenzen van deze meting:

- Het is een labmeting op een snelle Mac met gesimuleerde vertraging, geen echte telefoon.
- INP (reactie op tikken en slepen) meet Lighthouse zo niet; TBT is alleen een benadering. Echte telefoons komen uit de testronde hieronder en uit Fase 8.
- De SEO-score van 100 betekent niet dat SEO in orde is: Lighthouse controleert niet of de canonical-URL bestaat (zie bevinding 3).

Latere fases meten op de preview-URL van hun PR, met hetzelfde commando.

### Testronde op echte telefoons (Kay)

Uitgevoerd door Kay op 27 september 2026, op `https://coachboard.hardamkay.workers.dev/en/board/`. Kay gaf de resultaten samengevat door, niet per toestel. Daarom staat er één kolom Resultaat in plaats van aparte kolommen voor iPhone en Android.

Legenda: ✅ werkt, ⚠️ werkt maar stroef, ❌ werkt niet, — niet apart gemeld.

**Toestellen:** niet genoteerd ("op telefoon"). Welk model, welk besturingssysteem en welke browser is nog onbekend.

Kays eigen woorden:

> board werkt naar behoren. ook het delen qr en social. op telefoon bij fullcourt niet meer mogelijk om iconen te selecteren. ook kantelen van telefoon niet meer scrollbaar.

| # | Test | Resultaat | Opmerking |
|--:|---|:-:|---|
| 1 | Bord openen: de standaardopstelling staat er | ✅ | "board werkt naar behoren" |
| 2 | Een speler slepen: volgt hij je vinger soepel? | ✅ | Op het halve veld werkt het. Op het volledige veld reageren de knoppen in de balken onderaan niet meer. Zie bevinding 1. |
| 3 | Een pijl tekenen (loopactie, pass of dribbel) | ✅ | |
| 4 | Ongedaan maken: de laatste stap verdwijnt | ✅ | |
| 5 | Delen naar WhatsApp | ✅ | "delen … social" werkt |
| 6 | De gedeelde link openen op een tweede telefoon: hetzelfde bord? | ✅ | Valt onder "delen werkt" |
| 7 | QR-code op het scherm scannen vanaf 1 à 2 meter: opent het bord? | ✅ | "delen qr" werkt |
| 8 | Tactiekpagina (bijv. `/en/tactics/defense/6-0-defense-basics/`) → "Open in the board": de tactiek staat op het bord | — | |
| 9 | Daarna het bord opnieuw openen zonder link: je eigen bord staat er nog | — | |
| 10 | Staand: alles bereikbaar met één hand? | ⚠️ | Staand werkt het bord, maar op het volledige veld niet (zie punt 2) |
| 11 | Liggend: gebruikt het bord de ruimte goed? | ❌ | Na kantelen is de pagina niet meer scrollbaar. Zie bevinding 2. |
| 12 | Tablet: staand en liggend | — | |
| 13 | Snel twee keer op een knop tikken: zoomt de pagina in? | — | |
| 14 | Na het laden vliegtuigmodus aan: kun je nog slepen, tekenen en de QR-code openen? | — | |
| 15 | Stopwatch: openen → tekenen → gedeeld in de teamapp, in seconden | — | |

De punten met — (8, 9 en 12 tot en met 15) en de verdeling per toestel schuiven door naar de testronde van Fase 5, op de preview-URL.

### Bevindingen

Geordend op impact en moeite, met de uitkomsten van de testronde erin verwerkt. De twee problemen uit de testronde staan bovenaan: ze raken de kernflow nu, voor elke gebruiker. Punten 3 tot en met 5 wachten op het domein.

| # | Bevinding | Impact | Moeite | Fase |
|--:|---|---|---|---|
| 1 | ~~**Op een telefoon reageren de knoppen in de balken onderaan niet meer zodra het volledige veld aan staat** (testronde, punt 2; Kay bevestigde op 27 september dat met "iconen" de knoppen bedoeld zijn). **In Fase 4a gereproduceerd met mobiele emulatie.** Het volledige veld groeit tot ongeveer 730 px hoog: het schaalt naar de breedte in plaats van naar de beschikbare hoogte. Daardoor schuiven beide balken onder het scherm. Op een iPhone 15-viewport (393×659) staan ze op 809–908 px. De pagina scrollt niet, dus de knoppen zijn onbereikbaar. Vastgelegd in `e2e/full-court.spec.ts` (`test.fail()`).~~ **Opgelost in Fase 5:** het veld past in de ruimte tussen de balken; `e2e/layout.spec.ts`. | hoog | middel | 5 |
| 2 | ~~**Liggend is het bord niet te gebruiken: de pagina scrollt niet** (testronde, punt 11). Oorzaak volgens de code: de bordpagina is `height: 100dvh; overflow: hidden` (`.fullscreen` in `BaseLayout.astro`). In een liggend scherm van ongeveer 390 px hoog nemen de header en de twee knoppenbalken het grootste deel in, en scrollen kan niet. Waarschijnlijk dezelfde oorzaak als bevinding 1: in de emulatie van Fase 4a staan de balken liggend met het volledige veld ook ver onder het scherm.~~ **Opgelost in Fase 5:** liggend staan de balken als kolommen links en rechts, zonder header (optie B). | hoog | middel | 5 |
| 3 | **Canonical en `og:image` wijzen naar `handballcoachboard.com`, dat nog niet bestaat.** Gevolgen: een link vanaf workers.dev krijgt in WhatsApp geen voorbeeldafbeelding, en zoekmachines volgen een canonical naar een domein dat niet reageert. Lighthouse ziet dit niet. | hoog | laag, zodra het domein er is | 7 |
| 4 | **Het contactadres `contact@handballcoachboard.com` werkt nog niet.** Het staat op de privacy- en aboutpagina. | hoog (belofte op de privacypagina) | laag | 7 |
| 5 | **Deellinks en QR-codes gebruiken `location.origin`** (`BoardEditor.svelte`). Alles wat nu vanaf workers.dev gedeeld wordt, moet na de verhuizing doorsturen, met behoud van pad en `#t=`. | hoog | middel | 7 |
| 6 | ~~**Er zijn geen browsertests voor de kernflow**~~ **Opgelost in Fase 4a:** 50 e2e-tests in mobiel Chromium en WebKit, met een eigen CI-job. | hoog | middel | 4a |
| 7 | ~~**Niets bewaakt dat contentpagina's zonder JS blijven en het bord licht blijft.**~~ **Opgelost in Fase 4b:** `scripts/check-budget.mjs` in `npm run verify` laat de build falen op JS op een contentpagina en op een overschreden budget. | middel | laag | 4b |
| 8 | **Risico op zoomen bij dubbel tikken in iOS Safari.** Alleen het veld (`.stage`) heeft `touch-action`, de knoppen niet. Nog een hypothese: punt 13 is in de testronde niet gemeld en schuift door naar Fase 5. **Fase 5:** nog niet getest; test 13 staat in de testronde van Fase 5, en pas als de pagina zoomt komt er `touch-action: manipulation`. | middel | laag | 5 |
| 9 | **Geen security headers**, alleen de cache-header voor `/_astro/*` in `public/_headers`. | middel | laag tot middel (CSP voor de inline scripts van het bord) | 6 |
| 10 | ~~**De QR-bibliotheek zit in de editorbundel** (ongeveer 4 KB gzip). Pas laden bij het openen van de QR-dialoog scheelt weinig.~~ **Opgelost in Fase 5:** de QR-bibliotheek laadt na het bord; bij het laden 30,1 → 27,0 KB. | laag | laag | 5 |
| 11 | **Laadsnelheid in het lab:** alle pagina's 100, LCP ongeveer 0,8 s, CLS 0, TBT 0 ms. Er valt hier niets te winnen; de volgende stappen zijn vastleggen (4a, 4b) en echte telefoons (testronde, Fase 8). | — | — | — |
| 12 | **Opgelost in Fase 4a: een kapotte link overschreef het opgeslagen bord met de standaardopstelling.** Gevonden bij het lezen van de code voor Fase 4a, bevestigd met een e2e-test en daarna opgelost. Zie "Fase 4a" hieronder. | hoog | laag | 4a |
| 13 | **In WebKit's offline-emulatie mislukt het lezen van een Blob**, dus ook `encode()`: offline komt er in de emulatie geen deellink, geen QR-code en geen `#t=` in de adresbalk. Gevonden in Fase 5. Onbekend of een echte iPhone in vliegtuigmodus dit ook doet; dat is test 14. | middel (als het echt is) | onbekend | 5 (testronde) |

## Fase 4a: vangnet met end-to-end-tests (27 september 2026)

Branch `fase-4a-e2e` (PR #6), vanaf `main` @ `e930f42`.

### Wat er getest wordt

- **Opzet:** Playwright 1.63.0 in twee projecten met mobiele emulatie (viewport, touch, user agent):
  - `android`: Chromium, profiel Pixel 7;
  - `iphone`: WebKit, profiel iPhone 15.
- **Server:** de tests draaien tegen `wrangler dev` (4.141.0), dat `dist/` serveert zoals productie.
- **Omvang:** 25 tests per project, samen 50.
- **Wat de tests dekken:**
  - de standaardopstelling;
  - slepen zet binnen een seconde een nieuwe `#t=1.…` in de adresbalk;
  - een gedeelde link in een schone browsercontext geeft hetzelfde bord;
  - elke fixture uit `src/lib/board/fixtures/` opent als link;
  - een geldige link en "Open in the board" laten het opgeslagen bord staan tot de eerste bewerking;
  - een kapotte link toont de melding en houdt je eigen bord;
  - de QR-dialoog;
  - Delen kopieert de link als er geen `navigator.share` is;
  - `/` → `/en/`, `/en/privacy` → `/en/privacy/`, en een 404 met `noindex`;
  - een axe-scan (`@axe-core/playwright` 4.13.0) op alle 10 pagina's en de 404 vindt niets van niveau `serious` of `critical`.
- **Bekende fout:** `e2e/full-court.spec.ts` legt bevinding 1 vast met `test.fail()`. Die test gaat rood zodra Fase 5 het oplost; dan moet de markering eraf.
- **Beperking:** slepen gaat via pointer-events van de muis in een mobiele viewport, niet via echte touch-events. Echte touch blijft voor de testronde op telefoons.
- **Stabiliteit:** de eerste CI-run had één rode test op WebKit. Dat was een race in de test zelf, niet in de app: hij las het opgeslagen bord uit vóór de debounced opslag van de sleep, en sleepte een speler waar de bal bovenop lag. Na de fix (`saveOwnBoard()` in `e2e/helpers.ts`) lokaal 5 keer herhaald, 250/250 groen, en met CI-instellingen 3 keer, 150/150 groen.

### Controle: kapotte v1-decoder

Tijdelijk `case "1"` → `case "9"` in `decode()` (`src/lib/board/format.ts`), zodat v1-links niet meer gelezen worden. Daarna teruggezet met `git checkout`; niet gecommit.

| | Geslaagd | Gefaald |
|---|--:|--:|
| Met kapotte decoder | 38 | **12** |
| Na terugzetten | 50 | 0 |

De 12 gefaalde tests zijn in beide browsers:

- gedeelde link in een schone browser;
- de drie fixtures;
- een link laat het opgeslagen bord staan;
- "Open in the board".

### Bug: kapotte link overschreef het opgeslagen bord

**Vóór** (`main` @ `e930f42`), in beide browsers:

- Een kapotte `#t=`-link bij het openen toonde "This link couldn't be opened. Showing the default lineup."
- Binnen 300 ms stond de standaardopstelling in `localStorage` in plaats van het eigen bord.
- De test is eerst gecommit met `test.fail()` (`b8e3bcc`), om te laten zien dat hij op de oude code faalt.

**Na** (`623f54e`):

- De melding is "This link couldn't be opened." Later in deze PR aangepast: zie hieronder.
- Het bord laadt je opgeslagen bord, of de standaardopstelling als er niets is opgeslagen.
- `localStorage` blijft ongewijzigd.
- De test slaagt zonder markering.

Groottes (zelfde methode als de nulmeting):

| | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 28,2 KB | 28,2 KB |
| `BoardEditor.*.js` (gzip) | 12,3 KB | 12,3 KB |

Lighthouse mobiel op de preview-URL (`https://fase-4a-e2e-coachboard.hardamkay.workers.dev/en/board/`, mediaan van 3):

| | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| Vóór (productie, nulmeting) | 100 | 100 | 100 | 100 | 0,81 s | 0 | 0 ms |
| Na (preview) | 100 | 100 | 100 | 66 | 0,84 s | 0 | 0 ms |

De lagere SEO-score komt niet door deze wijziging. Cloudflare zet op preview-URL's `X-Robots-Tag: noindex`, en Lighthouse rekent dat mee. **SEO vergelijk je voortaan alleen op productie**; de andere drie scores wel op de preview-URL.

### Melding bij een kapotte link (op verzoek van Kay)

**Wat er veranderd is:**

- Met een opgeslagen bord is de melding "This link couldn't be opened. You're seeing your own board. Ask the sender for a new link."
- Zonder opgeslagen bord eindigt de tweede zin op "You're seeing the default lineup."
- De melding blijft staan tot je hem wegklikt of het bord bewerkt. Andere meldingen verdwijnen nog steeds na 6 seconden.

**Hoe het getest is:**

- De tests zetten de klok 10 seconden vooruit (`page.clock`) en controleren dat de melding er dan nog staat. Daarna verdwijnt hij bij een sleep of bij de sluitknop.
- Controle: met een niet-reactieve versie van de "bewerkt?"-controle falen de tests in beide browsers. Dat was mijn eerste versie; de tests vingen de fout.

| | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 28,2 KB | 28,3 KB |
| `BoardEditor.*.js` (gzip) | 12,3 KB | 12,4 KB |
| E2e-tests | 50 | 52 |

### Kosten van het vangnet

| | Vóór | Na |
|---|--:|--:|
| `node_modules` na `npm ci` (lokaal) | 241 MB | 447 MB |
| CI-job `verify` | 26 s | 33 s |
| CI-job `e2e` (nieuw) | — | 1 min 52 s, waarvan 57 s browsers installeren en 39 s tests |
| Browsers lokaal (`~/Library/Caches/ms-playwright`) | — | ongeveer 850 MB (Chromium, Chrome Headless Shell, WebKit) |

Voor bezoekers verandert er niets: alle nieuwe pakketten zijn devDependencies.

## Fase 4b: vangnet met budgetten (28 september 2026)

Branch `fase-4b-budgetten`, vanaf `main` @ `c3b77e3`.

### Wat er bewaakt wordt

`scripts/check-budget.mjs` draait als laatste stap van `npm run verify` (en los met `npm run budget`). Het meet `dist/` op dezelfde manier als de nulmeting: KB = 1000 bytes, gzip met Node `zlib` op standaardniveau, PNG's raw.

| Regel | Hoe gemeten | Gemeten | Budget |
|---|---|--:|--:|
| Geen JS op contentpagina's | elke pagina behalve `/<lang>/board/`: geen `<script>` (JSON-LD mag), geen `<astro-island>`, geen `modulepreload` | 0 op 9 pagina's | 0 |
| JS van het bord | `<script src>`, `component-url` en `renderer-url` van de island, plus hun statische imports, elk bestand één keer | 28,3 KB | 32,5 KB |
| Lazy JS van het bord | bestanden die alleen via `import()` geladen worden | 0 KB | 10 KB |
| Alle JS samen | elk `.js`-bestand in `dist/_astro/`, ook chunks die geen pagina laadt (besluit Kay) | 28,3 KB | 32,5 KB |
| CSS per pagina | de `<link rel="stylesheet">`-bestanden | 1,6 KB | 2,0 KB |
| HTML per pagina | het HTML-bestand, één grens voor alle pagina's | 2,4 tot 5,5 KB | 6,5 KB |
| PNG per bestand | elk `.png` in `dist/` | 1,7 tot 50,5 KB | 60 KB |

De budgetten zijn de nulmeting plus ongeveer 15%, afgerond. Ze staan in de constante `BUDGETS` in het script. Een budget verhogen mag alleen bewust, met de reden in de PR en de nieuwe meting hier.

### Vóór en na

De app verandert in deze fase niet: de gemeten groottes zijn gelijk aan de nulmeting en Fase 4a (bord-JS 28,3 KB, HTML en CSS per pagina gelijk op 0,1 KB). Lighthouse is daarom niet opnieuw gedraaid.

| | Vóór | Na |
|---|--:|--:|
| Unittests | 7 bestanden, 71 tests | 8 bestanden, 83 tests |
| `npm run verify` lokaal | 7,6 s | 7,0 s (het budgetscript zelf: 0,05 s; het verschil is ruis) |
| CI-job `verify` | 33 s | 31 s (PR #7; het verschil is ruis) |
| Dependencies | — | geen nieuwe |

### Controle: JS op een contentpagina

Tijdelijk `<script>console.log(1)</script>` onderaan `src/pages/[lang]/about.astro`. Astro bundelt dat tot een `<script type="module">`. `npm run verify` faalt (exit 1):

```
Scripts         9 content pages                                          1        0  OVER

Budget check failed (1):
  /en/about/: content pages ship no JS, found <script type="module">
```

Tweede controle: het budget voor de bord-JS tijdelijk op 28,0 KB. `npm run verify` faalt:

```
JS (gzip)       /en/board/                                         28.3 KB  28.0 KB  OVER

Budget check failed (1):
  JS (gzip) /en/board/: 28.3 KB is over the budget of 28.0 KB
```

Beide teruggezet met `git checkout`; niet gecommit. Daarna is `npm run verify` weer groen.

## Fase 5: mobiele UX in de zaal (28 september 2026)

Branch `fase-5-mobiele-ux`, vanaf `main` @ `dba34a2`.

### Wat er veranderd is

- **Het veld past in de ruimte die de balken overlaten** (bevinding 1 en 2). Het veld schaalde alleen naar de breedte. `.editor` zat in een `auto`-rij van `main` en kreeg zijn hoogte van de SVG. Nu vult `main` het scherm met één rij, en staat de SVG absoluut in de stage (letterbox). De no-JS-fallback werkt hetzelfde.
- **Liggend: zijbalken** (optie B, gekozen door Kay na screenshots van drie opties):
  - de header verdwijnt;
  - de tools staan in een kolom links, de acties rechts;
  - bovenaan rechts staat een Home-link met het logo;
  - het Clear-menu opent naar links.
  - Dit is een derde media query, `(orientation: landscape) and (max-height: 559px)`, alleen voor het bord. `AGENTS.md` en `tokens.css` noemen hem.
- **Groter tikvlak voor stukken** (op verzoek van Kay onderzocht en gebouwd):
  - een tik tot 22 px naast een stuk pakt dat stuk, en bij overlap wint het dichtstbijzijnde (`nearestPiece()` in `src/lib/board/hit.ts`);
  - binnen het getekende tikvlak (13 dm) wint het stuk, daarna een pijl, en pas daarna de extra reikwijdte, zodat een pijl naast een speler te pakken blijft;
  - het einde van een getekende pijl klikt met dezelfde reikwijdte vast aan een speler.
- **De CSS van de editor zit in zijn JS** (`<svelte:options css="injected" />`).
  - **Aanleiding:** door de zijbalken werd de stylesheet groter dan Vite's inline-grens van 4 KB. Astro linkte hem daarna op elke pagina, ook op contentpagina's: CSS 1,6 → 3,0 KB per pagina. Het budgetscript ving dat.
  - **Oorzaak:** met `inlineStylesheets: "always"` kwam hij ook op elke pagina terecht. Het ligt dus aan hoe Astro deze `client:only`-CSS aan pagina's koppelt, niet aan de grootte zelf.
- **De QR-bibliotheek laadt na het bord** (bevinding 10, besluit Kay):
  - `uqr` is een eigen chunk, die geladen wordt zodra de browser niets te doen heeft (`requestIdleCallback`, anders na 500 ms);
  - bewust niet pas bij de eerste tik op "QR code": dan zou de QR-code offline niet meer openen (test 14);
  - lukt het laden niet, dan meldt een tik dat.
- **Budgetscript:** Vite schrijft een dynamische import met backticks (``import(`./dist.….js`)``). Het script herkende alleen `"` en `'`, waardoor "Lazy JS" altijd 0 KB was. "All JS" telde de chunk wel mee.

### Layout vóór en na

**Methode:**

- Playwright met de apparaatprofielen iPhone 15, iPhone 15 landscape, iPhone SE en iPhone SE landscape (WebKit), en Pixel 7 en Pixel 7 landscape (Chromium).
- Getest tegen `wrangler dev`, met de standaardopstelling.
- "Knoppen bereikbaar" betekent: elke knop helemaal in beeld.
- **Tikvlak:** de diameter op het scherm.
  - "Los" is een stuk zonder buren.
  - "P" is de cirkelspits tussen twee verdedigers, 23 dm van de dichtstbijzijnde. Vóór: het getekende vlak minus de overlap met de verdediger die erboven ligt. Na: de helft van de afstand tot die verdediger, of de reikwijdte als die kleiner is.
- "Vóór" is `main` @ `dba34a2`. Waar de knoppen niet bereikbaar waren, is het veld groot omdat het onder het scherm doorliep.

| Viewport | Veld | Knoppen bereikbaar | Veld op scherm (px) | px/dm | Tikvlak los stuk | Tikvlak P |
|---|---|:-:|--:|--:|--:|--:|
| iPhone 15 staand 393×659 | half | ja → ja | 352×362 → 377×387 | 1,63 → 1,75 | 42 → 46 px | 34 → 41 px |
| iPhone 15 staand 393×659 | vol | **nee** → ja | 369×730 → 239×474 | 1,71 → 1,11 | 44 → 44 px | 35 → 26 px |
| iPhone 15 liggend 734×343 | half | **nee** → ja | 352×362 → 326×335 | 1,63 → 1,51 | 42 → 44 px | 34 → 35 px |
| iPhone 15 liggend 734×343 | vol | **nee** → ja | 369×730 → 169×335 | 1,71 → 0,78 | 44 → 44 px | 35 → 18 px |
| Pixel 7 staand 412×839 | half | ja → ja | 396×407 → 396×407 | 1,83 → 1,83 | 48 → 48 px | 38 → 43 px |
| Pixel 7 staand 412×839 | vol | **nee** → ja | 369×730 → 330×654 | 1,71 → 1,53 | 44 → 44 px | 35 → 36 px |
| Pixel 7 liggend 863×360 | half | **nee** → ja | 352×362 → 342×352 | 1,63 → 1,59 | 42 → 44 px | 34 → 37 px |
| Pixel 7 liggend 863×360 | vol | **nee** → ja | 369×730 → 178×352 | 1,71 → 0,82 | 44 → 44 px | 35 → 19 px |
| iPhone SE staand 320×568 | half | ja → ja | 304×312 → 304×312 | 1,41 → 1,41 | 37 → 44 px | 29 → 33 px |
| iPhone SE staand 320×568 | vol | **nee** → ja | 304×602 → 193×383 | 1,41 → 0,89 | 37 → 44 px | 29 → 21 px |
| iPhone SE liggend 568×320 | half | **nee** → ja | 352×362 → 304×312 | 1,63 → 1,41 | 42 → 44 px | 34 → 33 px |
| iPhone SE liggend 568×320 | vol | **nee** → ja | 369×730 → 157×312 | 1,71 → 0,73 | 44 → 44 px | 35 → 17 px |

De kleinste knop is overal minstens 40×44 px (iPhone SE staand: 7 knoppen naast elkaar), liggend 64×44 px.

**Wat dit kost:**

- Op het volledige veld is het veld nu kleiner, omdat het in het scherm moet passen.
- Een los stuk blijft overal 44 px, dankzij de grotere reikwijdte. Tussen stukken is de ruimte zelf de grens: liggend op het volledige veld is P maar 18 px.
- De afweging stond bij de keuze (optie C tekende het volledige veld liggend dwars, met P op 29 px); Kay koos B.

### Groottes

| | Vóór (`dba34a2`) | Na |
|---|--:|--:|
| JS van het bord bij het laden (gzip) | 28,3 KB | **27,0 KB** |
| Lazy JS van het bord (gzip) | 0 KB | 4,3 KB (QR-bibliotheek) |
| Alle JS in `_astro/` (gzip) | 28,3 KB | 31,3 KB (budget 32,5 KB) |
| CSS per pagina (gzip) | 1,6 KB | 1,6 KB |
| HTML van `/en/board/` (gzip) | 5,5 KB | 4,7 KB (de CSS van de editor staat er niet meer inline) |

Per wijziging, voor de JS van het bord bij het laden: 28,3 → 29,5 KB (editor-CSS in de JS) → 29,9 KB (zijbalken) → 30,1 KB (tikvlak) → 27,0 KB (QR lazy).

Let op: "Alle JS" zit nu op 31,3 van 32,5 KB, omdat de CSS van de editor meetelt als JS. Er is geen budget verhoogd.

### Tests

| | Vóór | Na |
|---|--:|--:|
| Unittests | 8 bestanden, 83 tests | 9 bestanden, 90 tests |
| E2e-tests (beide browsers samen) | 52 | 74, waarvan 1 overgeslagen |

- **`e2e/layout.spec.ts`** vervangt `e2e/full-court.spec.ts` en heeft geen `test.fail()` meer. Het controleert:
  - elke knop en het hele veld in beeld, staand en liggend, half en vol;
  - kantelen tijdens gebruik;
  - de header en de Home-link liggend;
  - het Clear-menu.
- **`e2e/reach.spec.ts`** controleert:
  - een tik 21 px naast een speler op het volledige veld;
  - tussen twee spelers beweegt de dichtstbijzijnde;
  - een pijl naast een speler blijft te pakken.
- **`e2e/share.spec.ts`:** de QR-code opent nog na offline gaan. Alleen in Chromium: in WebKit's offline-emulatie mislukt ook het lezen van een Blob (`NotReadableError`), en `encode()` gebruikt dat. Of een echte iPhone in vliegtuigmodus dit ook doet, is test 14 hieronder.

**Controles** (tijdelijk teruggezet, niet gecommit):

| Controle | Resultaat |
|---|---|
| Layouttests op de oude layout | 8 van 10 falen; alleen staand met het halve veld slaagt, zoals verwacht |
| Reach-tests met de oude reikwijdte (13 dm) | "21 px naast een speler" faalt in beide browsers; de twee andere (voorrang) slagen, zoals bedoeld |
| Offline-QR-test zonder het vooraf laden | faalt |

### Lighthouse

Volgt op de preview-URL van de PR, met het commando uit de nulmeting. Let vooral op CLS: de no-JS-fallback toont het veld zonder balken, en de editor vervangt hem.

### Testronde Fase 5 (Kay, op de preview-URL)

Legenda als in de nulmeting. Vul per toestel in (model, iOS/Android-versie, browser).

| # | Test | iPhone | Android |
|--:|---|:-:|:-:|
| 1 | Staand, halve veld: alles bereikbaar met één hand? | | |
| 2 | Staand, volledige veld: knoppen bereikbaar, stukken te pakken? | | |
| 3 | Liggend, halve veld: tools links, acties rechts, veld over de volle hoogte? | | |
| 4 | Liggend, volledige veld: nog bruikbaar? | | |
| 5 | Kantelen tijdens gebruik: blijft alles staan? | | |
| 6 | Een speler net naast de rand pakken (volledig veld): pak je de goede? | | |
| 7 | Een pijl vlak naast een speler aantikken: wordt de pijl geselecteerd? | | |
| 8 | Tactiekpagina → "Open in the board": de tactiek staat op het bord | | |
| 9 | Daarna het bord opnieuw openen zonder link: je eigen bord staat er nog | | |
| 12 | Tablet: staand en liggend | | |
| 13 | Snel twee keer op een knop tikken: zoomt de pagina in? (bevinding 8) | | |
| 14 | Na het laden vliegtuigmodus aan: slepen, tekenen, QR-code openen? | | |
| 15 | Stopwatch: openen → tekenen → gedeeld in de teamapp, in seconden | | |

De nummers 8 tot en met 15 zijn die van de nulmeting.
