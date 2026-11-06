---
type: drill
title: "Schot met het verkeerde been voor"
category: attack
ages: [u12, u14, u16]
level: intermediate
summary: "In viertallen schieten uit de loop. De bal komt van opzij, de schutter zet twee passen en schiet met het been aan de kant van zijn werparm voor."
goal: "Schieten met het verkeerde been voor: het been aan de kant van je werparm. Dat schot komt een pas eerder dan de keeper verwacht."
organization:
  players: "Viertallen: een keeper, een schutter en twee aanspeelpunten met bal."
  equipment: "Per viertal een doel of doeltje, twee ballen en bij een doeltje twee pionnen voor de schotlijn."
  space: "Per viertal een baan van 5 meter breed, met de 9 meter als schotlijn; bij een doeltje pionnen op 6 meter."
rules:
  - "Geen loopfout: hoogstens drie passen met de bal."
  - "Schiet van achter de schotlijn."
  - "Wie scoort, wordt keeper."
  - "Na het schot haalt de schutter zijn bal en sluit aan bij de rij. Het aanspeelpunt is de volgende schutter."
coachingPoints:
  - "Aanspeelpunt: speel de bal voor de schutter uit, op borsthoogte."
  - "Vang in de loop, blijf niet staan."
  - "Tel mee: links, rechts, schot."
  - "Werparm hoog, elleboog boven je schouder."
  - "Schiet meteen na de tweede pas."
mistakes:
  - "De schutter zet een derde pas en schiet toch met het goede been voor."
  - "De schutter staat stil als de bal komt."
  - "De pass komt achter de schutter, zodat hij moet afremmen."
  - "De elleboog zakt en het schot wordt een duw."
easier:
  - "Zonder aanspeelpunt: de schutter start met de bal, zet twee passen en schiet."
  - "Eerst uit stand: zet het verkeerde been voor en schiet."
  - "Zonder keeper: mik op een pion in het doel."
harder:
  - "Schiet na één pas, of direct na de vangst."
  - "Het aanspeelpunt wisselt af: een strakke pass, een boogbal of een stuitpass."
  - "Zet een pion op de schotlijn als verdediger: schiet erlangs."
  - "Spreek vooraf een hoek af waar de schutter op mikt."
related: []
board:
  v: 2
  court: half
  cones: []
  frames:
    - text: "A1 loopt aan en A2 speelt naar A1."
      players:
        - { team: a, label: A1, at: [90, 172] }
        - { team: a, label: A2, at: [132, 128] }
        - { team: a, label: A3, at: [132, 150] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[144, 128], [144, 150]]
      arrows:
        - { kind: run, from: 0, pts: [[90, 172], [90, 136]] }
        - { kind: pass, from: 1, pts: [[132, 128], [90, 136]] }
    - text: "A1 loopt twee passen door en schiet met het verkeerde been voor."
      players:
        - { team: a, label: A1, at: [90, 136] }
        - { team: a, label: A2, at: [132, 128] }
        - { team: a, label: A3, at: [132, 150] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[100, 128], [144, 150]]
      arrows:
        - { kind: run, from: 0, pts: [[90, 136], [90, 100]] }
        - { kind: shot, from: 0, pts: [[90, 100], [90, 0]] }
    - text: "A2 loopt naar de startplek, A1 sluit aan achter A3. Nu speelt A3 aan: zo gaat het door."
      players:
        - { team: a, label: A1, at: [90, 100] }
        - { team: a, label: A2, at: [132, 128] }
        - { team: a, label: A3, at: [132, 150] }
        - { team: d, label: K, at: [100, 10] }
      balls: [[90, 0], [144, 150]]
      arrows:
        - { kind: run, from: 1, pts: [[132, 128], [90, 172]] }
        - { kind: run, from: 0, pts: [[90, 100], [166, 132], [132, 172]] }
---

Rechtshandig is het links, rechts en schieten: de bal komt van rechts. Linkshandig is het rechts, links en schieten: spiegel de opstelling, zodat de bal van links komt.
