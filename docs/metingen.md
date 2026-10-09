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
| 15 | ~~Stopwatch: openen → tekenen → gedeeld in de teamapp, in seconden~~ Vervallen (besluit Kay, 8 oktober 2026) | — | |

De punten met — (8, 9 en 12 tot en met 14) en de verdeling per toestel schuiven door naar de testronde van Fase 5, op de preview-URL. Test 15 vervalt: we meten niet meer in seconden.

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
| 9 | ~~**Geen security headers**, alleen de cache-header voor `/_astro/*` in `public/_headers`.~~ **Opgelost in Fase 6:** security headers in `public/_headers` en een CSP-`<meta>` van Astro op elke pagina; zie "Fase 6" onderaan. HSTS volgt in Fase 7. | middel | laag tot middel (CSP voor de inline scripts van het bord) | 6 |
| 10 | ~~**De QR-bibliotheek zit in de editorbundel** (ongeveer 4 KB gzip). Pas laden bij het openen van de QR-dialoog scheelt weinig.~~ **Opgelost in Fase 5:** de QR-bibliotheek laadt na het bord; bij het laden 30,1 → 27,0 KB. | laag | laag | 5 |
| 11 | **Laadsnelheid in het lab:** alle pagina's 100, LCP ongeveer 0,8 s, CLS 0, TBT 0 ms. Er valt hier niets te winnen; de volgende stappen zijn vastleggen (4a, 4b) en echte telefoons (testronde, Fase 8). | — | — | — |
| 12 | **Opgelost in Fase 4a: een kapotte link overschreef het opgeslagen bord met de standaardopstelling.** Gevonden bij het lezen van de code voor Fase 4a, bevestigd met een e2e-test en daarna opgelost. Zie "Fase 4a" hieronder. | hoog | laag | 4a |
| 13 | **In WebKit's offline-emulatie mislukt het lezen van een Blob**, dus ook `encode()`: offline komt er in de emulatie geen deellink, geen QR-code en geen `#t=` in de adresbalk. Gevonden in Fase 5. Onbekend of een echte iPhone in vliegtuigmodus dit ook doet; dat is test 14. | middel (als het echt is) | onbekend | 5 (testronde) |
| 14 | ~~**Staand verspringt het veld 52 px zodra de editor laadt** (Fase 5, Lighthouse-filmstrip en Playwright). De fallback in `board.astro` houdt geen ruimte vrij voor de knoppenbalken. CLS blijft 0, omdat de editor het veld vervangt in plaats van verschuift; Lighthouse ziet het dus niet. Liggend blijft het veld staan en verschijnen alleen de balken.~~ **Opgelost:** de fallback houdt de ruimte van de balken vrij; zie "Bevinding 14: het veld verspringt niet meer" onderaan. | laag tot middel | laag | aparte PR |
| 15 | **De 404-pagina krijgt op Cloudflare geen headers uit `_headers`** (Fase 6, gemeten op de preview-URL). Geen `X-Frame-Options`, `frame-ancestors`, `nosniff`, COOP en de rest; `wrangler dev` zet ze er wel op. De CSP-`<meta>` staat in de HTML, dus de regels voor scripts en styles gelden er wel. De pagina heeft geen functie, dus het risico is klein. Oplossen kan alleen met Worker-code. `e2e/security.spec.ts` controleert de headers daarom niet op de 404. | laag | hoog (Worker-code) | — |
| 16 | **Een tabblad dat vóór een deploy al open stond, draait de oude code.** Landt daar een link van een nieuwere versie (na Fase 11: `2.`), dan toont het de melding voor een kapotte link, terwijl de link goed is. Herladen zou de nieuwe code halen: de HTML is `max-age=0, must-revalidate`. Gevonden door Kay op 5 oktober 2026, vastgelegd in `e2e/board.spec.ts` (`test.fail()`). Zie "Herladen bij een link van een nieuwere versie" onderaan. | middel (vanaf Fase 11) | laag | vóór 11 |

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

### Lighthouse (productie, 29 september 2026)

Gemeten na de merge van PR #8, dus op productie (`main` @ `70bfaac`) in plaats van op de preview-URL. Zo is ook SEO te vergelijken met de nulmeting.

**Methode:** het commando uit de nulmeting, drie runs per URL, mediaan in de tabel. Lighthouse 13.5.0, Chrome 154.0.8037.58 headless (nulmeting: Chrome 153), op een Mac.

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100 | 100 | 100 | 100 | 0,82 s | 0 | 0 ms |
| `/en/board/` | 100 | 100 | 100 | 100 | 0,82 s | 0 | 0 ms |
| `/en/tactics/defense/6-0-defense-basics/` | 100 | 100 | 100 | 100 | 0,84 s | 0 | 0 ms |

Per run (Performance, LCP):

- `/en/`: 100, 100, 100 (0,82, 0,82, 0,79 s)
- `/en/board/`: 100, 100, 100 (0,84, 0,81, 0,82 s)
- tactiekpagina: 100, 100, 100 (0,86, 0,82, 0,84 s)

Vergeleken met de nulmeting:

- De scores en LCP zijn gelijk; de verschillen vallen binnen de spreiding tussen runs.
- **Het bord:** 7 verzoeken en 43,6 KB, was 6 en 40,5 KB. Het extra verzoek is de QR-bibliotheek, die nu als eigen chunk na het bord laadt (zie "Groottes").
- **LCP-element op het bord:** nog steeds het logo in de header.

#### Verspringt het veld bij het laden van het bord?

**Ja, staand.** CLS 0 zegt hier niets: de editor verschuift het veld van de fallback niet, hij vervangt het door nieuwe elementen. CLS telt alleen elementen die bewegen, dus deze sprong telt niet mee.

**Filmstrip.** Drie runs met `--throttling-method=devtools` (echte vertraging in plaats van gesimuleerde). Scores: Performance 100, LCP 1,25, 1,30 en 1,27 s, CLS 0, TBT 0 ms. De filmstrip (een beeld per 375 ms) laat in alle drie hetzelfde zien:

- tot ongeveer 1,1 s: nog niets getekend;
- vanaf 1,5 s: het veld van de fallback, verticaal gecentreerd, zonder knoppenbalken;
- tussen 1,9 en 2,25 s neemt de editor het over: het veld schuift omhoog en de twee balken verschijnen onderaan.

**Hoe groot de sprong is.** Gemeten met Playwright op productie. De fallback is gemeten met JavaScript aan en het script van de editor geblokkeerd; dat is wat een bezoeker ziet voordat de editor laadt. Met JavaScript uit staat er ook de `noscript`-tekst onder het veld, en dat is een andere layout.

| Viewport | Veld (breedte) | Verschuiving |
|---|--:|--:|
| iPhone SE staand 320×568 | 281 → 281 px | 52 px omhoog |
| iPhone 15 staand 393×659 | 349 → 349 px | 52 px omhoog |
| Pixel 7 staand 412×839 | 367 → 367 px | 52 px omhoog |
| Moto G Power staand 412×823 (Lighthouse) | 367 → 367 px | 52 px omhoog |
| iPhone 15 liggend 734×343 | 302 → 302 px | geen |
| Pixel 7 liggend 863×360 | 317 → 317 px | geen |

- **Oorzaak:** `.fallback` in `board.astro` houdt geen ruimte vrij voor de knoppenbalken. Het veld staat daardoor gecentreerd in de volle hoogte; zodra de balken er zijn, is het gecentreerd in de hoogte erboven.
- **Liggend:** het veld blijft op zijn plek, maar de balken verschijnen er plotseling naast.
- **Gemeten:** alleen het halve veld, met de standaardopstelling.

Wordt bevinding 14; de fix komt in een aparte PR.

### Testronde Fase 5 (Kay)

**Nog niet uitgevoerd; volgt later.** De PR van Fase 5 is gemerged zonder deze testronde. Kay test daarom op productie (`https://coachboard.hardamkay.workers.dev/en/board/`) in plaats van op de preview-URL. De resultaten en wat eruit volgt, komen in een latere PR.

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
| 15 | ~~Stopwatch: openen → tekenen → gedeeld in de teamapp, in seconden~~ Vervallen (besluit Kay, 8 oktober 2026) | deels: 10–15 s zonder het laden | deels: 10–15 s zonder het laden |
| 16 | Een gedeelde link openen in een privévenster: zie je eerst de standaardopstelling voordat de tactiek verschijnt, en stoort dat? | | |
| 17 | Het bord openen, staand en liggend: blijft het veld staan terwijl de knoppenbalken verschijnen? (bevinding 14) | | |

De nummers 8 tot en met 15 zijn die van de nulmeting. 16 en 17 kwamen erbij met de fix van bevinding 14.

- **Test 15** is deels gemeten, als T1 in seconden vóór Fase 12a (Kay, 7 oktober 2026): zie "UX-metingen" → "Per taak en toestel". Die meting begint bij de eerste tik op het bord, dus het openen en laden van het bord ontbreekt. Dat deel meten we niet meer: test 15 vervalt (besluit Kay, 8 oktober 2026), de meting blijft staan. De rest van deze testronde staat nog open.
- **Waarom test 16:** de fallback tekent altijd de standaardopstelling; pas de editor leest `#t=` en tekent de tactiek. In een privévenster staat er niets in de cache, dus duurt dat het langst.

## Bevinding 14: het veld verspringt niet meer (29 september 2026)

Branch `fix-verspringend-veld`, vanaf `main` @ `34c0ff8` (merge van PR #9).

### Wat er veranderd is

- **De fallback heeft de box van de editor.** `.fallback` in `board.astro` heeft nu dezelfde padding en tussenruimte als `.editor`, en houdt de ruimte van de balken vrij:
  - staand een rij van twee balken plus tussenruimte onder het veld;
  - liggend een kolom van 64 px links en rechts.
- **Gedeelde maten.** De maten staan als tokens in `tokens.css`: `--board-bar` (48 px), `--board-gap` (6 px) en `--board-side` (64 px). Editor en fallback gebruiken ze allebei.
- **Balkhoogte.** De rijen van de balken in de editor zijn `minmax(var(--board-bar), auto)`:
  - bij de standaard tekstgrootte zijn ze precies 48 px (de inhoud is 46,1 px), dus de fallback past exact;
  - bij een grotere tekstgrootte groeien ze mee in plaats van de labels af te knippen. Het veld verspringt dan weer een beetje, maar dat is beter dan onleesbare knoppen.
- **Gevolg:** de balken zijn 1,9 px hoger dan voorheen, en het veld staat daardoor staand 1,9 px hoger.
- **Zonder JavaScript:** staand staat de `noscript`-tekst in de vrijgehouden ruimte. Liggend staat hij onder het veld, over de volle breedte.

### Vóór en na

Gemeten met Playwright tegen `wrangler dev`, met de standaardopstelling (halve veld). De positie is die van het veld zelf (de `rect` van het speelveld), niet van de `<svg>`: die vult zijn vak en centreert het veld erin. "Fallback" is gemeten met de scripts van de pagina vastgehouden; daarna mogen ze laden en is de editor gemeten, in dezelfde paginalading.

**Vóór** (`main` @ `34c0ff8`):

| Viewport | Fallback (x, y) | Editor (x, y) | Breedte | Verschuiving |
|---|--:|--:|--:|--:|
| iPhone SE staand 320×568 | 19,3, 180,0 | 19,3, 127,9 | 281,5 → 281,5 | 52,1 px omhoog |
| iPhone 15 staand 393×659 | 22,0, 192,7 | 22,0, 140,6 | 349,1 → 349,1 | 52,1 px omhoog |
| Pixel 7 staand 412×839 | 22,7, 274,2 | 22,7, 222,1 | 366,7 → 366,7 | 52,1 px omhoog |
| iPhone 15 liggend 734×343 | 216,1, 25,1 | 216,1, 25,1 | 301,8 → 301,8 | geen |
| Pixel 7 liggend 863×360 | 272,9, 26,2 | 272,9, 26,2 | 317,1 → 317,1 | geen |

**Na:**

| Viewport | Fallback (x, y) | Editor (x, y) | Breedte | Verschuiving |
|---|--:|--:|--:|--:|
| iPhone SE staand 320×568 | 19,3, 126,0 | 19,3, 126,0 | 281,5 → 281,5 | geen |
| iPhone 15 staand 393×659 | 22,0, 138,7 | 22,0, 138,7 | 349,1 → 349,1 | geen |
| Pixel 7 staand 412×839 | 22,7, 220,2 | 22,7, 220,2 | 366,7 → 366,7 | geen |
| iPhone 15 liggend 734×343 | 216,1, 25,1 | 216,1, 25,1 | 301,8 → 301,8 | geen |
| Pixel 7 liggend 863×360 | 272,9, 26,2 | 272,9, 26,2 | 317,1 → 317,1 | geen |

- **Hoogte van een balk** (staand): 46,1 px vóór, 48 px na, in Chromium en WebKit.
- **iPhone SE:** WebKit met het profiel "iPhone SE" van Playwright. De rest zijn de profielen van de e2e-projecten.

### Groottes

`npm run budget`, vóór en na:

| Meting | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 27,0 KB | 27,0 KB |
| Lazy JS van het bord (gzip) | 4,3 KB | 4,3 KB |
| Alle JS in `_astro/` (gzip) | 31,3 KB | 31,4 KB |
| CSS per pagina (gzip) | 1,6 KB | 1,6 KB |
| HTML `/en/board/` (gzip) | 4,7 KB | 4,7 KB |

### Tests

- **Nieuw in `e2e/layout.spec.ts`:** "the court stays put when the editor loads", staand en liggend, in beide projecten (Pixel 7 en iPhone 15). Het verschil in x, y, breedte en hoogte mag hooguit 1 px zijn.
- **Vóór de fix:** staand faalde de test met 52,1 px (vastgelegd met `test.fail()` in de eerste commit); liggend slaagde hij al.
- **Na de fix:** `test.fail()` is weg. `npm run verify` is groen (90 unittests), en `npm run e2e` geeft 77 geslaagd en 1 overgeslagen.

## Fase 6: veiligheid en onderhoud (29 september 2026)

Branch `fase-6-veiligheid`, vanaf `main` @ `4fa8b08` (merge van PR #10).

### Wat er veranderd is

- **Security headers** in `public/_headers`, voor elke response (ook de 404-pagina en de bestanden in `/_astro/`):

  | Header | Waarde |
  |---|---|
  | `X-Content-Type-Options` | `nosniff` |
  | `Referrer-Policy` | `strict-origin-when-cross-origin` (de standaard van browsers, nu vastgelegd; `#t=` gaat nooit mee, want een fragment staat nooit in een referrer) |
  | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`; `web-share` en `clipboard-write` blijven toegestaan, want Delen gebruikt ze |
  | `X-Frame-Options` | `DENY` |
  | `Content-Security-Policy` | `frame-ancestors 'none'` |
  | `Cross-Origin-Opener-Policy` | `same-origin` |

- **CSP als `<meta>` van Astro** (`security.csp` in `astro.config.mjs`), op elke pagina:

  ```
  default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none';
  script-src 'self' 'sha256-…' (7 hashes); style-src 'self' 'unsafe-inline'
  ```

  - De 7 hashes zijn die van de inline scripts die Astro kan uitsturen. De bordpagina gebruikt er twee (de `client:only`-directive en de island-loader); beide staan in de set, nagerekend. Astro zet op elke pagina dezelfde set, ook op contentpagina's zonder script.
  - **Waarom niet alles in `_headers`:** de hashes zijn pas na de build bekend, en `_headers` is een vast bestand. Browsers negeren `frame-ancestors` in een `<meta>`; daarom staat het verbod op inbedden als header (opmerking van Kay).
  - Een `<meta>`-CSP geldt alleen voor wat erna komt. Astro zet hem vroeg in `<head>`, vóór elk `<style>`, `<script>` en `<link rel="stylesheet">`.
  - **Niet in `npm run dev`:** Astro past de CSP alleen toe in de build. Testen gaat met `wrangler dev` of `npm run e2e`.
- **`markdown.syntaxHighlight: false`.** Met CSP aan waarschuwt Astro dat Shiki inline styles gebruikt. De tactieken hebben geen codeblokken, dus Shiki staat uit.
- **Dependabot** (`.github/dependabot.yml`): wekelijks op maandag, voor npm en GitHub Actions. Minor- en patch-updates komen per ecosysteem in één PR, elke major in een eigen PR. Niets merget automatisch.

### De CSS van de editor: opties en besluit

Met een strikte `style-src` (alleen hashes) blokkeert de browser de `<style>` die Svelte voor `BoardEditor` invoegt. Gemeten met `security: { csp: true }`: 24 e2e-tests falen (alle layout- en reach-tests, in beide browsers). Het bord staat er dan zonder opmaak.

| Optie | Gemeten | Uitkomst |
|---|---|---|
| **`'unsafe-inline'` alleen voor `style-src`** | e2e groen, geen CSP-meldingen; HTML +0,3 tot 0,4 KB per pagina | **gekozen (Kay)** |
| Stylesheet alleen op het bord (de CSS van de editor naar een bestand dat `board.astro` importeert) | proef: Astro linkt zo'n bestand alleen op `/en/board/`; HTML +0,9 tot 1,0 KB per pagina (14 style-hashes), JS van het bord ongeveer −1,6 KB (de CSS is 4,9 KB raw, 1,6 KB gzip), een extra verzoek op het bord, en de scoping van Svelte valt weg | komt terug zodra het JS-budget knelt (besluit Kay) |
| Hash van de ingevoegde CSS | de CSS staat pas na het bundelen in de JS, terwijl Astro de `<meta>` in dezelfde build schrijft; kan alleen met een stap na de build die elke HTML herschrijft | afgeraden |
| Nonce | kan niet zonder Worker-code: een statische host maakt geen nonce per verzoek | valt af |

Met `'unsafe-inline'` in `style-src` laat Astro de style-hashes weg (een hash zou `'unsafe-inline'` uitschakelen). Scripts blijven strikt: alleen `'self'` en de 7 hashes.

### Groottes

`npm run budget`, vóór (`main` @ `4fa8b08`) en na:

| Meting | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 27,0 KB | 27,0 KB |
| Lazy JS van het bord (gzip) | 4,3 KB | 4,3 KB |
| Alle JS in `_astro/` (gzip) | 31,4 KB | 31,4 KB |
| CSS per pagina (gzip) | 1,7 KB | 1,7 KB |
| HTML `/404.html` (gzip) | 1,4 KB | 1,8 KB |
| HTML `/en/` (gzip) | 4,0 KB | 4,4 KB |
| HTML `/en/board/` (gzip) | 4,8 KB | 5,2 KB |
| HTML `/en/tactics/defense/6-0-defense-basics/` (gzip) | 4,3 KB | 4,7 KB (grootste pagina, budget 6,5 KB) |

De `<meta>` is 558 bytes raw. De hashes zijn willekeurige tekens en comprimeren slecht, vandaar +0,3 tot 0,4 KB gzip. Er is geen budget verhoogd.

### Tests

- **Nieuw: `e2e/security.spec.ts`**, 21 tests per browser:
  - per pagina: de headers (niet op de 404, zie bevinding 15), en een `<meta>`-CSP met `default-src 'self'`, `script-src` met alleen `'self'` en hashes, en zonder `frame-ancestors`;
  - per pagina: geen enkele CSP-melding (`securitypolicyviolation`) tijdens het laden;
  - het bord: QR-code openen, de CSS van de editor is toegepast, en geen CSP-meldingen.
- De lijst met pagina's staat nu in `allPages()` in `e2e/helpers.ts`; de axe-scan gebruikt hem ook.
- `npm run verify` groen (90 unittests); `npm run e2e`: 119 geslaagd, 1 overgeslagen (was 77 en 1).
- **Delen, klembord en QR met COOP:** de bestaande tests in `e2e/share.spec.ts` blijven groen. Echt delen naar WhatsApp kan alleen op een telefoon: zie de testronde.

**Controles** (tijdelijk, niet gecommit):

| Controle | Resultaat |
|---|---|
| Strikte `style-src` (zonder `'unsafe-inline'`) | 3 tests in `security.spec.ts` falen: `style-src-elem blocked inline`, en de editor heeft `display: block` in plaats van `grid` |
| `X-Frame-Options` en `frame-ancestors` uit `_headers` | de headertests falen op elke pagina |
| `<img src="https://example.com/x.png">` op de aboutpagina | `img-src blocked https://example.com/x.png`; de test faalt |

Bij de derde controle stond de `<img>` eerst vóór `<html>`, dus vóór de `<meta>`. Toen slaagde de test: zo'n `<meta>`-CSP dekt niets wat ervoor staat. In de pagina's staat vóór de `<meta>` alleen wat `BaseLayout` zelf in `<head>` schrijft.

### Headers en Lighthouse

**Vóór:** productie (`main` @ `4fa8b08`), 29 september 2026. Het commando uit de nulmeting, drie runs per URL, mediaan. Lighthouse 13.5.0, Chrome 154 headless.

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100 | 100 | 100 | 100 | 0,82 s | 0 | 0 ms |
| `/en/board/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |
| `/en/tactics/defense/6-0-defense-basics/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |

Lighthouse noemt onder Best Practices ook vijf beveiligingspunten, zonder ze mee te tellen in de score. Vóór stonden ze alle vijf op "High": geen CSP, geen HSTS, geen COOP, geen bescherming tegen inbedden (clickjacking), geen Trusted Types.

**Headers op de preview-URL** (`https://fase-6-veiligheid-coachboard.hardamkay.workers.dev`), met `curl -I`:

- `/en/board/` en de andere pagina's: alle zes de headers, en de `<meta>`-CSP in de HTML;
- `/_astro/*`: de headers plus `Cache-Control: public, max-age=31536000, immutable`, zoals voorheen;
- **de 404-pagina: geen enkele header uit `_headers`**, terwijl `wrangler dev` ze wel zet. Wordt bevinding 15;
- met Playwright (Pixel 7 en iPhone 15) op alle pagina's en de 404, plus de QR-code op het bord: geen CSP-meldingen, en de CSS van de editor is toegepast.

**Na:** preview-URL van deze PR, 29 september 2026, zelfde commando en versies.

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100 | 100 | 100 | 66 | 0,85 s | 0 | 0 ms |
| `/en/board/` | 100 | 100 | 100 | 66 | 0,84 s | 0 | 0 ms |
| `/en/tactics/defense/6-0-defense-basics/` | 100 | 100 | 100 | 66 | 0,86 s | 0 | 0 ms |

- **SEO 66** komt door `X-Robots-Tag: noindex` op preview-URL's (zie Fase 4a); SEO vergelijk je alleen op productie.
- **LCP** 0,82–0,83 → 0,84–0,86 s: binnen de spreiding tussen runs (in de nulmeting 0,80 tot 0,91 s).
- **Overdracht:** contentpagina's 7,7–7,9 → 8,5–8,8 KB, het bord 43,7 → 45,4 KB. Dat zijn de `<meta>` en de nieuwe headers (headers worden niet gecomprimeerd).

De beveiligingspunten van Lighthouse, vóór → na:

| Punt | Vóór | Na |
|---|---|---|
| CSP tegen XSS | High: geen CSP | 2× Medium: (1) voeg `'unsafe-inline'` toe aan `script-src` als terugval voor heel oude browsers zonder hashes; kan niet, want dan laat Astro de hashes weg. (2) De CSP staat in een `<meta>`; zie "Waarom niet alles in `_headers`". |
| Clickjacking | High: geen bescherming | opgelost |
| COOP | High: geen COOP | opgelost |
| HSTS | High | High; komt in Fase 7, op het eigen domein |
| Trusted Types | High | High; buiten dit plan. Vraagt `require-trusted-types-for 'script'` in een header, en `{@html qr}` in de editor moet dan via een policy. |

### Testronde Fase 6 (Kay)

Op de preview-URL `https://fase-6-veiligheid-coachboard.hardamkay.workers.dev/en/`. Vul per toestel in (model, iOS/Android-versie, browser).

| # | Test | iPhone | Android |
|--:|---|:-:|:-:|
| 1 | Home, een tactiekpagina en privacy zien eruit als op productie (opmaak, kleuren, menu) | | |
| 2 | Het bord staand en liggend: balken en veld zoals altijd | | |
| 3 | Speler slepen, pijl tekenen, ongedaan maken | | |
| 4 | Delen naar WhatsApp, en de link openen op een tweede telefoon | | |
| 5 | QR-code openen en scannen vanaf 1 à 2 meter | | |
| 6 | Tactiekpagina → "Open in the board": de tactiek staat op het bord | | |

**Na de merge:** de eerste Dependabot-run komt binnen (PR's onder Pull requests, of Insights → Dependency graph → Dependabot).


## Fase 7a: het domein live (1 oktober 2026)

Kay heeft `handballcoachboard.com` gekocht bij Cloudflare Registrar. Deze PR zet de site op dat domein. Het doorsturen vanaf workers.dev volgt in 7b, pas als het domein werkt (zie het plan).

### Wat er veranderd is

- **`wrangler.jsonc`:** `routes` met `handballcoachboard.com` als Custom Domain. Bij de deploy na de merge maakt Cloudflare het DNS-record en het certificaat aan. Het domein staat in de config, want een deploy zonder de route haalt een domein uit het dashboard weer weg. `workers_dev` blijft aan voor oude links.
- **`public/_headers`:** `Strict-Transport-Security: max-age=31536000`, zonder `includeSubDomains` en zonder `preload`.
- **`playwright.config.ts`:** met `E2E_BASE_URL` draaien de e2e-tests tegen een gedeployde site in plaats van `wrangler dev`.
- **`README.md` en `AGENTS.md`:**
  - het domein, en dat deployen alleen via Workers Builds gaat;
  - waarom de route in `wrangler.jsonc` staat;
  - wat in het dashboard staat: Always Use HTTPS, Email Address Obfuscation uit, www → kaal domein, Email Routing en het TXT-record voor Search Console.

### Groottes

`npm run budget`: geen verschil met `main` @ `6b0ccd5`. Deze PR raakt geen HTML, CSS of JS; de nieuwe header telt niet mee in de budgetten.

### Tests

- `npm run verify` groen (90 unittests, 125 links, 28 budgetten).
- `npm run e2e`: 119 geslaagd, 1 overgeslagen (gelijk aan Fase 6). `e2e/security.spec.ts` verwacht nu ook de HSTS-header.
- **Controle** (tijdelijk, niet gecommit): zonder de HSTS-regel in `_headers` falen 9 van de 21 tests in `security.spec.ts` (Pixel 7). Dat is de headertest op elke pagina behalve de 404, die de headers overslaat (bevinding 15).
- `npx wrangler deploy --dry-run` slaagt. De dry-run controleert de route niet tegen het account. Volgens de broncode van Wrangler 4.141 gebruikt `wrangler preview` alleen routes met `previews_enabled`, dus de route raakt de previews niet.

### Preview-URL

`https://fase-7a-domein-coachboard.hardamkay.workers.dev`, 1 oktober 2026:

- `curl -I /en/`: `strict-transport-security: max-age=31536000`, plus de zes headers uit Fase 6 (en `x-robots-tag: noindex`, zoals op elke preview);
- `E2E_BASE_URL=<preview-URL> npx playwright test e2e/security.spec.ts`: 42 van 42 geslaagd (Pixel 7 en iPhone 15). Zo is `E2E_BASE_URL` getest vóór de run tegen productie.

### Na de livegang (1 oktober 2026)

PR #14 is gemerged (`main` @ `219c3ce`, met ook de Dependabot-update uit PR #12). Kay heeft het domein bekeken en www, Email Routing en Search Console ingericht.

**`e2e/security.spec.ts` tegen productie**, met `E2E_BASE_URL=https://handballcoachboard.com` na een build van `219c3ce`: **42 van 42 geslaagd** (Pixel 7 en iPhone 15).

- Elke pagina heeft de headers, met HSTS.
- Er zijn geen CSP-meldingen, ook niet op het bord met de QR-code.
- Cloudflare voegt dus geen scripts in die de CSP blokkeert.

**Met `curl`:**

| Controle | Resultaat |
|---|---|
| Headers op `/en/` | HSTS `max-age=31536000` plus de zes headers uit Fase 6; geen `x-robots-tag` |
| `http://handballcoachboard.com/en/board/` | 301 → `https://handballcoachboard.com/en/board/` (Always Use HTTPS) |
| `https://www.handballcoachboard.com/en/privacy/?x=1` | 301 → `https://handballcoachboard.com/en/privacy/?x=1` (Redirect Rule) |
| `http://www.handballcoachboard.com/en/` | 301 → `https://www.…`, dan 301 → het kale domein |
| `/`, `/en/privacy`, `/en/nope/` | 302 → `/en/`, 307 → `/en/privacy/`, 404 |
| canonical, `og:url`, `og:image` (`/en/` en de tactiekpagina) | alle drie absoluut op `https://handballcoachboard.com`; `og-default.png` en de `og.png` van de tactiek geven 200 met `image/png` |
| `/robots.txt` | `Allow: /`, `Sitemap: https://handballcoachboard.com/sitemap-index.xml` |
| `/sitemap-index.xml` → `/sitemap-0.xml` | de 9 indexeerbare pagina's, allemaal op het domein en met `/` aan het eind |
| HTML van `/en/about/` en `/en/privacy/` | geen `cdn-cgi`, geen `<script>`; de link is gewoon `mailto:contact@handballcoachboard.com`, dus Email Address Obfuscation staat uit |
| `https://coachboard.hardamkay.workers.dev/en/board/` | 200: werkt nog, tot 7b doorstuurt |

Mijn Mac kon `www.handballcoachboard.com` eerst niet vinden (een negatieve cache), terwijl `dig` het adres wel gaf. De www-controles zijn daarom gedaan met `curl --resolve` op het IP-adres van Cloudflare.

**Lighthouse mobiel op productie**, met het commando uit de nulmeting: drie runs per URL, de mediaan. Lighthouse 13.5.0, Chrome 154 headless.

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100 | 100 | 100 | 100 | 0,84 s | 0 | 0 ms |
| `/en/board/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |
| `/en/tactics/defense/6-0-defense-basics/` | 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms |

- Elke run gaf 100 in alle vier de categorieën. De LCP lag tussen 0,82 en 0,85 s; in de nulmeting op workers.dev was dat 0,80 tot 0,91 s.
- **SEO is 100** op het eigen domein: er is geen `noindex` zoals op de preview-URL's, en de canonical wijst naar het domein zelf.
- **Beveiligingspunten:**
  - HSTS ging van "High" (geen HSTS, Fase 6) naar twee keer "Medium": geen `includeSubDomains` en geen `preload`. Allebei zijn bewust weggelaten (zie het plan).
  - De CSP- en Trusted Types-punten zijn ongewijzigd ten opzichte van Fase 6.

**Nog van Kay:** het linkvoorbeeld in WhatsApp met een link naar het domein, en of de testmail naar `contact@handballcoachboard.com` is aangekomen.

## Fase 7b: workers.dev doorsturen (1 oktober 2026)

### Wat er veranderd is

- **`src/pages/[lang]/board.astro`:** een `<script>` die het bord op `coachboard.hardamkay.workers.dev` doorstuurt naar hetzelfde pad op `https://handballcoachboard.com`, met `#t=` erbij.
  - Alleen precies die host, niet de preview-URL's.
  - Astro zet het script inline (301 bytes) en neemt zijn hash op in de CSP-`<meta>` van het bord: 8 hashes, was 7, nagerekend.
  - `location.replace`, zodat de oude URL niet in de geschiedenis blijft.
- **Het eigen bord gaat mee.** Zonder `#t=` neemt het script het opgeslagen bord van workers.dev mee als `#own=…`.
  - De editor bewaart dat als eigen bord, maar alleen als het nieuwe domein nog geen bord heeft.
  - Heeft het nieuwe domein al een bord, dan negeert de editor `#own=`, en de adresbalk krijgt de `#t=` van het eigen bord (besluit Kay).
  - `format.ts` blijft ongewijzigd.
- **Contentpagina's sturen niet door.** Ze laden geen JS, en hun canonical wijst al naar het domein.

### Groottes

`npm run budget`, vóór (7a) en na:

| Meting | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 27,0 KB | 27,1 KB |
| Lazy JS van het bord (gzip) | 4,3 KB | 4,3 KB |
| Alle JS in `_astro/` (gzip) | 31,4 KB | 31,4 KB |
| HTML `/en/board/` (gzip) | 5,2 KB | 5,4 KB |
| Contentpagina's | geen JS | geen JS |

Het script zit in de HTML van het bord, niet in `_astro/`; vandaar +0,2 KB HTML. Er is geen budget verhoogd. Wel is `All JS` 31,4 van 32,5 KB: nog 1,1 KB ruimte. Dat is het moment uit Fase 6 om de CSS van de editor naar een stylesheet te verplaatsen, zodra er JS bij moet.

### Tests

- **Nieuw: `e2e/move.spec.ts`**, 5 tests per browser. `context.route()` bedient `coachboard.hardamkay.workers.dev`, `handballcoachboard.com` en een preview-host vanuit `wrangler dev`, elk met een eigen localStorage:
  1. een workers.dev-link met `#t=` (fixture `v1-full-lineup`) opent op het domein met hetzelfde bord;
  2. een eigen bord op workers.dev gaat mee, wordt op het domein opgeslagen en krijgt een `#t=` in de adresbalk;
  3. heeft het domein al een bord, dan blijft dat staan en verandert de opslag niet, zonder melding;
  4. een preview-host stuurt niet door;
  5. `/en/` op workers.dev stuurt niet door.
- `npm run verify` groen; `npm run e2e`: 129 geslaagd, 1 overgeslagen (was 119 en 1).

**Controles** (tijdelijk, niet gecommit):

| Controle | Resultaat |
|---|---|
| Hostnaam in het script fout (`…workers.dev.invalid`) | tests 1, 2 en 3 falen (Pixel 7) |
| Editor neemt `#own=` altijd over, ook als er al een bord is | test 3 faalt (Pixel 7) |

### Preview-URL

`https://fase-7b-doorsturen-coachboard.hardamkay.workers.dev`, 1 oktober 2026.

- **`security.spec.ts` met `E2E_BASE_URL` = de preview:** 42 van 42 geslaagd. Het nieuwe inline script geeft dus geen CSP-meldingen.
- **De preview stuurt niet door.** Het bord opent met `#t=` op de preview-host zelf, in beide browsers, zonder routes.
- **`move.spec.ts` met `E2E_BASE_URL` = de preview:** 8 van 10 geslaagd. Twee tests falen op Pixel 7, elke run opnieuw. Ze openen direct een bordpagina op een gerouteerde host en wachten 5 s op de editor.
  - Gemeten: een paar van de `route.fetch()`-verzoeken vanuit Node naar de preview duren elk ongeveer 5,3 s, de rest 60 tot 110 ms. De editor verschijnt na ongeveer 6 s.
  - Dat ligt aan de testopzet (doorsturen via Node naar een externe host), niet aan de site. Tegen `wrangler dev` slagen alle 10.
- **Lighthouse mobiel, `/en/board/`**, drie runs met het commando uit de nulmeting:
  - elke run Performance, Accessibility en Best Practices 100, SEO 66 (`noindex` op de preview);
  - LCP 0,85 tot 0,86 s (mediaan 0,86 s; productie vóór deze PR 0,83 s), CLS 0, TBT 0 ms;
  - overdracht 45,6 KB, op productie vóór deze PR 45,0 KB: het script en de extra hash in de HTML.

**Na de merge (Kay):** open op je telefoon een oude link naar `https://coachboard.hardamkay.workers.dev/en/board/` met `#t=`, en kijk of je op `handballcoachboard.com` uitkomt met hetzelfde bord.

### Productie (na de merge van PR #15)

`main` @ `0550cd6`, gemerged en door Workers Builds uitgerold op 1 oktober 2026. De bordpagina op `coachboard.hardamkay.workers.dev` geeft 200 met het script erin; het doorsturen gebeurt in de browser, dus de server ziet `#t=` niet.

**Doorsturen tegen de echte hosts.** Een kopie van `e2e/move.spec.ts` zonder `context.route()`, tijdelijk en niet gecommit, elke test in een verse browsercontext. Er is nog geen Nederlands bord (`/nl/board/` geeft 404), dus geval 1 alleen op `/en/board/`.

| # | Geval | Verwacht | Pixel 7 | iPhone 15 |
|---|---|---|---|---|
| 1 | workers.dev-link met `#t=` (fixture `v1-full-lineup`) | op het domein, zelfde `#t=` en bord | ✅ | ✅ |
| 2 | zonder `#t=`, niets opgeslagen | op het domein, standaardopstelling | ✅ | ✅ |
| 3 | zonder `#t=`, eigen bord op workers.dev | gaat mee als `#own=`, opgeslagen, adresbalk krijgt `#t=` | ✅ | ✅ |
| 4 | domein heeft al een bord | `#own=` genegeerd, opslag ongewijzigd, geen melding | ✅ | ✅ |
| 5 | preview-URL met `#t=` | blijft op de preview-host | ✅ | ✅ |
| 6 | `/en/` op workers.dev | stuurt niet door | ✅ | ✅ |

**Geval 7: `#t=` én een eigen bord op workers.dev**, in één browsercontext. Zonder vooraf verwachte uitkomst; beide browsers gaven hetzelfde.

1. Eigen bord opgeslagen op workers.dev (via `/en/`), domein leeg.
2. `OLD/en/board/#t=<fixture>` opent op het domein met de fixture en `#t=`. `#own=` gaat niet mee: het script neemt het eigen bord alleen mee zonder `#t=`. De opslag van het domein blijft leeg, want een bord uit een `#t=`-link wordt pas bij de eerste wijziging bewaard.
3. Daarna `OLD/en/board/` zonder `#t=`:
   - **zonder wijziging in stap 2 (geval 7):** het eigen bord gaat alsnog mee en wordt op het domein opgeslagen;
   - **met één wijziging in stap 2 (7′, een speler verschoven):** het domein heeft nu een bord (de aangepaste fixture), dus het eigen bord wordt genegeerd, zoals in geval 4. **Het blijft achter op workers.dev.**

**Bekend en geaccepteerd gevolg (besluit Kay, geen 7c):** wie eerst een gedeelde link opent en daar iets aan verandert, krijgt het eigen bord van workers.dev niet meer mee naar het domein; het blijft op workers.dev achter. Daar raakt niemand het meer aan, want het bord stuurt meteen door, en Safari op iOS wist de opslag van een site na zeven dagen Safari-gebruik zonder interactie op die site. Reden om het zo te laten: een gedeeld bord aanpassen overschrijft het eigen bord ook zonder verhuizing, en het gaat om weinig gebruikers.

**`security.spec.ts` tegen `https://handballcoachboard.com`** (build van `0550cd6`): 42 van 42 geslaagd. De CSP-`<meta>` van het bord heeft 8 script-hashes, zoals op de preview.

**Controles van Kay** (1 oktober 2026):

| Controle | Resultaat |
|---|---|
| Oude workers.dev-link met `#t=` op een echte telefoon | werkt: op het domein met hetzelfde bord |
| Testmail naar `contact@handballcoachboard.com` (uit 7a) | aangekomen |
| Linkvoorbeeld in WhatsApp (uit 7a), met links naar `handballcoachboard.com` | werkt: titel, beschrijving en afbeelding (`og-default.png`), in het grote en in het compacte kaartje |

- Een eerdere test met een versie-preview-URL (`d30ab823-…`) telt niet mee.
- **Opmerking voor een nieuwe versie van `og-default.png`:** in het compacte kaartje snijdt WhatsApp de afbeelding vierkant bij vanuit het midden, waardoor de tekst half wegvalt.

## Fase 8a: statistieken op de bordpagina's (2 oktober 2026)

### Wat er veranderd is

- **Cloudflare Web Analytics, alleen op de bordpagina's** (besluit Kay, variant B).
  - `src/components/Beacon.astro` zet de beacon als laatste in `<body>`, als `type="module"`, zoals het snippet van Cloudflare. Het token staat in `src/data/analytics.ts`; het is openbaar.
  - Eerst stond er `defer`. Kay vroeg om de vorm van het snippet over te nemen, zodat de beacon blijft werken als Cloudflare hem aanpast. Een module-script wordt net zo uitgesteld als `defer`, maar wordt met CORS opgehaald. Cloudflare stuurt `Access-Control-Allow-Origin: *` mee (gecontroleerd met `curl`).
  - `"spa": false`: anders telt de beacon in Chromium elke `history.replaceState()` als paginaweergave, dus elke bewerking (gevonden in de code van de beacon: hij luistert naar het `navigate`-event van de Navigation API).
  - Contentpagina's laden nog steeds geen JavaScript.
- **Drie bordpagina's per taal**, alle drie via `src/components/board/BoardPage.astro`:
  - `/en/board/`: de editor, zoals altijd;
  - `/en/board/link/`: hier opent een gedeelde link (Delen);
  - `/en/board/qr/`: hier opent een gescande QR-code.
  - Link en QR zijn `noindex` en staan niet in de sitemap. Oude links naar `/en/board/#t=…` blijven werken. `format.ts` is ongewijzigd.
- **De CSP per pagina.** `BoardPage.astro` voegt met `Astro.csp` alleen op de bordpagina's toe:
  - `script-src`: `https://static.cloudflareinsights.com/beacon.min.js`;
  - `connect-src 'self' https://cloudflareinsights.com` (daar stuurt de beacon naartoe).
  - Een scriptbron vervangt de standaard-`'self'` van Astro. Zonder expliciete `'self'` blokkeert de CSP de editor zelf (controle hieronder).
  - Contentpagina's houden de CSP van vóór deze fase, zonder `connect-src` en zonder Cloudflare.
- **Privacypagina:** de naam van de dienst, wat hij verstuurt, zes maanden bewaren, de paden voor link en QR, en de datum (2 oktober 2026). De zin "loads no … tracking scripts" is weg.

### De beacon

Gedownload op 2 oktober 2026: versie 2026.9.1, 30,3 KB raw, **10,1 KB gzip**, door Cloudflare 1 dag gecachet.

- **Telt niet mee in de JS-budgetten van het bord.** Hij staat niet in `dist/` en is niet nodig om te tekenen. `scripts/check-budget.mjs` heeft een nieuwe rij "External scripts":
  - op een bordpagina mag precies één script van een ander domein staan: de beacon;
  - elk ander extern script geeft een fout, net als de beacon twee keer;
  - op een contentpagina blijft elk script een fout.
- **Opgeteld** laadt het bord 27,1 + 10,1 = 37,2 KB JS bij het openen.
  - De stylesheet-optie uit Fase 6 (ongeveer 1,5 KB) is daarvoor niet nodig en zou dat gat ook niet dichten.
  - De krappe plek blijft "All JS": 31,4 van 32,5 KB.
- **Wat hij verstuurt** (gecontroleerd in de code en in `e2e/analytics.spec.ts`):
  - de URL zonder `?` en `#`, dus nooit `#t=`;
  - de verwijzer, ook zonder `?` en `#`;
  - meetwaarden: LCP, INP, CLS, FCP en TTFB.
- **Wat hij niet doet:** geen cookies, geen `localStorage`, geen `sessionStorage`. Volgens Cloudflare gooit hij het IP-adres weg in het datacenter en bewaart hij de gegevens zes maanden. Na 7 dagen zijn ze teruggebracht tot ongeveer 10% (een steekproef).

### Wacht het bord op de beacon?

Nee. De volgorde in `dist/en/board/index.html`:

| # | Wat | Hoe het laadt |
|--:|---|---|
| 1 | twee inline scripts van Astro (`astro:only` en `<astro-island>`) | direct, tijdens het parsen |
| 2 | `<astro-island … await-children>` | haalt de editor op met een dynamische `import()` zodra zijn inhoud er is (`astro:end`) |
| 3 | `<script type="module">` (doorsturen vanaf workers.dev, alleen op `/en/board/`) | uitgesteld, in volgorde |
| 4 | `<script type="module" src="…beacon.min.js">` | uitgesteld, als laatste |

- Een dynamische `import()` staat niet in de rij met uitgestelde scripts, dus de editor wacht nergens op.
- Wel wachten `DOMContentLoaded` en `load` op het downloaden van de beacon. Het bord gebruikt die events niet.
- **Getest:** `e2e/analytics.spec.ts` houdt de beacon voor altijd tegen, op alle drie de paden. Het bord laadt een gedeeld bord, een speler is te slepen en de adresbalk krijgt de nieuwe `#t=`.
- Daarom is `async` niet nodig. Ook niet om de beacon pas na het laden in te voegen. Met `type="module"` blijft dit zo: een module-script staat in dezelfde rij als `defer`.

### Groottes

`npm run budget`, vóór (`main` @ `934db67`) en na:

| Meting | Vóór | Na |
|---|--:|--:|
| JS van het bord (gzip) | 27,1 KB | 27,1 KB (op alle drie de bordpagina's) |
| Lazy JS van het bord (gzip) | 4,3 KB | 4,3 KB |
| Alle JS in `_astro/` (gzip) | 31,4 KB | 31,4 KB |
| HTML `/en/board/` (gzip) | 5,4 KB | 5,5 KB |
| HTML `/en/board/link/` en `/qr/` (gzip) | — | 5,4 KB |
| Externe scripts op een bordpagina | 0 | 1 (de beacon, 10,1 KB gzip) |
| Contentpagina's | geen JS | geen JS |

Er is geen budget verhoogd.

**Linklengte en QR-code**, met `https://handballcoachboard.com` (foutcorrectie L, zoals de editor; QR-versie met `uqr`):

| Fixture | `/en/board/` (vóór) | `/en/board/link/` | `/en/board/qr/` |
|---|--:|--:|--:|
| `v1-full-lineup` | 247 tekens, versie 10 | 252, versie 10 | 250, versie 10 |
| `v1-default` | 183, versie 8 | 188, versie 8 | 186, versie 8 |
| `v1-empty` | 64, versie 4 | 69, versie 4 | 67, versie 4 |

De QR-code blijft even groot.

### Tests

- **Nieuw: `e2e/analytics.spec.ts`**, 4 tests per browser:
  - op `/en/board/`, `/link/` en `/qr/` laadt en werkt het bord terwijl de beacon nooit aankomt;
  - de echte beacon (opgehaald bij Cloudflare, met het echte token) verstuurt geen `#t=`, geen deel van de link en geen query. De `location` is `…/en/board/link/`, `siteToken` is het token uit `src/data/analytics.ts`, en er zijn geen CSP-meldingen, geen cookies en alleen `coachboard.board` in de opslag. In WebKit is de inhoud van `sendBeacon()` niet te zien voor de route; daar telt de inhoud van de XHR's.
- **`e2e/helpers.ts` exporteert `test`**, die de beacon in elke test beantwoordt met een leeg script, en het eindpunt met 204. Geen test stuurt dus data naar het echte dashboard, ook niet met `E2E_BASE_URL` tegen productie. Alle specs importeren `test` en `expect` nu daaruit.
- **`e2e/security.spec.ts`:**
  - `script-src` per pagina: `'self'` voorop, hashes, en alleen op de bordpagina's de beacon; `connect-src` alleen daar;
  - **nieuw, op verzoek van Kay:** geen script van een ander domein in de pagina, behalve de beacon op de bordpagina's. De test kijkt naar `document.scripts` en naar de netwerkverzoeken, dus ook naar een script dat Cloudflare bóven de CSP-`<meta>` injecteert. Zo'n script blokkeert de `<meta>` niet, want die geldt alleen voor wat erna komt; Kay zag de beacon daardoor op `/en/` draaien.
- **`e2e/share.spec.ts`:**
  - Delen kopieert een link naar `/en/board/link/`;
  - de QR-code bevat de link van de adresbalk op `/en/board/qr/` (vergeleken met `uqr`, module voor module);
  - beide pagina's openen een gedeeld bord en zijn `noindex`, zonder canonical.
- `scripts/check-budget.test.mjs`: 3 tests erbij (link en QR als bordpagina, de beacon wel en andere externe scripts niet, en dezelfde URL als `src/data/analytics.ts`).
- `npm run verify` groen: 9 testbestanden met 93 tests, 12 pagina's, 143 interne links. `npm run e2e`: 179 geslaagd, 1 overgeslagen (was 129 en 1).

**Controles** (tijdelijk, niet gecommit):

| Controle | Resultaat |
|---|---|
| `insertScriptResource("'self'")` weggelaten | de editor laadt niet: bord- en security-tests falen (Pixel 7) |
| beacon op `/en/about/` gezet | `no script from another origin` en `no CSP violations` falen; het budgetscript faalt |

Niet getest: `"spa": true`. Dat staat alleen in de code van de beacon en in een comment in `Beacon.astro`.

### Lighthouse vóór (productie, 2 oktober 2026)

`/en/board/` op `https://handballcoachboard.com` (`main` @ `934db67`), drie runs met het commando uit de nulmeting, Lighthouse 13.5.0, Chrome 154. Vanuit Nederland, dus zonder de beacon die Cloudflare nu buiten de EU injecteert (zie "Open").

| Run | Performance | LCP | CLS | TBT | Overdracht | Verzoeken |
|--:|--:|--:|--:|--:|--:|--:|
| 1 | 100 | 0,88 s | 0 | 0 ms | 45,3 KB | 7 |
| 2 | 97 | 0,99 s | 0 | 3 ms | 45,4 KB | 7 |
| 3 | 99 | 1,22 s | 0 | 4 ms | 45,3 KB | 7 |

Mediaan: Performance 99, LCP 0,99 s. Accessibility, Best Practices en SEO waren 100 in elke run. De spreiding is groter dan in Fase 5 (0,81 tot 0,84 s). De meting "na" volgt op de preview-URL.

### Zonder script: wat Cloudflare aan de serverkant meet

Onderzocht voor besluit 1, niet gekozen.

- **Op Free alleen totalen:** requests, bandbreedte en unieke bezoekers. Bots tellen mee en er is geen uitsplitsing per pad.
- **Per pad alleen via de GraphQL API** (`httpRequestsAdaptiveGroups`); hoe ver die op Free teruggaat, staat niet in de docs en is niet nagegaan.
- **Geen Core Web Vitals**, en de previews van WhatsApp en crawlers tellen als bezoek.

### Preview-URL

`https://fase-8a-statistieken-coachboard.hardamkay.workers.dev`, 2 oktober 2026, nog zonder token. CI (verify, e2e, Workers Builds) is groen.

- **`security.spec.ts`, `analytics.spec.ts` en `share.spec.ts` met `E2E_BASE_URL` = de preview:** 93 geslaagd, 1 overgeslagen.
  - Geen CSP-meldingen.
  - Geen script van een ander domein behalve de beacon op de drie bordpagina's.
  - De echte beacon verstuurt geen `#t=`.
- **Lighthouse mobiel**, drie runs per URL met het commando uit de nulmeting:

| URL | Performance | LCP (mediaan) | CLS | TBT | Overdracht | Verzoeken |
|---|--:|--:|--:|--:|--:|--:|
| `/en/board/` | 100, 100, 100 | 0,87 s | 0 | 0–5 ms | 56,1–56,8 KB | 8–9 |
| `/en/board/link/` | 100, 100, 100 | 0,86 s | 0 | 4–5 ms | 56,1–56,7 KB | 8–9 |

- **Vergeleken met productie vóór deze PR** (mediaan Performance 99, LCP 0,99 s, 45,3 KB, 7 verzoeken):
  - LCP en Performance zijn niet slechter; de verschillen vallen binnen de spreiding;
  - de overdracht is ongeveer 11 KB groter: de beacon is 10,3 KB over het netwerk;
  - Accessibility en Best Practices zijn 100. SEO is 66, en 63 op `/link/`: de preview stuurt `noindex`, en `/link/` heeft zelf ook `noindex`.

**Na de overstap naar `type="module"` en het echte token** (`0e46a58`, 2 oktober 2026). `analytics.spec.ts` en `security.spec.ts` met `E2E_BASE_URL` = de preview: 82 van 82 geslaagd, in beide browsers.

- De echte beacon laadt als module en stuurt het token van de site als `siteToken`.
- Er gaan geen `#t=` en geen query mee.
- Er zijn geen CSP-meldingen en geen andere scripts van een ander domein.

### Maandmeting (vanaf 8b)

Elke maand één tabel, gelezen in het Web Analytics-dashboard, gefilterd op host `handballcoachboard.com`.

- **Aantal metingen:** zet bij elke p75 het aantal metingen (n) waarop hij rust. Toont het dashboard dat niet, noteer dan het aantal paginaweergaven met hetzelfde filter, en schrijf erbij dat n dat getal of lager is.
- **Telling of schatting:** na 7 dagen bewaart Cloudflare ongeveer 10% van de metingen. Over de laatste 7 dagen is n dus een echte telling. Gaat de periode verder terug, dan is n waarschijnlijk een schatting die uit de steekproef is teruggerekend: een getoonde 100 kan dan zo'n 10 echte metingen zijn.
  - Of het dashboard terugrekent en of het een melding over sampling toont, is nog niet nagegaan. Controleer dat bij de eerste maandmeting.
  - Tot het tegendeel blijkt geldt: bij een schatting deel je n door 10 (of door de factor die het dashboard noemt).
- **Minimum:** onder **100 echte metingen** per meetwaarde en per groep (iOS of Android) noteren we de p75, maar trekken we geen conclusie. Bij p75 uit minder dan 100 metingen schuift één trage zaal of één slecht netwerk de waarde al ver op. Er zijn nu twee gebruikers.
- **Echte tellingen erbij:** lees op de dag van de maandmeting ook de laatste 7 dagen af. Die rusten op alle metingen, dus daar is n een echte telling.
- **CLS komt alleen uit Chromium**, dus niet van iPhones. Of Safari LCP en INP doorgeeft, hangt af van de versie; het dashboard laat het zien (filter op besturingssysteem).

Sjabloon:

```
#### <maand> <jaar> (gelezen op <datum>)

| Wat | Aantal |
|---|--:|
| Paginaweergaven /en/board/ | |
| Paginaweergaven /en/board/link/ (gedeelde link geopend) | |
| Paginaweergaven /en/board/qr/ (QR-code gescand) | |
| Verwijzers naar /en/board/ (top 3) | |

Per periode een tabel: de hele maand, en de laatste 7 dagen.

| Meetwaarde | iOS p75 | iOS n | Android p75 | Android n | n is telling of schatting | Echte n (schatting ÷ 10) | Conclusie (alleen bij echte n ≥ 100) |
|---|--:|--:|--:|--:|---|--:|---|
| LCP | | | | | | | |
| INP | | | | | | | |
| CLS | — | — | | | | | |

Melding over sampling in het dashboard: ja (factor …) / nee. Opmerkingen:
```

### Open

- **Voorwaarden voor de merge, allebei vervuld (2 oktober 2026):**
  - Web Analytics (RUM) staat op "Enable with JS Snippet installation" (Kay). Eerder stond hij op "Enable, excluding visitor data in the EU", en dan injecteert Cloudflare de beacon op elke pagina voor bezoekers buiten de EU;
  - het token staat in `analyticsToken` in `src/data/analytics.ts`.
- **Na de merge:** `security.spec.ts` tegen productie. Gedaan, zie hieronder.

### Productie (na de merge van PR #17)

`main` @ `9bfb2e9`, gemerged en door Workers Builds uitgerold op 2 oktober 2026.

- Workers Builds en verify zijn geslaagd.
- `/en/board/link/` geeft 200, met de beacon als `type="module"` en het token.

**`security.spec.ts` tegen `https://handballcoachboard.com`** (build van `9bfb2e9`): 74 van 74 geslaagd, in beide browsers.

- Elke pagina heeft de headers.
- Er zijn geen CSP-meldingen.
- Op geen enkele pagina staat een script van een ander domein, behalve de beacon op `/en/board/`, `/link/` en `/qr/`. Cloudflare injecteert dus niets meer.
- Dat geldt voor een bezoeker uit Nederland. Of Cloudflare buiten de EU nog injecteert, is van hieruit niet te zien. Met RUM op "Enable with JS Snippet installation" hoort dat niet meer te gebeuren.

**Lighthouse mobiel**, drie runs per URL met het commando uit de nulmeting. Lighthouse 13.5.0, Chrome 154.

| URL | Performance | Accessibility | Best Practices | SEO | LCP (mediaan) | CLS | TBT | Overdracht | Verzoeken |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| `/en/` | 100, 100, 100 | 100 | 100 | 100 | 0,82 s | 0 | 0 ms | 8,0–8,4 KB | 3 |
| `/en/board/` | 100, 100, 100 | 100 | 100 | 100 | 0,83 s | 0 | 0 ms | 56,5 KB | 11 |

Per run (LCP): `/en/` 0,82, 0,83 en 0,82 s; `/en/board/` 0,83, 0,83 en 0,83 s.

Vergeleken met vóór 8a (productie, 2 oktober 2026: `/en/board/` mediaan Performance 99, LCP 0,99 s, 45,3 KB, 7 verzoeken):

- **Het bord:** Performance en LCP zijn niet slechter. De spreiding is kleiner dan in de meting vooraf.
- **11 KB meer:** de beacon (10,3 KB over het netwerk).
- **11 verzoeken in plaats van 7:** de beacon, twee berichten naar `cloudflareinsights.com/cdn-cgi/rum` (36 en 0 bytes), en het QR-chunk.
- **`/en/`:** geen verzoek naar Cloudflare Insights en geen JS, zoals bedoeld. Gelijk aan Fase 5 (0,82 s).

**Let op voor 8b:** deze drie Lighthouse-runs stuurden echte beacons. Dat zijn drie paginaweergaven van `/en/board/` op 2 oktober 2026, uit Nederland, met headless Chrome op macOS en een gesimuleerd mobiel scherm. De e2e-tests sturen niets: hun beacon is een leeg script.

## Standaardopstelling (2 oktober 2026)

Een inhoudsfix vóór Fase 9, in `src/lib/board/defaults.ts`. Drie spelers staan anders:

| Speler | Was | Nu | Waarom |
|---|---|---|---|
| P (cirkelspeler) | [100, 78] | [100, 66] | in de verdediging: precies tussen de twee middelste verdedigers ([80, 66] en [120, 66]) en op hun diepte |
| LB | [45, 118] | [35, 118] | breder, zelfde diepte |
| RB | [155, 118] | [165, 118] | breder, zelfde diepte |

- **Alleen een nieuw of gereset bord** krijgt de nieuwe opstelling: een bord zonder `#t=`, eigen bord of `#own=`, en "Default lineup". Deellinks en het eigen bord in `localStorage` houden hun posities.
- **`src/lib/board/fixtures/` is niet aangeraakt.** `v1-default.json` is een oude link en decodeert nog steeds naar de oude opstelling.
- **Waar het te zien is:** de homepage (`/en/`), de statische fallback van de bordpagina's (`BoardPage.astro`, op `/en/board/`, `/link/` en `/qr/`) en het bord zelf (`BoardEditor`). In de HTML veranderen alleen de drie `translate()`'s van die spelers. `public/og-default.png` tekent zijn eigen spelers en verandert niet.
- **Een tik op de rand:** de cirkelspeler en de verdedigers naast hem staan nu 20 dm uit elkaar (hart op hart), met 2 dm tussen de cirkels. `hit.test.ts` legt vast dat een tik op [91, 66], de rand van de cirkelspeler aan de kant van een verdediger, de cirkelspeler pakt (9 dm tegen 11 dm), op het halve en het hele veld.

**Groottes** (gzip -9, vóór `main` @ `7bda591`, en na): `/en/` 4434 → 4436 bytes, `/en/board/` 5556 → 5556, `BoardEditor`-chunk 11092 → 11091. `npm run budget` geeft dezelfde tabel.

**Tests:** `npm run verify` groen: 9 testbestanden met 94 tests (was 93). `npm run e2e`: 179 geslaagd, 1 overgeslagen, zoals vóór. In `e2e/reach.spec.ts` klopte alleen een comment niet meer (de afstand tussen cirkelspeler en verdediger, 23 → 20 dm).

### LB en RB naar 3,0 m van de zijlijn (vervolg op #19)

LB en RB staan een halve meter breder: LB van [35, 118] naar [30, 118], RB van [165, 118] naar [170, 118]. Dat is 3,0 m van de zijlijn (was 3,5 m), op dezelfde diepte (11,8 m van het doel). De rest van de opstelling is gelijk.

- Dezelfde regels als hierboven: `src/lib/board/fixtures/` is niet aangeraakt, en deellinks en het eigen bord houden hun posities. Alleen een nieuw of gereset bord krijgt de nieuwe plek.
- In de HTML van `/en/` en de bordpagina's veranderen alleen de `translate()`'s van LB en RB.

**Groottes** (gzip -9, vóór `main` @ `d360502`, en na): `/en/` 4436 → 4436 bytes, `/en/board/` 5556 → 5557, `BoardEditor`-chunk 11091 → 11090. `npm run budget` geeft dezelfde tabel.

**Tests:** `npm run verify` groen: 9 testbestanden met 94 tests. `npm run e2e`: 179 geslaagd, 1 overgeslagen, zoals vóór.

## UX-metingen (Fase 9, 2 oktober 2026)

Hoe snel tekenen en voorbereiden nu gaan, als nulmeting voor de fases die het bord veranderen. De app zelf verandert in Fase 9 niet.

**Testen met mensen is geparkeerd:** de trainers, de testronde van Fase 5, de tekentest en de scantest. Tot die er zijn, is het aantal handelingen van de kortste e2e-route de nulmeting. ~~Seconden volgen later.~~ Vervallen (besluit Kay, 8 oktober 2026): we meten niet in seconden.

### Meettaken

| Taak | Wat | Toestel | Nu te meten |
|---|---|---|---|
| T1 | Open het bord, zet een aanval tegen een 6-0 neer, teken drie pijlen (loop, pass, loop) en deel de link in de teamapp | telefoon | ja |
| T2 | Maak de aanval Kruising MO–LO in vier stappen, met een zin per stap, en deel hem | telefoon | als vier losse borden; als route zodra het bord stappen heeft |
| T3 | Zet de oefening Kruisen in tweetallen neer: twee rijen, een keeper, twee pionnen, een bal en de kruising | telefoon | ~~met spelers als pionnen; als route zodra het bord pionnen heeft~~ route sinds Fase 13-1, met dekkers als pionnen |
| T4 | Bereid een training voor: drie borden klaarzetten op de laptop en ze de volgende dag op je telefoon openen | laptop en telefoon | met links naar jezelf (route sinds Fase 12b); ~~met Mijn borden zodra die er zijn~~ met export en import (route sinds Fase 12b-3) |

### Meetmethode

- **Tikken.** Elke tik, sleep en toetsaanslag telt als één handeling.
  - Het openen van het bord telt niet mee.
  - Het deelvenster van de telefoon (app kiezen, chat kiezen, versturen) ligt buiten de pagina en telt ook niet.
- **Route.** De kortste route per taak is een e2e-test: `e2e/tasks.spec.ts`, in beide projecten (iPhone en Android).
  - Een tik gaat alleen naar een knop die al in beeld staat (`toBeInViewport()`): de route mag niet om scrollen vragen.
  - De test controleert ook de uitkomst. De gedeelde link (`/en/board/link/#t=…`) wordt gedecodeerd en moet de standaardopstelling met twee looppijlen en één pass bevatten.
- **Budget.** `TAP_BUDGET` in die test moet precies kloppen.
  - Vraagt de route een handeling meer, dan faalt de test. Vraagt hij er een minder, dan faalt hij ook. Zo blijft elke winst vastgelegd.
  - Het budget gaat alleen bewust omhoog of omlaag, met de reden in de PR en de nieuwe meting hieronder.
- **Geen seconden** (besluit Kay, 8 oktober 2026): de stopwatch vervalt, ook bij de sessies met trainers.
- **Wie** (geparkeerd, vóór Fase 14): drie tot vijf trainers, liefst jeugdtrainers, doen elke taak één keer zonder hulp. Kay kijkt alleen waar ze vastlopen.
- **Per fase.** Elke fase meet de taken die ze raakt opnieuw, vóór en na, en noteert dat hier.

### Nulmeting in tikken: T1

`main` @ `29b6d4b`, mobiele emulatie (Pixel 7 en iPhone 15, staand). De route vanaf de standaardopstelling:

| # | Handeling |
|--:|---|
| 1 | Tik "Run" |
| 2 | Sleep een looppijl vanaf LB |
| 3 | Sleep een looppijl vanaf RB |
| 4 | Tik "Pass" |
| 5 | Sleep een pass van CB naar RB |
| 6 | Tik "Share" |

| Route | Handelingen |
|---|--:|
| T1, eerste keer (standaardopstelling) | **6** |
| T1 met eigen bord (eerst "Clear" → "Default lineup") | **8** |

- **De aanval tegen 6-0 kost niets.** De standaardopstelling is al zes aanvallers tegen een 6-0 met keeper. Een trainer die al een eigen bord heeft, zet hem terug met twee tikken.
- **Gereedschap blijft gekozen na een pijl.** Daarom tekent de route eerst beide looppijlen en dan de pass.
  - In de volgorde van de taak (loop, pass, loop) is het één tik meer, want dan wissel je twee keer van gereedschap: 7.
  - v1 kent geen volgorde van pijlen, dus het gedeelde bord is in beide gevallen hetzelfde.
- **Controle** (tijdelijk, niet gecommit):
  - met het budget op 5 en daarna op 7 faalt de test ("Expected: 5, Received: 6" en "Expected: 7, Received: 6");
  - de route met eigen bord zonder "Clear" faalt op de opstelling.

### T1 in het Nederlands (Fase 10, 3 oktober 2026)

Dezelfde route op `/nl/board/`, met de Nederlandse knoppen ("Loop", "Pass", "Delen"; met eigen bord eerst "Wissen" → "Standaardopstelling"). `e2e/tasks.spec.ts` loopt nu per taal, in beide browsers.

| Route | `/en/` | `/nl/` |
|---|--:|--:|
| T1, eerste keer (standaardopstelling) | **6** | **6** |
| T1 met eigen bord | **8** | **8** |

- De gedeelde link gaat naar `/nl/board/link/`. Hij bevat de standaardopstelling met de Nederlandse afkortingen (LH, LO, MO, RO, RH, CL, K), twee looppijlen en een pass.
- Het budget blijft 6 (en 8), in beide talen.

### T1 na de nieuwe indeling (Fase 12a, 7 oktober 2026)

Dezelfde route in de nieuwe indeling: het gereedschap blijft onderaan, Delen staat in de titelbalk rechtsboven. Met een eigen bord is het Meer → Standaardopstelling in plaats van Wissen → Standaardopstelling.

| Route | `/en/` | `/nl/` |
|---|--:|--:|
| T1, eerste keer (standaardopstelling) | **6** | **6** |
| T1 met eigen bord | **8** | **8** |

- `TAP_BUDGET` blijft 6 en 8. Elke tik gaat naar een knop die al in beeld staat.
- ~~De seconden na Fase 12a meet Kay op de preview-URL (zie "Per taak en toestel" en "Fase 12a").~~ Vervallen (besluit Kay, 8 oktober 2026): geen seconden.

### T4: nulmeting met links naar jezelf (Fase 12b, 8 oktober 2026)

`main` @ `fb73f11`, in `e2e/tasks.spec.ts`. Twee toestellen in één test: een laptop (1280×720, eigen opslag) en de telefoon van het project.

- **De borden:** drie keer de standaardopstelling met één looppijl, van LB, CB en RB (LO, MO en RO). Geen titel: typen telt per toets.
- **Telt niet:** het bord openen, en alles buiten de pagina: het deelvenster, de link naar jezelf sturen, de link in de chat aantikken.

| # | Handeling (laptop) |
|--:|---|
| 1 | Tik "Run" |
| 2 | Sleep een looppijl vanaf LB |
| 3 | Tik "Share" |
| 4–5 | Meer → Standaardopstelling |
| 6 | Sleep een looppijl vanaf CB |
| 7 | Tik "Share" |
| 8–11 | Hetzelfde voor RB |

| Route | `/en/` | `/nl/` |
|---|--:|--:|
| T4 met links naar jezelf | **11** | **11** |

- Op de telefoon kost het niets: elke link opent zijn bord. De test controleert dat.
- Op de laptop blijft alleen bord 3 staan. Bord 1 en 2 bestaan alleen nog als link.
- **Controle** (tijdelijk, niet gecommit): met het budget op 10 en op 12 faalt de test ("Expected: 10, Received: 11" en "Expected: 12, Received: 11").

### T1 en T4 met Mijn borden (Fase 12b-2, 8 oktober 2026)

| Route | Vóór | Na |
|---|--:|--:|
| T1, eerste keer (en en nl) | 6 | **6** |
| T1 met eigen bord (en en nl) | 8 (Meer → Standaardopstelling, overschrijft je bord) | **8** (Meer → Nieuw bord, je bord blijft) |
| T4 met links naar jezelf (en en nl) | 11 (Meer → Standaardopstelling) | **11** (Meer → Nieuw bord) |

- Na T4 staan alle drie de borden in Mijn borden op de laptop; vóór alleen het laatste.
- `TAP_BUDGET` blijft 6, 8 en 11 (B7, besluit Kay: T1 met eigen bord via Nieuw bord).

### Doelen (besluit Kay, 2 oktober 2026; T4 op 9 oktober 2026)

| Taak | Nulmeting (route) | Doel | `TAP_BUDGET` |
|---|--:|--:|--:|
| T1 | 6 handelingen | **5** | 6 |
| T4, met links naar jezelf | 11 handelingen | ~~Kay kiest, na de route met Mijn borden (Fase 12b)~~ geen: ter vergelijking (B6) | 11 |
| T4, met export en import (Fase 12b-3) | 21 handelingen; 14 tot de borden in Mijn borden op de telefoon staan | **20** (B6) | 21 |
| T3 (Fase 13-1) | 21 handelingen; 23 met een eigen bord | Kay kiest, na de route (besluit 6, Fase 13) | 21 |
| T2 | — | zodra de route bestaat | — |

- **Het budget blijft 6** tot een fase de route echt korter maakt. Die fase verlaagt `TAP_BUDGET` in dezelfde PR, met de nieuwe meting hier.
- **T4 (B6, besluit Kay, 9 oktober 2026):** de route met export en import telt, tot elk bord één keer op het veld van de telefoon stond (21, ook het budget). Het doel is 20: met de slimme pijlen uit Fase 13 valt de tik op "Run" weg, net als bij T1. `TAP_BUDGET` blijft 21 tot die fase. De route met links (11) blijft in `e2e/tasks.spec.ts`, ter vergelijking.
- ~~**Doelen in seconden** volgen na de stopwatch (geparkeerd).~~ Vervallen (besluit Kay, 8 oktober 2026): alleen doelen in handelingen.

### Per taak en toestel

De routes in handelingen staan hierboven, per taak. De sessies met trainers (vóór Fase 14) noteren hier per taak waar ze vastlopen. De tabellen voor seconden zijn weg: seconden vervallen (besluit Kay, 8 oktober 2026).

**T1 in seconden, vóór Fase 12a** (Kay, 7 oktober 2026):

- op productie (`handballcoachboard.com`), drie keer, op iPhone en op Android: 10 tot 15 s;
- per toestel niet uitgesplitst, dus de mediaan is onbekend;
- **beginpunt:** de eerste tik op het bord, zoals de meetmethode hierboven. Het laden telt niet mee. ~~De meting na Fase 12a begint ook bij de eerste tik;~~ Vervallen (8 oktober 2026): er komt geen meting na Fase 12a;
- **eindpunt:** de link verstuurd in WhatsApp.
- **Test 15** uit de testronde van Fase 5 ("openen → tekenen → gedeeld in de teamapp") is hiermee maar deels gedaan: het openen en laden van het bord ontbreekt (in het lab ongeveer 1 s, LCP 0,8 s). Dat deel vervalt (besluit Kay, 8 oktober 2026); deze meting blijft staan.

### Linklengte en QR-grootte

Nagerekend met een eenmalig script (niet in de repo), met dezelfde compressie als `format.ts`: JSON → `deflate-raw` → base64url. De QR-versie komt van `uqr`, de bibliotheek van het bord.

**De borden:**
- de standaardopstelling (13 spelers, 7 met label) en een bal;
- per stap een pass en 1 tot 3 looppijlen, soms gebogen;
- lopers eindigen waar hun pijl eindigt, en twee verdedigers schuiven per stap;
- een titel en een Nederlandse zin per stap van 57 tot 65 tekens (gemiddeld 61);
- voor het formaat is een prefix `2.` aangenomen en een pad onder `/nl/`. Geen van beide bestaat nog: de links openen geen bord.

**De oefening** gebruikt wat er volgens de voorlopige uitkomst van de tekentest bij moet: een derde kleur (twee aanspeelpunten), vier pionnen, twee ballen, en schot, blok en stuit als pijlsoorten.

**Twee manieren om de stappen te schrijven:**
- (a) elke stap volledig, zoals de frames van v1;
- (b) de eerste stap volledig en daarna alleen wat verandert: verplaatste spelers, de bal, de pijlen en de zin.

| Bord | Variant | Tekens `/link/` | Tekens `/qr/` | QR, foutcorrectie L | QR, foutcorrectie M |
|---|---|--:|--:|--:|--:|
| Nu (v1): 1 stap, 3 pijlen, geen tekst | — | 206 | 204 | versie 9, 53×53 | versie 10, 57×57 |
| 4 stappen + tekst | a | 650 | 648 | versie 18, 89×89 | versie 20, 97×97 |
| 4 stappen + tekst | b | 638 | 636 | versie 17, 85×85 | versie 20, 97×97 |
| 8 stappen + tekst | a | 998 | 996 | versie 22, 105×105 | versie 25, 117×117 |
| 8 stappen + tekst | b | 973 | 971 | versie 22, 105×105 | versie 25, 117×117 |
| 12 stappen + tekst | a | 1325 | 1323 | versie 26, 121×121 | versie 30, 137×137 |
| 12 stappen + tekst | b | 1282 | 1280 | versie 26, 121×121 | versie 30, 137×137 |
| Oefening: 4 stappen, aanspeelpunten, pionnen, 2 ballen | a | 560 | 558 | versie 16, 81×81 | versie 18, 89×89 |
| Oefening: 4 stappen, aanspeelpunten, pionnen, 2 ballen | b | 541 | 539 | versie 16, 81×81 | versie 18, 89×89 |

- **Alleen opslaan wat verandert, levert bijna niets op:** 2 tot 3% korter, en de QR-code wordt hooguit één versie kleiner. `deflate-raw` haalt de herhaling tussen stappen er al uit. Voor de lengte hoeft v2 dus geen verschilformaat te hebben.
- **De tekst kost het meest.** Zonder zinnen zijn dezelfde borden 425, 600 en 762 tekens (`/link/`, variant a). Dat is versie 13, 17 en 19 bij L.
  - De zinnen zijn dus 35 tot 45% van de link.
  - Elke zin van ongeveer 61 tekens kost ongeveer 47 tekens in de link.
  - De limiet op stappen en die op tekst per stap bepalen samen de grootte.
- **Pas op met foutcorrectie M:** die maakt de code 2 tot 4 versies groter. Het bord gebruikt L.
- **Limieten doorgerekend:** dezelfde borden (variant a, pad `/qr/`), met elke zin precies zo lang als de limiet.
  - De zinnen zijn unieke woordreeksen uit een Nederlandse woordenlijst, zodat de compressie geen herhaling tussen stappen vindt.
  - Bij 61 tekens geeft dat 1300 tekens tegen 1323 met de echte zinnen hierboven, dus de woordenlijst comprimeert ongeveer als echte tekst.

  | Stappen | Zin ≤ 61 | Zin ≤ 80 | Zin ≤ 100 | Zin ≤ 140 |
  |--:|--:|--:|--:|--:|
  | 4 | 620 (v17) | 662 (v18) | 715 (v18) | 796 (v20) |
  | 8 | 1002 (v22) | 1060 (v23) | 1140 (v24) | 1276 (v26) |
  | 12 | 1300 (v26) | 1416 (v27) | 1496 (v28) | 1720 (v30) |

  In tekens van de hele link, met de QR-versie bij foutcorrectie L tussen haakjes.
- **Ter vergelijking:**
  - de grootste QR-code (versie 40, L) houdt op bij ongeveer 2950 tekens;
  - het formaat staat nu 4000 tekens payload toe (`MAX_PAYLOAD`).
  - Welke versie in de zaal nog scant van telefoon naar telefoon, moet de scantest uitwijzen.
- **Testmateriaal voor de scantest** (geparkeerd):
  - de negen QR-codes van de `/qr/`-links hierboven (de borden met variant a en b, plus v1);
  - met dezelfde instellingen als de QR-dialoog van het bord (foutcorrectie L, rand 2), en een printpagina van 8 cm per code;
  - ze staan lokaal en niet in de repo.

### Vóór en na

- **De app verandert niet.** `npm run budget` geeft dezelfde tabel als vóór Fase 9: JS van het bord 27,1 KB, alle JS 31,4 van 32,5 KB (gzip).
- **`npm run verify`** is groen: 9 testbestanden met 94 tests, zoals vóór.
- **`npm run e2e`:** 179 → 183 geslaagd, 1 overgeslagen. Dat zijn de twee routes van `e2e/tasks.spec.ts`, elk in twee browsers.

### Geparkeerd

Testen ligt stil (besluit Kay). Deze punten worden ingehaald vóór de fase die ze nodig heeft:

- **De testronde van Fase 5,** op productie. Test 15 (stopwatch) vervalt (besluit Kay, 8 oktober 2026); de rest staat open.
- ~~**De vier meettaken in seconden,** door Kay en door drie tot vijf trainers. De sessies met trainers vóór Fase 12a. T1 door Kay is gedaan (7 oktober 2026, zie "Per taak en toestel").~~ Vervallen (besluit Kay, 8 oktober 2026): geen seconden. **De sessies met trainers** blijven, vóór Fase 14, zonder stopwatch: drie tot vijf trainers doen elke meettaak één keer zonder hulp, en Kay kijkt alleen waar ze vastlopen.
- **Lezen of kijken,** in dezelfde sessies met trainers. Een trainer opent een tactiek en legt die daarna uit aan een speler. Noteer per trainer of hij de tekst las of alleen naar de tekening keek. Dit toetst of trainers vooral doeners zijn (Kay, 3 oktober 2026). Met de uitkomst kiest Kay hoeveel tekst een tactiekpagina naast de tekening nodig heeft.
- **Delen en vertrouwen:** vraag elke trainer of hij zijn eigen tactieken zou delen, en wanneer hij een tactiek van een ander vertrouwt. Dit toetst het idee van één kennisbank waar trainers zelf bijdragen, mits de kwaliteit gewaarborgd blijft (Kay, 3 oktober 2026). De uitkomst weegt mee bij besluit 9.
- **De tekentest:** de laatste drie trainingen en twee aanvalsvormen tekenen, en noteren waar het vastloopt.
  - De voorlopige uitkomst, van Kay: er ontbreken blok, schot, stuit, pionnen, meerdere ballen en een derde kleur (aanspeelpunten).
- **Eén aanval naar het eigen team sturen** en vragen wat ze zien.
- **De scantest,** na de merge van Fase 11 in een eigen PR (besluit Kay, 5 oktober 2026; PR #28 is gemerged vóór de scantest): de QR-codes hierboven in de zaal scannen.
  - **Gedaan (7 oktober 2026):** alle negen codes scanden binnen 1 à 2 tellen. De uitslag staat in de tabel onder "Fase 11" ("Scantest").
  - Telefoon bij telefoon: scherm naar camera, zoals bij het doorgeven van een bord.
  - Op de afstand waarop spelers in de zaal staan als de trainer zijn scherm laat zien: 1 m en 2 m.
  - Noteer per code en afstand: scant hij, en na hoeveel seconden. Daarna wordt besluit 3 (de limieten van de link) definitief. De tabel staat onder "Fase 11".
- **De testlijst voor de telefoon (Fase 9).** De app verandert in Fase 9 niet; dit is wat de nulmeting met echte telefoons aanvult. Op productie (`https://handballcoachboard.com/en/board/`), per toestel (model, iOS/Android-versie, browser):

  | # | Test | iPhone | Android |
  |--:|---|:-:|:-:|
  | 1 | T1 met de hand vanaf de standaardopstelling ("Run", twee looppijlen, "Pass", een pass, "Share"): 6 handelingen, zonder scrollen? | | |
  | 2 | T1 met een eigen bord ("Clear" → "Default lineup" eerst): 8 handelingen? | | |
  | 3 | ~~T1 met de stopwatch, drie keer: de mediaan in seconden, tot "gedeeld" in de teamapp~~ Vervallen (besluit Kay, 8 oktober 2026) | | |
  | 4 | De gedeelde link openen op een tweede telefoon: opent `/en/board/link/` met de drie pijlen? | | |
  | 5 | De scantest hierboven, op beide afstanden | | |
  | 6 | iPhone: Coachboard op het beginscherm zetten en dan een link uit WhatsApp openen. Opent hij in Safari of in de app? (Fase 12b) | | — |
  | 7 | Android: na "Toevoegen aan startscherm" een bord tekenen in Chrome. Staat het ook in de geïnstalleerde app? (Fase 12b) | — | |
  | 8 | Mijn borden → Alle borden exporteren: waar komt het bestand terecht (iPhone: Bestanden › Downloads?), en heet het `coachboard-borden-<datum>.json`? (Fase 12b-3) | | |
  | 9 | Borden importeren: is het bestand te kiezen, uit Bestanden, na AirDrop en uit een mail of chat? Komen de borden erbij met hun map? (Fase 12b-3) | | |
  | 10 | Hetzelfde bestand nog eens importeren: "Alle borden uit dit bestand staan er al."? (Fase 12b-3) | | |


## Fase 10: Nederlands (3 oktober 2026)

### Wat er veranderd is

- **`/nl/` met alle pagina's:** home, het bord (met `link/` en `qr/`), de tactieken, de onderwerpen, about en privacy.
  - `ui.ts` heeft een complete Nederlandse lijst. Het type eist elke sleutel, dus `npm run check` faalt op een ontbrekende.
  - About en privacy staan per taal in `src/i18n/pages/<pagina>/<taal>.astro`. Mist een taal zijn bestand, dan faalt de build: geen Engels onder `/nl/`. De Engelse pagina's zijn pixel voor pixel gelijk gebleven (schermafbeelding vóór en na).
  - De twee tactieken in het Nederlands, met dezelfde bestandsnaam en de Nederlandse afkortingen in de tekening.
- **Besluiten van Kay** (2 oktober 2026): Nederlands als eerste taal (4), oefeningen erbij (1), alleen het type in de URL met Engelse padnamen en slugs (2), de bordpaden niet vertaald (11). Voor deze fase: de afkortingen LH, LO, MO, RO, RH, CL en K, en `/` naar `/nl/`.
- **Tactiekpagina's op `/<taal>/tactics/<slug>/`** (besluit 2), zonder het onderwerp.
  - De twee Engelse pagina's verhuizen. De oude URL's, met en zonder `/` aan het eind, en hun `og.png` krijgen een 301 in `public/_redirects`. `e2e/routing.spec.ts` controleert dat.
  - Onderwerppagina's blijven op `/<taal>/tactics/<onderwerp>/`. Ze staan dus op hetzelfde niveau als de tactieken. Astro 7 bouwt beide dynamische routes naast elkaar zonder waarschuwing, en `checkTactics()` laat de build falen op een slug die gelijk is aan een onderwerp.
- **`/` gaat naar `/nl/`** (302). `x-default` wijst naar de Engelse pagina, niet naar `/`.
- **hreflang** `en`, `nl` en `x-default` op elke pagina die in beide talen bestaat.
  - `BaseLayout` krijgt de talen van een pagina in plaats van een lijst paden. Een vertaling heeft hetzelfde pad na het voorvoegsel.
  - Tactiek- en onderwerppagina's geven alleen de talen mee waarin ze bestaan. De taallinks in de footer sturen een andere taal dan naar zijn startpagina.
  - Op `link/`, `qr/` en de 404 staat geen hreflang.
- **Taalknop:** elke contentpagina heeft de taallinks EN en NL in de footer (dat was al zo; nu met een tweede taal). Het bord heeft geen footer.
- **Wat Fase 8a regelde, geldt ook voor `/nl/`:**
  - de beacon en de CSP met de beacon alleen op `/nl/board/`, `/nl/board/link/` en `/nl/board/qr/`;
  - `link/` en `qr/` zijn `noindex` en staan niet in de sitemap.
  - Het budgetscript, de sitemapfilter en `BoardPage.astro` werkten al per taal.
- **De standaardopstelling per taal.** `defaultBoardFor(lang)` geeft de Nederlandse afkortingen, en het bord krijgt de opstelling als prop, net als zijn teksten.
- **Labels die passen.**
  - Op 360 px breed heeft een gereedschapslabel ongeveer 40 px, en een actielabel ongeveer 48 px.
  - Afgekapt werden: "Verdedig", "Ongedaan maken", "Verwijderen", "Heel veld", en het Engelse "Full court". Dat laatste was al zo vóór deze fase.
  - De actiebalk toont nu korte labels (`board.*Short`). De volledige tekst blijft de titel van de knop.

  | Knop | Label NL | Titel NL | Label EN (titel EN) |
  |---|---|---|---|
  | verdediger | Dekker | Dekker | Defend |
  | ongedaan maken | Herstel | Ongedaan maken | Undo |
  | verwijderen | Weg | Verwijderen | Delete |
  | heel of half veld | Heel / Half | Heel veld / Half veld | Full / Half (Full court / Half court) |

- **De 404** is één pagina voor de hele site. Hij toont de tekst in het Engels en het Nederlands.
- **Een Nederlandse deelafbeelding:** `public/og-default-nl.png`, 46,6 KB.
  - Zes verdedigers in een 6-0, en drie opbouwers met een pass en een loopactie.
  - Het middelste vierkant van 630×630 is op zichzelf compleet (merknaam, veld, ondertitel). Chat-apps snijden een deelafbeelding voor een kleine preview bij tot dat vierkant. De kop staat in de zijstroken.
  - `public/og-default.png` (Engels) is ongewijzigd en heeft nog de oude indeling met vijf verdedigers. `node scripts/og-default.mjs en` maakt hem in de nieuwe indeling.

### Groottes

Gzip -9, vóór (`main` @ `07a2f91`) en na:

| Bestand | Vóór | Na |
|---|--:|--:|
| `BoardEditor` (JS) | 11.090 B | 10.990 B |
| Svelte-runtime (`client`) | 15.497 B | 15.497 B |
| HTML `/en/board/` | 5.557 B | 5.801 B |
| HTML `/nl/board/` | — | 5.891 B |
| HTML `/en/board/link/` | 5.388 B | 5.603 B |
| HTML `/en/` | 4.436 B | 4.515 B |
| HTML `/nl/` | — | 4.536 B |
| HTML 6-0-tactiek (`/en/`) | 4.755 B | 4.838 B |
| HTML 6-0-tactiek (`/nl/`) | — | 4.898 B |
| HTML 404 | 1.875 B | 2.075 B |
| CSS | 1.691 B | 1.691 B |

`npm run budget`: JS van het bord 27,1 KB, alle JS 31,4 van 32,5 KB, zoals vóór. Er is geen budget verhoogd.

- **De editor is 100 B kleiner,** want hij importeert de standaardopstelling niet meer.
- **De HTML van het bord is ongeveer 0,25 KB groter:** de opstelling als prop, de korte labels en de hreflang-regels. `/nl/board/` gebruikt 5,9 van 6,5 KB. Die marge wordt krap als het bord meer teksten krijgt (Fase 12a).
- **Eerst was de runtime 235 B groter,** door `$state.snapshot()`. Astro geeft props door als `$state`-proxy, en `structuredClone()` kan die niet kopiëren (zonder kopie laadde de editor niet; de bordtests vingen dat). Een JSON-kopie doet hetzelfde zonder extra runtime.
- **PNG:** de Nederlandse tactiekafbeeldingen zijn 36,6 en 44,9 KB, de Nederlandse standaardafbeelding 46,6 KB. Het budget is 60 KB.
- **Pagina's:** 12 → 23. Interne links: 143 → 294.

### Tests

- **`npm run verify`** groen: 11 testbestanden met 100 tests (was 9 en 94), 23 pagina's, 294 interne links, 73 budgetcontroles.
  - Nieuw: `defaults.test.ts` (de opstelling per taal) en `pages.test.ts` (`pageText()` faalt op een ontbrekende taal).
  - `tactics.test.ts`: het nieuwe pad, en een slug die gelijk is aan een onderwerp.
- **`npm run e2e`:** 183 → 349 geslaagd, 1 overgeslagen.
  - Het meeste komt van de `/nl/`-pagina's in de bestaande lussen over alle pagina's (axe, headers, CSP, scripts van een ander domein).
  - Nieuw: `e2e/i18n.spec.ts`:
    - hreflang op elke indexeerbare pagina, met `x-default` naar het Engels;
    - `link/` en `qr/` zonder hreflang;
    - de sitemap bevat precies de indexeerbare pagina's;
    - de taallink in de footer;
    - een Nederlandse tactiek opent in het Nederlandse bord, met de Nederlandse afkortingen.
  - `routing.spec.ts`: `/` → `/nl/`, en de 301's van de oude tactiek-URL's.
  - `security.spec.ts` faalt als de bordpagina's van een taal ontbreken, en tekent in beide talen zonder CSP-melding.
  - `layout.spec.ts`: in beide talen geen afgekapt label, op 360 px en liggend. Vóór de nieuwe labels faalde deze test op de woorden hierboven.
  - `tasks.spec.ts`: T1 in beide talen (zie "T1 in het Nederlands" onder "UX-metingen").

### Lighthouse vóór (productie, 3 oktober 2026)

`https://handballcoachboard.com` (`main` @ `07a2f91`), drie runs per URL met het commando uit de nulmeting, Lighthouse 13.5.0, Chrome 154.

| URL | Performance | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|
| `/en/` | 100, 100, 100 | 0,82 / 0,82 / 0,81 s | 0 | 0 ms | 8,4 KB |
| `/en/board/` | 100, 100, 100 | 0,81 / 0,81 / 0,82 s | 0 | 0 ms | 56,4 KB |
| `/en/tactics/defense/6-0-defense-basics/` | 100, 100, 100 | 0,83 / 0,82 / 0,82 s | 0 | 0 ms | 8,7 KB |

Accessibility, Best Practices en SEO waren 100 in elke run.

### Teksten van de Nederlandse homepage (Kay, 3 oktober 2026)

Kay heeft de teksten van `/nl/` herschreven: kop, inleiding, kenmerken, de drie stappen, de inleiding van de tactieken, het slot, de footer en de beschrijving (meta en `og:description`). De inleiding onder "Zo werkt het" is weg.

- **De kaarten met onderwerpen noemen alleen wat erin zit:** "Break, tweede golf" bij Aanval en "6-0-dekking" bij Verdediging.
  - Jeugd en Keepers hebben nog geen tactieken. Hun omschrijving is daarom leeg, en de kaart toont alleen "Binnenkort".
  - Een lege tekst laat de pagina nu weg, zowel de inleiding onder "Zo werkt het" als de omschrijving op een kaart.
  - De kaarten staan ook op `/nl/tactics/`.
- **De footertekst** staat op elke Nederlandse pagina.
- **Het Engels is ongewijzigd:** HTML `/en/` blijft 4.515 B. `/nl/` gaat van 4.536 naar 4.431 B (gzip).
- **Daarna (Kay): geen kaarten voor lege onderwerpen in het Nederlands.**
  - Jeugd en Keepers staan niet meer op `/nl/` en `/nl/tactics/`. Ze komen terug zodra er een Nederlandse tactiek in staat.
  - `soonCards` in `src/data/categories.ts` bepaalt per taal of een leeg onderwerp als "Soon" verschijnt; Engels doet dat nog.
  - HTML `/nl/` 4.431 → 4.305 B, `/nl/tactics/` 4.366 → 4.109 B. Engels ongewijzigd.
  - De meta-beschrijving van `/nl/tactics/` noemde nog "jeugd en keepers". Gesloten bij de tactiekpagina's (hieronder).

### Teksten van het Nederlandse bord (Kay, 3 oktober 2026)

Op `/nl/board/`, `/link/` en `/qr/` zijn de paginatitel, de kop, de beschrijving, de twee meldingen over een kapotte link, de melding als de QR-code niet laadt en de uitleg bij de QR-code nieuw.

- **De paginatitel is nu 46 tekens** ("Tactiekbord voor handbal | Handball Coachboard"); was 69.
- **De meldingen over een kapotte link zijn korter:** 65 en 74 tekens, was 95 en 104. Op 360 px zijn dat 2 regels in plaats van 3.
- **"Terug" wordt "Herstel".** Het past, en de titel blijft "Ongedaan maken".
- **"Dekking" past niet.** `e2e/layout.spec.ts` faalde staand in beide browsers (het woord is 42,5 tot 44,6 px; er is ongeveer 40 px). Daarom blijft het "Dekker".
- **Geen test controleerde op de oude woorden:** de e2e-tests lezen de teksten uit `ui.ts`.
- **HTML `/nl/board/`:** 5.891 → 5.852 B (gzip).

### Teksten van de Nederlandse tactiekpagina's (Kay, 3 oktober 2026)

Op `/nl/tactics/`, de twee onderwerpen en de twee tactieken zijn de teksten nieuw. Thema, niveau, `related` en de tekeningen zijn gelijk gebleven; het Engels ook.

- **`/nl/tactics/`:** titel, beschrijving en inleiding.
  - De titel noemt geen oefeningen meer: "Handbaltactieken met tekeningen | Handball Coachboard", 53 tekens (was 67).
  - De beschrijving noemt geen jeugd en keepers meer. Dat sluit het open punt bij de homepage.
- **De onderwerpen Aanval en Verdediging:** titel ("{label}: handbaltactieken"), inleiding en de oproep onderaan ("Teken je eigen aanval of verdediging"). De teksten van Jeugd en Keepers staan er nog; die pagina's bestaan niet op `/nl/`.
- **"6-0-verdediging: de basis" heet nu "6-0-dekking: de basis",** zoals de kaart bij Verdediging. Bestandsnaam en slug blijven.
- **De twee tactieken:** samenvatting (ook de meta-beschrijving), stappen en aandachtspunten.
  - De samenvattingen zijn 149 en 151 tekens (was 234 en 198).
  - De tweede golf heeft nu 6 stappen (was 5); de 6-0 houdt er 4.
  - **De zinnen van de stappen zijn 54 tot 92 tekens, gemiddeld 71.** De linkberekening ("Linklengte en QR-grootte", Fase 9) rekende met 61. Voor besluit 3 (de limieten).
- **Geen test controleerde op de oude teksten.**
- **HTML (gzip):** Engels ongewijzigd.

  | Pagina | Vóór | Na |
  |---|--:|--:|
  | `/nl/tactics/` | 4.109 B | 4.101 B |
  | `/nl/tactics/attack/` | 3.934 B | 3.883 B |
  | `/nl/tactics/defense/` | 3.937 B | 3.862 B |
  | `/nl/tactics/6-0-defense-basics/` | 4.846 B | 4.756 B |
  | `/nl/tactics/fast-break-second-wave/` | 4.502 B | 4.390 B |

### Teksten van de Nederlandse over- en privacypagina (Kay, 3 oktober 2026)

In de PR "Fase 10: afronding" (branch `fase-10-afronding`). Op `/nl/about/` en `/nl/privacy/` zijn de teksten nieuw, en de oproep onderaan de onderwerppagina's. Het Engels is ongewijzigd; dat volgt in stap 5.

- **`/nl/about/`:** de lijst "Wat het doet" (nu vier punten), "Gratis, zonder account" en "Contact". Titel, beschrijving en inleiding blijven.
- **`/nl/privacy/`:** de beschrijving (meta en `og:description`), de inleiding en alle onderdelen behalve "Wijzigingen". "Laatst bijgewerkt" is 3 oktober 2026.
  - Wat Cloudflare Web Analytics krijgt, staat nu in een lijst. De privacypagina had nog geen lijststijl; die komt van de over-pagina, met boven en onder de lijst dezelfde ruimte als tussen alinea's (12 px).
  - De paden van een gedeelde link en een QR-code noemen de taal: `/nl/board/link/` en `/nl/board/qr/`.
  - Die paden komen uit `sharePaths` in `src/data/nav.ts`, dezelfde bron als Delen en de QR-code in `BoardPage.astro`. Ze kunnen dus niet uit elkaar lopen.
- **De oproep op `/nl/tactics/attack/` en `/nl/tactics/defense/`:** "Gratis, zonder account. Deel je tekening met je team, als link of QR-code."
- **Geen test controleerde op de oude teksten.**
- **HTML (gzip):**

  | Pagina | Vóór | Na |
  |---|--:|--:|
  | `/nl/about/` | 2.345 B | 2.355 B |
  | `/nl/privacy/` | 3.064 B | 3.128 B |
  | `/nl/tactics/attack/` | 3.883 B | 3.887 B |
  | `/nl/tactics/defense/` | 3.862 B | 3.866 B |
  | `/en/privacy/` | 3.011 B | 3.036 B |

  - `/en/privacy/` is 25 B groter door de lijststijl, die in de pagina zelf staat. De Engelse tekst is gelijk.

### Teksten van de Engelse pagina's (Kay, 3 oktober 2026)

Stap 5, in PR #24 (branch `fase-10-afronding`, na de merge van #23). Het Engels volgt nu het Nederlands van stap 1 tot en met 4. Het Nederlands is ongewijzigd.

- **`/en/`:** kop, inleiding, kenmerken, de drie stappen, de inleiding van de tactieken, het slot, de footer (op elke Engelse pagina) en de beschrijving. De inleiding onder "How it works" is weg, net als in het Nederlands.
- **Het bord:** paginatitel, beschrijving, de uitleg bij de QR-code, de melding als die niet laadt en de twee meldingen over een kapotte link.
  - De paginatitel is 44 tekens ("Handball tactics board | Handball Coachboard"); was 66.
  - De meldingen over een kapotte link zijn 72 en 76 tekens; was 90 en 94.
- **`/en/tactics/` en de onderwerpen:** titel, beschrijving en inleiding; de kaarten bij Attack en Defense ("Fast break, second wave", "6-0 defense"); de oproep onderaan de onderwerppagina's.
  - De titel noemt geen drills meer: "Handball tactics with diagrams | Handball Coachboard", 52 tekens (was 63). Ook de titel van een onderwerp: "{label}: handball tactics".
- **Geen "Soon"-kaarten meer.** Youth en Goalkeeping staan in het Engels niet meer op `/en/` en `/en/tactics/`, net als in het Nederlands. Daarmee gebruikte niets meer `soonCards`, de "Soon"-kaart of `tactics.soon`; die zijn weg. `CategoryCards` toont alleen onderwerpen met een tactiek, altijd als link.
- **De twee tactieken:** titel, samenvatting (ook de meta-beschrijving), stappen en aandachtspunten. Thema, niveau, `related`, de tekeningen, bestandsnaam en slug blijven.
  - "6-0 Defense: Basics" heet nu "6-0 defense: the basics", en "Fast Break: Second Wave Attack" heet "Fast break: the second wave".
  - De samenvattingen zijn 155 en 152 tekens. De tweede golf heeft nu 6 stappen, zoals in het Nederlands.
- **`/en/about/`:** de lijst "What it does" (vier punten), "Free, without an account" en "Contact". Titel, beschrijving, inleiding en koppen blijven.
- **`/en/privacy/`:** de beschrijving, de inleiding en alle onderdelen behalve "Changes". "Last updated" is 3 October 2026.
  - Wat Cloudflare Web Analytics krijgt, staat nu in een lijst, met de lijststijl van stap 4.
  - De paden van een gedeelde link en een QR-code komen uit `sharePaths`, zoals in `nl.astro`: `/en/board/link/` en `/en/board/qr/` (was `/board/link/` en `/board/qr/`, zonder taal).
- **Tests:** `e2e/board.spec.ts` controleerde de twee oude meldingen over een kapotte link letterlijk; die controleren nu de nieuwe tekst. Verder controleerde geen test op een oude Engelse tekst. Er is geen controle weggehaald.
  - `npm run verify` groen (100 tests, 23 pagina's, 294 interne links). `npm run e2e`: 349 geslaagd, 1 overgeslagen, zoals vóór.
- **HTML (gzip -9):**

  | Pagina | Vóór | Na |
  |---|--:|--:|
  | `/en/` | 4.515 B | 4.210 B |
  | `/en/board/` | 5.801 B | 5.781 B |
  | `/en/board/link/` en `/qr/` | 5.603 B | 5.579 B |
  | `/en/tactics/` | 4.364 B | 3.992 B |
  | `/en/tactics/attack/` | 3.981 B | 3.851 B |
  | `/en/tactics/defense/` | 3.939 B | 3.835 B |
  | `/en/tactics/6-0-defense-basics/` | 4.838 B | 4.717 B |
  | `/en/tactics/fast-break-second-wave/` | 4.516 B | 4.346 B |
  | `/en/about/` | 2.358 B | 2.322 B |
  | `/en/privacy/` | 3.036 B | 3.043 B |
  | `/nl/` | 4.305 B | 4.251 B |
  | `/nl/tactics/` | 4.101 B | 4.045 B |
  | 404 | 2.075 B | 2.017 B |

  - `/nl/` en `/nl/tactics/` zijn kleiner doordat de CSS van de "Soon"-kaart uit `CategoryCards` weg is; hun tekst is gelijk. De andere Nederlandse pagina's zijn byte voor byte even groot.
  - De 404 toont de Engelse footertekst, die korter is.
- **De Engelse deelafbeelding** (`public/og-default.png`) heeft nu de indeling van de Nederlandse: zes verdedigers in een 6-0, en drie opbouwers met een pass en een loopactie. Tot nu toe had hij de oude indeling met vijf verdedigers (zie "Een Nederlandse deelafbeelding" hierboven).
  - Opnieuw gemaakt met `node scripts/og-default.mjs en`, lokaal met systeemfonts. De tekst is gelijk gebleven: "Draw a play." en "Share it with your team.", met "Free tactics board for handball trainers".
  - Het middelste vierkant van 630×630 is op zichzelf compleet: merknaam, veld en ondertitel. De kop staat in de zijstroken.
  - 46,7 KB (was 50,5 KB). Het budget is 60 KB.

### Preview-URL

`https://fase-10-nederlands-coachboard.hardamkay.workers.dev`, 3 oktober 2026. Workers Builds is groen.

PR #24 (stap 5, de Engelse teksten en deelafbeelding): `https://fase-10-afronding-coachboard.hardamkay.workers.dev`.

- **`security.spec.ts`, `i18n.spec.ts`, `routing.spec.ts` en `analytics.spec.ts` met `E2E_BASE_URL` = de preview:** 218 geslaagd.
  - Geen CSP-meldingen, in beide talen.
  - Geen script van een ander domein, behalve de beacon op de zes bordpagina's.
  - `/` → `/nl/` (302), en de oude tactiek-URL's → 301.
- **Lighthouse mobiel**, drie runs per URL:

| URL | Performance | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|
| `/en/` | 100, 100, 100 | 0,84 / 0,84 / 0,87 s | 0 | 0 ms | 8,6 KB |
| `/en/board/` | 100, 100, 100 | 0,81 / 0,83 / 0,82 s | 0 | 0 ms | 56,3 KB |
| `/en/tactics/6-0-defense-basics/` | 100, 100, 100 | 0,84 / 0,85 / 0,85 s | 0 | 0 ms | 8,9 KB |
| `/nl/` | 100, 100, 100 | 0,84 / 0,83 / 0,83 s | 0 | 0 ms | 8,7 KB |
| `/nl/board/` | 100, 100, 100 | 0,82 / 0,81 / 0,82 s | 0 | 0 ms | 56,5 KB |
| `/nl/tactics/6-0-defense-basics/` | 100, 100, 100 | 0,85 / 0,85 / 0,84 s | 0 | 0 ms | 9,0 KB |

- **Vergeleken met productie vóór deze PR:**
  - Performance blijft 100.
  - LCP is 0 tot 0,03 s hoger. Dat valt binnen de spreiding van eerdere metingen (Fase 8a: 0,81 tot 1,22 s).
  - De overdracht is 0,2 KB groter (hreflang en de taallinks).
  - Accessibility en Best Practices zijn 100. SEO is 66, omdat de preview `noindex` stuurt; SEO alleen op productie vergelijken.

### Testronde Fase 10 (Kay)

Op de preview-URL hierboven. Testen ligt stil (besluit Kay, Fase 9); dit zijn de tests voor wanneer het weer begint, of vóór de merge als je dat wilt. Vul per toestel in (model, iOS/Android-versie, browser).

| # | Test | iPhone | Android |
|--:|---|:-:|:-:|
| 1 | Het domein zonder pad openen: kom je op `/nl/`? | | |
| 2 | `/nl/`, de tactieken, een tactiek, over en privacy: alles in het Nederlands, niets afgekapt, staand en liggend? | | |
| 3 | Het bord op `/nl/board/`: de afkortingen LH, LO, MO, RO, RH, CL en K, en alle labels heel (Schuif, Aanval, Dekker, Bal, Loop, Pass, Dribbel; Herstel, Weg, Wissen, Heel, Delen, QR-code)? | | |
| 4 | Lezen de labels goed? Vooral "Dekker", "Herstel" (ongedaan maken) en "Weg" (verwijderen) | | |
| 5 | T1 in het Nederlands: Loop, twee looppijlen, Pass, een pass, Delen. Zes handelingen, en de link opent `/nl/board/link/` op een tweede telefoon? | | |
| 6 | Een Nederlandse tactiek → "Open in het bord": de tactiek staat op het bord, met Nederlandse afkortingen | | |
| 7 | De taallink in de footer (EN/NL) op een tactiek: kom je op dezelfde tactiek in de andere taal? | | |
| 8 | Een oude link (`/en/tactics/defense/6-0-defense-basics/`) gaat naar de nieuwe URL | | |
| 9 | Een link naar `/nl/` in WhatsApp: de Nederlandse deelafbeelding, ook als klein vierkant? | | |
| 10 | Een niet-bestaande pagina (`/nl/bestaat-niet/`): de 404 in het Engels en het Nederlands | | |

## Tekstcorrecties na Fase 10 (3 oktober 2026)

Branch `teksten-coach-gratis`, na de merge van PR #24. Alleen tekst en de twee standaard-deelafbeeldingen; geen Lighthouse-meting, want er verandert geen code.

### Wat er veranderd is

- **"Coach" in plaats van "trainer" in het Engels.** In het Engels is een trainer een fitness- of medische trainer; wie een team traint en coacht, is een coach. Het Nederlands houdt "handbaltrainer".
  - `src/i18n/ui.ts` (en): `footer.tagline`, `footer.madeBy`, `home.description`, `home.lead` en `about.description`. De rest van die zinnen bleef gelijk.
  - `src/i18n/pages/about/en.astro`: de inleiding. `src/i18n/pages/privacy/en.astro`, onder Statistics: "whether coaches use the board".
- **`og:locale` is `en_US`** (was `en_GB`): spelling en URL's zijn Amerikaans. `ogLocale` in `src/i18n/ui.ts`.
- **"Gratis" en "free" staan alleen nog op de about-pagina,** in het blok "Gratis, zonder account" / "Free, without an account"; dat blok is ongewijzigd. Het stond op elke pagina (de footer) en op home drie keer, en het zegt wat het bord kost, niet wat het doet.
  - `src/i18n/ui.ts` (nl en en): `footer.tagline`, `home.description`, `home.note`, `home.ctaBody`, `about.description`, `category.ctaBody` en `board.description`.
  - `src/i18n/pages/about/nl.astro` en `en.astro`: de inleiding.
  - `git grep -i -w -E "gratis|free"` vindt als sitetekst alleen nog die twee blokken (verder `README.md` tot commit `1cf2595`, en een codecommentaar over de vrijeworplijn in `geometry.ts`).
- **De deelafbeeldingen:** de ondertitel in `scripts/og-default.mjs` is "Tactics board for handball coaches" en "Tactiekbord voor handbaltrainers". Beide opnieuw gemaakt met `node scripts/og-default.mjs en` en `nl`.
- **Documentatie:** de regels voor sitetekst staan in `AGENTS.md` onder "Copy"; de eerste regel van `AGENTS.md` en regel 3 van `README.md` zeggen "coaches".

### Groottes

HTML (gzip -9), vóór en na:

| Pagina | Vóór | Na |
|---|--:|--:|
| `/en/` | 4.210 B | 4.196 B |
| `/en/about/` | 2.322 B | 2.308 B |
| `/en/privacy/` | 3.043 B | 3.038 B |
| `/en/board/` | 5.781 B | 5.781 B |
| `/en/board/link/` en `/qr/` | 5.579 B | 5.580 B |
| `/en/tactics/` | 3.992 B | 3.990 B |
| `/en/tactics/attack/` | 3.851 B | 3.827 B |
| `/en/tactics/defense/` | 3.835 B | 3.811 B |
| `/en/tactics/6-0-defense-basics/` | 4.717 B | 4.710 B |
| `/en/tactics/fast-break-second-wave/` | 4.346 B | 4.341 B |
| `/nl/` | 4.251 B | 4.238 B |
| `/nl/about/` | 2.355 B | 2.354 B |
| `/nl/privacy/` | 3.128 B | 3.122 B |
| `/nl/board/` | 5.852 B | 5.850 B |
| `/nl/board/link/` en `/qr/` | 5.653 B | 5.650 B |
| `/nl/tactics/` | 4.045 B | 4.042 B |
| `/nl/tactics/attack/` | 3.887 B | 3.867 B |
| `/nl/tactics/defense/` | 3.866 B | 3.845 B |
| `/nl/tactics/6-0-defense-basics/` | 4.756 B | 4.752 B |
| `/nl/tactics/fast-break-second-wave/` | 4.390 B | 4.385 B |
| 404 | 2.017 B | 2.010 B |

- Elke pagina verandert: de footer staat op elke contentpagina, `og:locale` op elke Engelse pagina en de beschrijving op het bord. De bordpagina's hebben geen footer.
- `/en/board/` is na gzip even groot: de beschrijving is korter, maar gecomprimeerd valt dat weg.
- De onderwerppagina's winnen het meest (20 tot 24 B): daar verdween "Free, no account needed." / "Gratis, zonder account." uit de oproep onderaan.

Deelafbeeldingen (budget 60 KB):

| Afbeelding | Vóór | Na |
|---|--:|--:|
| `og-default.png` (en) | 46,7 KB | 46,4 KB |
| `og-default-nl.png` | 46,6 KB | 45,7 KB |

Het middelste vierkant van 630×630 is in beide op zichzelf compleet: merknaam, veld en ondertitel.

### Tests

- Geen test controleerde een van deze teksten of `en_GB`; er is geen test aangepast of weggehaald.
- `npm run verify` groen na elke commit (100 tests, 23 pagina's, 294 interne links, budget 73 controles).
- `npm run e2e`: 349 geslaagd, 1 overgeslagen, zoals vóór.

### Preview-URL

PR #25: `https://teksten-coach-gratis-coachboard.hardamkay.workers.dev`.

## De CSS van de editor in een stylesheet (5 oktober 2026)

Branch `editor-stylesheet`, vóór Fase 11 van het productplan. Fase 11 (linkformaat v2) kost naar schatting 0,9 tot 1,7 KB JS (gzip), en er was 1,1 KB vrij onder het budget voor alle JS. Het besluit uit Fase 6 ("terugkomen zodra het JS-budget knelt") is hiermee voor de helft uitgevoerd.

### Wat er veranderd is

- **De styles van `BoardEditor.svelte` staan in `src/components/board/BoardEditor.css`.** `<svelte:options css="injected" />` is weg. Alleen `BoardPage.astro` importeert het bestand, dus Astro linkt het alleen op de zes bordpagina's.
- **Svelte schermt de CSS niet meer af.** Elke regel begint nu bij `.editor`, of bij `.qr` voor de QR-dialoog (die staat naast de editor). De specificiteit blijft gelijk: Svelte gaf elke selector een eigen klasse, nu doet `.editor` dat.
- **De styles van de fallback** in `BoardPage.astro` stonden als `<style>` in de HTML. Astro voegt ze nu samen met de styles van de editor in één bestand (`BoardPage.*.css`).
- **`'unsafe-inline'` blijft in `style-src`** (besluit Kay). Er voegt niets meer een `<style>` in tijdens het draaien, maar zonder `'unsafe-inline'` zet Astro een hash voor elke inline `<style>` in de HTML, ongeveer 0,6 KB per pagina. Dat volgt apart.
- **Budget:** de bordpagina's krijgen een eigen CSS-budget, `boardCss`: 3,3 KB (gemeten 3,1 KB plus een kleine marge). Contentpagina's houden 2,0 KB; daar past de stylesheet van de editor niet bij, dus het budget vangt het als hij op een contentpagina terechtkomt.

### Groottes

Gzip -9, vóór (`main` @ `0621098`) en na:

| Bestand | Vóór | Na |
|---|--:|--:|
| `BoardEditor` (JS) | 11.005 B | 9.424 B |
| Svelte-runtime (`client`) | 15.505 B | 15.393 B |
| CSS van de site (`BaseLayout`) | 1.692 B | 1.692 B |
| CSS van het bord (`BoardPage`) | — | 1.435 B |
| HTML `/nl/board/` | 5.874 B | 5.581 B |
| HTML `/en/board/` | 5.800 B | 5.511 B |
| HTML `/nl/board/link/` | 5.674 B | 5.379 B |
| HTML `/nl/` en de andere contentpagina's | gelijk | gelijk |

`npm run budget`:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 27,0 KB | 25,3 KB | 32,5 KB |
| Alle JS in `_astro/` | 31,3 KB | 29,6 KB | 32,5 KB |
| CSS bordpagina | 1,7 KB | 3,1 KB | 2,0 → 3,3 KB (`boardCss`) |
| CSS contentpagina | 1,7 KB | 1,7 KB | 2,0 KB |

- **JS −1,7 KB:** de CSS van de editor (1,6 KB) en de code in de runtime die hem invoegt (0,1 KB). Onder het budget voor alle JS is nu 2,9 KB vrij.
- **De bordpagina samen is 0,6 KB lichter:** JS −1,7 KB, CSS +1,4 KB, HTML −0,3 KB (de styles van de fallback staan niet meer in de HTML).
- **Eén verzoek meer** op het bord: de stylesheet, van hetzelfde domein, in de `<head>`.
- Interne links: 294 → 300. `check-links.mjs` telt de nieuwe stylesheet-link op de zes bordpagina's mee.

### Lighthouse (preview-URL's)

Drie runs per URL met het commando uit de nulmeting, Lighthouse 13.5.0, Chrome 154. Vóór: de preview van PR #25 (dezelfde code als `main`). Na: de preview van deze branch. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`.

| URL | Vóór: Performance | Vóór: LCP (runs) | Na: Performance | Na: LCP (runs) | CLS | TBT | Overdracht vóór → na |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` | 99, 100, 100 | 1,94 / 0,81 / 0,81 s | 100, 100, 100 | 0,85 / 0,81 / 0,81 s | 0 | 0 ms | 56,5 → 56,2 KB |
| `/en/board/` | 100, 100, 100 | 0,81 / 0,82 / 0,83 s | 100, 100, 100 | 0,82 / 0,82 / 0,81 s | 0 | 0 ms | 56,5 → 56,2 KB |
| `/nl/` | 100, 100, 100 | 0,85 / 0,85 / 0,83 s | 100, 100, 100 | 0,83 / 0,83 / 0,82 s | 0 | 0 ms | 8,4 → 8,4 KB |

- De eerste run vóór op `/nl/board/` (1,94 s) was een koude cache van de preview. De mediaan is 0,81 s, vóór en na.
- Accessibility en Best Practices zijn 100 in elke run.

### Verspringt het veld?

Gemeten zoals bij bevinding 14: Playwright op de preview-URL, `/nl/board/`, halve veld met de standaardopstelling. "Fallback" is gemeten met de scripts van de pagina vastgehouden, daarna de editor, in dezelfde paginalading. De stylesheet laadt los van de scripts, dus de fallback heeft hem al.

| Viewport | Fallback (x, y) | Editor (x, y) | Breedte | Verschuiving vóór | Verschuiving na |
|---|--:|--:|--:|--:|--:|
| iPhone SE staand 320×568 | 19,3, 126,0 | 19,3, 126,0 | 281,5 → 281,5 | geen | geen |
| iPhone 15 staand 393×659 | 22,0, 138,7 | 22,0, 138,7 | 349,1 → 349,1 | geen | geen |
| Pixel 7 staand 412×839 | 22,7, 220,2 | 22,7, 220,2 | 366,7 → 366,7 | geen | geen |
| iPhone 15 liggend 734×343 | 216,1, 25,1 | 216,1, 25,1 | 301,8 → 301,8 | geen | geen |
| Pixel 7 liggend 863×360 | 272,9, 26,2 | 272,9, 26,2 | 317,1 → 317,1 | geen | geen |

Vóór en na zijn de posities gelijk tot op 0,1 px.

### Tests

- `npm run verify` groen na elke commit: 101 tests (een nieuwe in `check-budget.test.mjs`: de bordpagina's hebben hun eigen CSS-budget), 23 pagina's, 300 interne links.
- `npm run e2e`: 349 geslaagd, 1 overgeslagen, zoals vóór. De layouttests (balken in beeld, labels niet afgekapt, veld verspringt niet) en `e2e/security.spec.ts` (geen CSP-meldingen) blijven groen.

### Preview-URL

`https://editor-stylesheet-coachboard.hardamkay.workers.dev`

## Herladen bij een link van een nieuwere versie (5 oktober 2026)

Branch `reload-newer-link`, vóór Fase 11 van het productplan. Lost bevinding 16 op.

### Wat er veranderd is

- **`isNewerLink()` in `format.ts`** herkent een link van een nieuwere versie dan de code: het deel vóór de punt is een geheel getal boven `LATEST` (nu 1). Een kapotte `1.`-link, `0.`, `abc.` of tekst zonder punt is geen nieuwere versie. `encode()` schrijft `LATEST`, zodat Fase 11 één getal ophoogt naast de nieuwe lezer.
- **De editor herlaadt de pagina** voor zo'n link: bij het openen, en als hij in een open tabblad landt (`hashchange`). Bij het openen gebeurt dat vóór het opslaan begint, dus de link blijft in de adresbalk staan.
- **Hooguit één keer per link per tabblad:** `sessionStorage` (`coachboard.reloaded`) houdt de link die het tabblad herlaadde. Kent de code de versie na het herladen nog niet, dan volgt de gewone melding voor een kapotte link, met je eigen bord of de standaardopstelling.
- **Zonder `sessionStorage`** (geblokkeerd) herlaadt de pagina niet en volgt meteen de melding. Zonder marker kan het herladen niet begrensd worden.
- Een kapotte link met een bekende versie herlaadt niet. Geen nieuwe teksten.

### Vóór en na

**Vóór** (`main` @ `dca85d9`), in Chromium en WebKit: een `#t=2.…`-link toonde direct de melding, bij het openen en in een open tabblad. De tests zijn eerst gecommit met `test.fail()` (`a6f7051`).

**Na** (`4e12339`): de pagina laadt twee keer (één herlaad) en toont dan de melding; je opgeslagen bord blijft staan. Een `#t=1.…`-link die kapot is, laadt één keer, zoals vóór.

Groottes, gzip zoals `npm run budget`:

| Bestand | Vóór | Na |
|---|--:|--:|
| `BoardEditor` (JS) | 9.400 B | 9.515 B |
| Alle JS in `_astro/` | 29.598 B | 29.713 B |

- `npm run budget`: JS van het bord 25,3 → 25,4 KB (budget 32,5 KB). Onder het budget voor alle JS blijft 2,8 KB vrij voor Fase 11.
- CSS en HTML veranderen niet.

### Tests

- Unit: 13 nieuwe in `format.test.ts` voor `isNewerLink()`; `npm run verify` geeft 101 → 114.
- E2e (`e2e/board.spec.ts`), geteld met het `load`-event van de pagina (WebKit meldt het eerste verzoek voor een pagina twee keer, dus verzoeken tellen klopt daar niet):
  - een link van een nieuwere versie herlaadt één keer en toont dan de melding; het opgeslagen bord verandert niet;
  - een open tabblad herlaadt als zo'n link in de adresbalk landt;
  - de bestaande test voor een kapotte link controleert dat een bekende versie niet herlaadt.
- Een echte `2.`-lezer bestaat nog niet, dus de tests laten de grens zien: na één herlaad stopt het. Dat een herlaad de nieuwe code haalt, volgt uit de headers: de HTML is `cache-control: public, max-age=0, must-revalidate` (productie, gemeten met `curl`), en de JS heeft een hash in de naam.
- `npm run e2e`: 349 → 353 geslaagd, 1 overgeslagen.

## Fase 11: linkformaat v2 (5 oktober 2026)

Branch `fase-11-linkformaat`. Het productplan (Fase 11) beschrijft wat v2 moet kunnen.

### Besluit 3: de limieten van de link (Kay, 5 oktober 2026)

- **Voorlopig 8 stappen en 100 tekens per zin.** Volgens de berekening van Fase 9 ("Linklengte en QR-grootte") is de grootste link dan ongeveer 1140 tekens: QR-versie 24 bij foutcorrectie L.
- **Definitief na de scantest (Kay, 7 oktober 2026): 8 stappen, 100 tekens per zin en een titel van 40, zoals nu.** `MAX_STEPS`, `MAX_TEXT`, `MAX_TITLE` en `QR_VERSION` (24) blijven gelijk. PR #28 was al gemerged vóór de scantest; de uitslag staat hieronder, in de PR `fase-11-scantest`.
- **Ook versie 30 scant, en toch gaat de limiet niet omhoog:**
  - verhogen breekt later geen links, verlagen na Fase 14 wel: dan kunnen trainers borden tot de limiet delen, en een lagere limiet weigert die links;
  - de ruimte tot versie 30 is marge voor drukke borden en oudere telefoons.

### Scantest (Kay)

De codes uit Fase 9 (lokaal in `scantest/scan/`), op het scherm van de eigen telefoon, met dezelfde instellingen als de QR-dialoog van het bord (foutcorrectie L, rand 2). Per code en afstand: scant hij binnen 3 tellen?

Toestel dat de codes toont: een Android-telefoon · Gescand met: een iPhone en een Android-telefoon. De modellen en versies zijn niet genoteerd.

| Code | QR-versie | Telefoon bij telefoon | 1 m | 2 m |
|---|--:|:-:|:-:|:-:|
| Nu (v1): 1 stap, 3 pijlen | 9 | ja | ja | ja |
| Oefening: 4 stappen, aanspeelpunten, pionnen, 2 ballen | 16 | ja | ja | ja |
| 4 stappen + tekst | 18 | ja | ja | ja |
| 8 stappen + tekst | 22 | ja | ja | ja |
| 8 stappen, zin ≤ 100 tekens | 24 | ja | ja | ja |
| 12 stappen + tekst | 26 | ja | ja | ja |
| 12 stappen, zin ≤ 100 tekens | 28 | ja | ja | ja |
| 12 stappen, zin ≤ 140 tekens | 30 | ja | ja | ja |
| **Grootste v2-bord binnen de limiet** (Fase 11, een echte link) | 24 | ja | ja | ja |

"ja": beide telefoons scanden de code binnen 3 tellen.

- **Alle negen codes scanden binnen 1 à 2 tellen,** met beide telefoons en op alle drie de afstanden. Tot en met versie 30 scant dus alles; groter is niet getest.
- Daarmee is besluit 3 definitief (zie hierboven).

- De nieuwe code staat lokaal in `scantest/scan/` en op de printpagina daar (`v24-v2-grootste.svg`).
- Hij vervangt de schatting uit Fase 9: hij is gemaakt met de echte `encode()` (zie "Het grootste bord binnen de limiet").

### Wat er veranderd is

- **Links zijn nu versie 2** (`2.…`). `encode()` schrijft alleen nog v2, en `decode()` leest v1 en v2.
  - De verpakking is gelijk aan v1: JSON → `deflate-raw` → base64url.
  - De opzet staat bovenaan `src/lib/board/format.ts`.
- **v1 blijft werken.** De v1-lezer is ongewijzigd. `toBoard()` zet wat hij leest om naar een v2-bord met dezelfde tekening: de pijlen houden hun eigen beginpunt, zonder speler.
  - `toBoard()` leest ook borden die vóór v2 bewaard zijn: in `localStorage` en via `#own=` (workers.dev).
  - Niet meer geldig: een v1-link met andere spelers in een latere stap, of met meer dan 8 stappen (besluiten Kay). Zulke links kunnen alleen met de hand gemaakt zijn; ze krijgen de melding voor een kapotte link.
- **Het model:**
  - één opstelling voor alle stappen;
  - een titel en een zin per stap;
  - ballen als lijst en pionnen per bord;
  - aanspeelpunten als derde team, zonder label;
  - blok, schot en stuit naast loop, pass en dribbel.
  - `isBoard()` eist in elke stap dezelfde spelers, met hetzelfde team en label.
- **Pijlen van een speler.** Een pijl die je vanaf een speler tekent, hoort bij die speler.
  - Hij begint waar die speler dan is: op zijn plek, of aan het eind van zijn vorige loop, dribbel of blok in die stap.
  - De link bewaart de speler in plaats van het beginpunt.
  - Sleep je de speler, dan gaat de pijl mee. Sleep je de hele pijl, dan laat hij de speler los. Laat je het beginpunt van een losse pijl los op een speler, dan hoort hij bij die speler.
- **Afwijking van het plan:** een pijl van een speler heeft geen beginhandvat meer.
  - Zijn begin is de speler, dus een sleep daar verplaatst de speler, ook direct na het tekenen.
  - Gevonden door de e2e-test: met handvat pakte je na het tekenen het handvat in plaats van de speler, en maakte je de pijl los.
  - Losmaken gaat door de hele pijl te slepen.
- **Schot en stuit:**
  - Een schot hoort altijd bij een speler en eindigt in het doel dat het dichtst bij de schutter is, links, in het midden of rechts (x = 90, 100 of 110). De link bewaart alleen de kant.
  - Een stuit is een pass. Het bord tekent het stuitpunt op 2/3 van de lijn.
- **Court tekent de nieuwe stukken**, ook op tactiekpagina's en in de OG-afbeeldingen:
  - aanspeelpunten blauw;
  - pionnen als rode driehoek;
  - blok met een dwarsstreep;
  - schot als dubbele lijn;
  - stuit als stippellijn met een open stuitpunt.
  - Kleuren: besluit Kay (5 oktober 2026), aanspeelpunt blauw en pion rood, uit drie varianten op een voorbeeldkaart.
- **Nog niet in de editor** (Fase 13 en 14):
  - nieuwe stukken en pijlsoorten maken: pionnen zijn er nog niet te kiezen;
  - stappen, titel en zinnen tonen. De editor bewerkt nog alleen stap 1 en laat de rest ongewijzigd.
  - Een speler toevoegen of verwijderen gebeurt wel in elke stap.
- **De tactieken** staan in v2-YAML (`v: 2`, `cones`, `balls`). Hun pagina's zijn gelijk op de `#t=`-link en de markeringen van Svelte na, en hun `og.png` is byte-gelijk.
- Geen nieuwe of gewijzigde teksten, geen nieuwe dependencies.

### De opzet van v2, gekozen op lengte

Met een eenmalig script (niet in de repo) op de borden van Fase 9: lengte van de hele link op `/nl/board/qr/`, met de QR-versie bij foutcorrectie L. Pijlen hebben hier al hun speler.

| Bord | C: spelers per stap volledig | A: opstelling één keer, posities als paren | **B: zoals A, posities, ballen en pionnen plat** | D: zoals A, teams en labels als twee lijsten |
|---|--:|--:|--:|--:|
| 1 stap, 3 pijlen (zoals T1) | 206 (v9) | 208 (v9) | **204 (v9)** | 215 (v9) |
| 4 stappen + tekst | 639 (v17) | 631 (v17) | **616 (v17)** | 635 (v17) |
| 8 stappen + tekst | 964 (v22) | 943 (v22) | **926 (v21)** | 946 (v22) |
| 12 stappen + tekst | 1267 (v25) | 1235 (v25) | **1211 (v25)** | 1239 (v25) |
| Oefening | 550 (v16) | 548 (v16) | **536 (v16)** | 548 (v16) |
| 8 stappen, zin = 100 | 1150 (v24) | 1138 (v24) | **1108 (v24)** | 1143 (v24) |

- **B is het kortst,** 1 tot 4% korter dan C, en het is wat `encode()` nu schrijft.
- Ook de opstelling plat maken (`[0,"LW",0,"LB",…]`) scheelde -6 tot +2 tekens. Dat is te weinig voor een lastiger formaat.
- **Ruimte voor A+:** een `-1` op de plek van een positiepaar kan later "deze speler staat in deze stap niet op het veld" betekenen. v2 weigert dat nu nog (er is een test voor), dus alle v2-links blijven geldig als A+ komt.

### Wat een speler per pijl kost

Dezelfde borden, opzet A:

| Bord | Zonder speler | Speler + beginpunt | **Speler in plaats van beginpunt** |
|---|--:|--:|--:|
| 1 stap, 3 pijlen | 212 (v9) | 215 (v9) | **208 (v9)** |
| 4 stappen + tekst | 648 (v18) | 662 (v18) | **631 (v17)** |
| 8 stappen + tekst | 984 (v22) | 1010 (v23) | **943 (v22)** |
| 12 stappen + tekst | 1310 (v26) | 1344 (v26) | **1235 (v25)** |
| Oefening | 552 (v16) | 560 (v16) | **548 (v16)** |
| 8 stappen, zin = 100 | 1176 (v25) | 1195 (v25) | **1138 (v24)** |

- **De speler in plaats van het beginpunt (besluit Kay) maakt links 1 tot 6% korter dan pijlen zonder speler.**
- Bij 8 stappen met zinnen van 100 tekens scheelt dat net een QR-versie (25 → 24).

### Lengte van de link, vóór en na

Tekens van de link zelf (`2.…`, zonder het adres ervoor):

| Bord | v1 | v2 | `/nl/board/qr/`, v1 → v2 |
|---|--:|--:|--:|
| Fixture `v1-empty` | 21 | 29 | 67 (v4) → 75 (v4) |
| Fixture `v1-default` (standaardopstelling) | 140 | 148 | 186 (v8) → 194 (v9) |
| Fixture `v1-full-lineup` | 204 | 210 | 250 (v10) → 256 (v10) |
| T1 (standaardopstelling, 2 lopen en een pass) | 158 | 165 | |
| Tactiek `en/6-0-defense-basics` | 197 | 199 | |
| Tactiek `en/fast-break-second-wave` | 202 | 209 | |
| Tactiek `nl/6-0-defense-basics` | 194 | 197 | |
| Tactiek `nl/fast-break-second-wave` | 201 | 207 | |

- **Een bord van één stap is in v2 2 tot 8 tekens langer:** titel, pionnen, zin en de ballen als lijst kosten samen een paar vaste tekens.
  - De standaardopstelling op `/qr/` gaat daardoor van QR-versie 8 naar 9.
  - In T1 levert de speler per pijl 1 teken op.
- **Vanaf twee stappen is v2 korter:** de opstelling staat er maar één keer in, en pijlen bewaren hun speler (zie de tabellen hierboven).
- De tactieken houden hun pijlen zonder speler, zodat hun tekening precies gelijk blijft.

### Het grootste bord binnen de limiet

`format.test.ts` bouwt dit bord uit de limieten (`MAX_STEPS`, `MAX_TEXT`, `MAX_TITLE`):
- de standaardopstelling;
- 8 stappen met elk een pass en 1 tot 3 lopen (elke derde gebogen), lopers die eindigen waar hun loop eindigt, en twee verdedigers die schuiven;
- een titel van 40 tekens en zinnen van precies 100 tekens, uit dezelfde woordenlijst als in Fase 9.

De test eist dat het past in QR-versie 24 (`QR_VERSION`).

| Link | Tekens | QR (L) |
|---|--:|--:|
| `/nl/board/qr/` | 1106 | versie 24, 113×113 |
| `/nl/board/link/` | 1108 | versie 24 |
| Hetzelfde bord zonder titel en zinnen | 494 | |

- **Ruimte per versie** (link op `/nl/board/qr/`): versie 22 tot 1003 tekens, 23 tot 1091, 24 tot 1171, 25 tot 1273, 26 tot 1367, 28 tot 1528. Het grootste bord heeft binnen versie 24 nog 65 tekens over.
- **Dit is het grootste bord zoals een trainer een aanval tekent, niet het meeste wat het formaat toelaat.** 30 pijlen per stap geeft een veel grotere code.
  - De editor tekent nu één stap, en die past ruim.
  - Als Fase 14 stappen toevoegt, moet het bord laten zien wanneer een bord niet meer in een bruikbare QR-code past.
  - De scantest geeft daarvoor de grens: tot en met versie 30 scanden beide telefoons alles.
- **Na de scantest blijven de limiet en `QR_VERSION` (24) gelijk** (besluit 3). Geen fixture zit op de limiet, dus ook een ruimere limiet later verandert geen fixture.

### Groottes

Gzip -9, vóór (`main` @ `50233af`) en na:

| Bestand | Vóór | Na |
|---|--:|--:|
| `BoardEditor` (JS) | 9.533 B | 10.868 B |
| Svelte-runtime (`client`) | 15.386 B | 15.386 B |
| QR-bibliotheek (lazy) | 4.337 B | 4.337 B |
| CSS van de site en van het bord | 1.691 + 1.433 B | gelijk |
| HTML `/en/board/` | 5.488 B | 5.498 B |
| HTML `/nl/board/` | 5.557 B | 5.565 B |
| Contentpagina's | | gelijk, op de `#t=`-link en de markeringen van Svelte na |

`npm run budget`:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 25,4 KB | 26,7 KB | 32,5 KB |
| Alle JS in `_astro/` | 29,7 KB | 31,1 KB | 32,5 KB |
| Lazy JS | 4,3 KB | 4,3 KB | 10,0 KB |

- **De editor wordt 1,3 KB groter:** de v2-lezer en -schrijver, `toBoard()`, `settle()`, de nieuwe stukken in Court en de pijlen van een speler.
- Dat zit binnen de schatting van 0,9 tot 1,7 KB uit het productplan.
- Onder het budget voor alle JS blijft 1,4 KB vrij. Fase 12a tot en met 14 moeten dus keuzes maken (besluit 8).

### Tests

- **`npm run verify`** groen na elke commit: 114 → 162 unittests, 23 pagina's, 300 interne links.
  - `format.test.ts`: v1-fixtures openen als v2-bord; v2-fixtures; elke soort pijl, titel, zinnen, pionnen, aanspeelpunten; 19 soorten kapotte v2-links; de grens van `isNewerLink()` (nu vanaf `3.`); het grootste bord in QR-versie 24.
  - `edit.test.ts`: pijlen van een speler (volgen, kettingen, loslaten, toewijzen, verwijderen), schoten, ballen als lijst, spelers in elke stap.
  - `Court.test.ts`: de nieuwe stukken en hun handvatten.
- **`npm run e2e`:** 353 → 367 geslaagd, 1 overgeslagen.
  - Nieuw: `e2e/arrows.spec.ts` (een pijl volgt zijn speler en zijn volgende pijl begint aan het eind; slepen maakt los, het beginpunt op een speler laten los geeft hem aan die speler).
  - Ook nieuw: een bord van vóór v2 in `localStorage` opent en wordt als v2 bewaard; een v1-link met andere spelers per stap geeft de melding; de drie v2-fixtures openen als link.
  - Aangepast: links in de adresbalk zijn `2.…`, de "nieuwere versie" is nu `3.`, en een pijl van een speler heeft 2 handvatten (`reach.spec.ts`).
- **Controle** (tijdelijk, niet gecommit): met een kapotte v1-lezer (teams verwisseld) falen 3 unittests en 4 e2e-tests (de v1-fixtures in beide browsers; de lege fixture heeft geen spelers).

### Meettaken

| Route | Vóór | Na |
|---|--:|--:|
| T1, eerste keer (en en nl) | 6 | **6** |
| T1 met eigen bord (en en nl) | 8 | **8** |

- `e2e/tasks.spec.ts` is groen in beide browsers, met hetzelfde budget. De gedeelde link is nu een v2-link; de check van de uitkomst decodeert hem.
- T2 en T3 hebben nog geen route: de stappen komen in Fase 14 en de pionnen in Fase 13. T4 raakt deze fase niet. ~~Seconden zijn geparkeerd.~~ Vervallen (besluit Kay, 8 oktober 2026).

### Lighthouse

Drie runs per URL met het commando uit de nulmeting, Lighthouse 13.5.0. Vóór: productie (`main` @ `50233af`). Na: de preview-URL van deze branch. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`; op productie 100.

| URL | Vóór: Performance | Vóór: LCP (runs) | Na: Performance | Na: LCP (runs) | CLS | TBT | Overdracht vóór → na |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` | 99, 100, 100 | 1,93 / 0,80 / 0,81 s | 100, 100, 100 | 0,81 / 0,82 / 0,82 s | 0 | 0 ms | 55,9 → 57,8 KB |
| `/en/board/` | 100, 100, 100 | 0,81 / 0,82 / 0,82 s | 100, 100, 100 | 0,83 / 0,81 / 0,81 s | 0 | 0 ms | 55,9 → 57,7 KB |
| `/nl/tactics/6-0-defense-basics/` | 100, 100, 100 | 0,82 / 0,83 / 0,81 s | 100, 100, 100 | 0,84 / 0,83 / 0,86 s | 0 | 0 ms | 8,7 → 8,9 KB |

- De eerste run vóór op `/nl/board/` (1,93 s) was een koude cache, zoals bij de vorige meting. De mediaan blijft 0,81 à 0,82 s.
- **Het bord is 1,8 KB zwaarder om over te dragen,** vooral door de grotere editor (+1,3 KB gzip). De rest heb ik niet uitgesplitst.
- Accessibility en Best Practices zijn 100 in elke run.

### Preview-URL

`https://fase-11-linkformaat-coachboard.hardamkay.workers.dev`

### Testronde Fase 11 (Kay, 5 oktober 2026)

Op de preview-URL, met de testlijst uit de PR. Test 7 op productie, na de merge.

| # | Test | Uitslag |
|--:|---|---|
| 1 | Een oude link openen, of "Open in het bord" op een tactiekpagina | werkt |
| 2 | De drie v2-testborden openen | werkt |
| 3 | Een loop van LO volgt LO; zijn pass begint aan het eind van de loop | werkt |
| 4 | De loop zelf slepen maakt hem los; zijn beginpunt op RO maakt hem van RO | werkt |
| 5 | T1 met de hand: 6 handelingen | werkt |
| 6 | De scantest | werkt: alle negen codes binnen 1 à 2 tellen (zie "Scantest") |
| 7 | Na de merge, op productie: het eigen opgeslagen bord staat er nog | werkt |

- **Besluit Kay:** akkoord met de afwijking. Een pijl van een speler heeft geen beginhandvat; losmaken gaat door de hele pijl te slepen.
- **Besluit Kay:** aanspeelpunt blauw (`#2563eb`), pion rood (`#dc2626`, rand `#7f1d1d`).
- De scancodes staan lokaal ook als PNG in `scantest/scan/`, voor het openen op Android: per code een kopie van het QR-scherm van het bord (telefoon in portret, code over 92% van de breedte, hele pixels per module, met de hint eronder).

## Fase 12a: nieuwe indeling van het bord (7 oktober 2026)

Branch `fase-12a-indeling`, vanaf `main` @ `4c6368b`. Het productplan (Fase 12a, besluit 5) beschrijft de opdracht.

### Wat er veranderd is

- **Staand volgt het canvas** (besluit 5). Een titelbalk vervangt de siteheader, met daarin:
  - Home;
  - de titel: tik om te wijzigen, Enter bewaart, Escape breekt af, hooguit 40 tekens. Zonder titel staat er "Titel toevoegen";
  - Ongedaan;
  - Delen, dat meteen deelt, zoals vóór;
  - Meer.
- **De actiebalk is weg.** Meer bevat, plat onder elkaar: QR-code, Heel/Half veld, Pijlen en bal wissen, Standaardopstelling en Leeg veld. Een tik op het veld of Escape sluit het menu.
- **Verwijderen verschijnt alleen bij een selectie.** Staand en breed staat het rechtsboven in het vak van het veld; op het halve veld valt het in de lege strook boven het veld. Liggend staat het onder het rechterpaneel. Het veld verspringt niet en wordt niet bedekt.
- **Liggend: L-B** (keuze Kay uit drie varianten in schermafbeeldingen).
  - Links het gereedschap met de labels ernaast.
  - Rechts de titel, Ongedaan, Delen en Meer met tekst, en daaronder een vaste plek voor Verwijderen.
  - Elke knop blijft minstens 44 px hoog.
- **Breed: B-A** (keuze Kay). Vanaf 860 px breed en 560 px hoog staat de titelbalk over de volle breedte, met links het gereedschap als kolom. Rechts blijft een kolom vrij voor de stappen (Fase 14).
- **Aanpassingen van Kay bij de keuze:**
  - liggend staat Verwijderen in het rechterpaneel, zodat het nooit een hoekspeler bedekt;
  - op een smal scherm toont de titelbalk alleen het potlood, als er bijna niets van de titel past. Op 320 px is er 18 px voor tekst, op 360 px 58 px; de grens ligt op 60 px (`@container`).
- **De siteheader** staat niet meer op de bordpagina's. De fallback heeft een statische titelbalk met de Home-link, ook zonder JavaScript.
- **Nieuwe teksten** (akkoord Kay): Meer/More, Titel wijzigen/Edit title, Titel toevoegen/Add title. De korte labels van de actiebalk (`board.*Short`, `board.clear`) zijn vervallen.
- Geen nieuwe dependencies. `format.ts` verandert niet: de titel zat al in v2.

### De varianten

Schermafbeeldingen van drie varianten voor liggend en drie voor breed, gemaakt als extra CSS over de echte editor (de variantcode staat niet in de repo). Ze staan op een privé-pagina van Kay.

| Variant | Halve veld, iPhone SE liggend | iPhone 15 liggend | Laptop 1280×720 |
|---|--:|--:|--:|
| L-A (optie B bijgewerkt) | 281 px | 302 px | |
| **L-B (zijpanelen met titel)** | **263 px** | **302 px** | |
| L-C (titelbalk boven) | 229 px | 250 px; een tool valt buiten beeld | |
| Nu (staande indeling, 720 px breed) | | | 478 px |
| **B-A (tools links, rechts vrij)** | | | **573 px** |
| B-B (als B-A, Meer als knoppen) | | | 573 px |
| B-C (als B-A, met siteheader) | | | 514 px |

### Layout vóór en na

Playwright tegen `wrangler dev`, `/nl/board/`. Het veld is de `rect` van het speelveld. "Knoppen" betekent: elke knop helemaal in beeld. "Kleinste" is de kleinste knop (b×h).

| Viewport | Veld | Veld op scherm (px) | px/dm | Knoppen | Kleinste |
|---|---|--:|--:|:-:|--:|
| iPhone SE staand 320×568 | half | 282×282 → 282×282 | 1,41 → 1,41 | ja → ja | 40×48 → 40×48 |
| iPhone SE staand 320×568 | heel | 177×354 → 208×415 | 0,89 → 1,04 | ja → ja | 40×48 → 40×48 |
| iPhone SE liggend 568×320 | half | 281×281 → 263×263 | 1,41 → 1,31 | ja → ja | 64×44 → 118×44 |
| iPhone SE liggend 568×320 | heel | 146×292 → 146×292 | 0,73 → 0,73 | ja → ja | 64×44 → 118×44 |
| iPhone 15 staand 393×659 | half | 349×349 → 349×349 | 1,75 → 1,75 | ja → ja | 50×48 → 44×44 |
| iPhone 15 staand 393×659 | heel | 220×439 → 250×500 | 1,10 → 1,25 | ja → ja | 50×48 → 44×44 |
| iPhone 15 liggend 734×343 | half | 302×302 → 302×302 | 1,51 → 1,51 | ja → ja | 64×46 → 118×46 |
| iPhone 15 liggend 734×343 | heel | 156×313 → 156×313 | 0,78 → 0,78 | ja → ja | 64×46 → 118×46 |
| Pixel 7 staand 412×839 | half | 367×367 → 367×367 | 1,83 → 1,83 | ja → ja | 53×48 → 44×44 |
| Pixel 7 staand 412×839 | heel | 304×608 → 334×668 | 1,52 → 1,67 | ja → ja | 53×48 → 44×44 |
| Pixel 7 liggend 863×360 | half | 317×317 → 317×317 | 1,59 → 1,59 | ja → ja | 64×47 → 118×49 |
| Pixel 7 liggend 863×360 | heel | 164×329 → 164×329 | 0,82 → 0,82 | ja → ja | 64×47 → 118×49 |
| iPad staand 820×1180 | half | 652×652 → 652×652 | 3,26 → 3,26 | ja → ja | 97×48 → 44×44 |
| iPad staand 820×1180 | heel | 463×926 → 494×987 | 2,32 → 2,47 | ja → ja | 97×48 → 44×44 |
| iPad liggend 1180×820 | half | 568×568 → 663×663 | 2,84 → 3,32 | ja → ja | 97×48 → 44×44 |
| iPad liggend 1180×820 | heel | 295×590 → 344×688 | 1,47 → 1,72 | ja → ja | 97×48 → 44×44 |
| Laptop 1280×720 | half | 478×478 → 573×573 | 2,39 → 2,86 | ja → ja | 97×48 → 44×44 |
| Laptop 1280×720 | heel | 248×496 → 297×594 | 1,24 → 1,49 | ja → ja | 97×48 → 44×44 |

- **Staand:**
  - het halve veld blijft even groot; het is door de breedte begrensd en staat nu lager. De vrije strook erboven en eronder is voor de stappenbalk en de uitleg (Fase 14);
  - het hele veld wordt op telefoons 10 tot 18% groter, op een iPad 7%.
- **Liggend:** op de iPhone SE wordt het halve veld 6% kleiner, door de bredere panelen. Op de andere telefoons blijft het gelijk.
- **Breed:** het veld wordt 17 tot 20% groter.
- **De kleinste knop** is staand nu 44×44: de iconen in de titelbalk. Op de iPhone SE staand blijven de tools 40 px breed, zoals vóór.
- **Het veld verspringt niet** als de editor laadt: hooguit 1 px, staand, liggend en breed (`e2e/layout.spec.ts`).

### Groottes

Gzip -9, vóór (`main` @ `4c6368b`) en na:

| Bestand | Vóór | Na |
|---|--:|--:|
| `BoardEditor` (JS) | 10.853 B | 11.115 B |
| Svelte-runtime (`client`) | 15.374 B | 15.613 B |
| CSS van de site (`BaseLayout`) | 1.668 B | 1.658 B |
| CSS van het bord (`BoardPage`) | 1.412 B | 2.183 B |
| HTML `/nl/board/` | 5.577 B | 5.487 B |
| HTML `/en/board/` | 5.506 B | 5.421 B |

`npm run budget`:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 26,7 KB | 27,2 KB | 32,5 KB |
| Alle JS in `_astro/` | 31,1 KB | 31,6 KB | 32,5 KB |
| CSS bordpagina | 3,1 KB | 3,8 KB | 3,3 → **4,0 KB** (`boardCss`) |
| CSS contentpagina | 1,7 KB | 1,7 KB | 2,0 KB |
| HTML `/nl/board/` | 5,6 KB | 5,5 KB | 6,5 KB |

- **JS +0,5 KB** (schatting in het plan: +0,35 tot 0,65 KB):
  - de editor +0,26 KB (titelbalk, titel wijzigen, Meer, Verwijderen bij een selectie);
  - de Svelte-runtime +0,24 KB, voor de nieuwe sjabloononderdelen (`use:`, `class:`).
  - Onder het budget voor alle JS blijft 0,95 KB vrij (besluit 8).
- **CSS +0,77 KB:** de titelbalk, het menu, de pil, en de liggende en brede indeling. `boardCss` gaat van 3,3 naar 4,0 KB: de meting plus 0,2 KB (akkoord Kay).
- **HTML −0,1 KB:** de siteheader staat niet meer op de bordpagina's (−0,2 KB). De fallback heeft er een titel bij (+0,1 KB, zie Lighthouse).
- Interne links: 300 → 290 (de siteheader op de zes bordpagina's).

### Tests

- `npm run verify` groen: 162 → 167 unittests (`setTitle()` in `edit.test.ts`), 23 pagina's, 290 interne links.
- `npm run e2e`: 367 → 396 geslaagd; overgeslagen 1 → 2 (de LCP-test draait alleen in Chromium: WebKit kent geen LCP-metingen).
  - `e2e/layout.spec.ts`:
    - alles in beeld en minstens 44 px hoog, staand, liggend en breed;
    - geen siteheader, de Home-link in beeld;
    - Meer opent in beeld;
    - Verwijderen alleen bij een selectie, zonder dat het veld verspringt of bedekt wordt;
    - geen label afgekapt (nl en en);
    - een lange titel krijgt een ellips;
    - op 320 px alleen het potlood.
  - `e2e/board.spec.ts`: de titel wijzigen, in de link en na herladen; Ongedaan; Escape; hooguit 40 tekens.
  - Aangepast: QR-code, Heel veld en Standaardopstelling via Meer (`share`, `security`, `reach`, `tasks`).
  - `e2e/reach.spec.ts` draait nu op 393×659 in beide browsers. Op de Pixel 7 is het hele veld groter geworden, en daar valt 21 px naast een speler binnen het getekende tikvlak.

### Meettaken

| Route | Vóór | Na |
|---|--:|--:|
| T1, eerste keer (en en nl) | 6 | **6** |
| T1 met eigen bord (en en nl) | 8 (Wissen → Standaardopstelling) | **8** (Meer → Standaardopstelling) |

- `TAP_BUDGET` blijft 6 en 8.
- **Seconden:** vóór 10–15 s op productie (zie "UX-metingen"). ~~Na: Kay op de preview-URL, op dezelfde manier: van de eerste tik op het bord tot de link verstuurd is in WhatsApp, drie keer per toestel.~~ Vervallen (besluit Kay, 8 oktober 2026): geen seconden. **Risico:** Delen staat nu rechtsboven in plaats van in de onderbalk, verder van de duim.

### Lighthouse

Vóór: productie (`main` @ `4c6368b`), drie runs per URL met het commando uit de nulmeting, Lighthouse 13.5.0.

| URL | Performance | Accessibility | Best Practices | SEO | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` | 100 | 100 | 100 | 100 | 0,82 / 0,82 / 0,80 s | 0 | 0 ms | 57,5 KB |
| `/en/board/` | 100 | 100 | 100 | 100 | 0,80 / 0,80 / 0,80 s | 0 | 0 ms | 57,5 KB |

**Na:** de preview-URL van deze branch, op dezelfde manier. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`.

| URL | Performance | Accessibility | Best Practices | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` | 100 | 100 | 100 | 0,96 / 0,81 / 0,86 s | 0 | 0 ms | 59,3 KB |
| `/en/board/` | 100 | 100 | 100 | 0,81 / 0,82 / 0,82 s | 0 | 0 ms | 59,2 KB |

**Gevonden en opgelost: de LCP wachtte op de JS.**

- Vóór was het LCP-element het logo in de siteheader, dat met de HTML verschijnt. Zonder siteheader werd het de tekst "Titel toevoegen" in de titelbalk van de editor, die pas met de JS komt.
- De eerste meting op de preview gaf:
  - gesimuleerd: LCP 1,89 tot 2,02 s, Performance 98 tot 100;
  - met echte vertraging (`--throttling-method=devtools`): FCP 1,29 s en LCP 2,54 s. Dat is boven de grens van 2,5 s. Productie, op dezelfde manier: 1,30 s, gelijk aan de FCP.
- **De oplossing:** de titelbalk van de fallback toont dezelfde tekst, even groot. Die verschijnt met de HTML, en de editor maakt hem niet groter.
- **Na de oplossing,** met echte vertraging: `/nl/board/` FCP = LCP = 1,29 s, `/en/board/` 1,32 s, telkens op de tekst van de fallback.
- **Test:** `e2e/layout.spec.ts` houdt de scripts vast en eist dat de LCP op de fallback blijft (alleen in Chromium). Zonder de oplossing faalt hij.
- **Blijft over:** heeft het bord een titel die breder is dan "Titel toevoegen", dan wordt die titel een latere LCP. Dat geldt voor een eigen bord met titel, of een gedeelde link met titel. Zulke borden komen er pas veel bij Fase 14; de kijkmodus (Fase 15) krijgt eigen pagina's. Volg het met de Core Web Vitals van echte bezoekers (Fase 8b).

### Preview-URL

`https://fase-12a-indeling-coachboard.hardamkay.workers.dev`


## Fase 12b-1: metingen en T4-nulmeting (8 oktober 2026)

Branch `fase-12b1-metingen`, vanaf `main` @ `fb73f11`. Eerste van drie PR's voor Fase 12b (Mijn borden). De app verandert niet.

- **Seconden en de stopwatch** zijn overal doorgehaald waar ze nog als open punt stonden (besluit Kay, 8 oktober 2026). Gemeten getallen blijven staan.
- **T4** heeft een route: 11 handelingen met links naar jezelf (zie "UX-metingen").
- `e2e/helpers.ts`: `stubBeacon()` vangt de beacon af in een context die een test zelf maakt, zoals de laptop van T4.
- **Groottes:** gelijk, `npm run budget` geeft dezelfde tabel als na Fase 12a.
- **Tests:**
  - `npm run verify` groen, zoals vóór;
  - `npm run e2e`: 396 → 400 geslaagd, 2 overgeslagen. Dat zijn de twee T4-routes (en, nl), elk in twee browsers.


## Fase 12b-2: Mijn borden (8 oktober 2026)

Branch `fase-12b-mijn-borden`, vanaf `main` @ `ceb3fe0`. Indeling, teksten en budgetten volgens de besluiten van Kay (B1 tot en met B9, productplan Fase 12b).

### Wat er veranderd is

- **Meer** begint met Mijn borden en Nieuw bord. Liggend staat Meer in twee kolommen: zeven items passen niet op 320 px hoog.
- **Mijn borden:**
  - rijen met een kleine tekening, de titel en de datum; mappen eerst;
  - per bord: Dupliceren (met " (kopie)"), de map, Nieuwe map, en onderaan Verwijderen, met Ongedaan maken in de melding;
  - liggend staat Nieuw bord in de kop, breed is het een paneel rechts.
- **Opslaan** gebeurt pas bij de eerste echte wijziging: de link verschilt van het bord zoals het geopend werd. Het eerste bezoek bewaart dus niets meer.
- **Herladen** opent je eigen bord via het nummer in de geschiedenis van het tabblad (`history.state`), niet via de link.
- **Overzetten:** het oude bord (`coachboard.board`) wordt één keer het eerste bord, behalve een onaangeroerde standaardopstelling.
- **Gevonden met de T4-route:** wie binnen 300 ms na een wijziging Nieuw bord koos, verloor die wijziging. Een ander bord openen bewaart nu eerst het bord dat je verlaat.
- **Privacypagina:** de tekst van Kay (B8).

### Groottes

`npm run budget`, vóór (`main` @ `ceb3fe0`) en na:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 27,2 KB | 30,2 KB | 32,5 KB |
| Alle JS in `_astro/` | 31,6 KB | 34,5 KB | 32,5 → **34,7 KB** |
| Later geladen JS (QR-code) | 4,3 KB | 4,3 KB | 10,0 KB |
| CSS bordpagina | 3,8 KB | 4,6 KB | 4,0 → **4,85 KB** |
| HTML `/nl/board/` | 5,5 KB | 5,7 KB | 6,5 KB |

- **Alle JS +2,94 KB** (B1: de meting + 0,2 KB). Het plan schatte +1,6 tot 1,9 KB; het prototype kostte +1,57 KB. Wat de echte code meer kost:
  - herladen met het nummer in `history.state`, en de terugval als dat nummer weg is;
  - het verlaten bord eerst bewaren;
  - de invoer voor een nieuwe map of een nieuwe naam, met Escape;
  - Ongedaan maken na Verwijderen (0,1 KB) en de lege lijst.
- Apart gemeten, door het onderdeel tijdelijk weg te laten:
  - mapjes 0,44 KB;
  - de controle op een onaangeroerde standaardopstelling 0,37 KB, met de standaardopstelling uit `defaults.ts`. Met alleen de posities is het 0,18 KB.
- ~~**Gevolg voor 12b-3:** het plan schat daar +0,9 KB. Dan komt alle JS op ongeveer 35,4 KB, boven de bovengrens van 35,0 KB (B1).~~ Vervallen: na "JS besparen vóór 12b-3" (hieronder) komt 12b-3 op 33,7 tot 34,3 KB.
- **CSS +0,8 KB:** het scherm Mijn borden, staand, liggend en breed, en het menu in twee kolommen.
- **Opslag:** 100 borden zijn 75 KB (standaardopstelling) tot 280 KB (een aanval van vier stappen) in localStorage. Dat is ruim binnen de ongeveer 5 MB die een browser geeft.

### Tests

- `npm run verify` groen: 167 → 194 unittests (`boards.test.ts`).
- `npm run e2e`: 400 → 448 geslaagd, 2 overgeslagen.
  - `e2e/boards.spec.ts`:
    - opslaan pas na een echte wijziging;
    - een bewerkte link maakt een nieuw bord;
    - overzetten één keer, zonder onaangeroerde standaardopstelling;
    - herladen na je eigen bord, een tactiek, een gedeelde link, zonder nummer, en na een geplakte link met Terug;
    - twee tabbladen;
    - nieuw, openen, dupliceren, verwijderen met Ongedaan maken;
    - mappen.
  - **Controles** (tijdelijk, niet gecommit):
    - laat elk tabblad zijn eigen, oude lijst wegschrijven, dan faalt de test met twee tabbladen (unittest en e2e);
    - zonder het wegschrijven bij het overzetten falen de twee unittests daarvoor.
  - `e2e/layout.spec.ts`: Mijn borden in beide talen, staand, liggend en breed. Alles in beeld, minstens 44 px hoog en niets afgekapt. Liggend staat Nieuw bord in de kop. Meer liggend toont alle zeven items.
  - `e2e/a11y.spec.ts`: axe met Mijn borden en het menu van een bord open, nl en en.
  - Aangepast: de tests die de oude sleutel lazen (`board`, `move`, `tactics`, `analytics`, `layout`).

### Lighthouse

Vóór: productie (`main` @ `ceb3fe0`). Na: de preview-URL. Drie runs per URL, Lighthouse 13.5.0. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`.

| URL | Performance | Accessibility | Best Practices | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` vóór | 100 | 100 | 100 | 0,83 / 0,83 / 0,81 s | 0 | 0 ms | 58,9 KB |
| `/nl/board/` na | 100 | 100 | 100 | 0,91 / 0,80 / 0,81 s | 0 | 0–12 ms | 63,5 KB |
| `/en/board/` vóór | 100 | 100 | 100 | 0,80 / 0,82 / 0,81 s | 0 | 0 ms | 58,8 KB |
| `/en/board/` na | 100 | 100 | 100 | 0,87 / 0,83 / 0,82 s | 0 | 0 ms | 63,5 KB |

### Preview-URL

`https://fase-12b-mijn-borden-coachboard.hardamkay.workers.dev`

## JS besparen vóór 12b-3 (9 oktober 2026)

Branch `fase-12b-js-besparen`, vanaf `main` @ `e6d7d4f`. Na 12b-2 kwam 12b-3 geschat op 35,4 KB alle JS, boven de bovengrens van 35,0 KB (B1). Deze PR bespaart eerst, zonder iets aan het gedrag te veranderen: geen nieuwe teksten, geen andere indeling, dezelfde QR-code.

### Wat er veranderd is

Elke besparing is apart gemeten door alleen die ene weg te laten uit het geheel:

| Besparing | Bestanden | Alle JS |
|---|---|--:|
| De JS van het bord in één bestand: de Svelte-runtime, de Svelte-renderer van Astro en de editor waren drie chunks, met import- en exportlijsten ertussen. In één chunk kort de minifier ook de namen ertussen in. | `astro.config.mjs` (`codeSplitting.groups`, alleen de client-build) | −0,87 KB |
| Alleen de iconen van het bord: de editor importeerde de hele set, met de iconen van de categorieën en de homepage. Een bundel houdt elke sleutel van een object dat hij importeert. Nu `boardIcons`; `icons` neemt die over voor `Icon.astro`. | `src/lib/icons.ts` | −0,36 KB |
| Van de QR-bibliotheek (`uqr`) alleen `renderSVG`: `import("uqr")` hield ook de tekstrenderers. Nu via `src/lib/board/qr.ts`. | `src/lib/board/qr.ts` | −0,30 KB |
| Svelte schrijft geen versiemerk meer (`window.__svelte`). | `svelte.config.js` (`discloseVersion: false`) | −0,02 KB |

- De groep in `astro.config.mjs` noemt zelf wat erin mag. Zonder die afbakening ging ook het inline redirectscript van `board.astro` naar een bestand; nu blijft het inline en blijft de QR-code later laden.
- Er komen twee doorgeefbestanden van 76 B bij (`BoardEditor.*.js` en `client.svelte.*.js`, voor `component-url` en `renderer-url`). Die zitten in de −0,87 KB.
- **Geprobeerd en niet gedaan:**
  - Terser als minifier: +0,14 KB, slechter dan de minifier van Vite;
  - een eigen QR-encoder in plaats van `uqr`: geschat −2 KB later geladen JS, maar nieuwe code voor iets dat werkt;
  - code in `BoardEditor.svelte` en `Court.svelte` herschrijven: weinig winst per stuk, en wel kans op ander gedrag.

### Groottes

`npm run budget`, vóór (`main` @ `e6d7d4f`) en na:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 30,2 KB | 28,9 KB | 32,5 KB |
| Alle JS in `_astro/` | 34,5 KB (34.492 B) | 32,9 KB (32.931 B) | 34,7 → **33,15 KB** |
| Later geladen JS (QR-code) | 4,3 KB | 4,0 KB | 10,0 KB |

- **Budget omlaag** (besluit Kay, 9 oktober 2026, volgens B1: de meting + 0,2 KB), zodat de besparing vast staat en 12b-3 laat zien wat het kost.

### Wat 12b-3 kost (prototype)

Gemeten in een kopie van het project, bovenop de besparingen:

| Onderdeel | Alle JS |
|---|--:|
| `persist()` in de webapp | +0,06 KB |
| Link openen in Mijn borden | +0,22 KB |
| Export en import als links | +0,45 KB |
| Samen | +0,74 KB → 33,7 KB |

- In 12b-2 kostte de echte code 1,9 keer het prototype. Met die marge komt 12b-3 op 33,7 tot 34,3 KB, onder de 35,0 KB.
- **Besluit Kay (9 oktober 2026):** Link openen en `persist()` zijn vooral voor de webapp. Ze komen met de beginschermtip mee, na test 6 en 7 van Fase 9, en niet in 12b-3. 12b-3 houdt export en import, en T4 met Mijn borden. Dan komt alle JS na 12b-3 op ongeveer 33,4 tot 33,8 KB (+0,45 KB, of 1,9 keer dat).

### Tests

- `npm run verify` groen: 194 unittests, budget OK.
- `npm run e2e`: 448 geslaagd, 2 overgeslagen, zoals vóór. Daarin onder meer de QR-code (gelijk aan `renderSVG` van `uqr`, ook offline), het tapbudget, de redirect van workers.dev en de CSP.
- De gebouwde HTML is gelijk aan die van `main`, op de bestandsnamen van de chunks en de `uid` van `<astro-island>` na.

### Lighthouse

Vóór: productie (`main` @ `e6d7d4f`). Na: de preview-URL. Drie runs per URL, Lighthouse 13.5.0, mobiel. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`; op productie 100.

| URL | Performance | Accessibility | Best Practices | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` vóór | 100 | 100 | 100 | 0,83 / 0,81 / 0,80 s | 0 | 0 ms | 63,1 KB |
| `/nl/board/` na | 100 | 100 | 100 | 0,91 / 0,80 / 0,81 s | 0 | 0 ms | 61,9 KB |
| `/en/board/` vóór | 100 | 100 | 100 | 0,80 / 0,81 / 0,81 s | 0 | 0 ms | 63,1 KB |
| `/en/board/` na | 100 | 100 | 100 | 0,82 / 0,85 / 0,81 s | 0 | 0 ms | 61,8 KB |

- De overdracht daalt 1,2 tot 1,3 KB. Daarin zit ook de QR-code, die laadt zodra het bord klaar is. De overdracht is met de compressie van Cloudflare en met headers, dus niet gelijk aan de gzip-getallen hierboven; de twee doorgeefbestanden kosten elk een eigen verzoek met headers.
- LCP blijft gelijk (mediaan 0,81 s vóór en na). De ene run van 0,91 s zag 12b-2 ook op zijn preview: één trage eerste run.

### Preview-URL

`https://fase-12b-js-besparen-coachboard.hardamkay.workers.dev`

## Fase 12b-3: exporteren en importeren (9 oktober 2026)

Branch `fase-12b3-verhuizen`, vanaf `main` @ `8267b7f`. Plek, teksten en gedrag volgens de besluiten van Kay: B10 (onderaan de lijst, [schermafbeeldingen](https://claude.ai/artifact/Cmw1AbXgPqGbs56PgT81Yu)), B13 (de volledige URL in het bestand), dubbele borden overslaan, en de tekst als opslaan niet lukt (9 oktober 2026).

### Wat er veranderd is

- **Mijn borden**, onderaan de lijst: de uitleg, Alle borden exporteren en Borden importeren. Exporteren staat er alleen als er borden zijn.
- **Het bestand:** per bord de link (`https://…/board/#t=2.…`), de map en de datum. Een export blijft altijd te importeren (`fixtures/export/export-1.json`).
- **Exporteren** bewaart eerst het bord op het veld als dat nog op zijn opslag (300 ms) wacht: onder zijn eigen nummer, zonder kopie.
- De download (een `blob:`-URL) blijft 40 seconden geldig, zoals in FileSaver.js: Safari op de iPhone vraagt eerst of je wilt downloaden.
- **Importeren** voegt alleen toe, met de map en de datum uit het bestand. Een bord dat er al staat, in welke map ook, wordt overgeslagen. `sameBoard()` vergelijkt de borden, niet de tekst van de link.
- **Privacypagina:** ", als link of als bestand" achter de laatste zin van "Het bord" (B8).

### Groottes

`npm run budget`, vóór (`main` @ `8267b7f`) en na:

| Meting | Vóór | Na | Budget |
|---|--:|--:|--:|
| JS van het bord | 28,9 KB | 29,6 KB | 32,5 KB |
| Alle JS in `_astro/` | 32,9 KB (32.931 B) | 33,6 KB (33.640 B) | 33,15 → **33,85 KB** |
| Later geladen JS (QR-code) | 4,0 KB | 4,0 KB | 10,0 KB |
| CSS bordpagina | 4,65 KB | 4,78 KB | 4,85 → **4,98 KB** |
| HTML `/nl/board/` | 5,69 KB | 5,90 KB | 6,5 KB |
| HTML `/en/board/` | 5,62 KB | 5,81 KB | 6,5 KB |

- **Budgetten** volgens B1: de meting + 0,2 KB.
- **Per functie,** gemeten door het onderdeel tijdelijk weg te laten uit het geheel (alle JS):

  | Onderdeel | Alle JS |
  |---|--:|
  | Exporteren, met eerst bewaren | +0,29 KB |
  | Importeren, met de meldingen | +0,47 KB |
  | waarvan: dubbele borden overslaan (`sameBoard()`) | +0,04 KB |
  | Samen, vergeleken met `main` | +0,71 KB |

  Het plan schatte +0,67 tot 0,76 KB. Alles laadt meteen (B2).
- **HTML +0,2 KB:** de nieuwe teksten gaan als prop mee.

### T4 met export en import

Twee toestellen in één test (`e2e/tasks.spec.ts`), elk met een eigen, lege opslag. Dezelfde drie borden als de route met links. Telt niet: het bord openen, de download, het bestand naar de telefoon sturen, het bestand kiezen in het venster van de telefoon.

| # | Toestel | Handeling |
|--:|---|---|
| 1 | laptop | Tik "Run" |
| 2 | laptop | Sleep een looppijl vanaf LB |
| 3–4 | laptop | Meer → Nieuw bord |
| 5 | laptop | Sleep vanaf CB |
| 6–7 | laptop | Meer → Nieuw bord |
| 8 | laptop | Sleep vanaf RB |
| 9–11 | laptop | Meer → Mijn borden → Alle borden exporteren |
| 12–14 | telefoon | Meer → Mijn borden → Borden importeren ("3 borden toegevoegd.") |
| 15 | telefoon | Tik bord 1 |
| 16–18 | telefoon | Meer → Mijn borden → bord 2 |
| 19–21 | telefoon | Meer → Mijn borden → bord 3 |

| Route | `/en/` | `/nl/` |
|---|--:|--:|
| T4 met links naar jezelf | 11 | 11 |
| T4 met export en import, tot de borden in Mijn borden staan | 14 | 14 |
| T4 met export en import, tot elk bord op het veld stond | **21** | **21** |
| T1 / T1 met eigen bord | 6 / 8 | 6 / 8 |

- De links blijven de kortste route. Met export en import staan de borden daarna wel blijvend in Mijn borden op de telefoon.
- `TAP_BUDGET` krijgt "T4 with export and import": 21. Het doel kiest Kay (B6).
- **Controle** (tijdelijk, niet gecommit): met het budget op 20 en op 22 faalt de test ("Expected: 20, Received: 21" en "Expected: 22, Received: 21").

### Tests

- `npm run verify` groen: 194 → 206 unittests (`boards.test.ts`, `format.test.ts`).
- `npm run e2e`: 448 → 478 geslaagd, 2 overgeslagen.
  - `e2e/boards.spec.ts`: exporteren binnen 300 ms na een wijziging (met een stilgezette klok), importeren met map en datum, dubbele borden, de meldingen, herladen na import, en geen Exporteren zonder borden.
  - `e2e/tasks.spec.ts`: de T4-route hierboven, in en en nl, iPhone en Android.
  - `e2e/layout.spec.ts`: de knoppen staand, liggend en breed, minstens 44 px hoog en niet afgekapt; ook de lege lijst. Op de iPhone staand staat Importeren met drie borden al onder de rand: op een telefoon scroll je ernaar, breed staat alles in beeld.
  - `e2e/a11y.spec.ts`: axe op de lege lijst, nl en en.
  - `e2e/security.spec.ts`: geen CSP-melding bij exporteren (een download van een `blob:`-URL) en importeren, nl en en.
  - **Controle** (tijdelijk, niet gecommit): zonder het bewaren vooraf faalt de test van de 300 ms.


### Lighthouse

Vóór: productie (`main` @ `8267b7f`). Na: de preview-URL. Drie runs per URL, Lighthouse 13.5.0, mobiel. SEO is 66 op elke preview-URL, door `X-Robots-Tag: noindex`; op productie 100.

| URL | Performance | Accessibility | Best Practices | LCP (runs) | CLS | TBT | Overdracht |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/nl/board/` vóór | 100 | 100 | 100 | 0,80 / 0,80 / 0,85 s | 0 | 0 ms | 61,4 KB |
| `/nl/board/` na | 100 | 100 | 100 | 0,89 / 0,81 / 0,81 s | 0 | 0 ms | 62,9 KB |
| `/en/board/` vóór | 100 | 100 | 100 | 0,80 / 0,82 / 0,81 s | 0 | 0 ms | 61,3 KB |
| `/en/board/` na | 100 | 100 | 100 | 0,84 / 0,80 / 0,86 s | 0 | 0 ms | 62,9 KB |

- De overdracht stijgt 1,5 KB: de JS, de CSS en de teksten in de HTML. LCP blijft gelijk (mediaan 0,81 s vóór en na); de trage eerste run zagen 12b-2 en de besparing ook op hun preview.

### Preview-URL

`https://fase-12b3-verhuizen-coachboard.hardamkay.workers.dev`

De telefoontests 8 tot en met 10 staan onder "Geparkeerd" in de testlijst voor de telefoon.

## Fase 13-1: T3-nulmeting (9 oktober 2026)

Branch `fase-13-sneller-tekenen`, vanaf `main` @ `a83509d`. Eerste PR van Fase 13 (sneller tekenen). De app verandert niet.

### T3, de definitie

"Zet de oefening Kruisen in tweetallen neer: twee rijen, een keeper, twee pionnen, een bal en de kruising." (besluit Kay, 9 oktober 2026: T3 telt de keeper mee.)

- Half veld. Twee rijen van drie aanvallers zonder label, een keeper, twee pionnen, één bal bij de eerste van de linker rij.
- De kruising: een loop van de eerste links, een loop van de eerste rechts erachterlangs, een pass van links naar rechts.
- Telt vanaf het bord zoals het opent; met een eigen bord eerst Meer → Nieuw bord. Telt niet: het bord openen, het deelvenster van de telefoon.
- De test controleert de stukken en de soorten pijlen (en van wie ze zijn), niet de plekken.
- Op `main` heeft het bord nog geen pionnen en geen keeper als eigen stuk: de pionnen en de keeper zijn dekkers.

### De route

| # | Handeling (nl / en) |
|--:|---|
| 1–2 | Meer → Leeg veld (More → Empty court) |
| 3 | Tik "Aanval" (Attack) |
| 4–9 | Zes tikken op het veld: twee rijen van drie |
| 10 | Tik "Dekker" (Defend) |
| 11–12 | Twee tikken: de pionnen |
| 13 | Eén tik bij het doel: de keeper |
| 14 | Tik "Bal" (Ball) |
| 15 | Eén tik naast de eerste van de linker rij |
| 16 | Tik "Loop" (Run) |
| 17 | Sleep een looppijl vanaf de eerste links |
| 18 | Sleep een looppijl vanaf de eerste rechts, erachterlangs |
| 19 | Tik "Pass" |
| 20 | Sleep een pass van de eerste links naar de eerste rechts |
| 21 | Tik "Delen" (Share) |

| Route | `/en/` | `/nl/` |
|---|--:|--:|
| T3 | **21** | **21** |
| T3 met eigen bord (Meer → Nieuw bord ervoor) | **23** | **23** |

- **21, niet 20:** het plan ging uit van een opstelling zonder keeper (20, en 22 met een eigen bord). De keeper kost één tik: een dekker bij het doel.
- `TAP_BUDGET` krijgt "T3": 21 en "T3 with your own board": 23. Het doel kiest Kay na deze meting (besluit 6). De verwachting na Fase 13, met de startopstelling "2 rijen" (met pionnen en keeper): 5, en 7 met een eigen bord.
- **Controle** (tijdelijk, niet gecommit): met het budget op 20 en op 22 faalt de test ("Expected: 20, Received: 21" en "Expected: 22, Received: 21").
- **Groottes:** gelijk; de app verandert niet.

