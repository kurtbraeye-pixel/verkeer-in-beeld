# Verkeer in beeld — werkafspraken

Webapp (geen build-stap) om Belgische verkeerssituaties te tekenen voor rijles/verkeersles.
Gemaakt door Kurt Braeye (Ligo Midden- en Zuid-West-Vlaanderen). Communiceer in het Nederlands (Vlaams).

## Online
- Repo: `kurtbraeye-pixel/verkeer-in-beeld` (publiek, branch `main`)
- Site: https://kurtbraeye-pixel.github.io/verkeer-in-beeld/ (GitHub Pages, deploy from branch, root)
- `gh` staat in `/usr/local/bin/gh`; `git push` en `gh` hebben de sandbox uitgeschakeld nodig (login zit in de keychain).

## Werkwijze bij elke wijziging
1. Aanpassen, daarna lokaal testen met `tools/devserver.py` (poort 8124, geen browsergeheugen; launch-config `verkeer-dev`).
2. **Bij testen in de browser:** eerst `localStorage['kruispunt-bouwer-v2']` bewaren (sessionStorage) en na de test terugzetten,
   met `Storage.prototype.setItem` geblokkeerd vóór het herladen (anders overschrijft `pagehide` de herstelde tekening).
   De gebruiker tekent vaak zelf in het testvenster.
3. Verhoog `VERSION` in `sw.js` en zet nieuwe bestanden in de lijst `FILES`.
4. Toon wat er veranderde en **vraag akkoord voordat je commit en pusht**. Pas na "ja, zet online": commit, push,
   wacht op de Pages-build (`gh api repos/kurtbraeye-pixel/verkeer-in-beeld/pages/builds/latest`) en controleer de site.

## Code
- `js/types.js`: tekeningen van alle onderdelen (TYPES), materiaalpaneel (SECTIONS), POSTS (alles op een paal), sanitizeItem.
- `js/presets.js`: voorbeeldsituaties PRESETS (rechte weg), XPRESETS (kruispunt), RPRESETS (rotonde); optioneel `q` = meerkeuzevraag voor het werkblad.
- `js/app.js`: toestand, plaatsing (G() met hv/hh/ex/ey), werkbalk, eigenschappenpaneel (`renderInspector`), opslaan, presentatiemodus, werkblad.
  Nieuwe instelbare eigenschappen van een onderdeel horen in het eigenschappenpaneel, niet in de werkbalk.
- Tekenvlak 1000×860, midden (500,430). Rotatie: 0 = rijdt naar boven; borden draaien mee met de rijrichting (`follow`).
- Stijl: SVG als strings, compact ES5-achtig, Nederlandstalig commentaar.
- Opmaak: ontwerpregels (tokens voor letters, ruimtes, afrondingen, schaduwen, kleuren licht/donker) bovenaan `css/style.css`;
  gebruik die variabelen in plaats van losse waarden. Iconen: Lucide-sprite bovenaan `index.html`, gebruik `<svg class="ic"><use href="#i-…"/></svg>`.
  Knoppen: `.btn` (secundair), `.btn.ghost` (zonder rand), `.btn.primary` (hoofdactie), `.btn.icon` (alleen icoon).

## Inhoudelijk
- Belgische regels en officiële SB250-borden; bij twijfel lesmateriaal of verkeersbord.be als referentie (zelf natekenen, niets kopiëren).
- Op de rotonde rijdt men in tegenwijzerzin; auto op de ring onder hoek θ heeft `rot = θ`.
- Kleuren volgen de Ligo-huisstijl (petrol `#056181`, navy `#041c37`, oranje `#cc4e06`).
