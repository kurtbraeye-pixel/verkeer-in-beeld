# Verkeer in beeld

Een webapp om verkeerssituaties te tekenen op een kruispunt, een rechte weg of een rotonde:
weggebruikers, verkeerslichten, verkeersborden (per officiële reeks), wegmarkeringen, wegenwerken en meer.

- **Opslaan** als afbeelding (voor Word of een presentatie) of als werkbestand (`.json`) om later verder te tekenen.
- **Werkblad**: drukt de tekening af met een meerkeuzevraag en, desgewenst, een antwoordsleutel (ook als PDF).
- **Presenteren**: schermvullend voor het digibord; met ← en → (of een presenter) door de voorbeelden.
- Werkt in elke moderne browser, op pc, Chromebook en tablet; installeerbaar als app en werkt offline (PWA).

## Projectstructuur

```
index.html              de pagina
css/style.css           opmaak (licht en donker thema)
js/types.js             tekeningen van alle onderdelen + indeling van het materiaalpaneel
js/presets.js           voorbeeldsituaties (kruispunt en rechte weg)
js/app.js               de app: toestand, slepen, werkbalk, opslaan, exporteren
sw.js                   service worker (offline werken)
manifest.webmanifest    gegevens om de app te installeren
fonts/                  Lexend-lettertype (lokaal, SIL Open Font License)
icons/                  app-iconen
```

Er is geen build-stap: wat in deze map staat, is precies wat online komt.

## Lokaal testen

De JavaScript-modules en de service worker werken niet als je `index.html`
rechtstreeks opent (`file://`). Start daarom een kleine webserver in deze map:

```bash
python3 -m http.server 8123
```

en open <http://localhost:8123>.

Tip: `python3 tools/devserver.py` start dezelfde server op poort 8124, maar verbiedt de browser
bestanden te onthouden. Zo zie je na elke wijziging meteen de nieuwste versie.

## Publiceren op GitHub Pages

1. Maak een repository op GitHub en upload de inhoud van deze map (niet de map zelf).
2. Ga naar **Settings → Pages**.
3. Kies bij **Source** voor *Deploy from a branch*, branch `main`, map `/ (root)`.
4. Na een minuutje staat de app op `https://<gebruikersnaam>.github.io/<repository>/`.

## Een nieuwe versie uitrollen

Gebruikers krijgen wijzigingen automatisch: de app haalt altijd eerst de nieuwste
bestanden op en gebruikt de bewaarde kopie alleen als er geen internet is.
Voeg je nieuwe bestanden toe (bijvoorbeeld een extra JavaScript-bestand), zet ze dan
ook in de lijst `FILES` in `sw.js` en verhoog `VERSION` (bv. `'v2'`).

## Toetsenbord

| Toets | Actie |
| --- | --- |
| Ctrl/Cmd + Z | Ongedaan maken |
| Ctrl/Cmd + Shift + Z of Ctrl + Y | Opnieuw |
| Delete / Backspace | Gekozen onderdeel verwijderen |
| Pijltjes (+ Shift) | Gekozen onderdeel verschuiven |
| + / − | Groter / kleiner |
| Esc | Selectie opheffen |
