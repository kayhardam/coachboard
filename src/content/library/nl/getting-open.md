---
type: drill
title: "Spelvorm: aanspeelbaar zijn"
category: attack
ages: [u10, u12, u14]
level: basic
summary: "Een wedstrijd met één accent: wie de bal niet heeft, loopt zich vrij. De stappen laten met drie tegen drie zien hoe dat eruitziet."
goal: "Aanspeelbaar zijn: de spelers zonder bal lopen zich vrij, zodat de balbezitter altijd naar twee kanten kan spelen."
organization:
  players: "Twee teams van gelijke sterkte op het hele veld, of vier teams met op elke helft een wedstrijd."
  equipment: "Per wedstrijd een bal en hesjes voor één team."
  space: "Het hele veld, of bij vier teams voor elke wedstrijd een eigen helft, in de breedte op doeltjes."
rules:
  - "De gewone wedstrijdregels gelden."
  - "Maak teams van gelijke sterkte."
  - "Speel twee keer 10 minuten."
  - "Bij vier teams wissel je na 10 minuten van tegenstander."
coachingPoints:
  - "Zonder bal: loop weg van je verdediger, de vrije ruimte in."
  - "Sta je achter je verdediger? Kom eruit."
  - "Vraag de bal met je hand."
  - "Loop door na je pass."
  - "Balbezitter: kijk eerst, dribbel daarna pas."
  - "Maak het veld breed: niet allemaal naar de bal."
mistakes:
  - "Spelers staan verstopt achter hun verdediger."
  - "Iedereen loopt naar de bal toe."
  - "Wie de bal heeft afgespeeld, blijft staan kijken."
  - "De balbezitter dribbelt met zijn hoofd omlaag en loopt zich vast."
easier:
  - "Speel met een joker die altijd meedoet met het team dat de bal heeft."
  - "Verdedigers mogen een pass onderscheppen, maar de bal niet uit de handen pakken."
  - "Maak de teams kleiner: 4 tegen 4 geeft meer ruimte."
harder:
  - "Zonder dribbel: alleen passen en lopen."
  - "Houd de bal hoogstens 3 tellen vast."
  - "Vijf passes achter elkaar zonder balverlies is een extra punt."
  - "Verdedig man tegen man over het hele veld."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "A2 en A3 lopen weg uit de dekking, de vrije ruimte in. Nu kan A1 naar twee kanten spelen."
      players:
        - { team: a, label: A1, at: [100, 150] }
        - { team: a, label: A2, at: [52, 112] }
        - { team: a, label: A3, at: [148, 112] }
        - { team: d, label: V1, at: [100, 124] }
        - { team: d, label: V2, at: [74, 132] }
        - { team: d, label: V3, at: [130, 129] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[110, 160]]
      arrows:
        - { kind: run, from: 1, pts: [[52, 112], [36, 150]] }
        - { kind: run, from: 2, pts: [[148, 112], [164, 150]] }
    - text: "A1 speelt naar A2 en loopt meteen door, tussen V1 en V3, naar de ruimte voor het doel."
      players:
        - { team: a, label: A1, at: [100, 150] }
        - { team: a, label: A2, at: [36, 150] }
        - { team: a, label: A3, at: [164, 150] }
        - { team: d, label: V1, at: [100, 124] }
        - { team: d, label: V2, at: [74, 132] }
        - { team: d, label: V3, at: [130, 129] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[110, 160]]
      arrows:
        - { kind: pass, from: 0, pts: [[100, 150], [36, 150]] }
        - { kind: run, from: 0, pts: [[100, 150], [115, 126], [96, 84]] }
    - text: "A2 speelt naar A1 en A1 schiet. Wie de bal afgeeft en doorloopt, blijft aanspeelbaar."
      players:
        - { team: a, label: A1, at: [96, 84] }
        - { team: a, label: A2, at: [36, 150] }
        - { team: a, label: A3, at: [164, 150] }
        - { team: d, label: V1, at: [100, 124] }
        - { team: d, label: V2, at: [74, 132] }
        - { team: d, label: V3, at: [130, 129] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[46, 142]]
      arrows:
        - { kind: pass, from: 1, pts: [[36, 150], [96, 84]] }
        - { kind: shot, from: 0, pts: [[96, 84], [90, 0]] }
---

Speel volgens de gewone regels en let als trainer op één ding: zijn de spelers zonder bal aanspeelbaar? Leg het spel stil als de balbezitter niemand kan aanspelen, en laat de spelers zelf de vrije ruimte aanwijzen.
