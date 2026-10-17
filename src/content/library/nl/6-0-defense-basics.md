---
type: tactic
title: "6-0-dekking: de basis"
category: defense
ages: [u14, u16, u18, senior]
level: basic
summary: >-
  In de 6-0-dekking staan zes verdedigers op een lijn, net buiten de 6 meter. Ze schuiven samen mee met
  de bal. Zo moet de aanval van afstand schieten.
coachingPoints:
  - "Middenverdedigers: roep elke verschuiving."
  - Houd de cirkelloper voor je, nooit achter je rug.
  - "Houd je armen omhoog: zo hinder je de pass, niet alleen het schot."
  - Schuif met kleine, snelle passen en kruis je voeten niet.
related:
  - nl/fast-break-second-wave
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "Elke verdediger staat net buiten de 6 meter en dekt de aanvaller voor zich."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[110, 124]]
      arrows: []
    - text: "Krijgt een aanvaller de bal, dan stapt zijn verdediger naar hem uit."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[110, 124]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 132], [48, 122]] }
        - { kind: run, from: 8, pts: [[48, 58], [48, 94]] }
    - text: "De rest van de lijn schuift mee naar de kant van de bal."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 94] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[58, 114]]
      arrows:
        - { kind: run, from: 9, pts: [[80, 66], [64, 72]] }
        - { kind: run, from: 10, pts: [[120, 66], [100, 68]] }
        - { kind: run, from: 11, pts: [[152, 58], [132, 64]] }
        - { kind: run, from: 12, pts: [[178, 30], [162, 46]] }
    - text: "Loopt de cirkelloper langs de lijn, dan neemt de volgende verdediger hem over."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 94] }
        - { team: d, at: [64, 72] }
        - { team: d, at: [100, 68] }
        - { team: d, at: [132, 64] }
        - { team: d, at: [162, 46] }
      balls: [[58, 114]]
      arrows:
        - { kind: run, from: 5, pts: [[100, 80], [76, 88]] }
        - { kind: run, from: 9, pts: [[64, 72], [70, 80]] }
---
