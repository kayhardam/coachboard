---
type: tactic
title: "Fast break: the second wave"
category: attack
ages: [u14, u16, u18, senior]
level: intermediate
summary: >-
  If the first wave is stopped, the second wave follows. The back court players cross the center line
  a beat later. They attack before the defense is set.
coachingPoints:
  - "First wave: always sprint, even without the ball. That pulls defenders back with you."
  - If there's no chance, play it back and don't force it.
  - "Back court players: stay wider than the retreating defenders."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "After a save or a steal, the ball goes deep to the first wave straight away."
      players:
        - { team: a, label: LW, at: [40, 170] }
        - { team: a, label: RW, at: [166, 176] }
        - { team: a, label: LB, at: [58, 192] }
        - { team: a, label: CB, at: [100, 194] }
        - { team: a, label: RB, at: [142, 192] }
        - { team: a, label: P, at: [122, 196] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[8, 199]]
      arrows:
        - { kind: run, from: 0, pts: [[40, 170], [18, 56]] }
        - { kind: run, from: 1, pts: [[166, 176], [182, 64]] }
        - { kind: pass, pts: [[8, 199], [18, 56]] }
    - text: "If the first wave is stopped, the ball goes back to the back court players."
      players:
        - { team: a, label: LW, at: [18, 56] }
        - { team: a, label: RW, at: [182, 64] }
        - { team: a, label: LB, at: [58, 192] }
        - { team: a, label: CB, at: [100, 194] }
        - { team: a, label: RB, at: [142, 192] }
        - { team: a, label: P, at: [122, 196] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[28, 48]]
      arrows:
        - { kind: pass, from: 0, pts: [[18, 56], [58, 192]] }
    - text: "The back court players come up wide: left, center and right."
      players:
        - { team: a, label: LW, at: [18, 56] }
        - { team: a, label: RW, at: [182, 64] }
        - { team: a, label: LB, at: [58, 192] }
        - { team: a, label: CB, at: [100, 194] }
        - { team: a, label: RB, at: [142, 192] }
        - { team: a, label: P, at: [122, 196] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[68, 184]]
      arrows:
        - { kind: run, from: 2, pts: [[58, 192], [38, 122]] }
        - { kind: run, from: 3, pts: [[100, 194], [100, 128]] }
        - { kind: run, from: 4, pts: [[142, 192], [162, 122]] }
    - text: "The pivot runs through the retreating defenders and posts up in the middle."
      players:
        - { team: a, label: LW, at: [18, 56] }
        - { team: a, label: RW, at: [182, 64] }
        - { team: a, label: LB, at: [38, 122] }
        - { team: a, label: CB, at: [100, 128] }
        - { team: a, label: RB, at: [162, 122] }
        - { team: a, label: P, at: [122, 196] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[48, 114]]
      arrows:
        - { kind: run, from: 11, pts: [[80, 138], [70, 78]] }
        - { kind: run, from: 12, pts: [[136, 146], [134, 82]] }
        - { kind: run, from: 5, pts: [[122, 196], [110, 88]] }
    - text: "The back court players play three quick passes, so the defense has to shift."
      players:
        - { team: a, label: LW, at: [18, 56] }
        - { team: a, label: RW, at: [182, 64] }
        - { team: a, label: LB, at: [38, 122] }
        - { team: a, label: CB, at: [100, 128] }
        - { team: a, label: RB, at: [162, 122] }
        - { team: a, label: P, at: [110, 88] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [70, 78] }
        - { team: d, at: [134, 82] }
      balls: [[48, 114]]
      arrows:
        - { kind: pass, from: 2, pts: [[38, 122], [100, 128]] }
        - { kind: pass, from: 3, pts: [[100, 128], [162, 122]] }
        - { kind: pass, from: 4, pts: [[162, 122], [131, 144], [100, 128]] }
        - { kind: run, from: 8, pts: [[84, 66], [96, 68]] }
        - { kind: run, from: 9, pts: [[124, 70], [136, 72]] }
    - text: "Then they choose: a shot from distance, the pivot or the wing."
      players:
        - { team: a, label: LW, at: [18, 56] }
        - { team: a, label: RW, at: [182, 64] }
        - { team: a, label: LB, at: [38, 122] }
        - { team: a, label: CB, at: [100, 128] }
        - { team: a, label: RB, at: [162, 122] }
        - { team: a, label: P, at: [110, 88] }
        - { team: d, label: GK, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [96, 68] }
        - { team: d, at: [136, 72] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [70, 78] }
        - { team: d, at: [134, 82] }
      balls: [[110, 120]]
      arrows:
        - { kind: shot, from: 3, pts: [[100, 128], [90, 0]] }
        - { kind: pass, from: 3, pts: [[100, 128], [110, 88]] }
        - { kind: pass, from: 3, pts: [[100, 128], [182, 64]] }
---
