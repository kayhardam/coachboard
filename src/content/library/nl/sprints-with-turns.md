---
type: drill
title: "Sprinten en draaien"
category: defense
ages: [u12, u14, u16, u18, senior]
level: basic
summary: "Een sprint van 30 meter langs vier pionnen in een T, met vier keer draaien. In drietallen: één loopt, twee rusten."
goal: "Kort sprinten, afremmen, draaien en weer wegstarten, zoals je in een wedstrijd steeds doet."
organization:
  players: "Drietallen die na elkaar starten."
  equipment: "Vier pionnen per drietal."
  space: "Per drietal een T van pionnen: 5 meter van de start naar het midden en 5 meter naar elke kant."
rules:
  - "Draai bij elke pion eerst helemaal en start dan weg: je sprint altijd vooruit."
  - "De volgende start als de loper terug is bij de start."
  - "Loop vier series. In een serie loopt iedereen twee keer."
  - "Tussen de series is er een minuut rust."
coachingPoints:
  - "Rem af met kleine pasjes, vlak voor de pion."
  - "Zak door je knieën als je draait."
  - "Kijk eerst naar de volgende pion, start dan."
  - "De eerste drie passen zijn de snelste."
  - "Sprint door tot voorbij de start."
mistakes:
  - "Zijwaarts of achteruit lopen in plaats van draaien."
  - "Meters voor de pion al afremmen."
  - "Rechtop draaien, waardoor de start traag wordt."
  - "Uitlopen op de laatste 5 meter."
easier:
  - "Zet de pionnen 3 meter uit elkaar in plaats van 5."
  - "Loop drie series in plaats van vier."
  - "Loop één keer per serie."
harder:
  - "Met bal: dribbel de hele T."
  - "Twee drietallen starten tegelijk, elk op een eigen T: wie is het eerst terug?"
  - "Tik elke pion aan met je hand."
related: []
board:
  v: 2
  court: half
  cones: [[50, 110], [100, 110], [150, 110], [116, 176]]
  frames:
    - text: "A1 sprint 5 meter naar voren, tot de middelste pion."
      players:
        - { team: a, label: A1, at: [100, 176] }
        - { team: a, label: A2, at: [78, 176] }
        - { team: a, label: A3, at: [56, 176] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[100, 176], [100, 126]] }
    - text: "A1 draait helemaal en sprint 5 meter naar rechts, tot de rechterpion."
      players:
        - { team: a, label: A1, at: [100, 126] }
        - { team: a, label: A2, at: [78, 176] }
        - { team: a, label: A3, at: [56, 176] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[100, 126], [150, 126]] }
    - text: "A1 draait en sprint 10 meter naar links, tot de linkerpion."
      players:
        - { team: a, label: A1, at: [150, 126] }
        - { team: a, label: A2, at: [78, 176] }
        - { team: a, label: A3, at: [56, 176] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[150, 126], [50, 126]] }
    - text: "A1 draait en sprint 5 meter terug naar de middelste pion."
      players:
        - { team: a, label: A1, at: [50, 126] }
        - { team: a, label: A2, at: [78, 176] }
        - { team: a, label: A3, at: [56, 176] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[50, 126], [100, 126]] }
    - text: "A1 draait en sprint 5 meter terug naar de start. Daarna is A2 aan de beurt."
      players:
        - { team: a, label: A1, at: [100, 126] }
        - { team: a, label: A2, at: [78, 176] }
        - { team: a, label: A3, at: [56, 176] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[100, 126], [100, 176]] }
---
