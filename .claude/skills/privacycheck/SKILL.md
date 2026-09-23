---
name: privacycheck
description: Controleert de privacybelofte van Handball Coachboard (geen tekening naar een server, geen cookies, geen externe scripts op het bord en /b/). Gebruik vóór elke PR die het bord, /b/, de Worker, delen of statistiek raakt.
---

Controleer de privacybelofte. Geef per punt OK of FOUT, met bewijs.

1. Draai de privacy-e2e-test (docs/v2/plan.md, T3) en toon de uitvoer.
2. Zoek in de diff naar nieuwe netwerkverzoeken (fetch, sendBeacon, XMLHttpRequest, WebSocket, bronnen van script, img, link en iframe, lettertypen) en naar gebruik van location.href, location.hash of document.URL. Leg per vondst uit waarom het veilig is, of repareer het.
3. Controleer dat er geen cookies bij zijn gekomen, en geen opslag (localStorage, sessionStorage, IndexedDB) buiten de bestaande sleutels van het bord. Noem die sleutels.
4. Controleer dat inhoud uit een link nergens als HTML wordt weergegeven ({@html}, innerHTML, insertAdjacentHTML).
5. Klopt de privacypagina in elke taal nog met wat de code doet? Zo niet, stel de tekstwijziging voor.

Sluit af met één regel: PRIVACY OK of PRIVACY FOUT.
