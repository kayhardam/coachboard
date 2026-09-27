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
| 1 | **Op een telefoon reageren de knoppen in de balken onderaan niet meer zodra het volledige veld aan staat** (testronde, punt 2; Kay bevestigde op 27 september dat met "iconen" de knoppen bedoeld zijn). **In Fase 4a gereproduceerd met mobiele emulatie.** Het volledige veld groeit tot ongeveer 730 px hoog: het schaalt naar de breedte in plaats van naar de beschikbare hoogte. Daardoor schuiven beide balken onder het scherm. Op een iPhone 15-viewport (393×659) staan ze op 809–908 px. De pagina scrollt niet, dus de knoppen zijn onbereikbaar. Vastgelegd in `e2e/full-court.spec.ts` (`test.fail()`). | hoog | middel | 5 |
| 2 | **Liggend is het bord niet te gebruiken: de pagina scrollt niet** (testronde, punt 11). Oorzaak volgens de code: de bordpagina is `height: 100dvh; overflow: hidden` (`.fullscreen` in `BaseLayout.astro`). In een liggend scherm van ongeveer 390 px hoog nemen de header en de twee knoppenbalken het grootste deel in, en scrollen kan niet. Waarschijnlijk dezelfde oorzaak als bevinding 1: in de emulatie van Fase 4a staan de balken liggend met het volledige veld ook ver onder het scherm. | hoog | middel | 5 |
| 3 | **Canonical en `og:image` wijzen naar `handballcoachboard.com`, dat nog niet bestaat.** Gevolgen: een link vanaf workers.dev krijgt in WhatsApp geen voorbeeldafbeelding, en zoekmachines volgen een canonical naar een domein dat niet reageert. Lighthouse ziet dit niet. | hoog | laag, zodra het domein er is | 7 |
| 4 | **Het contactadres `contact@handballcoachboard.com` werkt nog niet.** Het staat op de privacy- en aboutpagina. | hoog (belofte op de privacypagina) | laag | 7 |
| 5 | **Deellinks en QR-codes gebruiken `location.origin`** (`BoardEditor.svelte`). Alles wat nu vanaf workers.dev gedeeld wordt, moet na de verhuizing doorsturen, met behoud van pad en `#t=`. | hoog | middel | 7 |
| 6 | ~~**Er zijn geen browsertests voor de kernflow**~~ **Opgelost in Fase 4a:** 50 e2e-tests in mobiel Chromium en WebKit, met een eigen CI-job. | hoog | middel | 4a |
| 7 | **Niets bewaakt dat contentpagina's zonder JS blijven en het bord licht blijft.** Nu is dat zo: 0 KB JS op contentpagina's en 28,2 KB (gzip) op het bord. | middel | laag | 4b |
| 8 | **Risico op zoomen bij dubbel tikken in iOS Safari.** Alleen het veld (`.stage`) heeft `touch-action`, de knoppen niet. Nog een hypothese: punt 13 is in de testronde niet gemeld en schuift door naar Fase 5. | middel | laag | 5 |
| 9 | **Geen security headers**, alleen de cache-header voor `/_astro/*` in `public/_headers`. | middel | laag tot middel (CSP voor de inline scripts van het bord) | 6 |
| 10 | **De QR-bibliotheek zit in de editorbundel** (ongeveer 4 KB gzip). Pas laden bij het openen van de QR-dialoog scheelt weinig. | laag | laag | 5 |
| 11 | **Laadsnelheid in het lab:** alle pagina's 100, LCP ongeveer 0,8 s, CLS 0, TBT 0 ms. Er valt hier niets te winnen; de volgende stappen zijn vastleggen (4a, 4b) en echte telefoons (testronde, Fase 8). | — | — | — |
| 12 | **Opgelost in Fase 4a: een kapotte link overschreef het opgeslagen bord met de standaardopstelling.** Gevonden bij het lezen van de code voor Fase 4a, bevestigd met een e2e-test en daarna opgelost. Zie "Fase 4a" hieronder. | hoog | laag | 4a |

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
