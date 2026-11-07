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
    - text: "Elke verdediger dekt een zone, geteld van buiten naar binnen: L1 tot L3 en R3 tot R1. L1 dekt LH."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [20, 32] }
        - { team: d, label: L2, at: [36, 60] }
        - { team: d, label: L3, at: [64, 68] }
        - { team: d, label: R3, at: [112, 62] }
        - { team: d, label: R2, at: [138, 60] }
        - { team: d, label: R1, at: [164, 42] }
      balls: [[6, 58]]
      arrows: []
    - text: "LH speelt naar LO: L2 stapt uit aan de werparmkant, de lijn schuift mee naar de bal."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [20, 32] }
        - { team: d, label: L2, at: [36, 60] }
        - { team: d, label: L3, at: [64, 68] }
        - { team: d, label: R3, at: [112, 62] }
        - { team: d, label: R2, at: [138, 60] }
        - { team: d, label: R1, at: [164, 42] }
      balls: [[6, 58]]
      arrows:
        - { kind: pass, from: 0, pts: [[10, 50], [48, 122]] }
        - { kind: run, from: 7, pts: [[20, 32], [22, 32]] }
        - { kind: run, from: 8, pts: [[36, 60], [52, 100]] }
        - { kind: run, from: 9, pts: [[64, 68], [74, 68]] }
        - { kind: run, from: 10, pts: [[112, 62], [120, 64]] }
        - { kind: run, from: 11, pts: [[138, 60], [148, 58]] }
        - { kind: run, from: 12, pts: [[164, 42], [172, 36]] }
    - text: "LO speelt naar MO: L2 zakt terug, L3 stapt uit, de lijn schuift mee: niemand komt achter L3 langs."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [22, 32] }
        - { team: d, label: L2, at: [52, 100] }
        - { team: d, label: L3, at: [74, 68] }
        - { team: d, label: R3, at: [120, 64] }
        - { team: d, label: R2, at: [148, 58] }
        - { team: d, label: R1, at: [172, 36] }
      balls: [[58, 114]]
      arrows:
        - { kind: pass, from: 1, pts: [[48, 122], [100, 132]] }
        - { kind: run, from: 7, pts: [[22, 32], [30, 34]] }
        - { kind: run, from: 8, pts: [[52, 100], [54, 60]] }
        - { kind: run, from: 9, pts: [[74, 68], [104, 110]] }
        - { kind: run, from: 10, pts: [[120, 64], [128, 66]] }
        - { kind: run, from: 11, pts: [[148, 58], [154, 58]] }
        - { kind: run, from: 12, pts: [[172, 36], [176, 32]] }
    - text: "MO speelt naar RO: L3 zakt terug, R2 stapt uit en de lijn schuift naar rechts."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [30, 34] }
        - { team: d, label: L2, at: [54, 60] }
        - { team: d, label: L3, at: [104, 110] }
        - { team: d, label: R3, at: [128, 66] }
        - { team: d, label: R2, at: [154, 58] }
        - { team: d, label: R1, at: [176, 32] }
      balls: [[110, 124]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 132], [152, 122]] }
        - { kind: run, from: 7, pts: [[30, 34], [36, 38]] }
        - { kind: run, from: 8, pts: [[54, 60], [62, 62]] }
        - { kind: run, from: 9, pts: [[104, 110], [78, 88], [86, 64]] }
        - { kind: run, from: 10, pts: [[128, 66], [134, 66]] }
        - { kind: run, from: 11, pts: [[154, 58], [148, 100]] }
    - text: "RO speelt naar RH: R2 zakt terug, R1 dekt RH. Bij elke pass hetzelfde: één eruit, één terug."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [36, 38] }
        - { team: d, label: L2, at: [62, 62] }
        - { team: d, label: L3, at: [86, 64] }
        - { team: d, label: R3, at: [134, 66] }
        - { team: d, label: R2, at: [148, 100] }
        - { team: d, label: R1, at: [176, 32] }
      balls: [[162, 114]]
      arrows:
        - { kind: pass, from: 3, pts: [[152, 122], [190, 50]] }
        - { kind: run, from: 7, pts: [[36, 38], [44, 42]] }
        - { kind: run, from: 8, pts: [[62, 62], [66, 64]] }
        - { kind: run, from: 9, pts: [[86, 64], [88, 62]] }
        - { kind: run, from: 10, pts: [[134, 66], [138, 66]] }
        - { kind: run, from: 11, pts: [[148, 100], [160, 56]] }
    - text: "Loopt de CL langs de lijn naar rechts, dan laat L3 hem gaan en pakt R3 hem op: roep het."
      players:
        - { team: a, label: LH, at: [10, 50] }
        - { team: a, label: LO, at: [48, 122] }
        - { team: a, label: MO, at: [100, 132] }
        - { team: a, label: RO, at: [152, 122] }
        - { team: a, label: RH, at: [190, 50] }
        - { team: a, label: CL, at: [100, 80] }
        - { team: d, label: K, at: [92, 8] }
        - { team: d, label: L1, at: [44, 42] }
        - { team: d, label: L2, at: [66, 64] }
        - { team: d, label: L3, at: [88, 62] }
        - { team: d, label: R3, at: [138, 66] }
        - { team: d, label: R2, at: [160, 56] }
        - { team: d, label: R1, at: [176, 32] }
      balls: [[200, 42]]
      arrows:
        - { kind: run, from: 5, pts: [[100, 80], [120, 92]] }
        - { kind: run, from: 10, pts: [[138, 66], [132, 70]] }
---
