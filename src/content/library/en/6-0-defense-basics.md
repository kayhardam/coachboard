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
    - text: "Each defender stands just outside the goal area and covers their zone, not a fixed attacker."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
        - { team: d, at: [22, 30] }
        - { team: d, at: [48, 58] }
        - { team: d, at: [80, 66] }
        - { team: d, at: [120, 66] }
        - { team: d, at: [152, 58] }
        - { team: d, at: [178, 30] }
      balls: [[110, 124]]
      arrows: []
    - text: "Whoever has the ball can score: the defender whose zone the ball reaches steps out to them."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "The rest of the line shifts toward the ball, so no one gets in behind the one who stepped out."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "LB passes to CB: the one who stepped out drops back and the defender of that zone steps out."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "The same on every pass: CB passes to RB, the one who stepped out drops back, another steps out."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
    - text: "When P runs along the line, their defender passes them on and the next defender picks them up."
      players:
        - { team: a, label: LW, at: [10, 50] }
        - { team: a, label: LB, at: [48, 122] }
        - { team: a, label: CB, at: [100, 132] }
        - { team: a, label: RB, at: [152, 122] }
        - { team: a, label: RW, at: [190, 50] }
        - { team: a, label: P, at: [100, 80] }
        - { team: d, label: GK, at: [92, 8] }
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
