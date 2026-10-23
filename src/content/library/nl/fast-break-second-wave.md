---
type: tactic
title: "Break: de tweede golf"
category: attack
ages: [u14, u16, u18, senior]
level: intermediate
summary: >-
  Wordt de eerste golf gestopt, dan komt de tweede golf. De opbouwers komen een tel later over de
  middenlijn. Ze vallen aan voordat de verdediging staat.
coachingPoints:
  - "Eerste golf: sprint altijd, ook zonder bal. Zo trek je verdedigers mee terug."
  - Is er geen kans, speel dan terug en forceer niets.
  - "Opbouwers: blijf breder staan dan de verdedigers die teruglopen."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "Na een redding of balwinst gaat de bal direct diep naar de eerste golf."
      players:
        - { team: a, label: LH, at: [40, 170] }
        - { team: a, label: RH, at: [166, 176] }
        - { team: a, label: LO, at: [58, 192] }
        - { team: a, label: MO, at: [100, 194] }
        - { team: a, label: RO, at: [142, 192] }
        - { team: a, label: CL, at: [122, 196] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[8, 199]]
      arrows:
        - { kind: run, from: 0, pts: [[40, 170], [18, 56]] }
        - { kind: run, from: 1, pts: [[166, 176], [182, 64]] }
        - { kind: pass, pts: [[8, 199], [18, 56]] }
    - text: "Wordt de eerste golf gestopt, dan gaat de bal terug naar de opbouwers."
      players:
        - { team: a, label: LH, at: [18, 56] }
        - { team: a, label: RH, at: [182, 64] }
        - { team: a, label: LO, at: [58, 192] }
        - { team: a, label: MO, at: [100, 194] }
        - { team: a, label: RO, at: [142, 192] }
        - { team: a, label: CL, at: [122, 196] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[28, 48]]
      arrows:
        - { kind: pass, from: 0, pts: [[18, 56], [58, 192]] }
    - text: "De opbouwers komen breed mee: links, midden en rechts."
      players:
        - { team: a, label: LH, at: [18, 56] }
        - { team: a, label: RH, at: [182, 64] }
        - { team: a, label: LO, at: [58, 192] }
        - { team: a, label: MO, at: [100, 194] }
        - { team: a, label: RO, at: [142, 192] }
        - { team: a, label: CL, at: [122, 196] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[68, 184]]
      arrows:
        - { kind: run, from: 2, pts: [[58, 192], [38, 122]] }
        - { kind: run, from: 3, pts: [[100, 194], [100, 128]] }
        - { kind: run, from: 4, pts: [[142, 192], [162, 122]] }
    - text: "De cirkelloper loopt tussen de teruglopende verdedigers door en zet zich vast in het midden."
      players:
        - { team: a, label: LH, at: [18, 56] }
        - { team: a, label: RH, at: [182, 64] }
        - { team: a, label: LO, at: [38, 122] }
        - { team: a, label: MO, at: [100, 128] }
        - { team: a, label: RO, at: [162, 122] }
        - { team: a, label: CL, at: [122, 196] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [80, 138] }
        - { team: d, at: [136, 146] }
      balls: [[48, 114]]
      arrows:
        - { kind: run, from: 11, pts: [[80, 138], [64, 92]] }
        - { kind: run, from: 12, pts: [[136, 146], [142, 94]] }
        - { kind: run, from: 5, pts: [[122, 196], [110, 88]] }
    - text: "De opbouwers spelen drie snelle passes, zodat de verdediging moet schuiven."
      players:
        - { team: a, label: LH, at: [18, 56] }
        - { team: a, label: RH, at: [182, 64] }
        - { team: a, label: LO, at: [38, 122] }
        - { team: a, label: MO, at: [100, 128] }
        - { team: a, label: RO, at: [162, 122] }
        - { team: a, label: CL, at: [110, 88] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [124, 70] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [64, 92] }
        - { team: d, at: [142, 94] }
      balls: [[48, 114]]
      arrows:
        - { kind: pass, from: 2, pts: [[38, 122], [100, 128]] }
        - { kind: pass, from: 3, pts: [[100, 128], [162, 122]] }
        - { kind: pass, from: 4, pts: [[162, 122], [131, 144], [100, 128]] }
        - { kind: run, from: 12, pts: [[142, 94], [162, 98]] }
        - { kind: run, from: 9, pts: [[124, 70], [146, 74]] }
    - text: "Daarna kiezen ze: een schot van afstand, de cirkelloper of de hoek."
      players:
        - { team: a, label: LH, at: [18, 56] }
        - { team: a, label: RH, at: [182, 64] }
        - { team: a, label: LO, at: [38, 122] }
        - { team: a, label: MO, at: [100, 128] }
        - { team: a, label: RO, at: [162, 122] }
        - { team: a, label: CL, at: [110, 88] }
        - { team: d, label: K, at: [96, 8] }
        - { team: d, at: [48, 64] }
        - { team: d, at: [84, 66] }
        - { team: d, at: [146, 74] }
        - { team: d, at: [160, 52] }
        - { team: d, at: [64, 92] }
        - { team: d, at: [162, 98] }
      balls: [[110, 120]]
      arrows:
        - { kind: shot, from: 3, pts: [[100, 128], [90, 0]] }
        - { kind: pass, pts: [[100, 128], [110, 88]] }
        - { kind: pass, pts: [[100, 128], [182, 64]] }
---
