---
type: drill
title: "Joris en de draak"
category: defense
ages: [u10, u12, u14]
level: basic
summary: "Een tikspel in viertallen. Drie spelers houden elkaar bij de heupen vast en vormen zo de draak. De tikker staat ervoor en probeert de achterste te tikken."
goal: "Warm worden met snelle richtingsveranderingen. De draak leert samen bewegen en de achterste afschermen."
organization:
  players: "Viertallen: een tikker en drie spelers achter elkaar."
  equipment: "Geen materiaal."
  space: "Per viertal een vak van ongeveer 6 bij 6 meter, verdeeld over het veld."
rules:
  - "Een tik op de achterste is een punt voor de tikker."
  - "Laat de draak los, dan is dat ook een punt voor de tikker."
  - "De voorste schermt af met zijn lichaam en houdt de tikker niet vast."
  - "Een ronde duurt ongeveer 30 seconden. Daarna wordt de voorste de tikker en sluit de tikker achteraan."
coachingPoints:
  - "Tikker: maak een schijnbeweging en versnel dan."
  - "Voorste: armen wijd en blijf voor de tikker."
  - "Draak: kleine, snelle pasjes."
  - "Blijf dicht op elkaar, handen op de heupen."
  - "Achterste: kijk langs de rij waar de tikker is."
mistakes:
  - "De rij rekt uit en breekt bij de eerste draai."
  - "De voorste loopt weg van de tikker in plaats van ertussen te blijven."
  - "De tikker rent rondjes en verandert niet van richting."
  - "De achterste draait de verkeerde kant op, de tikker tegemoet."
easier:
  - "Maak de draak korter: twee spelers in plaats van drie."
  - "Speel rondes van 20 seconden."
  - "De achterste steekt een hesje als staart in zijn broekband: de tikker pakt het hesje."
harder:
  - "Maak de draak langer: vier of vijf spelers."
  - "De tikker dribbelt met een bal en tikt met zijn vrije hand."
  - "Twee tikkers tegen één lange draak."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "De tikker (T) loopt om de rij heen om A3 te tikken. De rij draait mee: A1 blijft ertussen."
      players:
        - { team: d, label: T, at: [100, 100] }
        - { team: a, label: A1, at: [100, 130] }
        - { team: a, label: A2, at: [100, 148] }
        - { team: a, label: A3, at: [100, 166] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[100, 100], [128, 112], [138, 148]] }
        - { kind: run, from: 1, pts: [[100, 130], [115, 138]] }
        - { kind: run, from: 3, pts: [[100, 166], [85, 158]] }
    - text: "T probeert het langs de andere kant. De rij draait weer mee en laat elkaar niet los."
      players:
        - { team: d, label: T, at: [138, 148] }
        - { team: a, label: A1, at: [115, 138] }
        - { team: a, label: A2, at: [100, 148] }
        - { team: a, label: A3, at: [85, 158] }
      balls: []
      arrows:
        - { kind: run, from: 0, pts: [[138, 148], [100, 106], [62, 148]] }
        - { kind: run, from: 1, pts: [[115, 138], [100, 130], [85, 138]] }
        - { kind: run, from: 3, pts: [[85, 158], [100, 166], [115, 158]] }
---
