# Plan v2 — fase 1 en 2

> **Voor Claude Code:** voer één taak tegelijk uit met `/taak <ID>`. Lees alleen de sectie van die taak en de documenten waarnaar ze verwijst. Vink een punt onder "Klaar als" pas af met bewijs.
> **Voor de eigenaar:** stappen met **(jij)** doe je zelf; Claude Code kan ze niet uitvoeren.

**Doel van v2:** het beste handbalbord in de eigen taal voor vrijwillige jeugdtrainers, gebouwd rond het moment van delen in de teamapp, en vanaf dag één meetbaar. Nederlands eerst.

## Overzicht

| ID | Taak | Na | Wie |
|---|---|---|---|
| T1 | Build en deploy stabiel | – | Claude Code, jij (dashboard) |
| T2 | Eigen domein en doorverwijzingen | T1 | Claude Code, jij (DNS) |
| T3 | Meten zonder cookies | T2 | Claude Code, jij (tokens) |
| T4 | Search Console | T2 | jij |
| T5 | Linkformaat v2 | T1 | Claude Code, jij (akkoord op het ontwerp) |
| T7 | Nederlands | T2 | Claude Code, tegelijk met T5 |
| T6 | Bord: materiaal, labels, beeldtaal | T5, T7 | Claude Code |
| T8 | Ontvangerspagina en delen | T3, T6 | Claude Code, jij (telefoontest) |
| T9 | Tien oefeningen voor E- en D-jeugd | T6 | jij (inhoud), Claude Code; tegelijk met T8 |
| T10 | Test met vijf trainers | T8, minstens 5 oefeningen | jij |

---

## Fase 1 — deze week

### T1 — Build en deploy stabiel
**Doel:** een wijziging bij Cloudflare mag je builds niet meer breken.

**Wat**
- Zet `wrangler` als devDependency met een exacte versie (zonder `^`) en commit de lockfile. Alle scripts gebruiken die lokale versie; `npx wrangler` pakt de lokaal geïnstalleerde.
- Leg de Node-versie vast (`.node-version` of `.nvmrc`, plus `engines` in package.json) en laat CI dezelfde gebruiken.
- Voeg Dependabot (of Renovate) toe die wrangler, Astro en Svelte maandelijks als één gegroepeerde PR bijwerkt, zodat updates bewust en getest binnenkomen.
- Schrijf `docs/v2/deploy.md`: welke commando's in het Cloudflare-dashboard moeten staan, en waarom.

**(jij) In het dashboard:** Workers & Pages → jouw Worker → Settings → Builds. Deze instellingen staan alleen daar, niet in de repo.
- Build command: het buildscript uit package.json (meestal `npm run build`)
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`

**Klaar als**
- [ ] `npm ci && npm run build` werkt op een schone checkout, met de vastgezette wrangler-versie.
- [ ] Een testbranch geeft een geslaagde preview-build in Workers Builds (link in de PR).
- [ ] De buildlog van Workers Builds toont dezelfde wrangler- en Node-versie als lokaal.

### T2 — Eigen domein en doorverwijzingen
**Doel:** alle nieuwe links en QR-codes gebruiken `handballcoachboard.com`, en elke oude link blijft werken.

**(jij) Vooraf:** voeg het domein toe aan Cloudflare en zet bij je registrar de nameservers om. Wacht tot Cloudflare het domein als actief toont.

**Wat**
- Koppel `handballcoachboard.com` en `www.handballcoachboard.com` als Custom Domain aan de Worker, via de wrangler-config.
- Voeg een klein Worker-script toe naast de statische bestanden:
  - verzoeken op precies `coachboard.hardamkay.workers.dev` en op `www.handballcoachboard.com` krijgen een 301 naar `https://handballcoachboard.com`, met hetzelfde pad en dezelfde query. Het deel na `#` komt nooit bij de server; de browser neemt het zelf mee naar het nieuwe adres.
  - versie-previews op `*-coachboard.hardamkay.workers.dev` worden níet doorgestuurd;
  - al het andere gaat naar de statische bestanden.
- Laat de Worker alleen vóór HTML-routes en `/api/*` draaien (`assets.run_worker_first` met uitzonderingen zoals `/_astro/*`). Verzoeken om statische bestanden zijn gratis en onbeperkt; Worker-verzoeken tellen mee voor de gratis limiet van 100.000 per dag.
- Zet `site` in de Astro-config op het nieuwe domein. Controleer canonical, sitemap, hreflang, OG-URL's en de QR-generator. Zoek en vervang hardgecodeerde workers.dev-adressen.

**Klaar als**
- [ ] Unit-tests van de Worker: oud adres geeft een 301 met hetzelfde pad en dezelfde query; een preview-adres wordt niet doorgestuurd; het nieuwe adres levert het statische bestand.
- [ ] Sitemap en canonicals in de build bevatten alleen `handballcoachboard.com`.
- [ ] (jij, na livegang) Een oude v1-link via workers.dev opent op je telefoon dezelfde tekening op het nieuwe domein.

### T3 — Meten zonder cookies
**Doel:** zien óf en hoe het bord gebruikt wordt, zonder dat er ooit een tekening, een cookie of een extern script op het bord aan te pas komt.

**Wat**
- **Inhoudspagina's** (home, bibliotheek, tactiek- en oefenpagina's, over, privacy): Cloudflare Web Analytics, met de snippet handmatig ingevoegd en `"spa": false`. Zet de automatische injectie in het dashboard níet aan: die komt ook op het bord en `/b/` terecht. Pas een eventuele Content-Security-Policy aan.
- **Bord en `/b/`:** geen extern script, want het beacon stuurt het paginaadres mee. In plaats daarvan een eigen minimale teller: de pagina stuurt `POST /api/e` met alleen een vaste gebeurtenisnaam en hooguit één vaste categorie, met `referrerPolicy: 'no-referrer'` en `keepalive`. De Worker accepteert alleen bekende namen en categorieën en schrijft die naar Workers Analytics Engine. Geen IP-adres, user-agent of URL opslaan.
- Gebeurtenissen, niet meer dan deze drie (T8 sluit de laatste twee aan):
  - `board_open`, met categorie `direct`, `library` of `link` (op het apparaat bepaald)
  - `share_open`: `/b/` geopend met een geldige tekening
  - `share_click`, met categorie `image_link`, `link` of `download`
- `npm run stats` toont per week het aantal per gebeurtenis via de SQL API van Analytics Engine (tel met `SUM(_sample_interval)`). Het API-token staat alleen in `.env`.
- Werk de privacypagina bij: wat er geteld wordt en wat niet, in gewone taal.
- **Privacy-e2e-test** (Playwright, draait in CI). Hij opent het bord (vanaf T8 ook `/b/`) met `#t=` en een unieke markering, tekent iets, drukt op delen, en faalt als:
  - een netwerkverzoek (URL, body of headers) de markering of de `#t=`-inhoud bevat;
  - er een cookie wordt gezet;
  - er vanaf het bord of `/b/` een verzoek naar een ander domein gaat.

**(jij)** Maak in het dashboard een Web Analytics-site aan en geef het token aan Claude Code (dat token is publiek). Maak een API-token met leesrecht op Account Analytics en zet dat zelf in `.env`.

**Klaar als**
- [ ] De privacy-e2e-test is groen in CI.
- [ ] Bewijs dat de test werkt: met een tijdelijk ingebouwd lek wordt hij rood (daarna teruggedraaid).
- [ ] Na deploy toont `npm run stats` gebeurtenissen, en het Cloudflare-dashboard toont bezoeken aan inhoudspagina's.
- [ ] De privacypagina beschrijft precies wat de code doet.

### T4 — Search Console (jij)
- Maak een domeinproperty aan in Google Search Console (verificatie via een DNS-record in Cloudflare) en dien de sitemap in.
- Waarom: dit is je enige bron voor de zoekwoorden waarmee trainers je vinden, zonder iets op je site te plaatsen.

---

## Fase 2 — week 1 tot 4

### T5 — Linkformaat v2
**Doel:** het formaat uitbreiden voor oefenstof zonder dat één oude link breekt.

**Wat:** voer `docs/v2/linkformaat-v2.md` uit, in twee rondes.
1. Stap 0 (v1 beschrijven, v1-leeslogica isoleren en bevriezen) plus een voorstel voor de concrete codering met gemeten groottes. **Stop en vraag akkoord.**
2. Na akkoord: encoder, decoder en alle tests uit het document. Nog geen UI.

**Klaar als**
- [ ] `docs/v2/linkformaat-v1.md` bestaat, en de gekozen codering staat met reden in `linkformaat-v2.md`.
- [ ] Alle verplichte tests uit `linkformaat-v2.md` bestaan en zijn groen; de v1-testlinks zijn onaangeroerd.
- [ ] Een subagent heeft geprobeerd een oude link anders te laten lezen, en vond niets (of de gaten zijn gedicht).

### T7 — Nederlands (tegelijk met T5)
**Doel:** site en bord volledig in het Nederlands; Nederlands is de hoofdtaal van v2.

**Wat**
- `nl` naast `en` in routing, sitemap en hreflang (met `x-default`). `de` alleen in de configuratie voorbereiden.
- Alle UI-teksten van het bord via één woordenboek per taal. Een i18n-test faalt als een sleutel in een taal ontbreekt.
- Vertalen: landingspagina, bibliotheek, beide tactieken, over en privacy. Gebruik `terminologie.md`; bij twijfel `TODO(term)`.
- `/` wordt een taalkeuze met een suggestie op basis van de browsertaal, zonder automatische doorverwijzing; `x-default` wijst daarheen. Een Nederlandse bezoeker is met één tik op `/nl/`.

**Klaar als**
- [ ] Elke pagina bestaat onder `/en/` en `/nl/`; de i18n-test en een hreflang-check zijn groen.
- [ ] Geen Engelse restteksten op `/nl/` (test).
- [ ] (jij, of een Nederlandse trainer) Teksten en termen nagelezen.

### T6 — Bord: materiaal, labels en beeldtaal
**Doel:** jeugdoefeningen tekenen zoals trainers ze kennen uit het materiaal van de bond.

**(jij) Vooraf:** download de NHV-pdf "trainingen uitleg" naar `docs/v2/bronnen/`. Die map staat in .gitignore: niet committen.

**Wat**
- Materiaal: pion, hoepel, minidoel, mat en bank (draaibaar waar nodig). Meerdere ballen.
- Spelers: rugnummer of positie (weergave per taal volgens `terminologie.md`). Rollen: aanvaller, verdediger, keeper, trainer, neutraal.
- Notitie per stap (maximaal 140 tekens), met de hint "gebruik geen namen van kinderen".
- Veldtype "leeg vlak".
- Beeldtaal: vergelijk de huidige tekens met de legenda in de NHV-pdf (aanvaller met en zonder bal, verdediger, keeper, loopweg, balweg, schot) en stem ze daarop af. Voeg een legenda toe aan het bord, de viewer en de oefenpagina's. Dit is alleen weergave; het formaat verandert hier niet.
- Alles werkt met touch; tikvlakken minimaal 44 px; ongedaan maken werkt voor elke nieuwe handeling.
- Nieuwe teksten gaan via het woordenboek uit T7, in `en` en `nl`.

**Klaar als**
- [ ] e2e-test: een oefening met materiaal en nummers tekenen, de link openen, en exact hetzelfde bord zien.
- [ ] Screenshots van bord en legenda op 390 px breed in de PR.
- [ ] De privacy-e2e-test is nog groen.

### T8 — Ontvangerspagina en delen
**Doel:** wie een link krijgt, ziet in één tik de situatie; wie deelt, verstuurt plaatje én link.

**Wat**
- `/b/` (taalneutraal) leest `#t=` en toont het bord alleen-lezen, met vorige/volgende als er stappen zijn. De UI-taal komt uit de browser (`nl`, `en`; terugval `en`), met een taalknop. Onderaan rustig "Maak zelf een bord". De knop "Bewerk een kopie" opent het bord, zonder het eigen opgeslagen bord van de ontvanger ongevraagd te overschrijven.
- `/b/` krijgt `noindex` en een aantrekkelijke algemene OG-afbeelding; die ziet de teamapp als alleen de link wordt gedeeld.
- Kies de kortste vorm (`/b#t=` of `/b/#t=`) die zonder extra doorverwijzing laadt.
- Oude links (`/en/board/#t=…`) blijven werken zoals nu.
- Deelknop in het bord: maakt op het apparaat een PNG van de huidige stap (domein klein in de hoek) en deelt via `navigator.share` het bestand plus een tekst met de `/b/`-link. Terugval: alleen de link delen; op desktop "Kopieer link" en "Download afbeelding".
- De QR-code gebruikt voortaan de korte `/b/`-link.
- Sluit `share_open` en `share_click` uit T3 aan, en breid de privacy-e2e-test uit naar `/b/`.

**Klaar als**
- [ ] e2e-tests voor de viewer (stappen, taal, bewerk-kopie zonder overschrijven) en voor delen (share-API gesimuleerd, plus de terugvallen).
- [ ] De privacy-e2e-test is groen, ook op `/b/`.
- [ ] (jij) Telefoontest op iPhone én Android via WhatsApp: komen plaatje en link allebei aan, opent de link `/b/` in de goede taal, en werkt de QR-code?

### T9 — Tien oefeningen voor E- en D-jeugd (tegelijk met T8)
**Doel:** tien goede Nederlandse oefeningen, elk met diagram, "Open in bord" en stationskaart.

**Wat**
- Contentmodel "oefening": titel, leeftijd (E/D), thema, duur, aantal spelers, materiaal, organisatie, uitvoering in stappen, coachingpunten, makkelijker/moeilijker, diagram (link-string) en OG-afbeelding.
- Build-check: elk diagram decodeert, blijft binnen het groottebudget en bevat alleen toegestane onderdelen.
- Bibliotheek: oefenstof per leeftijd en thema; tactieken blijven een categorie; bestaande URL's blijven werken.
- Een printbare stationskaart per oefening (A5: diagram, coachingpunten, QR naar de `/b/`-link), via print-CSS.
- **De inhoud komt van de eigenaar**, via een interview per oefening. Neem niets over uit NHV-materiaal of andere bronnen. Diagrammen: de eigenaar tekent ze op het bord en plakt de link, of beschrijft de opstelling en jij maakt de link met de encoder.

**Klaar als**
- [ ] Tien oefeningen op `/nl/`, elk met een werkende "Open in bord" en stationskaart.
- [ ] De build-check is groen.
- [ ] (jij) Een trainer heeft de teksten gelezen.

### T10 — Test met vijf trainers (jij)
Volg `docs/v2/testprotocol-trainers.md`. Leg de verslagen vast in `docs/v2/testverslagen/`, zonder namen.

---

## Buiten scope voor deze fasen
Niet bouwen, ook niet "alvast": Mijn borden en verzamellinks, PWA en offline, vloeiende animatie en export als video of GIF, de Duitse vertaling (alleen voorbereiden), accounts, advertenties, nieuwsbrief, app stores en sponsorlogo's. Komt iets hiervan op, zet het onder "Ideeën".

## Ideeën
_(nog leeg)_
