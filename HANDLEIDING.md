# Kamiel: technische handleiding

Stand: 7 oktober 2026 (versie 0.10.1)

## Voor wie dit is

Dit document beschrijft Kamiel volledig, zodat een nieuwe assistent (of een mens) zonder de oorspronkelijke chat meteen verder kan. Het beschrijft de stand van versie **0.7.2** (6 oktober 2026).

**Aan een nieuwe assistent:**

- De code staat op GitHub: `dylanbaele2000-glitch/kamiel-addon`, publiek, branch `main`. Lees de code altijd na voor je iets aanneemt: dit document legt uit waarom en hoe, de code is de waarheid.
- De eigenaar is geen programmeur. Praat Nederlands, leg stappen uit op beginnersniveau ("klik op… → dan op…"), en geef nooit terminalcommando's aan hem: hij werkt via Home Assistant en de tablet.
- Werkwijze die goed werkte: kleine versies, elke wijziging lokaal testen (met een nagebootste Home Assistant, zie Testen), versienummer ophogen in `config.yaml`, pushen naar GitHub, en de gebruiker laten updaten via Home Assistant.
- Vraag niet om toestemming voor kleine dingen; stel wel vragen als een keuze echt bij hem ligt (stijl, wat hij wil zien).
- Zijn esthetische lat ligt hoog: het moet altijd als een kunstwerk ogen, niet als een dashboard.

## Wat en wie Kamiel is

Kamiel is de "geest van het huis": een bruine pixel-art alpaca die op een tablet aan de muur door een eindeloze droomwereld wandelt. Het is in de eerste plaats een **kunstwerk dat nooit twee keer hetzelfde is**, en pas daarna een handig scherm met informatie.

**Stijl:** weirdcore/dreamcore, met de look van een VHS-camcorder uit de jaren 80 en 90. Linksboven staat een camcorder-stempel ("PM 4:12 / OCT 5 2026"), over het beeld liggen scanlijnen, ruis en een kleurverschuiving. Overdag is het optimistisch-vreemd met een diep elektrisch blauwe lucht; 's nachts griezeliger en donkerder.

**Kamiel zelf:**

- Pixel-art die de eigenaar zelf tekende (twee houdingen: hoofd links en hoofd rechts). De loop- en knipperanimaties zijn daaruit afgeleid.
- Hij staat op een plek en wandelt dag en nacht om de `walk_minutes` (standaard 20) naar een buurplek. Nek en hoofd wijzen altijd in de looprichting.
- Hij knippert met allebei de ogen (ook het oog achter de snuit). Verder is hij bewust weinig geanimeerd: geen eten, niet rondkijken.
- Hij kan kleren dragen (kleerkast) en knikt mee op snelle muziek.

**De wereld:** een doorlopend panorama (twee Canva-panorama's van 7680×1200, samen 8 plekken), met objecten die de eigenaar uploadt: dingen op de grond, op de horizon en in de lucht, wolken, kaders met foto's en tekstborden. Objecten bewegen nooit en staan nooit over elkaar. Elke plek wordt opnieuw samengesteld als Kamiel er weg is: kom je terug, dan staat er iets anders.

**Bewust niet (geschrapt):** een hut, glitch-scènes, plant- en afvalscènes, een Windows-95-pop-up als enige interactie, afstand tussen personen. Herinneringen vervangen de plant/afval-ideeën.

Het personage heette eerst Lavi; dat werd Kamiel de alpaca.

## Systeemoverzicht

Alle logica zit in één Home Assistant-add-on, **Kamiel Studio**, op de Home Assistant Green van de eigenaar. De tablet is "dom": hij toont een webpagina van de add-on en tekent alles zelf in de browser.

```
Tablet (Fully Kiosk) ──:8100──▶ ┌──────── Home Assistant Green ────────┐ ◀── GitHub (nieuwe versie = update)
                                │  Kamiel Studio (add-on, server.py)   │ ──▶ Telegram (berichten ophalen)
Gsm: HA-app ──:8099 (ingress)─▶ │  /data: kamiel.json, media, origineel│
                                │          ▲ REST API met token        │
                                │          ▼                           │
                                │  Home Assistant Core: weer, zon,     │
                                │  speaker, scripts, De Lijn, timers   │
                                └──────────────────────────────────────┘
```

De tablet praat alleen met de add-on (poort 8100); de add-on praat met Home Assistant via zijn token en haalt zelf Telegram-berichten op, dus er hoeft niets op de router opengezet te worden. Updates komen van GitHub: Home Assistant bouwt de add-on opnieuw wanneer het versienummer stijgt.

- **Hardware:** Home Assistant Green (aarch64), een Android-tablet aan de muur met Fully Kiosk Browser, Google Home-speakers (Cast).
- **Taal en techniek:** Python 3.12 op Alpine 3.20 (aiohttp, numpy, scipy, Pillow) voor de server; gewone HTML, CSS en JavaScript (canvas) voor tablet en Studio, zonder frameworks of buildstap.

## Repository en bestanden

Alles staat in één Home Assistant-add-on-repository, ongeveer 4300 regels code zonder frameworks of buildstap.

| Bestand | Wat het doet |
| --- | --- |
| `repository.yaml` | Maakt van de GitHub-repo een add-on-winkel in Home Assistant (naam "Kamiel"). |
| `kamiel_studio/config.yaml` | De add-on: naam, **versie** (ophogen bij elke release), architecturen (aarch64, amd64), ingress op poort 8099, open poort 8100, `homeassistant_api: true`. |
| `kamiel_studio/build.yaml` | Basisimages `ghcr.io/home-assistant/{arch}-base:3.20` (Alpine 3.20). |
| `kamiel_studio/Dockerfile` | `apk add python3 py3-aiohttp py3-numpy py3-scipy py3-pillow tzdata`, kopieert `app/` en `run.sh`. |
| `kamiel_studio/run.sh` | `#!/usr/bin/with-contenv bashio` + `exec python3 /app/server.py` (with-contenv is nodig om de token door te geven). |
| `app/server.py` | De volledige server (aiohttp): opslag, API, Home Assistant, Telegram, nummerlijst, gebeurtenissen, beeldverwerking aansturen. |
| `app/static/compose.js` | Hoe een plek opgebouwd wordt: kijkwijzen, kandidaat-opstellingen met score, raakvlakken, heuvels, stapels. Ook geladen door de Studio (lijst kijkwijzen). |
| `app/static/pets.js` | De huisdieren in pixel-art (rasters met palet, alle beelden), gemaakt door `tools/petgen.py` (vormen → rand → vachtruis → beelden staan/knipper/loop1-4/ineengedoken/sprong). Pas je een dier aan: script aanpassen en opnieuw draaien, `pets.js` wordt overschreven. |
| `app/static/events.js` | De wereldgebeurtenissen (lijst, planning per dag/week, alle animaties). De lijst bovenaan wordt ook door de server gelezen. |
| `app/process.py` | Beeldverwerking met numpy/scipy/Pillow: uitknippen, dreamcore-filter, fotovlak in kaders, kleurvarianten van borden, panorama-naden. |
| `app/static/display.html` | De tablet: één HTML-pagina met canvas-renderer en alle live-functies (±1300 regels). |
| `app/static/studio.html` | Kamiel Studio: het beheerscherm in Home Assistant. |
| `app/static/reminder.js` | Gedeeld: wanneer een herinnering aan staat, en de memestijl-tekst (ook voor berichten). |
| `app/static/outfits.js` | Gedeeld: de pixel-art kleren als rasters, tekenen en voorbeeldjes. |
| `app/static/kamiel/*.webp` | Kamiels frames: `stand`, `blink`, `walk1`–`walk4` (281×493, hoofd naar links). |
| `app/static/voorbeeldfoto.webp` | Neutrale foto voor kaders als er nog geen foto's zijn. |

De standaardafbeeldingen van de eigenaar zitten bewust **niet** in de repo (die is publiek); alleen Kamiel en de voorbeeldfoto.

## De server (add-on)

`server.py` is één Python-proces met **twee webservers** in dezelfde asyncio-lus:

- **Poort 8099 – Kamiel Studio.** Alleen bereikbaar via Home Assistant (ingress, in de zijbalk). Alles wat schrijft (uploaden, instellingen, berichten, Telegram koppelen) zit hier. Ingress geeft headers mee zoals `X-Remote-User-Display-Name` (gebruikt voor de naam onder berichten).
- **Poort 8100 – de tablet.** Open op het thuisnetwerk (`http://<ip-van-HA>:8100`). In principe alleen-lezen; de enige schrijvende acties zijn bewust beperkt tot wat in de Studio is ingesteld (een script starten, een van de 9 knoppen, muziekbediening, kleren kiezen, iets "gezien" melden, een herinnering wegtikken, een /kijk-screenshot afleveren).

**Opslag:** alles in `/data` (env `KAMIEL_DATA`), dat blijft bewaard bij updates en zit in de Home Assistant-back-ups; alleen verwijderen van de add-on wist het.

- `/data/kamiel.json`: de hele database (zie Datamodel). Wordt atomair weggeschreven (`.tmp` + `os.replace`).
- `/data/media/`: verwerkte afbeeldingen (webp, met png als terugval).
- `/data/originals/`: de originele uploads (sinds 0.1.4), zodat iets opnieuw verwerkt kan worden (bv. soort wijzigen, tekstbord maken).

**`version` in kamiel.json:** `save_db()` zet `version` op de huidige tijd; de tablet vraagt `api/world` elke 2 minuten op en **herlaadt de pagina** als `version` veranderd is. Snelle, kleine dingen (berichten, Telegram, kleren, wegtikken) slaan op met `save_db(db, bump=False)` om geen herlaad te veroorzaken.

**Home Assistant:** door `homeassistant_api: true` krijgt de add-on een `SUPERVISOR_TOKEN`. `read_token()` zoekt die in de omgeving en in `/run/s6/container_environment/`. Aanroepen gaan naar `http://supervisor/core/api` (env `KAMIEL_HA_URL` voor testen). Helpers: `ha_get`, `ha_service`, `ha_service_response` (met `?return_response`, voor weersvoorspellingen). Bij opstarten logt de server "Verbonden met Home Assistant." of een waarschuwing.

**Beeldverwerking (`process.py`):**

- Elk upload krijgt automatisch de **dreamcore-filter** (`dream()`): bloom, opgetilde zwarten, pastel split-tone (koele teal schaduwen, warm roze hoogtes), zachtheid en een halo rond uitgeknipte vormen. Sterkte: elementen 1.3, kaders 0.8, foto's 1.0, wolken 0.6 zonder halo, panorama 0.55, albumhoes 0.7.
- Witte achtergronden worden transparant gemaakt, losse stipjes verwijderd, alles bijgesneden.
- **Kaders:** `frame_hole()` zoekt het grootste puur witte (of transparante binnen-)vlak (≥ 2% van het beeld) en maakt daar een masker van; een foto wordt daarin uitgesneden.
- **Tekstborden:** `sign_plate()` vindt het gekleurde bordvlak (4 hoekpunten) en maakt kleurvarianten (paars, groen, blauw, oranje, cyaan, rood) door alleen die tint te verschuiven; het gele smileytje blijft.
- **Panorama:** naar 600 px hoog, breedte afgerond op veelvouden van 960 (= één plek), naden onzichtbaar gemaakt (gespiegeld uitbreiden, horizon vloeiend laten aansluiten, organisch masker), en een **horizonprofiel** om de 8 px berekend dat de tablet gebruikt om dingen op de grond te zetten.
- Uploads worden in de browser al verkleind en één per één verstuurd, want Home Assistant-ingress weigert verzoeken boven 16 MB.

## Datamodel

Alles leeft in één JSON-bestand, `/data/kamiel.json`. `load_db()` vult ontbrekende instellingen aan met `DEFAULT_SETTINGS` (en migreert oude sleutels), dus nieuwe instellingen hebben altijd een standaardwaarde.

**Bovenste niveau:**

| Sleutel | Inhoud |
| --- | --- |
| `assets` | Alle elementen (lijst, velden hieronder). |
| `photos` | Foto's voor kaders: `id`, `file`, `original`, `size`, `label`. |
| `panorama` | `file`, `width`, `horizon` (y-waarde om de 8 px). |
| `settings` | Alle instellingen (tabel verderop). |
| `reminders` | Herinneringen: `id`, `text`, `active`, `repeat` (once/daily/weekly/monthly/yearly), `date`, `until`, `days` (1=ma…7=zo), `every_weeks`, `month_day`, `from`, `to`, `scenes` (om de hoeveel plekken), `color`, `position`. |
| `dismissed` | Weggetikte herinneringen: `{reminder-id: "YYYY-MM-DD"}` (de dag van die keer). |
| `message` | Huidig bericht: `id`, `text`, `since`, `until`, `sign`, `chat` (Telegram), `seen`. |
| `spotlight` | Via Telegram gestuurde foto: `id`, `file`, `until`, `chat`. |
| `telegram` | `token` (geheim, nooit naar de tablet), `bot`, `chats` (`id`, `name`), `offset`, `minutes`, `pair` (code + geldig tot). |
| `outfit`, `outfit_day` | Wat Kamiel draagt, en de dag waarop iemand dat koos (wint van "verrassing van de dag"). |
| `version` | Tijdstempel; verandert = de tablet herlaadt. |

**Velden van een element (`assets[]`):** `id`, `label`, `kind` (`grond`, `horizon`, `lucht`, `wolk`, `kader`), `moment` (`dag`/`nacht`/`altijd`), `rare` (`gewoon`/`zeldzaam`/`heelzeldzaam`, gewicht 1 / 0.25 / 0.06), `size` \[b, h\], `files` (`main`, `mask`, `kleur_<kleur>`), `original`, `active`, en optioneel: `sign` + `plate` + `colors` (tekstbord), `hole` (fotovlak van een kader), `scale` (eigen grootte, 0.5–2), `sink` (zakdiepte horizon in %), `period` (+ `period_from`/`period_to` als MM-DD), `tv` (kader dat als muziek-tv dient), `tap` (`{action: niets|vertrek|script, entity}`), `weather` (lijst uit `zon`, `bewolkt`, `regen`, `sneeuw`, `mist`).

**Instellingen (`settings`):**

| Sleutel | Standaard | Betekenis |
| --- | --- | --- |
| `weather_entity` | "" | Weer-entiteit (bv. Met.no). |
| `walk_minutes` | 20 | Verder wandelen na zoveel minuten, dag én nacht. |
| `night_start` / `night_end` | 22:00 / 06:00 | Nachtperiode (voor dag/nacht-elementen). |
| `counts` | dag: grond 2–4, horizon 1–3, lucht 1–2, kader 0–1; nacht: lucht 1–3 | Hoeveel objecten per soort: `[minstens, hoogstens]`, per dag/nacht. |
| `max_objects` | 12 | Maximum objecten per plek (wolken en live-dingen niet meegeteld). |
| `spacing` | 30 | Pixels tussen objecten (negatief = overlappen). |
| `lane` | 94 | Vrije ruimte links en rechts van Kamiels midden. |
| `mix_layers` | false | Niet meer gebruikt: grond staat nooit vóór horizon. |
| `compose` | alle kijkwijzen aan, `color` true | Welke kijkwijzen mogen, kleurharmonie aan/uit. |
| `hills` | `chance` 40, `height` 18 | % plekken met heuvels, hoogte in % van het scherm. |
| `stack` | `chance` 35, `max` 3 | Kans dat een drager iets draagt, hoogste stapel (2–4). |
| `outfits_off` | \[\] | Kleren die níet in de kast hangen (vervangt `outfits_on`, zodat nieuwe kleren vanzelf beschikbaar zijn). |
| `events` | aan, lama 1/dag, vaak 3/dag, soms 4/week, avond aan, `off` [] | Wereldgebeurtenissen. |
| `sizes` | grond 10–40, horizon 15–42, lucht 12–38, kader 18–42 | Hoogte in % van de schermhoogte. |
| `giant_chance` | 10 | % kans op een reuzenobject. |
| `horizon_sink` | 3 | Hoeveel % een horizon-object in de grond zakt. |
| `season_colors` | true | Lichte kleurtoon per seizoen. |
| `words` | 6 zinnen | Woorden op de tekstborden. |
| `osd_entities` | \[\] | Tot 3 sensoren onder de datum. |
| `empty_tap` | vensters | Tikken op een lege plek: `vensters`, `url`, `vertrek` of `niets`. |
| `tap_url` | "" | Adres bij `empty_tap = url`. |
| `sun_script` / `moon_script` | "" | Wat tikken op zon/maan start. |
| `kamiel_tap` | kleerkast | Tikken op Kamiel opent de kleerkast. |
| `windows`, `window_titles`, `window_close`, `window_layout` | alles aan, \*.exe, 60 s, verspreid | De oude Windows-vensters. |
| `buttons` | \[\] | 9 knoppen: `icon`, `label`, `entity`. |
| `outfit_mode` | kiezen | Kleerkast: `kiezen` / `dag` / `uit`. |
| `media_player` | "" | Speaker voor de muziek-tv. |
| `board` | \[\] | Vertrekbordrijen: `label`, `entity`, `kind`, `lines`, `dest`, `count`. |
| `departure_trigger` | "" | Sensor die het vertrekbord automatisch toont. |
| `timer_entities` | \[\] | Google Home `_timers`-sensoren. |
| `message_entity`, `message_minutes` | "", 60 | Tekst-helper voor berichten uit automatiseringen. |

Buiten `settings` staan ook `songs` (de nummerlijst: `id`, `title`, `bpm`; vooraf gevuld met 13 nummers) en `event_req` (`n`, `id`, `at`: het laatst gevraagde event).

Oude, ongebruikte sleutels die nog kunnen voorkomen: `night_walks` (0.8.0: Kamiel wandelt nu ook 's nachts gewoon om de `walk_minutes`), `chances` (vervangen door `counts`; een soort die op 0 % stond, krijgt 0–0), `nod_bpm`, `min_frames`, `frame_ratio`, `departures` (vervangen door `board`), `people` (afstand-functie, verwijderd).

## API-overzicht

De tablet gebruikt poort 8100, de Studio 8099; de "gedeelde" endpoints bestaan op beide. Pagina's worden geserveerd met `?v=<tijdstempel>` achter elk script, en `/static/*.js` krijgt `Cache-Control: no-cache` (zie Valkuilen).

| Endpoint | Poort | Wat |
| --- | --- | --- |
| `GET /` | beide | 8099: Studio, 8100: tablet. `GET /display` toont de tablet ook via 8099. |
| `GET /api/world` | beide | Alles wat de wereld nodig heeft: elementen, foto's, panorama, instellingen, herinneringen, weggetikte herinneringen, `version`. |
| `GET /api/state` | beide | Elke minuut: zon (uit `sun.sun`), weer (gemapt), wind, bewolking, sensorregels onder de datum. |
| `GET /api/live` | beide | Elke 5 s: bericht, muziek (titel, hoes-sleutel, BPM, positie), trigger, Telegram-foto, /kijk-verzoek, kleren, timers, weggetikte herinneringen. |
| `GET /api/desk` | beide | Gegevens voor de vensters: weer + 4-daagse voorspelling, knoppen met hun status, muziek, kleren. |
| `GET /api/departures` | beide | Vertrekbordrijen (`label`, `line`, `kind`, `dest`, `due` als epoch). |
| `GET /api/cover` | beide | Albumhoes van de speaker, door de dreamcore-filter, in cache. |
| `GET /media/{naam}` | beide | Verwerkte afbeeldingen (lang te cachen, de namen veranderen bij elke verwerking). |
| `POST /api/tap/{sun\|moon\|el-<id>}` | beide | Start het script dat in de Studio gekozen is (alleen script/scene/automation/(input\_)button). |
| `POST /api/button/{0–8}` | beide | Een van de 9 knoppen: lampen/schakelaars toggelen, scripts/scènes starten. |
| `POST /api/media/{playpause\|next\|prev\|volup\|voldown}` | beide | Muziek bedienen. |
| `POST /api/outfit` | beide | Kleren kiezen (één per lichaamsdeel). |
| `POST /api/seen/{id}`, `/api/photo-seen/{id}` | beide | Iemand tikte een bericht/foto weg → Telegram meldt "gezien". |
| `POST /api/reminder-dismiss/{id}` | beide | Herinnering weg tot de volgende keer. |
| `POST /api/snapshot/{id}` | beide | De tablet levert een JPEG voor /kijk; alleen geldig als er een verzoek openstaat. |
| `GET /api/entities?domain=a,b` | 8099 | Lijst van Home Assistant-entiteiten voor de keuzelijsten. |
| `POST/PATCH/DELETE /api/assets[/id]` | 8099 | Elementen uploaden (multipart: `kind`, `dag`, `nacht`, `rare`, `sign`, `weer`, `files`), aanpassen, verwijderen. |
| `POST /api/photos`, `DELETE /api/photos/{id}` | 8099 | Foto's. |
| `POST /api/panorama` | 8099 | Panorama vervangen (alle delen in één verzoek, in de browser verkleind tot 600 px hoog). |
| `PUT /api/settings` | 8099 | Instellingen (elk veld wordt gevalideerd). |
| `POST/DELETE /api/message` | 8099 | Bericht sturen of wissen (wissen haalt ook een Telegram-foto weg). |
| `GET/PUT /api/telegram`, `POST /api/telegram/pair`, `DELETE /api/telegram/chats/{id}` | 8099 | Telegram instellen, koppelcode maken, iemand ontkoppelen. |
| `POST/PUT/DELETE /api/reminders[/id]` | 8099 | Herinneringen. |
| `GET/POST /api/songs`, `PUT/DELETE /api/songs/{id}` | 8099 | Nummerlijst om mee te knikken (titel + BPM). |
| `POST /api/event` | 8099 | Een event vragen (`{"id": "mol"}` of leeg = willekeurig); de tablet ziet het via `api/live` → `event`. |

## De tablet: hoe de wereld getekend wordt

`display.html` tekent op een canvas van **960×600** (logische pixels), dat met CSS `object-fit: cover` het scherm vult. Alles staat in één `async`-functie; bovenaan wordt `api/world` geladen (met herhaalpogingen), daarna start de tekenlus met `requestAnimationFrame`.

**Camcorder-look:** een SVG-filter `#vhs` op het canvas (rood en blauw kanaal 1,4 px verschoven, lichte blur), een div met scanlijnen, een vignet, bewegende ruis (`drawVHS`), en de datum/tijd als HTML-tekst in het lettertype VT323 (Google Fonts). Er wordt **nooit** `ctx.filter` gebruikt: dat sneed tekst af.

**Volgorde per frame:**

1. Hoofdcanvas: lucht (kleurverloop volgens de zonnehoogte, sterren, zon met gloed, maan).
2. Wereldcanvas: lucht-objecten → wolken (eigen canvas met warme/donkere tint) → horizon-objecten → panorama (de grond, die horizon-objecten deels bedekt) → grond-objecten met schaduw → Kamiel. Daarna een nachttint met `source-atop` en een seizoenstint.
3. Weer bovenop: regen, sneeuw, bliksem, vuurwerk, mist, horizongloed.
4. Teksten: herinnering, bericht, tikring. Dan VHS-ruis en de datum.

**Wereld en plekken:** het panorama is `PW` breed; elke 960 px is een **plek** (`N` plekken). Kamiel staat op `kx` (wereldcoördinaat), de camera centreert hem en de wereld loopt rond. Een plek heeft `items` (de objecten), `night`, `weather` en `seen`.

**Een plek samenstellen (`compose.js`, opgeroepen door `compose(i)`):**

- Elke plek krijgt één **kijkwijze**: `vrij` (balans, derdelijnen), `held` (één groot hoofdobject op een derde, rest ×0,62), `diepte` (groot object vooraan, deels uit beeld), `leegte` (bijna niets; negeert het minimum), `groepje` (drie grondobjecten dicht bij elkaar), `ritme` (één element drie keer, kleiner naar achter), `verhouding` (veel lucht of veel grond), `lijn` (van groot vooraan naar klein bij Kamiel). Te testen met `?stijl=held`.
- Er worden 28 opstellingen geprobeerd; de score telt: ontbrekende objecten (−3 elk), **raakvlakken** (−40 elk: twee dingen die net raken of net overlappen, een top op de horizonlijn of een heuveltop, iets dat net de rand of Kamiel raakt), balans als een wip (gewicht × oppervlak × afstand tot het midden), zware dingen op een derde (±160 px), dieptespreiding bij `diepte`, en op ±60 % van de plekken **kleurharmonie** (kleuren 45–150° uit elkaar botsen, max. één felle uitschieter). Gewicht (`wt`), hoofdkleur (`hue`) en kleurrijkheid (`sat`) meet de server per element bij het uploaden (`process.metrics`); oudere elementen worden bij het opstarten één keer gemeten.
- Grond en horizon delen één rij: **grondobjecten staan nooit vóór horizonobjecten**. Elementen met `gaze` (links/rechts) worden gespiegeld zodat ze naar Kamiel kijken. `grass_only`: kleiner gemaakt en zo diep gezet dat de top onder de horizon blijft.
- **Heuvels:** per plek met kans `hills.chance` 1 of 2 heuvelruggen (bulten met cosinusprofiel, naar 0 aan de plekranden zodat plekken op elkaar aansluiten). `drawHills()` tekent ze tussen wolken en horizonobjecten, gevuld met de grasstrook van het panorama van die plek plus een blauwige waas (achterste rug meer); de onderkant verdwijnt onder het panorama. Horizonobjecten staan soms (50 %) ×0,6 op de voorste rug (`onHill`, `base`), en worden eerst getekend.
- **Stapels:** na de opstelling krijgt een drager (`carry`) met kans `stack.chance` iets dat kan stapelen (`stack`) erbovenop: 30–65 % van zijn breedte, nooit hoger dan 85 % van de drager, tot `stack.max` hoog. Een kind heeft `on` (de drager) en `ox`; `itemPos()` zet het op de bovenrand van de drager (`topOf()` meet die per kolom) en het volgt de drager in events. Ook wolken kunnen dragen (`cl.stack`). Niet bovenaan het scherm (drager onder y 110).


- Alleen elementen die nu mogen: dag/nacht, periode (seizoen/feestdag, met Pasen berekend), weertype, niet de muziek-tv. Zeldzaamheid weegt mee; periode- en weer-gebonden elementen ×3. De laatste 3 keuzes worden vermeden.
- Per soort een willekeurig aantal tussen `counts[dag|nacht][soort]` minstens en hoogstens (aangepast door de kijkwijze); het maximum wordt afgedwongen. Zijn er minder elementen dan gevraagd, dan mag een grond- of horizon-element twee keer (nooit in de lucht). De laatste 6 keuzes worden vermeden.
- Grootte: tussen de ingestelde min/max (% van de schermhoogte), grond-objecten vooraan groter (diepte), soms een reus, maal de eigen `scale`. Te brede dingen worden kleiner zodat ze naast Kamiel passen.
- Plaatsing: grootste eerst, afwisselend naar de leegste kant, `spacing` px tussenruimte, en een **vrije baan rond Kamiel** (`lane`, 94 px aan elke kant).  Lucht-objecten komen als laatste en mogen niets raken dat staat.
- Horizon-objecten staan op het **laagste grondpunt onder hun voet** (uit het horizonprofiel) en zakken dan `sink`% in. Grond-objecten staan tussen horizon+14 en `FEET` = 548, op hun echte voet (`footOf()` meet de onderste ondoorzichtige rij, want de dreamcore-gloed maakt de afbeelding groter), met een zachte schaduw eronder.
- Borden krijgen een willekeurig woord + kleur; kaders een willekeurige foto.
- Een plek wordt opnieuw samengesteld zodra ze niet zichtbaar is en al gezien werd, of als dag/nacht of het weer veranderde. Komt Kamiel terug, dan staat er dus iets nieuws. **Let op:** `visible()` rekent zonder marge. Tot 0.7.2 stond er 40 px marge, en omdat een plek precies één scherm breed is, telden de buren dan altijd als zichtbaar: A→B→A gaf hetzelfde A (opgelost in 0.8.0, getest).
- Afbeeldingen laden pas als een element echt gebruikt wordt (lazy getters), zodat een grote bibliotheek de tablet niet vertraagt.

**Zon, maan en lucht:**

- Zon: liefst `sun.sun` uit Home Assistant (elevation/azimuth), anders zelf berekend voor de locatie die in Home Assistant is ingesteld (`api/config`, doorgegeven in `api/world` als `location`). Azimut 180° (zuid) = midden van het scherm.
- Overdag diep elektrisch blauw (`[[6,40,196],[38,98,236]]`), goudkleurig bij lage zon, donkerblauw 's nachts; grijzer bij slecht weer.
- Maan: echte fase uit de ecliptische lengtes van zon en maan (met evectie en variatie), maar **niet** de echte positie: `moonArc()` laat ze 's nachts een eigen boog maken, opkomend in het oosten bij zonsondergang, hoogst halverwege de nacht, ondergaand in het westen bij zonsopgang (zoals de zon overdag). Overdag geen maan. Wassend = rechts verlicht, afnemend = links. Aardschijn op het donkere deel, oranje tijdens Halloween.

**Weer:** Home Assistant-condities worden `helder`, `licht`, `bewolkt`, `regen`, `onweer`, `sneeuw` of `mist`. Het aantal wolken volgt `cloud_coverage` als dat er is, de windsnelheid bepaalt hoe snel ze drijven. Seizoenstint (lente roze, zomer geel, herfst oranje, winter koel), lichte sneeuw rond Kerst 's nachts, vuurwerk op 31/12 vanaf 23:30.

**Kamiel:**

- Frames 225 px hoog, voeten op `FEET` = 548, midden van het scherm. Loopt 70 px/s met 6 beelden per seconde, knippert om de 2 tot 6 seconden, gespiegeld als hij naar rechts loopt.
- `schedule()` (elke 15 s): dag en nacht na `walk_minutes` één plek verder (soms als wandel-event), tenzij er al een event bezig is.
- Tekenen gaat via `drawLlama(g, o)` (ook voor Heidi en de tweeling; `o.set` kiest de beeldenset uit `SETS`, met per lama eigen oog- en mondpositie): houding, schaal, draaiing, rek, hoofdhoek, ogen (`dicht`, `vies`, `rol`, `groot`, `hart`, `spiraal`, `x`, `blij`, `triest`, `boos`), open mond, kleren, tint (`wit`, `tweeling`), kou, wazig, uiteenvallen. De toestand van Kamiel zit in `kam` (`x`, `y`, `s`, `face`, `pose`, `layer` far/mid/front …); buiten events staat die op de standaard.
- Kleren: rasters in `outfits.js` (25 stuks, sloten hoofd/ogen/nek/neus/lijf; lijf-kleren zoals het ruimtepak zijn een `paint`-functie die over zijn eigen pixels kleurt, zodat ze met de poten meelopen), in coördinaten van het volle frame (780×1370, blokjes van 20 = zijn eigen pixelgrootte); ze bewegen mee in elke houding omdat zijn hoofd nooit verschuift (alleen de poten).
- Meeknikken: het frame wordt op y = 470 (onder het hoofd) in twee getekend; het hoofd draait rond de nek tot ±9° op elke tel.

**Hoe vaak de tablet vraagt:** `api/live` elke 5 s, `api/state` elke 60 s, `api/world` elke 120 s (herladen bij nieuwe `version`), planning elke 15 s, vensters elke 5 s als ze open staan.

## Live-functies en tikken

Alles hieronder komt binnen via `api/live` (elke 5 s) of wordt door tikken gestart. Nieuwe dingen in de wereld (muziek-tv, vertrekbord, timerbord, Telegram-kader) mogen altijd vóór horizon- en luchtobjecten staan; die blijven gewoon staan. Alleen als er op de grond echt geen plaats is, maakt het kleinste grondobject plaats (borden verbergen het tijdelijk).

**Berichten en herinneringen (memestijl):** `KamielReminder.render()` tekent tekst in laag-resolutie, vet (lettertype Arimo), rood met een cyaan "spook" en een donkere rand, en schaalt dat wazig op, zoals een te vaak opgeslagen meme. Berichten staan er meteen en blijven tot ze verlopen of weggetikt worden (dan meldt Telegram "gezien"). Herinneringen verschijnen alleen als ze aan staan (`isActive`), op elke N-de plek waar Kamiel aankomt, faden uit als hij wandelt, en kunnen weggetikt worden tot hun volgende keer (`occurrence()` = de dag van die keer; vensters over middernacht horen bij de dag waarop ze begonnen).

**Telegram-foto:** komt als `spotlight` binnen. Staat er op een plek al een kader, dan komt de foto **in dat kader** (de oude foto komt terug als de spotlight weg is); anders komt er een kader bij (eigen kader-element of ingebouwd goudkleurig kader). Weg door `/wis`, "Bericht wissen" in de Studio, erop tikken (meldt "Foto gezien"), of als de tijd om is.

**Muziek (`addMusic`):** speelt de gekozen speaker, dan toont elke plek de albumhoes. Meestal in een **fotokader** (het grootste dat er al staat, `music: true`, anders een toegevoegd kader `musicAdded`); de hoes wordt heel getoond en de rest van het fotovlak gevuld met de meest voorkomende kleur van de hoes (`dominant()`). Soms (±25 %) een tv op een wolk, soms (±20 %) een tv op iets dat kan dragen. De ingebouwde tv staat dus niet meer op de grond. Stopt de muziek, dan krijgen plekken buiten beeld hun eigen foto terug en verdwijnen tv's.

**Meeknikken:** alleen op nummers uit de eigen lijst (`songs`, in de Studio onder Muziek, of via Telegram `/muziek Titel 127`). `song_bpm()` vergelijkt hele woorden, zonder hoofdletters, leestekens en `(feat. …)`; een titel die met de andere begint telt ook als het minstens twee woorden zijn ("Everything Is Romantic" ↔ "Everything is Romantic (reimagined)"). De Deezer-opzoeking is weg (0.8.0). De fase komt uit `media_position` + `media_position_updated_at`.

**Wereldgebeurtenissen (`events.js`):** 65 korte events (max. 1 minuut): Heidi de witte lama (elke dag; eigen frames in `static/heidi/`, gemaakt uit de oorspronkelijke witte alpaca; tegendraads: spuwt, blokkeert het beeld, pikt Kamiels hoed, gaat liggen als hij haar wil verzetten, aapt hem na, draait haar kont, trapt iets omver — te testen met `?ev=lama&heidi=spuug`), 48 "vaak" en 16 "soms". Planning per dag (lama + vaak) en per week (soms) met een vaste toevalsgenerator op de datum, zodat herladen niets verdubbelt; 17:00–19:30 is drie keer zo waarschijnlijk. Events met `walk: true` (verkeerde kant, camera volgt niet, vergeten, moonwalk, dronken, wolkrit) wachten op de wandeltimer en vervangen die wandeling; de andere gebeuren midden in een verblijf (niet als de wandeling binnen 70 s valt). **Huisdieren** (cat `dier` in de eventlijst, ids `wifi`, `snoet`, `pippa`, `pebbels`, `dobby`): elk komt `events.pets_per_day[id]` keer per dag langs (standaard 2), met kans `events.pets_together` (25 %) een tweede mee (`buddy`: kat + hond blazen, twee honden achtervolgen elkaar, anders snuffelen). Karakters: **Wifi** (zwart-bruine langharige chihuahua) brengt een bal en blijft aandringen tot Kamiel meespeelt; **Snoet** (bruine langharige chihuahua, klein) racet rond, springt op Kamiels rug, likt hem, springt op een object, knuffelt; **Pippa** (zwart-witte kat) gaat zelfverzekerd voor hem liggen, is soms agressief (hoge rug, blazen) of plots bang (sprong, wegrennen); **Pebbels** (getijgerde kat) besnuffelt een object, schrikt van een vallend blad, gaat het dan voorzichtig bekijken, soms een dutje; **Dobby** (zwart konijn; karakter zelf bedacht) knabbelt gras, maakt een vreugdesprong, verstijft en stampt, of ploft neer voor een dutje. Getekend met `drawPet()`/`petPoint()` in `display.html`; één dierenpixel = één Kamiel-pixel. Roepen kan via het venster Roepen.exe (ook Heidi), `/event wifi` of de Studio.

**Nooit tekstballonnen** (vraag van de eigenaar): alleen pixel-icoontjes (`emote`: ! ? sterren, zweet, hartjes, noten, zzz, boos, burst, snuif, stank…). Elk event is een generator (`function*`) die per frame een stap zet, met hulpjes `walkTo`, `travel`, `tween`, `approach`, `emote`, `say`, `particles`, `view` (zoom/kantelen/schudden), `itemOff`/`cloudOff` (objecten laten schuiven of vallen). Lagen: `sky`, `ground`, `back`, `front`, `screen` en `post`. Na een event staat Kamiel altijd weer midden op een plek. Starten op vraag: Telegram `/event` (willekeurig) of `/event mol`, de ▶-knop in de Studio, of `?ev=mol` in het adres van de tablet. Uitvinken in de Studio geldt alleen voor vanzelf.

**Vertrekbord (tik op de klok):** een split-flap-bord zoals in de luchthaven (klasse `Flap`: tegeltjes met een middenlijn, letters die klapperen voor ze stilvallen). 17 tekens per rij: lijn (T1/B38), naam op het bord, minuten (`NU`, `WEG`). Het verdwijnt zodra alles erop vertrokken is, na 15 s als er niets is, of bij tikken. Ook via een trigger-sensor, een element met tikactie "vertrekbord", of de knop in Vertrek.exe.

**Timerbord:** zelfde `Flap`-klasse maar met rode letters, één rij per Google Home-timer (`PASTA 04:12`), telt per seconde af, knippert `TIJD!` als hij afgaat, wandelt mee met Kamiel, verdwijnt als er geen timers meer zijn.

**Vensters (tik op een lege plek):** HTML in een `#desk`-laag boven het canvas, in Windows 95-stijl. Weer.exe (nu + 4 dagen voorspelling), Vertrek.exe, Knoppen.exe (3×3, groen lampje als iets aan staat), Kleerkast.exe (voorbeeldjes van Kamiel met elk kledingstuk, "Uittrekken", "Verras me") en Muziek.exe (Winamp-achtig) en Wandel.exe (aftellen tot de volgende plek, ◀ ▶ om Kamiel meteen te sturen). Sluiten met ✕, "Alles sluiten", tikken op de scène, of vanzelf na `window_close` seconden. Slepen aan de titelbalk; minimaliseren naar de taakbalk.

**Volgorde bij tikken** (het eerste dat past, wint):

1. Op een venster of de taakbalk: dat venster handelt het af.
2. Vensters open: alles sluiten.
3. Op de Telegram-foto: weg + "foto gezien".
4. Een bericht staat er: weg + "gezien".
5. Een herinnering staat er: weg tot de volgende keer.
6. Op de klok: vertrekbord aan/uit.
7. Op het vertrekbord: weg.
8. Op de zon of de maan (alleen als zichtbaar en er een script is): script starten + ring.
9. Op een element met een tikactie: vertrekbord of script.
10. Op Kamiel: de kleerkast.
11. Elders: `empty_tap` (standaard de vensters).

Posities worden omgerekend van schermpixels naar canvascoördinaten (rekening houdend met `object-fit: cover`); elk frame houdt een lijst `hits` bij van waar elk object getekend werd.

## Kamiel Studio (beheerscherm)

Kamiel Studio staat in de zijbalk van Home Assistant (ingress). Het is een gewone HTML-pagina zonder framework; ze laadt `api/world` en tekent alles opnieuw na elke wijziging. Ontwerpprincipe op vraag van de eigenaar: **vinkjes en keuzelijsten, nooit bestandsnamen of codes**, en alles moet achteraf aanpasbaar zijn.

| Tabblad | Wat je er doet |
| --- | --- |
| Bericht | Een bericht op het scherm zetten (met voorbeeld, duur, naam eronder), wissen, en **Telegram** instellen en gsm's koppelen. Bewust het eerste tabblad: het is wat je van op afstand het meest gebruikt. |
| Elementen | Uploaden met soort, dag/nacht, weertype, zeldzaamheid, tekstbord. Bibliotheek als kleine tegels (zoeken, filter per soort met aantallen, icoontjes: ☀️🌙, ★, weer, 🪧, 📺, 🌱, ⬆ stapelt, ⬇ draagt, periode). Tikken opent een paneel (`<dialog>`) met groepen: Wat is het (soort, tekstbord, tv), Wanneer (moment, weer, periode, hoe vaak), Plaatsing (grootte, zakdiepte, enkel gras, kijkt naar), Stapelen (kan stapelen, kan dragen), Tikken; naam en "in de wereld" links; ‹ › om door te bladeren; alles wordt meteen bewaard. |
| Wereld | Het panorama bekijken en vervangen. |
| Foto's | Foto's voor de kaders (ook die uit Telegram komen hier terecht). |
| Bordteksten | De woorden op de tekstborden, één per regel. |
| Herinneringen | Herinneringen met live voorbeeld en "volgende keer: …". |
| Instellingen | Weer, wandeltijd, hoeveel objecten per soort (minstens–hoogstens, dag/nacht), ruimte tussen objecten, vrije ruimte rond Kamiel, hoe groot, reuzen, zakdiepte, maximum, sensoren onder de datum, tikken (zon, maan, elders, adres), vensters, 9 knoppen, kleerkast, muziek (speaker, nummerlijst om mee te knikken), gebeurtenissen (hoe vaak, aan/uit per event, ▶ om te testen), vertrekbord (met stappenplan voor De Lijn), Google Home-timers (met stappenplan), berichten via een tekst-helper, seizoenskleuren. |

Keuzelijsten met Home Assistant-entiteiten komen uit `api/entities?domain=…` (meerdere domeinen met komma's). Staat er "Niet verbonden met Home Assistant", dan heeft de add-on geen token (zie Valkuilen).

## Koppelingen met de buitenwereld

Alles behalve Home Assistant zelf is optioneel; zonder koppeling valt alleen die functie weg.

| Koppeling | Hoe | Waarvoor |
| --- | --- | --- |
| Home Assistant REST API | Supervisor-token, `http://supervisor/core/api` | Weer, zon, sensoren, scripts, knoppen, speaker, entiteitenlijsten. |
| Weer | Een `weather.*`-entiteit (bv. Met.no) + `weather.get_forecasts` (type daily) | Lucht, wolken, wind, weer-gebonden elementen, Weer.exe. |
| Speaker | `media_player.*` (Google Home/Cast): `entity_picture`, `media_title`, `media_artist`, `media_position` | Muziek-tv, Muziek.exe, meeknikken. Hoes via HA-proxy (`HA_ROOT + entity_picture`, met token). |
| De Lijn | Home Assistant-integratie `delijn` (YAML `sensor: - platform: delijn`, gratis sleutel van het De Lijn Open Data-portaal, `stop_id` per halte van 6 cijfers). Attributen: `next_passages` met `line_number_public`, `line_transport_type`, `final_destination`, `due_at_realtime`/`due_at_schedule`. | Vertrekbord, Vertrek.exe, Telegram `/bus`. De Lijn geeft af en toe een `http error`: normaal. |
| Google Home-timers | HACS-integratie "Google Home" (leikoilja/ha-google-home): `sensor.<speaker>_timers`, attribuut `timers` met `local_time_iso`, `fire_time`, `status` (set/ringing/paused), `label`. | Timerbord. |
| Telegram | Eigen bot via @BotFather; Kamiel doet **long polling** (`getUpdates`), dus niets openzetten op de router. Alleen gekoppelde chats (koppelcode van 6 cijfers, 10 min geldig) mogen iets. Commando's: tekst, foto, `/bus`, `/kijk`, `/wis`, `/muziek Titel 127`, `/muziek`, `/event`, `/event lijst`, `/event <naam>`, `/help`. | Berichten en foto's van op afstand, "gezien"-meldingen, screenshot van het scherm. |
| Tekst-helper | Een `input_text.*` gekozen in de Studio | Berichten uit automatiseringen ("de was is klaar"). |
| Fully Kiosk Browser | Op de Android-tablet, Start URL `http://<ip-HA>:8100`, Keep Screen On, Launch on Boot, Reload on network reconnect, Reload on idle | Kamiel permanent tonen. Fully PLUS (betalend) nodig voor kiosk-vergrendeling, bewegingsdetectie en bediening vanuit HA. |

De tablet laadt ook lettertypes van Google Fonts (VT323, Titan One, Arimo): zonder internet valt hij terug op systeemlettertypes.

## Installeren, updaten en uitbrengen

**Eenmalig installeren (bij de eigenaar al gebeurd):**

1. Home Assistant → Instellingen → Add-ons → Add-on-winkel → menu rechtsboven → Repositories → `https://github.com/dylanbaele2000-glitch/kamiel-addon` toevoegen.
2. Kamiel Studio installeren (de eerste build duurt enkele minuten), "Toon in zijbalk" aanzetten, starten.
3. In het logboek moet "Verbonden met Home Assistant." staan.
4. Tablet: Fully Kiosk met Start URL `http://<ip-HA>:8100`. Geef Home Assistant een vast IP-adres in de router.

**Een nieuwe versie uitbrengen (voor de assistent):**

1. Wijzig de code en test lokaal (zie Testen).
2. Hoog `version` op in `kamiel_studio/config.yaml` (bv. 0.7.2 → 0.7.3). **Zonder nieuw versienummer ziet Home Assistant geen update.**
3. Commit en push naar `main`. De assistent heeft (had) tijdelijk schrijfrechten via de Claude GitHub-app; de eigenaar kan die intrekken via GitHub → Settings → Applications.
4. De eigenaar: Instellingen → Add-ons → Kamiel Studio → Update (ziet hij niets: Add-on-winkel → menu → Controleren op updates). Home Assistant bouwt de image opnieuw op de HA Green (aarch64).
5. Na de update: tablet herladen (Fully: Reload Start URL). Sinds 0.7.2 halen browsers nieuwe scripts vanzelf op.

**Gegevens bij updates:** `/data` blijft altijd bewaard; nooit opnieuw uploaden. Alleen verwijderen van de add-on wist alles. Nieuwe instellingen krijgen hun standaardwaarde via `DEFAULT_SETTINGS`; schrijf migraties in `load_db()` als een sleutel van betekenis verandert.

**Versiegeschiedenis in het kort:** 0.1.x basis (Studio, tablet, panorama, borden, kaders, weer, HA-token), 0.1.7–0.1.10 percentages, grootte, plaatsing, horizon, 0.2.0 herinneringen, 0.3.0 berichten, muziek-tv, tikken, seizoenen, maan, 0.4.x Telegram, 0.5.0 vertrekbord, timers, zakdiepte per element, weer- en maanfixes, 0.6.0 Windows-vensters en kleerkast, 0.7.0 meeknikken, herinneringen wegtikken, tv-vormen, weer per element, 0.7.1 geen zwart scherm meer bij fouten, 0.7.2 scripts altijd vers, 0.10.1 huisdieren getekend naar echte foto's (pluizige oren en staart, Snoets crème masker, Pippa smoking met witte buik en poten, Pebbels met M-streep en witte pootjes, Dobby als compact dwergkonijn met witte bef en vlekje op de neus); 0.10.0 huisdieren (Wifi, Snoet, Pippa, Pebbels, Dobby) + Roepen.exe; 0.9.1 Heidi met eigen uiterlijk en karakter, geen tekstballonnen, persoonlijke info uit de handleiding, locatie uit Home Assistant; 0.9.0 compositie als een fotograaf (kijkwijzen + score, geen raakvlakken, grond nooit vóór horizon), heuvels, stapelen, enkel gras, kijkrichting, albumhoes in fotokaders, nieuwe bibliotheek in de Studio, kleerkast-bug (`outfits_off`); 0.8.0 wereldgebeurtenissen, scènes vernieuwen echt (visible-bug), ook 's nachts wandelen, maanboog, Wandel.exe, 13 nieuwe kleren, aantallen per soort, nieuwe plaatsingsregels, Telegram-foto in bestaand kader, eigen nummerlijst voor meeknikken.

## Testen en debuggen

De server draait ook buiten Home Assistant, zonder Docker: Python 3 met `aiohttp`, `numpy`, `scipy` en `Pillow`.

```bash
cd kamiel_studio/app
KAMIEL_DATA=/tmp/kamieldata KAMIEL_HA_URL=http://localhost:8123/api \
  KAMIEL_TG_URL=http://localhost:8124 SUPERVISOR_TOKEN=x python3 server.py
# Studio: http://localhost:8099   Tablet: http://localhost:8100
```

**Omgevingsvariabelen:** `KAMIEL_DATA` (opslagmap), `KAMIEL_HA_URL` (nep-Home Assistant), `KAMIEL_TG_URL` (nep-Telegram), `SUPERVISOR_TOKEN`, `STUDIO_PORT` / `DISPLAY_PORT`.

**Nep-Home Assistant en nep-Telegram:** tijdens de ontwikkeling werden kleine aiohttp-servers gebruikt die `/api/states`, `/api/states/{id}`, `/api/services/{d}/{s}` (met forecast-antwoord en toggles) en de Bot API (`getMe`, `getUpdates`, `sendMessage`, `sendPhoto`, `getFile`) nabootsen, met testhulpen om toestanden te zetten. Ze staan niet in de repo; ze zijn in een kwartier opnieuw te schrijven. Let op: geef een nep-Telegram hoge `update_id`'s, want de server onthoudt zijn `offset`.

**URL-parameters op de tablet:**

| Parameter | Doet |
| --- | --- |
| `?t=21:30` | Doe alsof het dit uur is (zon, maan, nacht). |
| `?d=2026-12-24` | Doe alsof het deze datum is (seizoenen, feestdagen, maanfase). |
| `?w=regen` | Weer forceren: helder, licht, bewolkt, regen, onweer, sneeuw, mist. |
| `?demo=10` | Kamiel wandelt om de 10 seconden. |
| `?r=1` | Toon meteen de eerste herinnering. |
| `?bpm=128` | Doe alsof het nummer dit tempo heeft (meeknikken testen). |

**Schermafbeeldingen:** Playwright (Python) met de voorgeïnstalleerde Chromium werkte goed om de tablet en de Studio te bekijken en te klikken. Het Playwright-MCP-hulpmiddel blokkeert `localhost` en `file://`.

**JavaScript-compatibiliteit:** alle tabletcode moet door een ES2019-parser kunnen (bv. `acorn` met `ecmaVersion: 2019`), zodat oudere Android-WebViews hem begrijpen. Dus geen `??`, `?.`, `.at()` in de tabletcode.

**Bij problemen bij de eigenaar:**

- Een rode balk "Kamiel kon niet starten: …" op de tablet (sinds 0.7.1) geeft de fout en het bestand.
- Logboek van de add-on: Instellingen → Add-ons → Kamiel Studio → Logboek.
- Logboek van Home Assistant zelf: Instellingen → Systeem → Logboeken (bv. fouten in `configuration.yaml`).
- `?ev=<id>` start een event, `?t=23:00`, `?d=2026-12-24`, `?w=regen`, `?bpm=120`, `?demo=5` (elke 5 s wandelen) en `?debug=1` (`window.__kamiel` met plekken en events) helpen bij testen. Let op: in een trage browser loopt alles trager (stap per frame is begrensd op 0,05 s).
- `http://<ip-HA>:8100` op een computer openen: zo zie je of het aan de tablet of aan de add-on ligt.

## Aandachtspunten en valkuilen

Elk van deze problemen is echt gebeurd; de oplossing zit in de code. Lees dit voor je iets aan het tekenen, uploaden of cachen verandert.

| Probleem | Oorzaak | Oplossing |
| --- | --- | --- |
| Zwart scherm op tablet én computer na een update ("occurrence is not a function") | Browser bewaarde een oude `reminder.js` en combineerde die met de nieuwe pagina. | Pagina's zetten `?v=<tijd>` achter elk script, `/static/*.js` krijgt `no-cache` (0.7.2). Nieuw gedeeld script? Laden via `<script src="static/x.js">` zodat het automatisch een versie krijgt. |
| Volledig zwart bij elke fout | Een fout bij het opstarten stopte alles. | Rode foutbalk (`window.onerror`), tekenlus met try/catch, `api/world` blijft opnieuw proberen (0.7.1). |
| "Niet verbonden met Home Assistant" | De Supervisor-token bereikte het proces niet onder s6-overlay. | `run.sh` met `#!/usr/bin/with-contenv bashio` + `read_token()` die ook in `/run/s6/container_environment/` kijkt. |
| "Maximum request body size 16777216 exceeded" | Home Assistant-ingress weigert verzoeken boven 16 MB. | Uploads één per één, in de browser verkleind (elementen 1400 px PNG, foto's 1600 px JPEG, panorama 600 px hoog). |
| Tekst op borden afgesneden | `ctx.filter` knipt getekende tekst af. | Nooit `ctx.filter`; donker maken met `source-atop`-lagen; borden en kaders in een eigen canvas per object (gecachet). |
| Nieuwe kleren niet in de kleerkast | De Studio bewaarde de lijst kleren die AAN stonden; wat later bijkwam, stond er niet in. | `outfits_off` (wat UIT staat), met migratie (0.9.0). |
| Kleine canvassen (voorbeeldjes) allemaal op dezelfde plek, enorm | De globale CSS-regel `canvas{position:absolute;inset:0}` van de tablet gold voor elk canvas. | Kleine canvassen expliciet `position:static`, eigen maat. |
| Objecten leken te zweven | De dreamcore-gloed maakt de afbeelding groter dan het object; de schaduw stond onder de gloed. | `footOf()` meet de echte voet uit de alfa; object en schaduw daarop. |
| Horizon-objecten zakten te diep weg | Hoogte alleen in het midden gemeten, horizon verschilt tot 100 px; vaste zakdiepte 10–20%. | Laagste grondpunt onder de hele voet, zakdiepte instelbaar (standaard 3%, per element aanpasbaar). |
| Lege scènes met muziek aan | De muziek-tv nam een plek van grond/horizon in. | De tv zoekt achteraf een vrije plek (grond, horizon of wolk), telt niet mee in het maximum. |
| Lucht-object achter een toren | Lucht werd los van de rest geplaatst. | Lucht als laatste, met een rechthoek-controle tegen alles wat staat. |
| Herinnering kwam terug na herladen | De lijst met weggetikte herinneringen kwam pas na 5 s binnen. | Zit ook in `api/world`. |
| Kamiel liep achteruit / knipperde met één oog | Frames waren van de verkeerde houding gemaakt. | Frames uit de houding "hoofd links", gespiegeld voor rechts; beide ogen knipperen. |
| Tekstbord zonder tekst | Bord geüpload zonder het vinkje "tekstbord". | Vinkje achteraf aan te zetten (verwerkt het origineel opnieuw); kan niet voor uploads van vóór 0.1.4 (geen origineel bewaard). |
| Home Assistant start in herstelmodus | Een losse `'` in `configuration.yaml` (bij het toevoegen van De Lijn). | Fout lezen in het HA-logboek: regel en kolom staan erbij. |
| Terugkomende scène bleef hetzelfde | `visible()` had 40 px marge; met plekken van één schermbreedte bleven de buren altijd "zichtbaar". | Marge weg (0.8.0). |
| Meeknikken deed niets | Deezer gaf geen tempo (of niet bereikbaar). | Eigen nummerlijst (0.8.0). |
| Lokale testservers vielen weg | Achtergrondprocessen stierven tussen shell-aanroepen. | Starten met `setsid nohup … < /dev/null &`. |

**Verder goed om te weten:**

- De tablet is mogelijk een goedkope Android met een oudere WebView: houd de JavaScript op ES2019, test met `acorn`.
- Het panorama heeft een echt horizonprofiel; alles wat op de grond staat moet dat volgen.
- De Studio-pagina tekent na elke `load()` alles opnieuw: niet-opgeslagen invoer in herinneringskaarten verdwijnt als je ondertussen iets anders opslaat.
- Alleen-lezen op poort 8100 is een belofte aan de eigenaar: nieuwe schrijvende endpoints daar mogen alleen dingen doen die vooraf in de Studio zijn ingesteld.
- De Telegram-sleutel staat in `kamiel.json` en mag nooit via `api/world` of `api/live` naar de tablet; chat-id's worden er ook uit gefilterd.

## Beslissingen en openstaande ideeën

**Bewuste keuzes (niet terugdraaien zonder te vragen):**

- Objecten bewegen nooit en verschijnen niet zomaar; verandering gebeurt buiten beeld (bij het wandelen). Uitzonderingen zijn live dingen die de eigenaar zelf oproept of die nieuws brengen (tv, borden, foto, berichten).
- Geen glitch-scènes, geen hut, geen plant/afval-scènes, geen afstand tussen personen.
- Elke upload krijgt de dreamcore-filter, ook foto's van bv. het Belfort.
- Weinig tekst op het scherm; info komt pas tevoorschijn als je erom vraagt (tikken) of als ze er echt toe doet.
- Berichten en herinneringen in dezelfde vage memestijl (rood met cyaan spook, Arimo).
- Uitleg aan de eigenaar altijd in het Nederlands en op beginnersniveau.

**Openstaande ideeën (niet gebouwd):**

- [ ] Pixel-editor in Kamiel Studio om zelf hoeden en kleren te tekenen (raster over Kamiels hoofd, kleuren kiezen, lichaamsdeel en naam); de eigenaar vroeg ernaar, wacht op zijn "ja".
- [ ] Scherm uit na middernacht tenzij er beweging is (Fully Kiosk PLUS + Home Assistant-integratie).
- [ ] Diepte door een lichte blauwe waas op horizon-objecten; schaduwen die van de zon weg vallen en langer worden bij lage zon.
- [ ] Kleurharmonie per scène (hoofdkleur bij upload bepalen) en thema-labels per element.
- [ ] Boodschappen.txt (HA-boodschappenlijst), Agenda.exe, Kamiel.exe ("over Kamiel"), een zeldzame nep-foutmelding.
- [ ] Kleren per seizoen of feestdag automatisch (de kerstmuts, paasoortjes en heksenhoed bestaan sinds 0.8.0).
- [ ] Kamiels dagboek: elke dag automatisch een screenshot bewaren als postkaart.
- [ ] Foto's "vandaag, x jaar geleden" in de kaders (EXIF-datum).
- [ ] Berichten per e-mail als tweede weg naast Telegram (met goedkeuring vooraf voor vreemden).

**Concept- en plandocument:** er bestaat ook een ouder document "Kamiel: concept en plan van aanpak" uit de begindagen; dit technische document is nieuwer en gaat voor.
