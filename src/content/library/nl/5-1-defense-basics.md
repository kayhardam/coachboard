---
type: tactic
title: "5-1-dekking: de basis"
category: defense
ages: [u14, u16, u18, senior]
level: basic
summary: >-
  In de 5-1-dekking staan vijf verdedigers net buiten de 6 meter. De zesde, de midvoor, staat ervoor bij de
  9 meter. Hij stoort MO en de passes tussen de opbouwers.
coachingPoints:
  - "Midvoor: armen omhoog, in de passlijn naar MO."
  - "Halfverdediger: stap uit naar de bal en zak na de pass meteen terug."
  - "Schuif snel mee: met vijf op de lijn zijn de gaten groter."
  - "Middelste van de vijf: jij hebt de cirkelloper, roep waar hij staat."
related:
  - nl/6-0-defense-basics
  - nl/step-out-and-shift
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "Vijf verdedigers staan net buiten de 6 meter, de midvoor staat voor hen tegenover MO."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [110, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [52, 56] }
        - { team: d, at: [90, 66] }
        - { team: d, at: [148, 56] }
        - { team: d, at: [178, 30] }
        - { team: d, at: [100, 92] }
      balls: [[110, 122]]
      arrows: []
    - text: "Heeft MO de bal, dan stapt de midvoor op hem af en hindert zijn pass."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [110, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [52, 56] }
        - { team: d, at: [90, 66] }
        - { team: d, at: [148, 56] }
        - { team: d, at: [178, 30] }
        - { team: d, at: [100, 92] }
      balls: [[110, 122]]
      arrows:
        - { kind: run, from: 12, pts: [[100, 92], [100, 110]] }
    - text: "Krijgt LO de bal, dan stapt zijn verdediger uit en schuift de rest mee."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [110, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [52, 56] }
        - { team: d, at: [90, 66] }
        - { team: d, at: [148, 56] }
        - { team: d, at: [178, 30] }
        - { team: d, at: [100, 110] }
      balls: [[110, 122]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 130], [30, 118]] }
        - { kind: run, from: 8, pts: [[52, 56], [36, 92]] }
        - { kind: run, from: 9, pts: [[90, 66], [72, 66]] }
        - { kind: run, from: 10, pts: [[148, 56], [130, 62]] }
        - { kind: run, from: 11, pts: [[178, 30], [160, 44]] }
    - text: "De midvoor schuift mee naar de kant van de bal en staat in de passlijn naar MO."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [110, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [36, 92] }
        - { team: d, at: [72, 66] }
        - { team: d, at: [130, 62] }
        - { team: d, at: [160, 44] }
        - { team: d, at: [100, 110] }
      balls: [[40, 110]]
      arrows:
        - { kind: run, from: 12, pts: [[100, 110], [70, 122]] }
    - text: "Zoekt de cirkelloper het gat achter de halfverdediger, dan pakt de middelste van de vijf hem."
      players:
        - { team: a, label: LH, at: [8, 48] }
        - { team: a, label: LO, at: [30, 118] }
        - { team: a, label: MO, at: [100, 130] }
        - { team: a, label: RO, at: [170, 118] }
        - { team: a, label: RH, at: [192, 48] }
        - { team: a, label: CL, at: [110, 66] }
        - { team: d, label: K, at: [100, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [36, 92] }
        - { team: d, at: [72, 66] }
        - { team: d, at: [130, 62] }
        - { team: d, at: [160, 44] }
        - { team: d, at: [70, 122] }
      balls: [[40, 110]]
      arrows:
        - { kind: run, from: 5, pts: [[110, 66], [86, 82], [52, 78]] }
        - { kind: run, from: 9, pts: [[72, 66], [54, 60]] }
---
