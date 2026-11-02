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
3. Verhoog `VERSION` in `sw.js` én `APP_VERSION` bovenaan `js/app.js` (altijd gelijk; verschillen ze, dan toont de app de balk "nieuwe versie") en zet nieuwe bestanden in de lijst `FILES`.
   Is de wijziging belangrijk voor collega's? Pas dan `NEWS` in `js/app.js` aan (nieuwe `id`, items per stap 1–3):
   iedereen krijgt het welkomstscherm dan één keer te zien, ook wie "niet meer tonen" aanvinkte.
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

## Tekenregels (één stijl voor alle tekeningen)
Vastgelegd met Kurt (stap 3 van de stijlronde). Waarden staan als `STYLE` bovenaan `js/types.js`; gebruik die in plaats van losse getallen.
1. **Gezichtspunt.** Alles wat op de weg ligt of rijdt (voertuigen, personen, markeringen, obstakels) in bovenaanzicht.
   Alles op een paal (borden, verkeerslichten) in vooraanzicht, zoals de leerling het ziet; de voet van de paal staat op de plaats van het bord.
2. **Borden.** Zo dicht mogelijk bij de officiële SB250-borden op verkeersbord.be: vlak, geen glans of schaduw, officiële verhoudingen.
   Cijfers en tekst met `letters()` (eigen lijnletters), nooit met een lettertype. Kurt keurt nieuwe borden eerst op een proefpagina.
3. **Contour.** Elk vlak heeft een rand in een donkerdere tint van de eigen kleur (`edge(c)` = `shade(c,-.35)`), nooit zwart.
   Lijndiktes bij 100%: buitenrand groot voertuig `STYLE.lw.big` (2.5), kleine weggebruiker of voorwerp `STYLE.lw.small` (2),
   details (ruiten, deuren) `STYLE.lw.detail` (1.5), fijne lijnen `STYLE.lw.fine` (1.2).
4. **Licht en diepte.** Licht valt van boven: het dak of de bovenkant is lichter (`shade(c,.25)`), de voorruit lichter dan de achterruit.
   Elke weggebruiker en elk voorwerp dat boven de weg uitsteekt krijgt dezelfde zachte schaduw: zelfde vorm, verschoven `STYLE.shadow` (3,4), zwart met dekking .18.
   Markeringen en vlakken op het wegdek krijgen geen schaduw.
5. **Vormen.** Afgeronde hoeken: auto's ongeveer een derde van de breedte, bussen en vrachtwagens 6–8, kleine voorwerpen 3–4.
   Breedtes in de juiste verhouding (auto 1,8 m ≈ 64 px); lange voertuigen mogen korter getekend worden dan op schaal.
6. **Vaste kleuren** (`STYLE.col`): banden, koplampen, achterlichten, ruiten, huid, haar, richtingaanwijzer, remlicht, zwaailicht,
   en voor borden `RED`, `INK`, `ORANGE`, blauw D `#1b6ec2`, blauw E/F `FBLUE`. Instelbare kleuren alleen uit `COLORS`.
7. **Details.** Genoeg om het voertuig of de persoon meteen te herkennen op het digibord (spiegels, lichten, ruiten, helm),
   maar niets wat op ware grootte een vlek wordt. Controleer elke tekening op 100% en vergroot.
