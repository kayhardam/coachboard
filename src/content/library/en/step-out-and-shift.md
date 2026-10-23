---
type: drill
title: "Step out and shift"
category: defense
ages: [u10, u12, u14, u16, u18]
level: basic
summary: "A defender steps out to the attacker and shifts along. That way they keep the attacker out of the lane between the cones."
goal: "Stepping out, shifting along and staying between your opponent and the goal."
organization:
  players: "Groups of three: an attacker, a defender and a passer."
  equipment: "Two cones and a ball per group."
  space: "A lane 6 meters wide between two cones on the free-throw line."
rules:
  - "The defender scores a point if the attacker doesn't get through between the cones."
  - "After three attempts, switch roles."
coachingPoints:
  - "Stay low, weight on the balls of your feet."
  - "Shift with small steps."
  - "Arms up, toward the ball."
mistakes:
  - "The defender steps out too late."
  - "The defender crosses their legs when shifting."
  - "The defender stands straight in front of the attacker, not slightly toward the attacker's throwing arm."
easier:
  - "Make the lane narrower."
  - "The attacker runs without the ball."
harder:
  - "Make the lane wider."
  - "The attacker may shoot once they're through."
related:
  - en/6-0-defense-basics
board:
  v: 2
  court: half
  cones: [[70, 90], [130, 90]]
  frames:
    - text: "The passer passes to the attacker."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [100, 60] }
        - { team: p, at: [100, 162] }
      balls: [[110, 154]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 162], [100, 120]] }
    - text: "The defender steps out toward the attacker."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [100, 60] }
        - { team: p, at: [100, 162] }
      balls: [[110, 112]]
      arrows:
        - { kind: run, from: 1, pts: [[100, 60], [106, 92]] }
    - text: "The attacker dribbles toward the left cone."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [106, 92] }
        - { team: p, at: [100, 162] }
      balls: [[110, 112]]
      arrows:
        - { kind: dribble, from: 0, pts: [[100, 120], [76, 114]] }
    - text: "The defender shifts along and stays between the attacker and the goal."
      players:
        - { team: a, at: [76, 114] }
        - { team: d, at: [106, 92] }
        - { team: p, at: [100, 162] }
      balls: [[86, 106]]
      arrows:
        - { kind: run, from: 1, pts: [[106, 92], [87, 90]] }
    - text: "If the attacker can't get through, they pass back to the passer."
      players:
        - { team: a, at: [76, 114] }
        - { team: d, at: [87, 90] }
        - { team: p, at: [100, 162] }
      balls: [[86, 106]]
      arrows:
        - { kind: pass, from: 0, pts: [[76, 114], [100, 162]] }
---
