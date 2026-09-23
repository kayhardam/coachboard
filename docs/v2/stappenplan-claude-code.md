# Stappenplan: v2 bouwen met Claude Code

Dit is jouw handleiding. De taken zelf staan in `docs/v2/plan.md`, en die leest Claude Code. Jij stuurt, controleert en doet de stappen die alleen jij kunt doen.

## 0. Wat je nodig hebt
- **Claude Code**, in de terminal, VS Code of de desktop-app. De prompts zijn overal hetzelfde.
- **De GitHub CLI `gh`**, ingelogd, zodat Claude branches en PR's kan maken.
- **Claude in Chrome** (extensie), aanbevolen voor T6 en T8. Start dan met `claude --chrome`, zodat Claude het bord zelf kan openen, klikken en screenshots maken.
- **Je eigen telefoon met WhatsApp**, voor de echte deeltest. Die kan Claude niet voor je doen.

## 1. Eenmalig: het pakket installeren (± 30 minuten)
1. Pak de zip uit in de root van je repo. Je krijgt een map `v2-pakket/` met daarin een verborgen map `.claude`.
2. Start Claude Code in de root van de repo, in plan mode: `claude --permission-mode plan`
3. Plak deze prompt:

```text
In de root staat v2-pakket/ met plannen en Claude Code-configuratie voor versie 2. Verwerk het zo:

1. Lees v2-pakket/LEESMIJ.md voor wat waar hoort.
2. Voeg v2-pakket/AGENTS-aanvulling.md als nieuwe sectie toe aan AGENTS.md. Haal niets weg. Botst iets met wat er al staat, noem het en vraag wat ik wil. Houd AGENTS.md onder de 200 regels.
3. Zet v2-pakket/CLAUDE.md in de root. Bestaat er al een CLAUDE.md, zet dan alleen de regel @AGENTS.md bovenaan en voeg de sectie "Claude Code" toe.
4. Verplaats docs/v2/ en de inhoud van .claude/ naar hun plek. Bestaat .claude/settings.json al, voeg dan samen in plaats van te overschrijven.
5. Zoek waar de v1-testlinks van het linkformaat staan en waar de linkformaat-code staat. Vul in .claude/rules/linkformaat.md bij paths beide paden in. Zet in de lijst BEVROREN in .claude/hooks/bescherm-bevroren.mjs de map met v1-testlinks, en alleen als de v1-leeslogica in een eigen bestand staat, ook dat bestand.
6. Voeg .claude/worktrees/ en docs/v2/bronnen/ toe aan .gitignore en controleer dat .env erin staat.
7. Test de hook: probeer een bestand in de bevroren map te wijzigen. Dat moet geblokkeerd worden.
8. Verwijder v2-pakket/ en commit als "chore: add v2 plan and Claude Code setup".

Laat me daarna zien: de diff van AGENTS.md, de ingevulde paden en het bewijs dat de hook blokkeert.
```

4. Lees het plan, keur het goed, en controleer daarna zelf:
   - `/context`: staat CLAUDE.md (met AGENTS.md erin) onder Memory files?
   - `/hooks`: staat er een PreToolUse-hook?
   - `/permissions`: staan de deny-regels voor `wrangler deploy` erin?
   - typ `/`: staan `/taak` en `/privacycheck` in de lijst?

**Waarom een CLAUDE.md?** Claude Code leest AGENTS.md alleen vanzelf als er geen CLAUDE.md is, en niet in elke sessie (bijvoorbeeld niet in de eerste sessie na een update). Een CLAUDE.md met de regel `@AGENTS.md` maakt het zeker. Andere tools blijven gewoon AGENTS.md lezen.

## 2. De vaste cyclus per taak
1. **Schone start.** Eén taak per sessie. Begin een nieuwe sessie (of typ `/clear`) en geef hem een naam: `/rename T5-linkformaat`.
2. **Plan mode.** Druk op Shift+Tab tot je `⏸ plan mode on` ziet, en typ `/taak T5`.
3. **Plan beoordelen.** Klopt de scope? Staat er niets in uit "Buiten scope"? Met Ctrl+G pas je het plan zelf aan. Keur goed.
4. **Laten werken.** Gaat het de verkeerde kant op: Esc, en bijsturen. Twee keer bijgestuurd zonder resultaat? Typ `/clear` en begin opnieuw met een scherpere prompt. Dat werkt bijna altijd beter dan doormodderen.
5. **Bewijs lezen.** Claude levert per acceptatiecriterium bewijs (testuitvoer, screenshot). Lees dat, niet alleen de samenvatting. Typ daarna `/code-review` voor een frisse blik op de diff.
6. **Zelf proberen.** Open de preview-URL uit de PR op je telefoon.
7. **Mergen doe jij.** Workers Builds zet het daarna live.

Terugdraaien kan met Esc Esc (of `/rewind`), maar dat dekt alleen wijzigingen die Claude via zijn bewerkingstools deed, niet via shellcommando's. Git en kleine PR's blijven je echte vangnet.

## 3. Volgorde, met wat jij doet

### Deze week
**T1: Build en deploy stabiel**
- Jij, vooraf: zet in het Cloudflare-dashboard de drie commando's uit `plan.md` (T1). Dat kan alleen daar.
- Claude Code: `/taak T1`. Dit is klein; plan mode mag je hier overslaan.
- Controle: een testbranch geeft een geslaagde preview-build.

**T2: Eigen domein**
- Jij, vooraf: voeg het domein toe aan Cloudflare, zet de nameservers om, en wacht tot het actief is.
- Claude Code: `/taak T2`
- Jij, na livegang: open een oude workers.dev-link op je telefoon. Zie je dezelfde tekening op het nieuwe domein?

**T3: Meten zonder cookies**
- Jij, vooraf: maak een Web Analytics-site aan (zonder automatische injectie) en geef Claude het token. Zet het API-token met leesrecht op Account Analytics zelf in `.env`. Plak geheime tokens nooit in de chat.
- Claude Code: `/taak T3`
- Extra prompt als Claude klaar is:
  ```text
  Laat zien dat de privacytest echt werkt: bouw tijdelijk een lek in (stuur location.href mee in de teller), laat de test rood worden, en draai het daarna terug.
  ```
- Na een dag: `npm run stats`

**T4: Search Console** (jij): een domeinproperty aanmaken en de sitemap indienen.

### Week 1 tot 4
De volgorde is: T5 en T7 tegelijk, dan T6, dan T8 en T9 tegelijk, dan T10.

**T5: Linkformaat v2.** Dit is het belangrijkste ontwerpbesluit van v2.
- Claude Code: `/taak T5`. Claude stopt na stap 0 met een beschrijving van v1 en een codeervoorstel.
- Jij: lees `linkformaat-v1.md` en het voorstel, en stel jezelf één vraag: kan elke oude link nog precies zo gelezen worden? Twijfel je, vraag dan:
  ```text
  Laat een subagent proberen dit ontwerp te breken: welke oude links zouden anders worden gelezen?
  ```
- Daarna: `Akkoord met het ontwerp. Ga verder met de implementatie.` Of noem wat je anders wilt.

**T7: Nederlands** (tegelijk met T5)
- Open een tweede terminal en start `claude --worktree t7-nl`. Die sessie werkt in een eigen kopie van de repo, zodat de twee sessies elkaar niet in de weg zitten.
- Daar: `/taak T7`
- Jij, of een Nederlandse trainer: lees de vertalingen en termen na.

**T6: Bord, materiaal, labels en beeldtaal** (na T5 en T7)
- Jij, vooraf: zet de NHV-pdf "trainingen uitleg" in `docs/v2/bronnen/`.
- Claude Code: start met `claude --chrome`, en typ `/taak T6`.

**T8: Ontvangerspagina en delen** (na T3 en T6)
- Claude Code: start met `claude --chrome --worktree t8-delen`, en typ `/taak T8`.
- Jij: de telefoontest op iPhone én Android (zie `plan.md`). Dit is de belangrijkste test van v2.

**T9: Tien oefeningen** (tegelijk met T8)
- Jij, vooraf: schrijf per oefening drie tot vijf regels in je eigen woorden: het doel, de organisatie, en waar het vaak misgaat.
- Claude Code, in een eigen worktree (`claude --worktree t9-oefeningen`): eerst `/taak T9` voor het contentmodel en de build-check. Daarna per oefening:
  ```text
  Interview me met de AskUserQuestion-tool over oefening 1: doel, leeftijd, organisatie, uitvoering, coachingpunten, makkelijker en moeilijker, en materiaal. Hier zijn mijn notities: [plak je notities]. Schrijf daarna de pagina, maak het diagram met de encoder, en laat het resultaat zien voordat je aan de volgende begint.
  ```

**T10: Vijf trainers** (jij): volg `testprotocol-trainers.md`.

## 4. Jouw lijst: wat Claude Code niet kan
- [ ] De Workers Builds-commando's in het dashboard (T1)
- [ ] Het domein naar Cloudflare en de nameservers omzetten (T2)
- [ ] Een oude link testen op je telefoon (T2)
- [ ] De Web Analytics-site aanmaken en het API-token in `.env` zetten (T3)
- [ ] Search Console (T4)
- [ ] Akkoord geven op het linkformaat-ontwerp (T5)
- [ ] De vertalingen laten nalezen (T7)
- [ ] De NHV-pdf in `docs/v2/bronnen/` zetten (T6)
- [ ] De WhatsApp-test op iPhone en Android (T8)
- [ ] De inhoud van tien oefeningen leveren, nagelezen door een trainer (T9)
- [ ] Vijf trainers laten testen (T10)
- [ ] Elke PR zelf mergen

## 5. Als het misgaat
- **Claude negeert een regel uit AGENTS.md.** Typ `/context` en kijk of CLAUDE.md geladen is. Houd AGENTS.md kort; in een te lang bestand verdwijnen regels.
- **De hook blokkeert niet.** Typ `/hooks`. Test het script los:
  `echo '{"tool_input":{"file_path":"PAD/NAAR/BEVROREN/BESTAND"}}' | node .claude/hooks/bescherm-bevroren.mjs; echo $?`
  Dat moet `2` geven. Let op: de hook ziet alleen wijzigingen via de bewerkingstools, niet via shellcommando's. De v1-tests in CI zijn de echte bewaker.
- **Workers Builds faalt, maar lokaal niet.** Vergelijk de wrangler- en Node-versie in de buildlog met je lockfile en `.node-version`.
- **Een sessie loopt vol of raakt de draad kwijt.** Begin een nieuwe sessie en typ opnieuw `/taak <ID>`. `plan.md` en de PR bevatten alles wat nodig is.

## 6. Na week 4: wat je wilt weten
- Hoeveel gedeelde borden werden per week geopend (`share_open`)?
- Hoe vaak werd er gedeeld, en op welke manier (`share_click`)?
- Met welke zoekwoorden vinden trainers je (Search Console)?
- Wat zeiden minstens drie van de vijf trainers?

Deze antwoorden bepalen fase 3 (stappen en animatie, Mijn borden, Duits). Niet je gevoel.
