---
type: drill
title: "Crossing in pairs"
category: attack
ages: [u12, u14, u16]
level: basic
summary: "Two lines cross in pairs and shoot at goal. That way you practice the timing of a crossing, without a defense."
goal: "The timing of a crossing: when to start, where to ask for the ball and when to pass it."
organization:
  players: "Two lines of three or more, and a goalkeeper."
  equipment: "Two cones, and balls with the left line."
  space: "Half court."
rules:
  - "Switch sides after five minutes: the balls go to the right line. That way you also cross the other way."
coachingPoints:
  - "Cross close behind each other."
  - "Ask for the ball with your hand."
mistakes:
  - "The second player starts too early and is standing still when the ball comes."
  - "The first player passes the ball behind the player crossing."
easier:
  - "No shot: the second player passes the ball back to the line."
harder:
  - "Put a defender between the cones."
related: []
board:
  v: 2
  court: half
  cones: [[64, 88], [136, 88]]
  frames:
    - text: "The first on the left runs diagonally to the middle with the ball."
      players:
        - { team: a, at: [70, 118] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [130, 118] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[80, 110], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 0, pts: [[70, 118], [96, 104]] }
    - text: "The first on the right crosses behind them and gets the ball."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [130, 118] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[106, 96], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 3, pts: [[130, 118], [98, 134], [80, 90]] }
        - { kind: pass, from: 0, pts: [[96, 104], [80, 90]] }
    - text: "That player shoots at goal."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [80, 90] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[90, 82], [80, 132], [80, 154]]
      arrows:
        - { kind: shot, from: 3, pts: [[80, 90], [90, 0]] }
    - text: "Then both join the back of the other line."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [80, 90] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[90, 0], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 0, pts: [[96, 104], [146, 140], [130, 184]] }
        - { kind: run, from: 3, pts: [[80, 90], [54, 140], [70, 184]] }
---
