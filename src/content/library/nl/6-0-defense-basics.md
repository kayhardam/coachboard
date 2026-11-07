---
type: tactic
title: "6-0-dekking: de basis"
category: defense
ages: [u14, u16, u18, senior]
level: basic
summary: >-
  In de 6-0-dekking staan zes verdedigers op een lijn net buiten de 6 meter, elk in een eigen zone.
  Wie de bal heeft, wordt altijd verdedigd. De rest schuift mee met de bal.
coachingPoints:
  - "Altijd iemand op de bal: stap uit naar wie kan scoren."
  - Stap uit naar de kant van zijn werparm.
  - Roep elke verschuiving en elke overname van de CL.
  - Houd de CL voor je, nooit achter je rug.
  - "Houd je armen omhoog: zo hinder je de pass, niet alleen het schot."
  - Schuif met kleine, snelle passen en kruis je voeten niet.
related:
  - nl/fast-break-second-wave
  - nl/step-out-and-shift
  - nl/5-1-defense-basics
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "Elke verdediger staat net buiten de 6 meter en dekt zijn zone, niet een vaste aanvaller."
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
    - text: "Wie de bal heeft, kan scoren: de verdediger in wiens zone de bal komt, stapt naar hem uit."
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
    - text: "De rest van de lijn schuift mee naar de bal, zodat niemand achter de uitstapper langs komt."
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
        - { kind: run, from: 10, pts: [[120, 66], [112, 64]] }
        - { kind: run, from: 11, pts: [[152, 58], [132, 64]] }
        - { kind: run, from: 12, pts: [[178, 30], [162, 46]] }
    - text: "LO speelt naar MO: de uitstapper zakt terug en de verdediger van die zone stapt uit."
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
        - { team: d, at: [112, 64] }
        - { team: d, at: [132, 64] }
        - { team: d, at: [162, 46] }
      balls: [[58, 114]]
      arrows:
        - { kind: pass, from: 1, pts: [[48, 122], [100, 132]] }
        - { kind: run, from: 8, pts: [[48, 94], [52, 62]] }
        - { kind: run, from: 9, pts: [[64, 72], [92, 108]] }
        - { kind: run, from: 11, pts: [[132, 64], [146, 60]] }
        - { kind: run, from: 12, pts: [[162, 46], [176, 32]] }
    - text: "Bij elke pass hetzelfde: MO speelt naar RO, de uitstapper zakt terug, een ander stapt uit."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [52, 62] }
        - { team: d, at: [92, 108] }
        - { team: d, at: [112, 64] }
        - { team: d, at: [146, 60] }
        - { team: d, at: [176, 32] }
      balls: [[110, 124]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 132], [152, 122]] }
        - { kind: run, from: 9, pts: [[92, 108], [84, 64]] }
        - { kind: run, from: 11, pts: [[146, 60], [150, 98]] }
    - text: "Loopt de CL langs de lijn, dan geeft zijn verdediger hem door en neemt de buur hem over."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [52, 62] }
        - { team: d, at: [84, 64] }
        - { team: d, at: [112, 64] }
        - { team: d, at: [150, 98] }
        - { team: d, at: [176, 32] }
      balls: [[162, 114]]
      arrows:
        - { kind: run, from: 5, pts: [[100, 80], [124, 88]] }
        - { kind: run, from: 10, pts: [[112, 64], [130, 68]] }
---
