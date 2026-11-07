---
type: tactic
title: "6-0 defense: the basics"
category: defense
ages: [u14, u16, u18, senior]
level: basic
summary: >-
  In the 6-0 defense, six defenders form a line just outside the goal area, each in their own zone.
  Whoever has the ball is always defended. The rest shift with the ball.
coachingPoints:
  - "Always someone on the ball: step out to whoever can score."
  - Step out to the side of their throwing arm.
  - Call every shift and every switch on P.
  - Keep P in front of you, never behind your back.
  - "Keep your arms up: that way you disrupt the pass, not just the shot."
  - Shift with small, quick steps and don't cross your feet.
related:
  - en/fast-break-second-wave
  - en/step-out-and-shift
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "Each defender covers a zone, counted from the outside in: L1 to L3 and R3 to R1. L1 covers LW."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
        - { team: d, label: L1, at: [20, 32] }
        - { team: d, label: L2, at: [36, 60] }
        - { team: d, label: L3, at: [64, 68] }
        - { team: d, label: R3, at: [112, 62] }
        - { team: d, label: R2, at: [138, 60] }
        - { team: d, label: R1, at: [164, 42] }
      balls: [[6, 58]]
      arrows: []
    - text: "LW passes to LB: L2 steps out on the throwing-arm side, the line shifts toward the ball."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "LB passes to CB: L2 drops back, L3 steps out, the line shifts: no one gets in behind L3."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "CB passes to RB: L3 drops back, R2 steps out and the line shifts to the right."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "RB passes to RW: R2 drops back, R1 covers RW. The same on every pass: one out, one back."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "When P runs along the line to the right, L3 lets them go and R3 picks them up: call it."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
