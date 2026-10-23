---
type: drill
title: "Uitstappen en meeschuiven"
category: defense
ages: [u10, u12, u14, u16, u18]
level: basic
summary: "Een verdediger stapt uit naar zijn aanvaller en schuift mee. Zo houdt hij hem buiten de baan tussen de pionnen."
goal: "Uitstappen, meeschuiven en tussen je tegenstander en het doel blijven."
organization:
  players: "Groepjes van drie: een aanvaller, een verdediger en een aanspeelpunt."
  equipment: "Twee pionnen en een bal per groepje."
  space: "Een baan van 6 meter breed tussen twee pionnen op de 9 meter."
rules:
  - "De verdediger krijgt een punt als de aanvaller niet tussen de pionnen door komt."
  - "Na drie pogingen wissel je van rol."
coachingPoints:
  - "Lage houding, gewicht op je voorvoeten."
  - "Schuif met kleine pasjes."
  - "Armen omhoog, naar de bal."
mistakes:
  - "De verdediger stapt te laat uit."
  - "De verdediger kruist zijn benen bij het schuiven."
  - "De verdediger staat recht voor de aanvaller, niet iets naar de kant van diens werparm."
easier:
  - "Maak de baan smaller."
  - "De aanvaller loopt zonder bal."
harder:
  - "Maak de baan breder."
  - "De aanvaller mag schieten als hij erdoor is."
related:
  - nl/6-0-defense-basics
board:
  v: 2
  court: half
  cones: [[70, 90], [130, 90]]
  frames:
    - text: "Het aanspeelpunt speelt de aanvaller aan."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [100, 60] }
        - { team: p, at: [100, 162] }
      balls: [[110, 154]]
      arrows:
        - { kind: pass, from: 2, pts: [[100, 162], [100, 120]] }
    - text: "De verdediger stapt uit naar de aanvaller."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [100, 60] }
        - { team: p, at: [100, 162] }
      balls: [[110, 112]]
      arrows:
        - { kind: run, from: 1, pts: [[100, 60], [106, 92]] }
    - text: "De aanvaller dribbelt naar de pion links."
      players:
        - { team: a, at: [100, 120] }
        - { team: d, at: [106, 92] }
        - { team: p, at: [100, 162] }
      balls: [[110, 112]]
      arrows:
        - { kind: dribble, from: 0, pts: [[100, 120], [76, 114]] }
    - text: "De verdediger schuift mee en blijft tussen hem en het doel."
      players:
        - { team: a, at: [76, 114] }
        - { team: d, at: [106, 92] }
        - { team: p, at: [100, 162] }
      balls: [[86, 106]]
      arrows:
        - { kind: run, from: 1, pts: [[106, 92], [87, 90]] }
    - text: "Komt de aanvaller er niet door, dan speelt hij terug naar het aanspeelpunt."
      players:
        - { team: a, at: [76, 114] }
        - { team: d, at: [87, 90] }
        - { team: p, at: [100, 162] }
      balls: [[86, 106]]
      arrows:
        - { kind: pass, from: 0, pts: [[76, 114], [100, 162]] }
---
