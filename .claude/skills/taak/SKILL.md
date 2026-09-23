---
name: taak
description: Voert één taak uit docs/v2/plan.md uit, van plan tot bewijs en PR. Gebruik als /taak T5.
disable-model-invocation: true
---

Voer taak $ARGUMENTS uit docs/v2/plan.md uit.

1. Lees alleen de sectie van $ARGUMENTS in docs/v2/plan.md, en de documenten waarnaar die sectie verwijst. Zijn de taken in de kolom "Na" nog niet afgevinkt, stop dan en meld dat.
2. Verken de relevante code. Moet je veel bestanden lezen, gebruik dan een subagent en werk met zijn samenvatting.
3. Maak een plan: welke bestanden je wijzigt, welke tests je schrijft, wat buiten scope blijft, en hoe je elk punt onder "Klaar als" aantoont. Stel eerst je vragen, zeker over handbalinhoud of termen. Wacht op akkoord voordat je iets wijzigt.
4. Werk op een eigen branch met $ARGUMENTS in de naam. Schrijf de tests vóór of tegelijk met de code.
5. Draai tests, build en lint. Bij UI: bekijk het resultaat op 390 px breed in de browser en maak een screenshot.
6. Raakt de taak het bord, /b/, de Worker, delen of statistiek? Voer dan de skill privacycheck uit.
7. Laat een subagent de diff toetsen aan "Klaar als" van $ARGUMENTS. Alleen echte gaten tellen, geen stijlvoorkeuren. Los die gaten op.
8. Vink de gehaalde punten af in docs/v2/plan.md, commit, en open een PR met: wat er veranderd is, bewijs per punt onder "Klaar als", en wat de eigenaar nog zelf moet testen.
