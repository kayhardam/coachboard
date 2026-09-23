# Linkformaat v2 — voorstel

Status: voorstel (23 september 2026). De eigenaar geeft akkoord op de codering voordat er code wordt geschreven (taak T5).

## Waarom zorgvuldig
Elke gedeelde link en elke geprinte QR-code is een belofte voor altijd: wat we nu in het formaat stoppen, moeten we blijven lezen. Daarom eerst vastleggen en ontwerpen, dan pas bouwen.

## Uitgangspunten
1. **Oude links werken voor altijd.** Bevroren zijn: hoe een v1-link wordt gelezen, en de v1-testlinks. De code die bepaalt welke versie een link heeft, mag wel beter worden, zolang elke v1-testlink identiek blijft decoderen.
2. **De laagste versie schrijven.** Past een tekening in v1, dan schrijft de encoder v1, exact zoals de huidige v1-encoder. Bestaande QR-codes blijven zo even klein.
3. **Uitbreidbaar.** v2 kan onbekende onderdelen overslaan, zodat een volgende toevoeging geen v3 hoeft te worden.
4. **Taalneutraal.** De link bevat geen UI-taal. Posities en rollen zijn codes; de weergave vertaalt ze.
5. **Onbetrouwbare invoer.** Iedereen kan een link maken. De decoder crasht nooit, heeft harde grenzen, en tekst wordt altijd als tekst weergegeven.
6. **Compact.** Een typische jeugdoefening past in een goed scanbare QR-code (zie Groottebudget).

## Stap 0 — v1 vastleggen, zonder iets te veranderen
Schrijf `docs/v2/linkformaat-v1.md` op basis van de huidige code:
- het versiemechanisme, en wat de decoder nu doet met een onbekende versie (dat moet een nette fout zijn, geen verkeerde tekening);
- alle velden, de codering (compressie, alfabet), en het bereik en de precisie van coördinaten;
- hoe meerdere beelden worden opgeslagen, en of objecten over beelden heen herkenbaar dezelfde blijven;
- of er één of meerdere ballen kunnen zijn, en hoe balbezit werkt;
- eigenaardigheden die we moeten blijven respecteren;
- het foutcorrectieniveau van de QR-code, en de QR-versie van de huidige testlinks;
- de lijst van v1-testlinks.

Staat de v1-leeslogica niet in een eigen bestand, zet hem daar dan in (bewezen gelijk via de testlinks) en voeg dat bestand toe aan `BEVROREN` in `.claude/hooks/bescherm-bevroren.mjs`. Bewaar ook de huidige v1-encoder als bevroren referentie voor de tests.

## Wat v2 toevoegt
| Onderdeel | Inhoud | Opmerking |
|---|---|---|
| Materiaal | pion, hoepel, minidoel, mat, bank; positie; draaiing in stappen van 45° | draaiing alleen bij minidoel, mat en bank |
| Ballen | meerdere ballen, los of bij een speler | alleen als v1 dat nog niet kan |
| Spelerslabel | rugnummer (1–99) of positiecode | zie de tabel hieronder |
| Rol | aanvaller, verdediger, keeper, trainer, neutraal | een onbekende rol wordt als neutraal getoond |
| Notitie | korte tekst per stap, maximaal 140 tekens | altijd als tekst weergeven; UI-hint: geen namen van kinderen |
| Veldtype | half veld en heel veld (v1), leeg vlak (nieuw) | |
| Stappen | zoals in v1; objecten houden hun identiteit over stappen heen | nodig voor vloeiende animatie later |

### Positiecodes
Opgeslagen als getal (0 = geen), weergegeven per taal. De afkortingen zijn een concept; zie `terminologie.md`.

| Code | NL | EN | DE |
|---|---|---|---|
| 1 | LH | LW | LA |
| 2 | LO | LB | RL |
| 3 | MO | CB | RM |
| 4 | RO | RB | RR |
| 5 | RH | RW | RA |
| 6 | CL | P | KL |
| 7 | K | GK | TW |

## Structuur: eisen, nog geen codering
- Hetzelfde versiemechanisme als v1; v2 krijgt versie 2.
- Eerst de kern (alles wat v1 ook kent), daarna optionele onderdelen. Elk optioneel onderdeel heeft een type en een lengte, zodat een decoder een onbekend type kan overslaan.
- Coördinaten: hetzelfde bereik en dezelfde precisie als v1, tenzij stap 0 laat zien dat dat niet volstaat.
- Kies de concrete codering ná stap 0. Twee voor de hand liggende routes: voortbouwen op de v1-codering met extra secties, of een compacte structuur met korte sleutels vóór dezelfde compressie. Schrijf de keuze en de reden hieronder op, met de gemeten grootte van de testgevallen, en vraag akkoord.

**Gekozen codering:** _(in te vullen na stap 0)_

## Grenzen en foutafhandeling
De decoder geeft altijd `{ ok: true, board }` of `{ ok: false, reason }` terug, nooit een exception naar de UI. Hij weigert netjes bij:
- een link langer dan 4.000 tekens, of uitgepakte inhoud groter dan 32 kB;
- meer dan 20 stappen, meer dan 40 objecten of 40 lijnen per stap, of een notitie langer dan 140 tekens;
- een hogere versie dan de site kent. Melding: "Deze link is gemaakt met een nieuwere versie. Vernieuw de pagina."

Onbekende optionele onderdelen worden overgeslagen; de viewer meldt klein dat niet alles kon worden getoond.

## Groottebudget
- Een typisch v1-bord blijft v1 en verandert niet van grootte.
- Een typische jeugdoefening in één stap (10 spelers met nummers, 6 pionnen, 3 ballen, 8 lijnen, een notitie van 60 tekens) past met de hele URL (`https://handballcoachboard.com/b#t=…`) in QR-versie 13, bij het foutcorrectieniveau dat de site gebruikt. Ter indicatie: versie 13 bevat 425 bytes bij niveau L en 331 bytes bij niveau M.
- Een oefening van zes stappen blijft onder 2.000 tekens. Daar geldt geen QR-eis; die deel je als link.

Wordt een budget overschreden, verbeter dan eerst de codering (bijvoorbeeld per stap alleen opslaan wat verandert) in plaats van het budget op te rekken.

## Verplichte tests
1. **v1-testlinks:** ongewijzigd en groen. De bestanden worden niet aangeraakt.
2. **Laagste versie:** voor elk v1-testbord geeft de nieuwe encoder exact dezelfde string als de bevroren v1-encoder.
3. **v2-testlinks:** minstens één per nieuw onderdeel en één combinatie, in een eigen map, los van v1.
4. **Round-trip:** willekeurige geldige borden binnen de grenzen worden gecodeerd en gedecodeerd, en zijn daarna gelijk.
5. **Fuzz:** willekeurige en verminkte strings geven nooit een exception en zijn binnen 50 ms afgehandeld.
6. **Onbekend onderdeel:** een v2-link met een verzonnen extra onderdeel decodeert de rest correct.
7. **Grenzen:** elke grens hierboven heeft een eigen test.
8. **Veiligheid:** een notitie met `<script>` of `<img onerror=…>` verschijnt als letterlijke tekst.
9. **Groottebudget:** de gevallen hierboven, met de gemeten QR-versie.

## Later, niet in v2.0
- Een verzamellink met meerdere borden (voor "Mijn borden" en trainingsplannen).
- Per stap alleen de verschillen opslaan, als het budget daarom vraagt.
- Zones of vlakken markeren.

## Open beslissingen voor de eigenaar
- Is de materiaallijst compleet genoeg voor de E- en D-jeugd?
- Kloppen de positie-afkortingen? Laat een trainer kijken.
- Blijft de notitie op 140 tekens?
- Het definitieve groottebudget, na de metingen uit stap 0.

## Wijzigingsprotocol
Elke volgende wijziging aan het formaat: (1) eerst dit document bijwerken, (2) nieuwe testlinks toevoegen, (3) oude testlinks nooit wijzigen, (4) een regel in het changelog hieronder.

## Changelog
- 2026-09-23 — voorstel v2.
