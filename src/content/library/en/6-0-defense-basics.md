---
type: tactic
title: "6-0 defense: the basics"
category: defense
ages: [u14, u16, u18, senior]
level: basic
summary: >-
  In the 6-0 defense, six defenders form a line just outside the goal area. They shift together with
  the ball. That forces the attack to shoot from distance.
coachingPoints:
  - "Center defenders: call every shift."
  - Keep the pivot in front of you, never behind your back.
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
    - text: "Each defender stands just outside the goal area and covers the attacker in front of them."
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
    - text: "When an attacker gets the ball, their defender steps out to them."
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
    - text: "The rest of the line shifts toward the ball."
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
        - { kind: run, from: 10, pts: [[120, 66], [100, 68]] }
        - { kind: run, from: 11, pts: [[152, 58], [132, 64]] }
        - { kind: run, from: 12, pts: [[178, 30], [162, 46]] }
    - text: "When the pivot moves along the line, the next defender picks them up."
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
        - { team: d, at: [100, 68] }
        - { team: d, at: [132, 64] }
        - { team: d, at: [162, 46] }
      balls: [[58, 114]]
      arrows:
        - { kind: run, from: 5, pts: [[100, 80], [76, 88]] }
        - { kind: run, from: 9, pts: [[64, 72], [70, 80]] }
---
