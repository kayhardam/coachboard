---
type: drill
title: "Break 1 tegen 1"
category: attack
ages: [u12, u14, u16]
level: basic
summary: "Een aanvaller dribbelt in volle vaart naar het doel aan de overkant, met een verdediger naast zich. Binnen 5 tellen moet het schot vallen. De stappen laten het laatste stuk zien, vanaf de middenlijn."
goal: "De aanvaller leert op snelheid dribbelen en afronden onder druk. De verdediger leert de bal af te pakken zonder te duwen."
organization:
  players: "Tweetallen van een aanvaller en een verdediger, en twee keepers."
  equipment: "Een bal per tweetal."
  space: "Het hele veld: de ene helft van de tweetallen start bij de ene 9 meter, de andere helft bij de andere, elk langs een eigen zijlijn."
rules:
  - "Aanvaller en verdediger starten tegelijk."
  - "Scoor binnen 5 tellen."
  - "De verdediger speelt de bal: niet duwen, trekken of vasthouden."
  - "Het volgende tweetal start na het schot."
coachingPoints:
  - "Aanvaller: dribbel recht op het doel af."
  - "Aanvaller: houd de bal aan de kant waar de verdediger niet loopt."
  - "Aanvaller: kijk op naar de keeper."
  - "Verdediger: loop eerst mee en let op het ritme van de stuit."
  - "Verdediger: tik de bal weg direct na de stuit."
mistakes:
  - "De aanvaller kijkt naar de bal en ziet de keeper niet."
  - "De aanvaller dribbelt aan de kant van de verdediger."
  - "De aanvaller remt af voor het schot."
  - "De verdediger grijpt naar de arm in plaats van naar de bal."
  - "De verdediger slaat te vroeg, mist en is de aanvaller kwijt."
easier:
  - "De verdediger start 2 meter achter de aanvaller."
  - "De verdediger loopt alleen mee en tikt nog niet."
  - "Zonder verdediger: dribbelen en schieten op snelheid."
harder:
  - "De verdediger start een stap voor de aanvaller."
  - "Scoor binnen 4 tellen."
  - "De keeper speelt de bal in: de aanvaller start zonder bal en vangt in de loop."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "A1 dribbelt vanaf de middenlijn naar het doel. V1 loopt naast hem mee."
      players:
        - { team: a, label: A1, at: [60, 188] }
        - { team: d, label: V1, at: [84, 188] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[48, 188]]
      arrows:
        - { kind: dribble, from: 0, pts: [[60, 188], [66, 142]] }
        - { kind: run, from: 1, pts: [[84, 188], [88, 138]] }
    - text: "A1 dribbelt door naar de 9 meter. V1 loopt mee en tikt direct na de stuit naar de bal."
      players:
        - { team: a, label: A1, at: [66, 142] }
        - { team: d, label: V1, at: [88, 138] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[54, 142]]
      arrows:
        - { kind: dribble, from: 0, pts: [[66, 142], [76, 98]] }
        - { kind: run, from: 1, pts: [[88, 138], [95, 94]] }
    - text: "A1 schiet binnen 5 tellen na de start. Daarna start het volgende tweetal."
      players:
        - { team: a, label: A1, at: [76, 98] }
        - { team: d, label: V1, at: [95, 94] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[64, 98]]
      arrows:
        - { kind: shot, from: 0, pts: [[76, 98], [90, 0]] }
---

Na het schot sluiten aanvaller en verdediger aan bij de rij bij dat doel en wisselen ze van rol. Zo loopt de oefening in een rondje door.
