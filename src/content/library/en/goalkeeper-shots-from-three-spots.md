---
type: drill
title: "Goalkeeper: shots from three spots"
category: goalkeeping
ages: [u12, u14, u16, u18, senior]
level: basic
summary: "Three shooters shoot one after another, from the left, the middle and the right. The goalkeeper picks their spot again for each shot."
goal: "Picking your spot for each shot: on the line between the ball and the middle of the goal."
organization:
  players: "A goalkeeper and three shooters (LB, CB and RB)."
  equipment: "Three cones on the free-throw line and a ball per shooter."
  space: "Half court."
rules:
  - "A shooter shoots only once the goalkeeper is standing still."
  - "After each round, the shooters switch spots."
coachingPoints:
  - "Step onto the line between the ball and the middle of the goal."
  - "Stand still at the moment of the shot."
  - "Hands up, beside your head."
mistakes:
  - "The goalkeeper steps only when the shooter is already throwing."
  - "The goalkeeper steps backward into the goal."
  - "The goalkeeper is still moving at the moment of the shot."
easier:
  - "Shoot at half power."
  - "Say beforehand which corner you'll shoot at."
harder:
  - "The shooters choose who shoots."
  - "Shoot with a jump shot."
related: []
board:
  v: 2
  court: half
  cones: [[24, 66], [84, 90], [176, 66]]
  frames:
    - text: "The goalkeeper steps toward LB's side."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[50, 78], [110, 88], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[100, 10], [90, 15]] }
    - text: "LB shoots at goal."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [90, 15] }
      balls: [[50, 78], [110, 88], [170, 78]]
      arrows:
        - { kind: shot, from: 0, pts: [[40, 86], [110, 0]] }
    - text: "The goalkeeper steps back to the middle."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [90, 15] }
      balls: [[110, 0], [110, 88], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[90, 15], [100, 10]] }
    - text: "CB shoots at goal."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[110, 0], [110, 88], [170, 78]]
      arrows:
        - { kind: shot, from: 1, pts: [[100, 96], [90, 0]] }
    - text: "The goalkeeper steps toward RB's side."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[110, 0], [90, 0], [170, 78]]
      arrows:
        - { kind: run, from: 3, pts: [[100, 10], [112, 13]] }
    - text: "RB shoots at goal."
      players:
        - { team: a, label: LB, at: [40, 86] }
        - { team: a, label: CB, at: [100, 96] }
        - { team: a, label: RB, at: [160, 86] }
        - { team: d, label: GK, at: [112, 13] }
      balls: [[110, 0], [90, 0], [170, 78]]
      arrows:
        - { kind: shot, from: 2, pts: [[160, 86], [90, 0]] }
---
