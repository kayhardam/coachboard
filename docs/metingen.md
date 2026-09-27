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
| 2 | Een speler slepen: volgt hij je vinger soepel? | ✅ / ❌ | Op het halve veld werkt het. Op het volledige veld (full court) zijn de "iconen" niet meer te selecteren. Zie bevinding 1. |
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
| 1 | **Op een telefoon zijn de stukken op het volledige veld niet te selecteren** (testronde, punt 2). Vermoeden: het veld schaalt naar de beschikbare hoogte. Het volledige veld (viewBox 216×428) wordt daardoor kleiner getekend dan het halve (216×222). Op een telefoon van 390×844 zakt het tikgebied van een stuk (`HIT_R` = 13 in `geometry.ts`) daardoor van ongeveer 45 px naar ongeveer 40 px, onder de 44 px uit `AGENTS.md`. Het ligt dan tegen de tikgebieden van de stukken ernaast. Eerst reproduceren: het is nog niet vastgesteld of "iconen" de stukken of de knoppen zijn. | hoog | middel | 5 |
| 2 | **Liggend is het bord niet te gebruiken: de pagina scrollt niet** (testronde, punt 11). Oorzaak volgens de code: de bordpagina is `height: 100dvh; overflow: hidden` (`.fullscreen` in `BaseLayout.astro`). In een liggend scherm van ongeveer 390 px hoog nemen de header en de twee knoppenbalken het grootste deel in, en scrollen kan niet. | hoog | middel | 5 |
| 3 | **Canonical en `og:image` wijzen naar `handballcoachboard.com`, dat nog niet bestaat.** Gevolgen: een link vanaf workers.dev krijgt in WhatsApp geen voorbeeldafbeelding, en zoekmachines volgen een canonical naar een domein dat niet reageert. Lighthouse ziet dit niet. | hoog | laag, zodra het domein er is | 7 |
| 4 | **Het contactadres `contact@handballcoachboard.com` werkt nog niet.** Het staat op de privacy- en aboutpagina. | hoog (belofte op de privacypagina) | laag | 7 |
| 5 | **Deellinks en QR-codes gebruiken `location.origin`** (`BoardEditor.svelte`). Alles wat nu vanaf workers.dev gedeeld wordt, moet na de verhuizing doorsturen, met behoud van pad en `#t=`. | hoog | middel | 7 |
| 6 | **Er zijn geen browsertests voor de kernflow** (tekenen → delen → openen). De unit-tests dekken het formaat, niet de flow in de browser. | hoog | middel | 4a |
| 7 | **Niets bewaakt dat contentpagina's zonder JS blijven en het bord licht blijft.** Nu is dat zo: 0 KB JS op contentpagina's en 28,2 KB (gzip) op het bord. | middel | laag | 4b |
| 8 | **Risico op zoomen bij dubbel tikken in iOS Safari.** Alleen het veld (`.stage`) heeft `touch-action`, de knoppen niet. Nog een hypothese: punt 13 is in de testronde niet gemeld en schuift door naar Fase 5. | middel | laag | 5 |
| 9 | **Geen security headers**, alleen de cache-header voor `/_astro/*` in `public/_headers`. | middel | laag tot middel (CSP voor de inline scripts van het bord) | 6 |
| 10 | **De QR-bibliotheek zit in de editorbundel** (ongeveer 4 KB gzip). Pas laden bij het openen van de QR-dialoog scheelt weinig. | laag | laag | 5 |
| 11 | **Laadsnelheid in het lab:** alle pagina's 100, LCP ongeveer 0,8 s, CLS 0, TBT 0 ms. Er valt hier niets te winnen; de volgende stappen zijn vastleggen (4a, 4b) en echte telefoons (testronde, Fase 8). | — | — | — |
