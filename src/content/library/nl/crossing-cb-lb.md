---
type: tactic
title: "Kruising MO–LO"
category: attack
ages: [u14, u16, u18, senior]
level: basic
summary: "MO loopt schuin naar links en krijgt de bal van RO. LO kruist achter hem langs en krijgt de bal terug. Zo krijgt LO ruimte in het midden."
coachingPoints:
  - "MO: ga op het doel af, zodat je verdediger moet uitstappen."
  - "LO: start pas als MO de bal heeft."
  - Kruis dicht achter MO langs.
  - Vraag de bal met je hand.
related:
  - nl/crossing-in-pairs
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "MO loopt schuin naar links en krijgt de bal van RO. CL loopt naar rechts naar de 6 meter."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [100, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[180, 110]]
      arrows:
        - { kind: run, from: 5, pts: [[100, 66], [126, 86], [136, 60]] }
        - { kind: run, from: 2, pts: [[100, 130], [66, 94]] }
        - { kind: pass, from: 3, pts: [[170, 118], [66, 94]] }
    - text: "LO kruist achter MO langs."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [66, 94] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [136, 60] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[76, 86]]
      arrows:
        - { kind: run, from: 1, pts: [[30, 118], [62, 126], [88, 112]] }
    - text: "MO speelt de bal terug naar LO."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [88, 112] }
        - { team: a, label: MO, at: [66, 94] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [136, 60] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[76, 86]]
      arrows:
        - { kind: pass, from: 2, pts: [[66, 94], [88, 112]] }
    - text: "LO loopt door en schiet op doel."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [88, 112] }
        - { team: a, label: MO, at: [66, 94] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [136, 60] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[98, 104]]
      arrows:
        - { kind: run, from: 1, pts: [[88, 112], [88, 94]] }
        - { kind: shot, from: 1, pts: [[88, 94], [110, 0]] }
---
