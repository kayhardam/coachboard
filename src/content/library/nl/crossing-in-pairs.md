---
type: drill
title: "Kruisen in tweetallen"
category: attack
ages: [u12, u14, u16]
level: basic
summary: "Twee rijen kruisen in tweetallen en schieten op doel. Zo oefen je de timing van een kruising, zonder verdediging."
goal: "De timing van een kruising: wanneer je start, waar je de bal vraagt en wanneer je hem afgeeft."
organization:
  players: "Twee rijen van drie of meer, en een keeper."
  equipment: "Twee pionnen en ballen bij de linkerrij."
  space: "Een half veld."
rules:
  - "Wissel na vijf minuten van kant: de ballen gaan naar de rechterrij. Zo kruis je ook de andere kant op."
coachingPoints:
  - "Kruis dicht achter elkaar langs."
  - "Vraag de bal met je hand."
mistakes:
  - "De tweede start te vroeg en staat stil als de bal komt."
  - "De eerste speelt de bal achter de kruiser."
easier:
  - "Zonder schot: de tweede speelt de bal terug naar de rij."
harder:
  - "Zet een verdediger tussen de pionnen."
related:
  - nl/crossing-cb-lb
board:
  v: 2
  court: half
  cones: [[64, 88], [136, 88]]
  frames:
    - text: "De eerste van links loopt met de bal schuin naar het midden."
      players:
        - { team: a, at: [70, 118] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [130, 118] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[80, 110], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 0, pts: [[70, 118], [96, 104]] }
    - text: "De eerste van rechts kruist erachter langs en krijgt de bal."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [130, 118] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[106, 96], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 3, pts: [[130, 118], [98, 134], [80, 90]] }
        - { kind: pass, from: 0, pts: [[96, 104], [80, 90]] }
    - text: "Die schiet op doel."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [80, 90] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[90, 82], [80, 132], [80, 154]]
      arrows:
        - { kind: shot, from: 3, pts: [[80, 90], [90, 0]] }
    - text: "Daarna sluiten ze allebei aan bij de andere rij."
      players:
        - { team: a, at: [96, 104] }
        - { team: a, at: [70, 140] }
        - { team: a, at: [70, 162] }
        - { team: a, at: [80, 90] }
        - { team: a, at: [130, 140] }
        - { team: a, at: [130, 162] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[90, 0], [80, 132], [80, 154]]
      arrows:
        - { kind: run, from: 0, pts: [[96, 104], [146, 140], [130, 184]] }
        - { kind: run, from: 3, pts: [[80, 90], [54, 140], [70, 184]] }
---
