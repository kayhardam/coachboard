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
        - { team: a, at: [56, 132] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [144, 132] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[66, 124], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 0, pts: [[56, 132], [100, 112]] }
    - text: "The first on the right crosses behind them and gets the ball."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [144, 132] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[110, 104], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 3, pts: [[144, 132], [104, 140], [70, 112]] }
        - { kind: pass, from: 0, pts: [[100, 112], [70, 112]] }
    - text: "That player shoots at goal."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [70, 112] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[80, 104], [66, 146], [66, 168]]
      arrows:
        - { kind: shot, from: 3, pts: [[70, 112], [90, 0]] }
    - text: "Then both join the back of the other line."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [70, 112] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: GK, at: [100, 10] }
      balls: [[90, 0], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 0, pts: [[100, 112], [124, 172], [144, 198]] }
        - { kind: run, from: 3, pts: [[70, 112], [80, 170], [56, 198]] }
---
