---
type: drill
title: "Keeper: schoten van drie plekken"
category: goalkeeping
ages: [u12, u14, u16, u18, senior]
level: basic
summary: "Drie schutters schieten na elkaar van links, het midden en rechts. De keeper kiest voor elk schot opnieuw zijn plek."
goal: "Voor elk schot je plek kiezen: op de lijn tussen de bal en het midden van het doel."
organization:
  players: "Een keeper en drie schutters (LO, MO en RO)."
  equipment: "Drie pionnen op 9 meter en een bal per schutter."
  space: "Een half veld."
rules:
  - "Een schutter schiet pas als de keeper stilstaat."
  - "Na een rondje wisselen de schutters van plek."
coachingPoints:
  - "Stap op de lijn tussen de bal en het midden van het doel."
  - "Sta stil op het moment van het schot."
  - "Handen omhoog, naast je hoofd."
mistakes:
  - "De keeper stapt pas als de schutter al gooit."
  - "De keeper stapt achteruit het doel in."
  - "De keeper beweegt nog op het moment van het schot."
easier:
  - "Schiet op halve kracht."
  - "Zeg vooraf in welke hoek je schiet."
harder:
  - "De schutters kiezen zelf wie schiet."
  - "Schiet met een sprongschot."
related: []
board:
  v: 2
  court: half
  cones: [[24, 66], [84, 90], [176, 66]]
  frames:
    - text: "De keeper stapt naar de kant van LO."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[50, 78], [110, 88], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[100, 10], [90, 15]] }
    - text: "LO schiet op doel."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [90, 15] }
      balls: [[50, 78], [110, 88], [170, 78]]
      arrows:
        - { kind: shot, from: 0, pts: [[40, 86], [110, 0]] }
    - text: "De keeper stapt terug naar het midden."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [90, 15] }
      balls: [[110, 0], [110, 88], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[90, 15], [100, 10]] }
    - text: "MO schiet op doel."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[110, 0], [110, 88], [170, 78]]
      arrows:
        - { kind: shot, from: 1, pts: [[100, 96], [90, 0]] }
    - text: "De keeper stapt naar de kant van RO."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[110, 0], [90, 0], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[100, 10], [112, 13]] }
    - text: "RO schiet op doel."
      players:
        - { team: a, label: LO, at: [40, 86] }
        - { team: a, label: MO, at: [100, 96] }
        - { team: a, label: RO, at: [160, 86] }
        - { team: d, label: K, at: [112, 13] }
      balls: [[110, 0], [90, 0], [170, 78]]
      arrows:
        - { kind: shot, from: 2, pts: [[160, 86], [90, 0]] }
---
