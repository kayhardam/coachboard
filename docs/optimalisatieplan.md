# Optimalisatieplan Coachboard

Opgesteld op 26 september 2026. Uitgangspunt: `main` @ `d2e32b8` (merge van PR #3).

Coachboard wordt stap voor stap geoptimaliseerd: eerst meten, dan een vangnet bouwen, dan verbeteren, en elke verbetering aantoonbaar maken. Claude Code voert de fases uit. Kay beslist, test op echte telefoons en doet de stappen in accounts (Cloudflare, GitHub, domein).

## Wat "geoptimaliseerd" betekent

| Doel | Maatstaf | Hoe we het meten |
|---|---|---|
| Snel op een telefoon | Core Web Vitals in het groen: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 | Lighthouse (Fase 3), echte bezoekers (Fase 8) |
| Licht | Contentpagina's laden geen JavaScript; het bord blijft binnen zijn JS-budget | budgetscript in `npm run verify` (Fase 4b) |
| Betrouwbaar | Tekenen → delen → openen werkt altijd; links met prefix `1.` blijven werken | e2e-tests in CI (Fase 4a) |
| Toegankelijk | Geen ernstige of kritieke fouten in axe; tikdoelen minstens 44 px | axe in de e2e-tests, testronde van Kay |
| Bruikbaar in de zaal | De kernflow lukt met één hand, staand en liggend, op iPhone en Android | testronde van Kay op de preview-URL |

## Nulmeting (26 september 2026)

Gemeten op `main` @ `d2e32b8` na een schone `npm ci`:

- `npm run verify` is groen: 7 testbestanden met 71 tests, 10 pagina's, 125 interne links.
- Contentpagina's laden geen JavaScript, alleen één CSS-bestand van 1,6 KB (gzip). De HTML is 2,4 tot 5,5 KB per pagina (gzip).
- Het bord (`/en/board/`) laadt ongeveer 28 KB JavaScript (gzip): de Svelte-runtime (15,3 KB), de editor (12,4 KB, waarvan ongeveer 4 KB de QR-bibliotheek `uqr` is) en een loader van 0,5 KB.
- De OG-afbeeldingen zijn 37 tot 51 KB.

Wat dit betekent: de laadsnelheid is al sterk. De meeste winst zit niet in kilobytes schrappen, maar in de kernflow bewaken met tests, de huidige lichtheid vastleggen met budgetten, testen hoe het bord zich op echte telefoons in de zaal gedraagt, en de lancering op het eigen domein goed neerzetten.

Al gevonden bij het doorlezen van de code:

- `contactEmail` in `src/data/site.ts` is `contact@handballcoachboard.com`, maar dat domein is nog niet geregistreerd. Het contactadres op de privacy- en aboutpagina werkt dus nog niet (Fase 7).
- `site` in `astro.config.mjs` is `https://handballcoachboard.com`, dus canonical en `og:image` wijzen naar een domein dat nog niet bestaat. Een link die nu vanaf workers.dev in WhatsApp wordt gedeeld, krijgt daardoor geen voorbeeldafbeelding (Fase 7).
- Deellinks en QR-codes gebruiken `location.origin`. Alles wat vanaf workers.dev gedeeld wordt, wijst naar workers.dev en moet na de verhuizing blijven werken (Fase 7).

## Zo gebruik je dit plan

1. Zet dit bestand in de repo als `docs/optimalisatieplan.md`. Fase 3 commit het mee.
2. De nummering sluit aan op je eerdere fases (Fase 2 was PR #3). Eén fase is één branch (`fase-3-nulmeting` enzovoort) en één PR. Een fase met delen (4a, 4b) krijgt per deel een eigen PR.
3. Start elke fase in een nieuwe Claude Code-sessie (of na `/clear`) met de startprompt onderaan. Die begint met `/plan`: Claude Code onderzoekt eerst en doet een voorstel, en gaat pas bouwen als jij het voorstel goedkeurt.
4. Test elke PR op je eigen telefoon via de preview-URL die Workers Builds per branch maakt, voordat je merget. Een merge naar `main` gaat direct live.
5. Een punt met **Beslissing (Kay)** is aan jou. Claude Code legt de opties met hun afweging voor en wacht.
6. Blijkt tijdens een fase dat het plan niet klopt, dan past Claude Code het plan aan in dezelfde PR en legt uit waarom.

## Regels voor Claude Code

Deze regels gelden in elke fase.

**Voor je begint**

- `CLAUDE.md` verwijst naar `AGENTS.md`: volg die conventies. Botst dit plan met `AGENTS.md`, stop dan en vraag Kay wat voorgaat.
- Controleer dat `git config user.email` eindigt op `@users.noreply.github.com`. Zo niet: stop en meld het. Commit nooit met een ander adres.
- De geschiedenis van deze repo is op 26 september 2026 herschreven. Doe `git fetch` en controleer dat de lokale `main` gelijk is aan `origin/main`. Wijkt hij af, stop dan en meld het: niet mergen, niet rebasen, niet force-pushen.
- Maak een nieuwe branch vanaf `origin/main`. Werk nooit direct op `main`.

**Tijdens het werk**

- Meet vóór en na elke wijziging die snelheid, grootte of gedrag raakt, en noteer beide in `docs/metingen.md`.
- Maak kleine, losse commits. `npm run verify` is groen vóór elke commit.
- Voeg geen dependency toe zonder akkoord van Kay. Noem naam, versie, grootte, de reden en het alternatief zonder dependency.
- `src/lib/board/format.ts` is een contract. Links met prefix `1.` moeten altijd blijven werken, en de fixtures in `src/lib/board/fixtures/` pas je nooit aan.
- Bestaande URL's blijven werken: links en QR-codes kunnen al in teamchats staan.
- Code, comments, commitberichten, `AGENTS.md` en `README.md` schrijf je in het Engels. Dit plan en `docs/metingen.md` in het Nederlands.
- Zoek versie-specifieke details (Astro 7, Svelte 5, Wrangler, Playwright, Cloudflare) op in de officiële documentatie, niet uit je geheugen.
- Voegt een fase een commando, script of conventie toe, werk dan `AGENTS.md` bij in dezelfde PR.

**Afronden**

- Push de branch en open een PR (met `gh` als die beschikbaar is; anders geef je Kay de titel en de beschrijving).
- De PR-beschrijving bevat: wat er veranderd is en waarom, de metingen vóór en na, wat Kay op zijn telefoon moet testen, en open vragen.
- Vink de fase af onder Voortgang, in dezelfde PR.

## Fase 3: Nulmeting en werkwijze

**Doel:** vastleggen waar de app nu staat, zodat elke volgende stap aantoonbaar iets oplevert. De app zelf verandert niet.

1. Doe de controles uit "Voor je begint" en draai `npm run verify`.
2. Maak `docs/metingen.md` met:
   - per pagina de grootte van HTML, CSS en JavaScript (raw en gzip), gemeten in `dist/`;
   - Lighthouse mobiel (`npx lighthouse`, headless, met de lokale Chrome) op de productie-URL `https://coachboard.hardamkay.workers.dev` voor `/en/`, `/en/board/` en `/en/tactics/defense/6-0-defense-basics/`: de vier scores plus LCP, CLS en TBT. Draai elke meting drie keer en noteer de mediaan. Latere fases meten op de preview-URL van hun PR, zodat voor en na te vergelijken zijn;
   - lukt een meting niet, noteer dan waarom.
3. Zet een testronde voor Kay in `docs/metingen.md`, voor iPhone (Safari) en Android (Chrome):
   - het bord openen, een speler slepen, een pijl tekenen, ongedaan maken;
   - delen naar WhatsApp en de link openen op een tweede telefoon;
   - de QR-code op het scherm laten scannen vanaf 1 à 2 meter;
   - op een tactiekpagina "Open in the board" gebruiken;
   - staand en liggend, en op een tablet als die er is;
   - snel twee keer op een knop tikken: zoomt de pagina in?
   - na het laden de vliegtuigmodus aanzetten: blijft het bord werken?
   - met een stopwatch: hoe lang duurt openen → tekenen → gedeeld in de teamapp?
4. Zet de bevindingen onderaan `docs/metingen.md` in een lijst, geordend op impact en moeite.
5. Commit dit plan en `docs/metingen.md` en open de PR.

**Kay:** doet de testronde en vult de resultaten aan, of geeft ze door aan Claude Code.

**Klaar als:** `docs/metingen.md` staat op `main` met de nulmeting, de testresultaten en de geordende lijst.

## Fase 4a: Vangnet met end-to-end-tests

**Doel:** optimalisaties kunnen de kernflow niet meer ongemerkt breken.

**Beslissing (Kay):** Playwright en `@axe-core/playwright` als devDependencies, en waartegen de tests draaien. `npx wrangler dev` gedraagt zich als productie (`_redirects`, `_headers`, trailing slash, 404), maar maakt `wrangler` een zware devDependency. `astro preview` is licht, maar test dat Cloudflare-gedrag niet.

Tests, met mobiele emulatie in Chromium en WebKit:

- het bord laadt met de standaardopstelling;
- een speler slepen zet binnen een seconde `#t=1.…` in de adresbalk;
- die link openen in een schone browsercontext geeft hetzelfde bord. Vergelijk de getekende stukken (`data-kind`, `data-index` en hun positie), niet de tekst van de link: de compressie kan per browser andere bytes opleveren;
- elke fixture uit `src/lib/board/fixtures/` opent als link in de browser;
- een kapotte link toont de foutmelding en laat het eigen bord staan;
- "Open in the board" op een tactiekpagina toont de tactiek, en het opgeslagen bord verandert pas na de eerste bewerking;
- de QR-dialoog opent met een QR-code, en zonder `navigator.share` kopieert de deelknop de link;
- `/` gaat naar `/en/`, `/en/privacy` naar `/en/privacy/`, en een onbekende URL geeft de 404-pagina (alleen bij `wrangler dev`);
- een axe-scan op elke pagina vindt geen fouten van niveau `serious` of `critical`.

Voeg `npm run e2e` toe en een aparte CI-job, en leg in `AGENTS.md` uit hoe je alles of één test draait.

**Controle:** maak de v1-decoder tijdelijk kapot en laat zien dat de tests falen. Draai dat terug vóór de commit.

**Klaar als:** de e2e-job draait groen in CI en de controle heeft aangetoond dat de tests een kapotte decoder vangen.

## Fase 4b: Vangnet met budgetten

**Doel:** de app kan niet meer ongemerkt zwaarder worden.

- Schrijf `scripts/check-budget.mjs` in de stijl van `scripts/check-links.mjs`: zonder dependencies, met eigen tests, en onderdeel van `npm run verify`.
- Regels: contentpagina's bevatten geen `<script>` (JSON-LD uitgezonderd), zodat de regel "Content pages ship no JS" uit `AGENTS.md` afdwingbaar wordt. Het JavaScript van het bord blijft onder de nulmeting plus ongeveer 15% (gzip). CSS, HTML per pagina en PNG's krijgen een grens op basis van de nulmeting.
- De uitvoer is een tabel met de gemeten waarde naast het budget. Een budget verhogen mag alleen bewust, met de reden in de PR.

**Klaar als:** een tijdelijk toegevoegd `<script>` op een contentpagina laat `npm run verify` falen.

## Fase 5: Mobiele UX in de zaal

**Doel:** de kernflow werkt soepel met één hand op echte telefoons.

Werk de geordende lijst uit Fase 3 af. Per punt: hypothese → kleine wijziging → e2e groen → Kay test op de preview-URL → resultaat in `docs/metingen.md`. Kandidaten, alleen als de testronde ze bevestigt:

- zoomt de pagina op iOS bij snel dubbel tikken, dan `touch-action: manipulation` op de knoppen;
- de knoppenbalk: volgorde, bereik met de duim, labels die zonder uitleg te snappen zijn;
- liggend en op tablets benut het bord de ruimte;
- voelt slepen traag, maak dan een performance-trace in Chrome DevTools met 4× CPU-vertraging, met als doel geen taken langer dan 50 ms tijdens het slepen;
- de QR-bibliotheek pas laden als de QR-dialoog opengaat. Dat scheelt ongeveer 4 KB (gzip) en heeft lage prioriteit.

**Klaar als:** elk opgepakt punt een meting of testresultaat van vóór en na heeft.

## Fase 6: Veiligheid en onderhoud

**Doel:** nette standaardbeveiliging en updates zonder gedoe.

- Zet security headers voor alle pagina's in `public/_headers`: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, een verbod op inbedden in frames, en een Content-Security-Policy. Zoek uit of Astro 7 zelf CSP-hashes kan maken voor de inline scripts van het bord; anders doe je een voorstel. HSTS komt pas in Fase 7, op het eigen domein.
- **CSS van de editor.** Sinds Fase 5 staat de CSS van `BoardEditor.svelte` in zijn JS (`<svelte:options css="injected" />`). Svelte voegt die bij het laden als `<style>`-element in, dus een strikte `style-src` blokkeert hem. Dan staat het bord er zonder opmaak, en de e2e-layouttests vangen dat. Zoek in de documentatie van Svelte 5 en Astro 7 uit welke opties er zijn en leg ze voor:
  - een hash: verandert bij elke build, dus moet automatisch in `_headers` komen;
  - een nonce: kan niet zonder Worker-code, omdat een statische host geen nonce per verzoek maakt;
  - `'unsafe-inline'` alleen voor `style-src`, niet voor scripts;
  - weer een gelinkte stylesheet, maar alleen op de bordpagina. Het budgetscript bewaakt dat contentpagina's hem niet krijgen, zoals in Fase 5.
- **`Cross-Origin-Opener-Policy: same-origin`** voor alle pagina's. De code opent geen vensters (`window.open`, `opener`), dus het risico is klein. Controleer toch dat delen naar WhatsApp, het klembord en de QR-code blijven werken, in de e2e-tests en op de preview-URL.
- Controleer dat de e2e-tests groen blijven (delen, klembord, QR, layout) en dat de headers te zien zijn in `wrangler dev` en op de preview-URL.
- Voeg `.github/dependabot.yml` toe voor npm en GitHub Actions: wekelijks en gegroepeerd. Nooit automatisch mergen: elke update gaat via CI en de preview-URL.

**Klaar als:** de headers op de preview-URL staan, de e2e-tests groen zijn en de eerste Dependabot-run binnen is.

**Uitgevoerd (29 september 2026):**

- **Aanpassing van het plan: de CSP staat niet helemaal in `public/_headers`.** De hashes van de inline scripts kent pas de build, en `_headers` is een vast bestand. Astro 7 schrijft ze zelf in een `<meta>`-CSP op elke pagina (`security.csp`). Browsers negeren `frame-ancestors` in een `<meta>`, dus het verbod op inbedden staat als header in `_headers` (`frame-ancestors 'none'` en `X-Frame-Options: DENY`).
- **Besluit Kay: `'unsafe-inline'` alleen voor `style-src`.** Scripts houden hun hashes. De gemeten opties staan in `docs/metingen.md` onder "Fase 6".
- **Terugkomen op dit besluit zodra het JS-budget knelt** (besluit Kay). Dan gaat de CSS van de editor naar een stylesheet die alleen `board.astro` importeert, en valt `'unsafe-inline'` weg. Dat haalt ongeveer 1,6 KB (gzip) uit de JS van het bord. Het kost ongeveer 0,6 KB HTML per pagina (de hashes van de styles), een extra verzoek op het bord, en de scoping van Svelte. In Fase 6 is met een proef nagegaan dat Astro zo'n stylesheet alleen op de bordpagina linkt.

## Fase 7: Lancering op handballcoachboard.com

**Start pas als Kay het domein registreert.** Deze fase mag eerder dan Fase 4 tot en met 6, los van de volgorde.

**Kay** (stappen in accounts; Claude Code zoekt de actuele stappen op in de Cloudflare-documentatie):

- het domein registreren en als custom domain aan de Worker koppelen;
- mail voor `contact@handballcoachboard.com` laten doorsturen naar zijn eigen adres (Cloudflare Email Routing) en een testmail sturen;
- Google Search Console verifiëren via DNS en de sitemap indienen.

**Claude Code:**

- **Beslissing (Kay):** hoe links die vanaf workers.dev gedeeld zijn, doorsturen naar het eigen domein, met behoud van pad en `#t=`. Opties: een klein script op het bord (past bij "geen Worker-code") of een redirect in Worker-code (raakt de regel in `AGENTS.md` dat `wrangler.jsonc` een pure upload van `dist/` is). Stuur alleen de productie-host `coachboard.hardamkay.workers.dev` door, niet de preview-URL's: die eindigen ook op `workers.dev`. Voeg een e2e-test toe.
- HSTS toevoegen, zonder `preload`.
- **CSP op het eigen domein (uit Fase 6).** Controleer dat Cloudflare op het custom domain geen scripts in de HTML zet, zoals Email Address Obfuscation voor het contactadres op de privacy- en aboutpagina. De CSP blokkeert zo'n inline script; `e2e/security.spec.ts` ziet dat niet, want dat draait tegen `wrangler dev`. Kijk na de livegang in de console van `/en/about/` en `/en/privacy/`.
- `README.md` ("not live yet") en het hoofdstuk Hosting in `AGENTS.md` bijwerken.
- Na de livegang controleren en noteren in `docs/metingen.md`: canonical, `og:image`, sitemap en `robots.txt` op het echte domein, het linkvoorbeeld in WhatsApp, en een nieuwe Lighthouse-meting.

**Klaar als:** het domein live is, oude workers.dev-links doorsturen, de testmail aankomt en de controles in `docs/metingen.md` staan.

**Uitvoering (1 oktober 2026; Kay heeft het domein gekocht bij Cloudflare Registrar):**

- **Aanpassing van het plan: twee PR's.** 7a zet het domein live, 7b zet daarna pas de doorsturing vanaf workers.dev aan. Zo stuurt workers.dev nooit door naar een domein dat nog geen certificaat heeft.
  - **7a** (`fase-7a-domein`): het custom domain staat in `wrangler.jsonc` en niet alleen in het dashboard, want een deploy zonder de route haalt het domein weer weg. Verder HSTS in `public/_headers`, README en `AGENTS.md` bijgewerkt, en `E2E_BASE_URL` om een e2e-test tegen productie te draaien.
  - **7b** (`fase-7b-doorsturen`): het script op het bord dat workers.dev doorstuurt, met de tests.
- **Besluit Kay: een klein script op de bordpagina stuurt door.** Het opgeslagen bord gaat mee (`#own=`), want localStorage hoort bij één domein, en met een redirect op de server zou het eigen bord van een trainer op workers.dev achterblijven. Heeft het nieuwe domein al een bord, dan wordt `#own=` genegeerd en blijft dat bord staan; dat krijgt een eigen test. Contentpagina's sturen niet door: ze laden geen JS, en hun canonical wijst al naar het eigen domein.
- **Werkafspraak (Kay):** Claude Code deployt nooit zelf met wrangler, alleen `--dry-run`. Live gaat alleen via een merge van Kay.
- **Na de merge van 7a** draait `e2e/security.spec.ts` één keer tegen `https://handballcoachboard.com`, zodat per pagina te zien is of Cloudflare scripts invoegt die de CSP blokkeert.
- **7a live (1 oktober 2026).** Na de merge van PR #14 slaagt `e2e/security.spec.ts` tegen productie: 42 van 42. De andere controles en Lighthouse (overal 100, SEO ook) staan in `docs/metingen.md`.
- **7b live (1 oktober 2026).** Na de merge van PR #15 sturen oude workers.dev-links door op productie, met en zonder `#t=`, en preview-URL's niet; `e2e/security.spec.ts` slaagt tegen productie: 42 van 42. Kay heeft een oude link op een echte telefoon geopend (werkt) en de testmail is aangekomen.
- **Besluit Kay: geen 7c.** Wie op het domein eerst een gedeelde link opent en aanpast, krijgt daarna het eigen bord van workers.dev niet meer mee (geval 7′ in `docs/metingen.md`). Dat is een bekend en geaccepteerd gevolg: een gedeeld bord aanpassen overschrijft het eigen bord ook zonder verhuizing, en het gaat om weinig gebruikers.
- **TypeScript 7 opnieuw bekijken (Kay).** Dependabot negeert 7.x sinds PR #13 (`@dependabot ignore this major version`). Kijk opnieuw zodra TypeScript 7.1 uit is en Astro en Svelte (`astro check`, `svelte-check`) het ondersteunen. Dan haal je de negeerregel weg, door PR #13 te heropenen of met `@dependabot unignore`, en loopt de update gewoon via CI en de preview-URL.

## Fase 8: Meten in productie

**Start na Fase 7.** Doel: weten of trainers de app gebruiken en hoe snel die op hun telefoons is.

- **Beslissing (Kay):** welke statistiekdienst. De privacypagina belooft statistieken zonder cookies, anoniem, zonder opslag van IP-adressen, en met de naam van de dienst op die pagina. Een kandidaat is Cloudflare Web Analytics: gratis, zonder cookies, en het meet ook Core Web Vitals van echte bezoekers. Claude Code controleert of de gekozen dienst aan de beloftes voldoet. Afweging: het is een extern script op elke pagina, terwijl contentpagina's nu geen JavaScript laden; het budgetscript krijgt daarvoor een bewuste, gedocumenteerde uitzondering. Sinds Fase 6 blokkeert de CSP elk script van een ander domein: het domein van de dienst moet in `astro.config.mjs` bij `security.csp.scriptDirective.resources` (naast `'self'`) en, als de dienst gegevens verstuurt, in `connect-src` bij `security.csp.directives`, en `e2e/security.spec.ts` moet groen blijven.
- Maak de kernlus meetbaar zonder tekendata te versturen, bijvoorbeeld met een markering als `?via=qr` in gedeelde links, zodat geopende gedeelde borden apart te tellen zijn. `format.ts` blijft ongewijzigd en oude links blijven werken. Controleer eerst of de gekozen dienst zo'n markering kan tonen.
- Werk de privacypagina bij: de naam van de dienst en de datum bovenaan.
- Noteer elke maand in `docs/metingen.md`: bezoeken aan het bord, geopende gedeelde borden, en de Core Web Vitals van echte bezoekers.

**Klaar als:** de eerste maandmeting in `docs/metingen.md` staat.

## Buiten dit plan

Elk van deze punten verdient een eigen plan, zoals `AGENTS.md` ook vraagt:

- een Nederlandse (en later Duitse) versie; voor Nederlandse trainers waarschijnlijk de grootste stap;
- offline werken in de zaal (PWA); tot die er is, geen claim "Works offline";
- meer tactieken;
- foutmeldingen uit de browser verzamelen (vraagt om een externe dienst of Worker-code, af te wegen tegen privacy).

## Voortgang

- [x] Fase 3: Nulmeting en werkwijze
- [x] Fase 4a: Vangnet met end-to-end-tests
- [x] Fase 4b: Vangnet met budgetten
- [x] Fase 5: Mobiele UX in de zaal
- [x] Fase 6: Veiligheid en onderhoud (de eerste Dependabot-run volgt na de merge)
- [ ] Fase 7: Lancering op handballcoachboard.com (nog van Kay: het linkvoorbeeld in WhatsApp)
  - [x] 7a: domein live
  - [x] 7b: workers.dev doorsturen
- [ ] Fase 8: Meten in productie

## Startprompts

Een fase starten (vervang N en de naam):

```
/plan Lees docs/optimalisatieplan.md en voer Fase N uit. Doe eerst de controles uit "Voor je begint". Laat me daarna je aanpak zien: welke bestanden je aanraakt, welke dependencies je wilt toevoegen en waarom, hoe je meet, en welke beslissingen je van mij nodig hebt. Werk op branch fase-N-<naam>.
```

Een fase afronden:

```
Rond Fase N af volgens "Afronden" in docs/optimalisatieplan.md en geef me de testlijst voor mijn telefoon.
```
