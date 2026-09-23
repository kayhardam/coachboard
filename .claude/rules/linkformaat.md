---
paths:
  - "src/lib/board/format*.ts"
  - "src/lib/board/fixtures/**"
---

# Linkformaat

- Oude links werken voor altijd. Hoe een v1-link wordt gelezen, de bevroren v1-encoder en de v1-testlinks veranderen niet. Een hook blokkeert bewerkingen; omzeil die niet via de shell.
- Elke formaatwijziging volgt `docs/v2/linkformaat-v2.md`: eerst dat document bijwerken en akkoord vragen, dan de code.
- Schrijf altijd de laagste versie die de tekening kan uitdrukken.
- Decoder: nooit een exception naar de UI, harde grenzen, onbekende onderdelen overslaan.
- Inhoud uit een link is onbetrouwbaar: altijd als tekst weergeven, nooit als HTML.
- Draai na elke wijziging de formaattests en de fuzz- en groottetests, en toon de uitvoer.
