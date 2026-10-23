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
related: []
board:
  v: 2
  court: half
  cones: [[64, 88], [136, 88]]
  frames:
    - text: "De eerste van links loopt met de bal schuin naar het midden."
      players:
        - { team: a, at: [56, 132] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [144, 132] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[66, 124], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 0, pts: [[56, 132], [100, 112]] }
    - text: "De eerste van rechts kruist erachter langs en krijgt de bal."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [144, 132] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[110, 104], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 3, pts: [[144, 132], [104, 140], [70, 112]] }
        - { kind: pass, from: 0, pts: [[100, 112], [70, 112]] }
    - text: "Die schiet op doel."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [70, 112] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[80, 104], [66, 146], [66, 168]]
      arrows:
        - { kind: shot, from: 3, pts: [[70, 112], [90, 0]] }
    - text: "Daarna sluiten ze allebei aan bij de andere rij."
      players:
        - { team: a, at: [100, 112] }
        - { team: a, at: [56, 154] }
        - { team: a, at: [56, 176] }
        - { team: a, at: [70, 112] }
        - { team: a, at: [144, 154] }
        - { team: a, at: [144, 176] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[90, 0], [66, 146], [66, 168]]
      arrows:
        - { kind: run, from: 0, pts: [[100, 112], [124, 172], [144, 198]] }
        - { kind: run, from: 3, pts: [[70, 112], [80, 170], [56, 198]] }
---
