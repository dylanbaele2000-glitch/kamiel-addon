# Kamiel: technische handleiding

Stand: 28 oktober 2026 (versie 0.24.1)

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
| `app/static/films_1.js` … `films_6.js` | De twaalf films (5–10 min). Elk bestand registreert zich in `window.KamielFilms[id] = { can, run }`; `events.js` maakt er events van en geeft ze de filmset `K`. |
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

**Velden van een element (`assets[]`):** `id`, `label`, `kind` (`grond`, `horizon`, `lucht`, `wolk`, `kader`), `moment` (`dag`/`nacht`/`altijd`), `rare` (`gewoon`/`zeldzaam`/`heelzeldzaam`, gewicht 1 / 0.25 / 0.06), `size` \[b, h\], `files` (`main`, `mask`, `kleur_<kleur>`), `original`, `active`, en optioneel: `sign` + `plate` + `colors` (tekstbord), `hole` (fotovlak van een kader), `scale` (eigen grootte, 0.5–2), `sink` (zakdiepte horizon in %), `period` (+ `period_from`/`period_to` als MM-DD), `tv` (kader dat als muziek-tv dient), `tap` (`{action: niets|vertrek|script, entity}`), `weather` (lijst uit `zon`, `bewolkt`, `regen`, `sneeuw`, `mist`), `clouds` (alleen lucht: `voor`, `tussen` (standaard) of `achter` de wolken).

**Instellingen (`settings`):**

| Sleutel | Standaard | Betekenis |
| --- | --- | --- |
| `weather_entity` | "" | Weer-entiteit (bv. Met.no). |
| `walk_minutes` | 20 | Verder wandelen na zoveel minuten, dag én nacht. |
| `night_start` / `night_end` | 22:00 / 06:00 | De **rusttijd van de tablet** (Studio → Huis → Camera van de tablet): alleen voor het scherm (`screen_off: nacht`, `isNightTime()` in display.html, `is_night()` en `screen_guard_loop` in de server). Dag en nacht in de wereld (nacht-elementen, nachtlook, `A.night()`, regels "overdag/'s nachts") volgen sinds 0.17.4 de zon: `isDark()` = zon onder −0,8° (sun.sun uit Home Assistant of zelf berekend), in de server `sun_down()` (sun.sun `below_horizon`, anders de rusttijd). |
| `counts` | dag: grond 2–4, horizon 1–3, lucht 1–2, kader 1 (sinds 0.18.0; was 0–1); nacht: lucht 1–3 | Hoeveel objecten per soort: `[minstens, hoogstens]`, per dag/nacht. |
| `max_objects` | 12 | Maximum objecten per plek (wolken en live-dingen niet meegeteld). |
| `spacing` | 30 | Pixels tussen objecten (negatief = overlappen). |
| `lane` | 94 | Vrije ruimte links en rechts van Kamiels midden. |
| `mix_layers` | false | Niet meer gebruikt: grond staat nooit vóór horizon. |
| `compose` | alle kijkwijzen aan, `color` true, `busy` 2 | Welke kijkwijzen mogen, kleurharmonie aan/uit, `busy` = Drukte (0 heel rustig … 4 heel druk; 2 = de aantallen uit `counts`). |
| `hills` | `chance` 40, `height` 18 | % plekken met heuvels, hoogte in % van het scherm. |
| `stack` | `chance` 35, `max` 3 | Kans dat een drager iets draagt, hoogste stapel (2–4). |
| `outfits_off` | \[\] | Kleren die níet in de kast hangen (vervangt `outfits_on`, zodat nieuwe kleren vanzelf beschikbaar zijn). |
| `events` | aan, lama 1/dag, vaak 3/dag, soms 4/week, avond aan, `off` [], `pets_stay` 35, `pets_lying` 20, `pets_stay_min` 45 | Wereldgebeurtenissen. `pets_stay`: % kans dat een huisdier na een bezoek blijft liggen; `pets_lying`: % kans dat er al een ligt op een nieuw samengestelde plek; `pets_stay_min`: ongeveer hoe lang ze blijven. `dance_chance` (20): bij een nieuw nummer met BPM is er 1 op N kans op een dansfeest (0 = nooit). `aurora_chance` (15): % kans per avond op noorderlicht. `stories_per_week` (3): verhaaltjes per week. `films_per_week` (2): films per week (0–14). |
| `feest` | aan, `boost` 3, `v` 2, geen eigen dagen (die vul je in de Studio in; ze staan nooit in de code), alle feestdagen aan | `days` (`name`, `date` MM-DD, `kind` `verjaardag`/`liefde`, optioneel `year` om de jaren te tellen), `holidays` (halloween, kerst, nieuwjaar, pasen, valentijn, sinterklaas aan/uit), `boost` = hoeveel keer meer events. |
| `halls` | `chance` 12, `off` [], `custom` [] | Zalen: % kans dat een nieuw samengestelde plek een zaal is; ingebouwde (`museum`, `disco`, `sterren`) uitzetten; eigen zalen `{id, name, file, original, on, elements}` (upload via `POST /api/halls`). |
| `air` | uit, `warn` 1000, `bad` 1500, `invert` uit | Luchtkwaliteit: `entity` (sensor), drempels; `invert` als een hoog getal goed is. |
| `sizes` | grond 10–40, horizon 15–42, lucht 12–38, kader 18–42 | Hoogte in % van de schermhoogte. |
| `giant_chance` | 10 | % kans op een reuzenobject. |
| `horizon_sink` | 3 | Hoeveel % een horizon-object in de grond zakt. |
| `season_colors` | true | Lichte kleurtoon per seizoen. |
| `words` | 6 zinnen | Woorden op de tekstborden. |
| `osd_right` | \[\] | Rechts bovenaan: tot 4 regels, elk tot 3 entiteiten. Tikken op een waarde opent Meter.exe (alleen deze entiteiten mag de tablet opvragen). |
| `osd_entities` | \[\] | Tot 3 regels onder de datum, elke regel een lijst van tot 3 entiteiten naast elkaar (oude vorm: één entiteit per regel, wordt nog gelezen). |
| `empty_tap` | vensters | Tikken op een lege plek: `vensters`, `url`, `vertrek` of `niets`. |
| `tap_url` | "" | Adres bij `empty_tap = url`. |
| `sun_script` / `moon_script` | "" | Niet meer gebruikt sinds 0.24.0: de zon opent Weer.exe, de maan Telescoop.exe. |
| `osd_rain_mark` | `*` | Teken achter de buitentemperatuur (`kamiel.buiten` in `osd_entities`/`osd_right`) als het regent; max 3 tekens, leeg = geen. |
| `battery` | geen, 20 % | `entities` (tot 60 batterijsensoren, % of binary_sensor aan = laag) en `low`. Toestand in `battery_state` ({entiteit: `low_t`, `dismissed`}); weggetikt komt na 7 dagen terug, opgeladen = boven low + 5. |
| `kamiel_tap` | kleerkast | Tikken op Kamiel opent de kleerkast. |
| `windows`, `window_titles`, `window_close`, `window_layout` | alles aan, \*.exe, 60 s, verspreid | De oude Windows-vensters. |
| `buttons` | \[\] | Knoppen voor Knoppen.exe (max 30): `icon`, `label`, `entity`, `service` (`domein.actie`, leeg = automatisch: aan/uit, starten, volgende optie…), `data` (de velden van die actie). Lege knoppen worden bij het laden weggefilterd. |
| `outfit_mode` | kiezen | Kleerkast: `kiezen` / `dag` / `uit`. |
| `media_players` | [] | Alle speakers/plekken waar Kamiel naar luistert: `{entity, name}` (max 12). `active_player(s)` kiest de speaker die speelt (blijft bij dezelfde zolang die speelt; starten er meerdere, dan de nieuwste `last_changed`), anders de laatste die speelde. Live, hoes, Muziek.exe (naam = plek, bij Spotify + `source`) en de knoppen gebruiken die. |
| `media_player` | "" | De eerste uit `media_players` (wordt bij opslaan gezet; oudere versies hadden alleen deze, `load_db` zet hem om naar de lijst). |
| `board` | \[\] | Vertrekbordrijen: `label`, `entity`, `kind`, `lines`, `dest`, `count`. |
| `departure_trigger` | "" | Sensor die het vertrekbord automatisch toont. |
| `timer_entities` | \[\] | Google Home `_timers`-sensoren. |
| `message_entity`, `message_minutes` | "", 60 | Tekst-helper voor berichten uit automatiseringen. |
| `doorbell` | uit, `mode` auto, 10 min, telegram en honden aan | Deurbel: `on`, `trigger` (event./binary_sensor./knop), `mode` (`auto`/`aan`/`verandert`; auto = verandert voor `event.`/knoppen, anders aan), `camera`, `minutes`, `keep` (in het album), `telegram`, `pets`. |
| `rules` | \[\] | "Als dit, dan dat" (max 40): `id`, `name`, `on`, `entity` (of `kamiel.beweging`), `cond` (`aan`/`uit`/`verandert`/`is`/`boven`/`onder`), `value`, `from`/`to` (HH:MM), `when` (`altijd`/`dag`/`nacht`), `cooldown` (min.), `actions` (max 6): `type` (`event`/`bericht`/`camera`/`kleren`/`rust`/`vertrek`/`ha`/`telegram`) met `id`, `text`, `entity`, `minutes`, `ids`, `photo`, `keep`, `on`, en voor `ha` ook `service` + `data` (zelfde als bij de knoppen). Bij `camera` betekent `on` "Kamiel gaat kijken" en `id: "pets"` "de honden blaffen". |
| `motion` | uit, kijken en scherm aan, scherm-uit `nooit` na 10 min, `away_off` uit, `away_entity` zone.home, `to_ha` aan | De tablet (Fully PLUS) of een `binary_sensor`: `on`, `look`, `wake`, `screen_off` (`nooit`/`nacht`/`altijd`), `off_after`, `entity`; `away_off` = scherm uit als niemand thuis is (`away_entity`: zone telt personen, of een person/group/binary_sensor); `to_ha` = batterij, lader, scherm en beweging als entiteiten naar Home Assistant; `fully_pw` = wachtwoord van Fully's Remote Administration om het scherm vanuit de server te wekken (blijft in de add-on); `away_entities` = tot 8 entiteiten, één die "thuis" zegt is genoeg (wifi-sensor van de HA-app vergeleken met `home_wifi`, person/device_tracker `home`, zone > 0, schakelaar `on`); `home_wifi` = naam (of namen, met komma) van de thuiswifi, gaat nooit naar de tablet; `away_delay` = minuten zonder enig teken van iemand thuis voor het scherm uitgaat (standaard 15; thuiskomen telt meteen); `phones` = tot 6 gsm's `{name, ip}` met een vast adres op het thuisnetwerk (blijft in de add-on, gaat nooit naar de tablet); `motion_counts` = beweging voor de tablet telt als iemand thuis. |
| `sky` | alles aan, nevel 10 %, bliksem 25 km | De echte lucht: `stars`, `planets`, `meteors`, `iss`, `eclipses`, `rainbow`, `geese`, `planes`, `lightning`, `telescope`, `rain_cloud`, `storm`, `frost_heat`, `uv` (aan/uit), `nebula` (kans per nacht in %), `lightning_km`, `lines` (lijnen van de sterrenbeelden, ook vanuit Telescoop.exe), `opensky_id`/`opensky_secret` (OpenSky API-client; gaan nooit naar de tablet), `plane_km` (straal 2–40 km), en optionele sensoren `rain_entity`, `temp_entity`, `uv_entity`. |
| `charge` | geen stekker, `uit`, 30–80 % | Slimme stekker van de lader: `entity` (switch/input_boolean/light), `mode` `uit`/`batterij`/`altijd`, `low`/`high`: aan bij ≤ low, uit bij ≥ high; meldt de tablet zich 15 min niet, dan aan. |
| `lamps` | \[\] | Niet meer gebruikt (0.11.0): bij het laden worden ze gewone knoppen. |
| `selfie` | uit, `days` 3, maandelijks en met huisdieren aan | Selfies op Telegram: `on`, `people` (`entity` = person.\*, `chat` = chat-id of leeg = iedereen; gaat nooit naar de tablet), `days`, `monthly`, `pets`. |

Buiten `settings` staan ook `selfie_state` (`away`: per persoon sinds wanneer weg en hoeveel selfies al; `month`: de maand waarvoor de maandselfie al verstuurd is), `actions` (de laatste 20 opdrachten voor de tablet uit regels en de deurbel: `type` `event`/`frame`/`kleren`/`rust`/`vertrek`/`beweging`, `n`, `at`; de tablet kijkt alleen naar die van de laatste 2 minuten en nooit opnieuw na herladen), `camera_stills` (de laatste 10 camerabeelden, oudere bestanden worden gewist), `songs` (de nummerlijst: `id`, `title`, `bpm`; vooraf gevuld met 13 nummers) en `event_req` (`n`, `id`, `at`: het laatst gevraagde event).

Oude, ongebruikte sleutels die nog kunnen voorkomen: `night_walks` (0.8.0: Kamiel wandelt nu ook 's nachts gewoon om de `walk_minutes`), `chances` (vervangen door `counts`; een soort die op 0 % stond, krijgt 0–0), `nod_bpm`, `min_frames`, `frame_ratio`, `departures` (vervangen door `board`), `people` (afstand-functie, verwijderd).

## API-overzicht

De tablet gebruikt poort 8100, de Studio 8099; de "gedeelde" endpoints bestaan op beide. Pagina's worden geserveerd met `?v=<tijdstempel>` achter elk script, en `/static/*.js` krijgt `Cache-Control: no-cache` (zie Valkuilen).

| Endpoint | Poort | Wat |
| --- | --- | --- |
| `GET /` | beide | 8099: Studio, 8100: tablet. `GET /display` toont de tablet ook via 8099. |
| `GET /api/world` | beide | Alles wat de wereld nodig heeft: elementen, foto's, panorama, instellingen, herinneringen, weggetikte herinneringen, `version`. |
| `GET /api/state` | beide | Elke minuut (ook `air`: `level` 0/1/2, `value`, `unit`): zon (uit `sun.sun`), weer (gemapt), wind, bewolking, sensorregels onder de datum. |
| `GET /api/live` | beide | Elke 5 s (ook `snap`: wat voor foto er gevraagd wordt, gewone schermfoto of selfie): bericht, muziek (titel, hoes-sleutel, BPM, positie), trigger, Telegram-foto, /kijk-verzoek, kleren, timers, weggetikte herinneringen. |
| `GET /api/desk` | beide | Gegevens voor de vensters: weer + 4-daagse voorspelling, knoppen met hun status, muziek, kleren. |
| `GET /api/departures` | beide | Vertrekbordrijen (`label`, `line`, `kind`, `dest`, `due` als epoch). |
| `GET /api/cover` | beide | Albumhoes van de speaker, door de dreamcore-filter, in cache. |
| `GET /media/{naam}` | beide | Verwerkte afbeeldingen (lang te cachen, de namen veranderen bij elke verwerking). |
| `POST /api/tap/{sun\|moon\|el-<id>}` | beide | Start het script dat in de Studio gekozen is (alleen script/scene/automation/(input\_)button). |
| `POST /api/button/{i}` | beide | Een knop uitvoeren (`do_call`): de gekozen actie met haar gegevens, of automatisch. Alleen wat in de Studio werd ingesteld. |
| `POST /api/media/{playpause\|next\|prev\|volup\|voldown}` | beide | Muziek bedienen. |
| `POST /api/outfit` | beide | Kleren kiezen (één per lichaamsdeel). |
| `POST /api/seen/{id}`, `/api/photo-seen/{id}` | beide | Iemand tikte een bericht/foto weg → Telegram meldt "gezien". |
| `POST /api/reminder-dismiss/{id}` | beide | Herinnering weg tot de volgende keer. |
| `POST /api/log` | beide | De tablet meldt events, huisdieren en fouten voor het logboek (max 20 per minuut, korte tekst). |
| `POST /api/opensky-test`, `GET /api/opensky-status` | 8099 | OpenSky nu proberen (40 km rond het huis, met de ingevulde client) / laatste antwoord, fout en vliegtuigen vandaag. |
| `POST /api/battery-dismiss` | beide | Batterij.exe gesloten: alle bijna-platte toestellen een week stil. |
| `POST /api/sky-pref` | beide | Vanuit Telescoop.exe: `{lines: true/false}`, zonder de tablet te herladen. |
| `GET/DELETE /api/logboek` | 8099 | Het logboek lezen (`?after=n`) of wissen. Bewaard in `/data/logboek.json`, de laatste 1500 regels. |
| `GET /api/backup?full=1\|0` | 8099 | Back-up als zip: `kamiel.json` (zonder Telegram-sleutel) + `media/` + `originals/`, of alleen de instellingen. |
| `POST /api/restore/chunk?id=&i=`, `POST /api/restore/finish?id=` | 8099 | Terugzetten in stukken van 8 MB (ingress laat max 16 MB door). Met afbeeldingen: alles vervangen (Telegram-sleutel van nu blijft); zonder: alleen settings, herinneringen, nummers. |
| `GET /api/selfie-preview`, `POST /api/selfie-send` | 8099 | Een selfie bekijken of nu versturen (variant ook `liefde`). |
| `POST /api/love-test` | 8099 | De liefdesfoto van de eerstvolgende jullie-dag nu versturen. |
| `POST /api/halls` (multipart `name`, `file`), `DELETE /api/halls/{id}`, `POST /api/hall-visit` | 8099 | Eigen zaal toevoegen (door de dreamcore-filter), wissen, of Kamiel er nu naartoe laten wandelen (actie `zaal`). |
| `POST /api/tablet-status` | beide | Elke minuut: wat de tablet weet via Fully (JS-interface, versie, IP, batterij, lader, scherm, bewegingsdetectie, het schermplan). |
| `GET /api/meter?entity=…&range=dag\|week\|maand` | beide | Meter.exe: reeks per uur of dag (langetermijnstatistiek via de websocket `recorder/statistics_during_period`, anders de geschiedenis), plus laagste/hoogste/gemiddelde of verbruik, piek en de periode daarvoor. Alleen voor entiteiten uit `osd_right`. |
| `POST /api/phones-test` | 8099 | Studio: vraag nu aan de opgegeven gsm's of ze er zijn (zonder op te slaan). |
| `GET /api/tablet-status` | 8099 | Voor de statuslijst in de Studio (+ nacht nu, zone.home, wie er thuis is per entiteit, wachttijd, stekker van de lader, laatst doorgegeven aan HA). |
| `POST /api/screen-test` | 8099 | Actie `scherm`: de tablet zet het scherm 10 s uit. |
| `POST /api/motion` | beide | De tablet zag beweging (Fully). Zet `kamiel.beweging` 60 s op aan. |
| `GET /api/services` | 8099 | Alles wat Home Assistant kan (`/services`): per domein de acties met hun velden en selectors; Nederlandse namen voor de bekendste (`SVC_NL`). |
| `POST /api/call-test` | 8099 | Een knop of actie meteen uitproberen (`{entity, service, data}`). |
| `POST /api/rule-test` | 8099 | De DAN-acties van een regel meteen uitvoeren (`{actions}`), of de deurbel testen (`{"doorbell": true}`). |
| `POST /api/snapshot/{id}` | beide | De tablet levert een JPEG voor /kijk; alleen geldig als er een verzoek openstaat. |
| `GET /api/entities?domain=a,b` | 8099 | Lijst van Home Assistant-entiteiten (`id`, `name`, `state`) voor de keuzelijsten; `domain=*` geeft alles; keuzelijsten krijgen ook hun `options`. |
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
2. Wereldcanvas: lucht-objecten `achter` → achterste wolken → lucht-objecten `tussen` → voorste wolken (elke tweede wolk, `cl.front`) → lucht-objecten `voor` (en tv's/kaders in de lucht) → wolken (eigen canvas met warme/donkere tint) → horizon-objecten → panorama (de grond, die horizon-objecten deels bedekt) → grond-objecten met schaduw → Kamiel. Daarna een nachttint met `source-atop` en een seizoenstint.
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
- Kleren: rasters in `outfits.js` (36 stuks; sinds 0.17.0 ook ninjaband, tovenaarshoed, rode baret, gasmasker, stofbril, priesterboord, rode overall, ninjapak, tovenaarsmantel, legerjas, zwarte toog, gemaakt voor de films; sloten hoofd/ogen/nek/neus/lijf; lijf-kleren zoals het ruimtepak zijn een `paint`-functie die over zijn eigen pixels kleurt, zodat ze met de poten meelopen), in coördinaten van het volle frame (780×1370, blokjes van 20 = zijn eigen pixelgrootte); ze bewegen mee in elke houding omdat zijn hoofd nooit verschuift (alleen de poten).
- Meeknikken: het frame wordt op y = 470 (onder het hoofd) in twee getekend; het hoofd draait rond de nek tot ±9° op elke tel.

**Hoe vaak de tablet vraagt:** `api/live` elke 5 s, `api/state` elke 60 s, `api/world` elke 120 s (herladen bij nieuwe `version`), planning elke 15 s, vensters elke 5 s als ze open staan.

## Live-functies en tikken

Alles hieronder komt binnen via `api/live` (elke 5 s) of wordt door tikken gestart. Nieuwe dingen in de wereld (muziek-tv, vertrekbord, timerbord, Telegram-kader) mogen altijd vóór horizon- en luchtobjecten staan; die blijven gewoon staan. Alleen als er op de grond echt geen plaats is, maakt het kleinste grondobject plaats (borden verbergen het tijdelijk).

**Berichten en herinneringen (memestijl):** `KamielReminder.render()` tekent tekst in laag-resolutie, vet (lettertype Arimo), rood met een cyaan "spook" en een donkere rand, en schaalt dat wazig op, zoals een te vaak opgeslagen meme. Berichten staan er meteen en blijven tot ze verlopen of weggetikt worden (dan meldt Telegram "gezien"). Herinneringen verschijnen alleen als ze aan staan (`isActive`), op elke N-de plek waar Kamiel aankomt, faden uit als hij wandelt, en kunnen weggetikt worden tot hun volgende keer (`occurrence()` = de dag van die keer; vensters over middernacht horen bij de dag waarop ze begonnen).

**Telegram-foto:** komt als `spotlight` binnen. Staat er op een plek al een kader, dan komt de foto **in dat kader** (de oude foto komt terug als de spotlight weg is); anders komt er een kader bij (eigen kader-element of ingebouwd goudkleurig kader). Weg door `/wis`, "Bericht wissen" in de Studio, erop tikken (meldt "Foto gezien"), of als de tijd om is.

**Muziek (`addMusic`):** speelt de gekozen speaker, dan toont elke plek de albumhoes. Meestal in een **fotokader** (het grootste dat er al staat, `music: true`, anders een toegevoegd kader `musicAdded`); de hoes wordt heel getoond en de rest van het fotovlak gevuld met de meest voorkomende kleur van de hoes (`dominant()`). Soms (±25 %) een tv op een wolk, soms (±20 %) een tv op iets dat kan dragen. De ingebouwde tv staat dus niet meer op de grond. Stopt de muziek, dan krijgen plekken buiten beeld hun eigen foto terug en verdwijnen tv's.

**Meeknikken:** alleen op nummers uit de eigen lijst (`songs`, in de Studio onder Muziek, of via Telegram `/muziek Titel 127`). `song_bpm()` vergelijkt hele woorden, zonder hoofdletters, leestekens en `(feat. …)`; een titel die met de andere begint telt ook als het minstens twee woorden zijn ("Everything Is Romantic" ↔ "Everything is Romantic (reimagined)"). De Deezer-opzoeking is weg (0.8.0). De fase komt uit `media_position` + `media_position_updated_at`.

**Wereldgebeurtenissen (`events.js`):** 65 korte events (max. 1 minuut): Heidi de witte lama (elke dag; eigen frames in `static/heidi/`, gemaakt uit de oorspronkelijke witte alpaca; tegendraads: spuwt, blokkeert het beeld, pikt Kamiels hoed, gaat liggen als hij haar wil verzetten, aapt hem na, draait haar kont, trapt iets omver — te testen met `?ev=lama&heidi=spuug`), 48 "vaak" en 16 "soms". Planning per dag (lama + vaak) en per week (soms) met een vaste toevalsgenerator op de datum, zodat herladen niets verdubbelt; 17:00–19:30 is drie keer zo waarschijnlijk. Events met `walk: true` (verkeerde kant, camera volgt niet, vergeten, moonwalk, dronken, wolkrit) wachten op de wandeltimer en vervangen die wandeling; de andere gebeuren midden in een verblijf (niet als de wandeling binnen 70 s valt). **Huisdieren** (cat `dier` in de eventlijst, ids `wifi`, `snoet`, `pippa`, `pebbels`, `dobby`): elk komt `events.pets_per_day[id]` keer per dag langs (standaard 2), met kans `events.pets_together` (25 %) een tweede mee (`buddy`: kat + hond blazen, twee honden achtervolgen elkaar, anders snuffelen). Karakters: **Wifi** (zwart-bruine langharige chihuahua) brengt een bal en blijft aandringen tot Kamiel meespeelt; **Snoet** (bruine langharige chihuahua, klein) racet rond, springt op Kamiels rug, likt hem, springt op een object, knuffelt; **Pippa** (zwart-witte kat) gaat zelfverzekerd voor hem liggen, is soms agressief (hoge rug, blazen) of plots bang (sprong, wegrennen); **Pebbels** (getijgerde kat) besnuffelt een object, schrikt van een vallend blad, gaat het dan voorzichtig bekijken, soms een dutje; **Dobby** (zwart konijn; karakter zelf bedacht) knabbelt gras, maakt een vreugdesprong, verstijft en stampt, of ploft neer voor een dutje. Getekend met `drawPet()`/`petPoint()` in `display.html`; één dierenpixel = één Kamiel-pixel. Roepen kan via het venster Roepen.exe (ook Heidi), `/event wifi` of de Studio. **Verjaardagen (0.24.0)**: `events.pet_birthdays` ({id: "JJJJ-MM-DD"}, alleen in `/data`; maand en dag tellen, het jaar alleen voor de leeftijd in het logboek). Op die dag draagt dat dier een feesthoedje (`petHat`/`petBday`), loopt het als `jarig` de hele dag naast Kamiel (zit naast hem, wisselt soms van kant, volgt hem bij het wandelen, verdwijnt even tijdens films en events waarin het zelf meespeelt) en plant `planFor` alle huisdieren twee keer zo vaak, de jarige nog twee keer extra, overdag.

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
| Huis | **Deurbel** (met stappenplan: merk kiezen, integratie toevoegen, de bel-entiteit en de camera vinden, testen), **Als dit, dan dat** (regelkaarten ALS / MAG / DAN met zoeklijst van alle entiteiten, huidige waarde ernaast, zin die de regel uitlegt, voorbeelden, ▶ Testen), **Camera van de tablet** (stappenplan Fully PLUS), **Knoppen** (snel toevoegen via zoeken, per knop: icoon, naam, wat, "doet" met alle acties uit Home Assistant en hun velden, ↑↓, ▶ Testen; de rules-actie "Iets in Home Assistant doen" gebruikt dezelfde editor). **Selfies** (personen, dagen, maandelijks, voorbeeld, nu sturen). Elk blok heeft een eigen Opslaan-knop. |
| Logboek | Alles wat er gebeurt, nieuwste bovenaan, per dag, met filters per soort en zoeken; vernieuwt elke 8 s. |
| Instellingen | Weer, wandeltijd, hoeveel objecten per soort (minstens–hoogstens, dag/nacht), ruimte tussen objecten, vrije ruimte rond Kamiel, hoe groot, reuzen, zakdiepte, maximum, sensoren onder de datum, tikken (zon, maan, elders, adres), vensters, 9 knoppen, kleerkast, muziek (speaker, nummerlijst om mee te knikken), gebeurtenissen (hoe vaak, aan/uit per event, ▶ om te testen), vertrekbord (met stappenplan voor De Lijn), Google Home-timers (met stappenplan), berichten via een tekst-helper, seizoenskleuren. |

**Huisdieren die blijven (events.js, "residents")**: een resident hoort bij een plek in de wereld (`wx`, wereldcoördinaat, niet bij een event) en blijft liggen als Kamiel verder wandelt. Elk heeft een eigen `life()`-generator met gewogen handelingen per dier (`PERS`: slapen, luieren, rechtop zitten, verliggen, en eigen dingen zoals graven/bal (Wifi), staart achterna/niezen/blaffen naar de lucht/zoomies (Snoet), wassen/kneden/streng kijken (Pippa), vlinder jagen/rollen (Pebbels), binky/omvallen/knabbelen/periscoop (Dobby)). Ze ontstaan na een bezoek (`settle`, kans `pets_stay`) of bij het samenstellen van een plek (`placeNew`, kans `pets_lying`; wie op een plek lag die opnieuw gemaakt wordt, is "naar huis"). Bij aankomst (`arrived`) kijken ze op en komt er soms een begroeten (intern event `begroeten`, met `GREET` per dier). Tikken op een resident = een aai. Maximaal 3 tegelijk. Nieuwe pixel-houdingen in `petgen.py`: `sit`, `paw` (katten), `lie`, `sleep`, `up` (Dobby).

**Feestdagen, zalen en luchtkwaliteit** staan in display.html in het blok "feast days, halls and air quality" (binnen de grote functie, want alles daar is lokaal; een apart script kan er niet bij).
- *Feestdagen*: `festival(d)` geeft `{kind, name, day}`: eerst eigen dagen uit `feest.days` (`verjaardag` of `liefde`), dan de feestdag zelf (`day: true`: Halloween 31/10, Kerstmis 24–26/12, Nieuwjaar 31/12–1/1, Valentijn 14/2, Sinterklaas 5–6/12, Pasen zondag en maandag), dan de dagen eromheen uit `FEST_AROUND` (`day: false`: Halloween 24/10–1/11, Kerst 15–27/12, Nieuwjaar 28/12–2/1, Valentijn 10–15/2, Sinterklaas 28/11–6/12, Pasen de week ervoor). Dan: in `planFor` alle aantallen × `boost` (op de dagen eromheen × de helft, huisdieren hoogstens × 2) plus 2 + boost feest-events (eromheen: 1) (`cat: 'feest'`, `fest: [...]` per event), dubbel zoveel verhaaltjes (alleen op de dag zelf); Nieuwjaar eromheen: af en toe vuurwerk tussen 20 en 2 u (`fireworksSome`, `drawFireworks(rate)`); jullie dag (`liefde`): roze/rode versiering, hartjes, hartjesbril, 's nachts af en toe vuurwerk, event `liefdesfeest` (de bende komt samen, een groot hart stijgt op, hartjesvuurwerk; ook op Valentijn) en `taart`; Kamiel krijgt een stuk kleding van de dag (`festOutfit`); de huisdieren een feesthoedje op verjaardagen en Nieuwjaar (`petHat`); versiering (`drawFestScreen`: slingers, ballonnen, vleermuizen, hartjes, pepernoten; `drawFestGround`: pompoenen, lichtjes langs de horizon, paaseieren die je kan aantikken). Testen: `?feest=verjaardag` (of halloween, kerst, nieuwjaar, pasen, valentijn, sinterklaas), `?d=2026-12-24`.
- *Zalen*: `compose(i, forceHall)` maakt van een nieuwe plek (niet de huidige, niet bij het opstarten) met kans `halls.chance` een zaal: `places[i].hall = {id, kind, photos, seed}`, zonder elementen (eigen zaal: optioneel de grondelementen). `drawHalls()` tekent na de grond, dus over lucht, wolken, horizon en panorama, met muren aan beide kanten. Museum (3 foto's als schilderijen, tik = groot), Disco (tegels in de maat via `beatNow`, discobal), Sterrenwacht (sterren, planeet, telescoop, vallende sterren), eigen zaal (achtergrond, confetti bij tikken). `hallTap()` komt vóór andere tikken. Testen: `?zaal=museum`.
- *Noorderlicht*: `drawAurora()` na de lucht, als de zon onder −5° staat tussen 18 en 3 u, bij helder weer, op avonden die `auroraTonight()` aanwijst (vaste kans per avond). Testen: `?aurora=1`.
- *Luchtkwaliteit*: niveau uit `api/state`; `airHead/airEyes/airWalk` maken Kamiel suf en traag, `drawAirHaze` een gele waas, bij niveau 2 om de 8 min `slapen`; beter = `strekken`. Testen: `?lucht=2`.
- *Wifi's bal*: een liggende Wifi (resident) heeft `a.ball` (wereldpositie, hoogte, snelheid). Een veeg die op de bal begint (`downAt` → `EV.throwBall`) gooit hem; `fetchBall` haalt hem terug naar haar plekje.

**Verhaaltjes (`cat: 'verhaal'`)**: `heidiwraak` (Heidi duwt Kamiel uit beeld, komt veel te dichtbij met een kroon, tot de bende haar terugduwt), `ufo` (Dobby wordt ontvoerd en komt terug met antennes), `verhuis` (drie huisdieren dragen een grondobject weg en brengen het ondersteboven terug; `it.flipY` blijft), `ogen` (alleen 's nachts: donker, gele ogen, het is Pippa), `brengen` (een huisdier duwt een grondelement uit de bibliotheek de scène in; het blijft daarna staan via `A.addItem`), `skydive` (met parachute naar beneden, de parachute belandt op Kamiels hoofd), `verdwaald` (zoekt de weg, wordt triest, Kamiel brengt het naar de rand), `sprint` (alle huisdieren rennen twee keer achter elkaar door de scène, Kamiel wordt duizelig), `toren` (ze klimmen op elkaar en vallen om), `sluipen` (ze sluipen achter Kamiel; draait hij zich om, dan zitten ze onschuldig stil).

**Films (cat `film`, 0.17.0)**: twaalf lange verhalen van 5 tot 10 minuten, zonder woorden behalve titelkaarten ("DEEL 2", "EINDE"). Planning: `films_per_week` keer per week op een vaste willekeurige dag (week-seed), tussen 10 en 21 u, de helft tussen 18 en 21 u; nooit via `choose()` zonder categorie. Een film is een event met `film: true`: tijdslimiet `FILM_MAX` 720 s, residents pauzeren en verdwijnen zolang `filming()`, en de nachttint van de wereld gaat omlaag (`EV.nightK()`: × .45, in een eigen decor 0), zodat de film zijn eigen licht maakt. Tijdens een film staat de pagina in bioscoopstand: `body.cine` (via `EV.filming()` in `drawVHS`) haalt scanlijnen, het VHS-filter (`#vhs`), de camcorder-stempel en de VHS-ruis weg; de film heeft zijn eigen fijne korrel. De filmset `K` (`filmKit()` in events.js, blok "cinema"): dunne zwarte balken (4,5 % van de hoogte, zodat er niets van de scène wegvalt), vignet, filmkorrel, kleurgradaties (`GRADES`: noir, horror, sepia, warm, koud, apocalyps, magie, rood, neon, nacht, groen, ruimte, goud), een camera (`lens`/`lensW`/`aim`, zoom, kantelen, schudden, nooit buiten het beeld), duisternis met lichten (`light`, `setv('dark')`), `over()` voor gloed na de gradatie, titelkaarten (`opening`, `card`, `ending` dat alles opruimt), `cut`, `fadeIn/Out`, eigen decors (`stage(draw)` verbergt de wereld), weer (regen, as, gloeiende vonken, sneeuw, stof, sterretjes, confetti, bladeren), `journey` (iedereen samen naar de volgende plek), `castNames()` (huisdieren die aan staan), `heidi()`, `llama()`. Huisdieren kunnen in films een kostuum (`deco`) en een CSS-`filter` krijgen; lama's ook (`deco`, `filter`). De films: **Het spook** (Heidi onder een laken), **De uitdrijving** (Pippa bezeten; vereist Pippa), **De anderen** (dubbelgangers in rode overalls, horror), **Hoog in de wolken** (Dobby op een wolk; vereist Dobby), **De rode bal** (Wifi's bal zoeken door dag, regen en nacht; vereist Wifi), **Waar is Snoet?** (roze gang, schaakvloer, lantaarnbos; vereist Snoet), **Kanaal 9** (Pebbels in de tv; vereist Pebbels), **Het regime** (Heidi's dictatuur en de revolutie), **De toverschool**, **De weg van de ninja** (een huisdier wordt ninja), **Missie Kamiel** (naar de ruimte), **Na het einde** (post-apocalyps: water, stofstorm, een zaadje maakt de wereld groen). Een film met een vereist huisdier start niet als dat dier uit staat. Testen: `?ev=film-spook&snel=8` (snel = alles 8× sneller).

**Dansfeest (`dansfeest`, cat `muziek`)**: start wanneer een nieuw nummer met BPM begint (kans 1 op `dance_chance`, niet voor het nummer dat al speelde bij het herladen), of via ▶ in de Studio / `/event dansfeest` (zonder muziek op 112 bpm). Alles volgt de maat via `A.beat()` (`beatNow()` in display.html: positie van de speaker × BPM / 60; springt de positie, dan schuift het dansplan mee, nog altijd op de tel). Opbouw in tellen: binnenkomen als parade (8), samen springen (8), een golf door de rij (8), solo's van 4 tellen (2 onder 90 bpm) per danser en als laatste Kamiel (Wifi draait, Snoet maakt een salto, Pippa danst ballet, Pebbels moonwalkt, Dobby doet binky's, Heidi weigert eerst en doet dan één perfecte pirouette), een kick line (8), de finale met één grote sprong en een slotpose met confetti (6), en weer weg (6). Lichtbundels, lichtvlekken op het gras, muzieknoten en confetti. Stopt de muziek, dan stopt de show. Huisdieren die in de scène lagen, dansen mee en gaan daarna terug liggen. Langere events (`long: true`) mogen 150 s duren in plaats van 66.

**Selfies**: `selfie_loop` (elke 10 min) kijkt of personen al `days` dagen weg zijn (`last_changed` van de person-entiteit) en stuurt dan tussen 10 en 21 u een selfie, en opnieuw na elke `days` dagen; de maandselfie valt op een vaste willekeurige dag en uur per maand (`_month_plan`). De tablet tekent de selfie (`sendSelfie`: wazige achtergrond van de scène, Kamiel op schaal 7–9 met het hoofd in beeld, varianten neus/schuin/boven/wazig/dier) en stuurt die via het /kijk-mechanisme (`take_picture`). Teksten in `SELFIE_AWAY`, `SELFIE_MONTH`, `SELFIE_PET`. **Liefdesfoto**: op een dag met `kind: liefde` stuurt `selfie_loop` (alleen Telegram nodig, niet `selfie.on`) op een vaste willekeurige tijd tussen 10 en 19 u `send_love(day)`: variant `liefde` (roze achtergrond met hartjes, een scheve polaroid van een willekeurige foto uit Foto's, Kamiel blij met blosjes en hartjesbril) naar alle gekoppelde chats, met een tekst uit `love_texts(naam, jaren)`. Eén keer per dag (`selfie_state.love`). Testen: `POST /api/love-test` (knop in de Studio) of `/api/selfie-preview?variant=liefde`.

**De tablet zelf**: alles via de JavaScript Interface van Fully (`fully.getScreenOn/turnScreenOn/turnScreenOff(true)/getBatteryLevel/isPlugged/getBooleanSetting('motionDetection')/getFullyVersion/getIp4Address/bind('onMotion')`), dus de Fully-integratie van Home Assistant is niet nodig. `screenPlan()` beslist (elke 30 s): uit als niemand thuis is (`away` uit `api/live`, behalve 2 min na echte beweging), of uit na `off_after` min zonder beweging ('s nachts of altijd); beweging zet het scherm aan. Elke minuut `reportTablet()`; de server zet dan met `POST /api/states/...` de entiteiten `sensor.kamiel_tablet_batterij`, `binary_sensor.kamiel_tablet_lader`, `…_scherm` en `…_beweging` in Home Assistant (ze verdwijnen bij een herstart van HA tot de volgende melding). In de Studio toont een statuslijst wat werkt (✅/⚠️) met wat je moet aanzetten, plus een testknop.

**Vensters**: `arrange()` maakt alle vensters eerst onzichtbaar, meet ze en legt ze grootste eerst op de hoogste vrije plek (skyline), met wat overlap en een kleine willekeurige duw; is er geen plaats meer, dan de plek die het minst bedekt (titelbalken tellen zesvoudig, zodat je elk venster kan vastpakken). Ze verschijnen van boven naar onder, de onderste vooraan.

**Regels-motor (`watch_loop`)**: elke 2 s haalt de server de status op van alle entiteiten die in actieve regels, de deurbel of `motion.entity` staan, vergelijkt met de vorige waarde (`_matches`), houdt rekening met tijdvenster, dag/nacht en "niet vaker dan", en voert dan `run_actions` uit. De eerste meting na een herstart vuurt nooit. Camerabeelden komen via `/camera_proxy/<camera>`, gaan door `_photo` (dreamcore-filter) en worden als `frame`-actie naar de tablet gestuurd; die hangt het beeld in een kader naast Kamiel (`placeDoor`, tikken = weg) en start het interne event `deurbel`. Interne events (`cat: 'intern'`: `deurbel`, `kijken`) worden nooit willekeurig gekozen en staan niet in de gebeurtenissenlijst.

Keuzelijsten met Home Assistant-entiteiten komen uit `api/entities?domain=…` (meerdere domeinen met komma's). Staat er "Niet verbonden met Home Assistant", dan heeft de add-on geen token (zie Valkuilen).

## Koppelingen met de buitenwereld

Alles behalve Home Assistant zelf is optioneel; zonder koppeling valt alleen die functie weg.

| Koppeling | Hoe | Waarvoor |
| --- | --- | --- |
| Home Assistant REST API | Supervisor-token, `http://supervisor/core/api` | Weer, zon, sensoren, scripts, knoppen, speaker, entiteitenlijsten. |
| Weer | Een `weather.*`-entiteit (bv. Met.no) + `weather.get_forecasts` (type daily) | Lucht, wolken, wind, weer-gebonden elementen, Weer.exe. |
| Speakers | `media_player.*` (Google Home/Cast, groepen, de Spotify-integratie): `entity_picture`, `media_title`, `media_artist`, `media_position` | Muziek-tv, Muziek.exe, meeknikken. Hoes via HA-proxy (`HA_ROOT + entity_picture`, met token). |
| De Lijn | Home Assistant-integratie `delijn` (YAML `sensor: - platform: delijn`, gratis sleutel van het De Lijn Open Data-portaal, `stop_id` per halte van 6 cijfers). Attributen: `next_passages` met `line_number_public`, `line_transport_type`, `final_destination`, `due_at_realtime`/`due_at_schedule`. | Vertrekbord, Vertrek.exe, Telegram `/bus`. De Lijn geeft af en toe een `http error`: normaal. |
| Google Home-timers | HACS-integratie "Google Home" (leikoilja/ha-google-home): `sensor.<speaker>_timers`, attribuut `timers` met `local_time_iso`, `fire_time`, `status` (set/ringing/paused), `label`. | Timerbord. |
| Telegram | Eigen bot via @BotFather; Kamiel doet **long polling** (`getUpdates`), dus niets openzetten op de router. Alleen gekoppelde chats (koppelcode van 6 cijfers, 10 min geldig) mogen iets. Commando's: tekst, foto, `/bus`, `/kijk`, `/selfie`, `/wis`, `/muziek Titel 127`, `/muziek`, `/event`, `/event lijst`, `/event <naam>`, `/logboek` (voorbije 24 u, of `/logboek 6`; per dag, met icoontjes, in stukken van max. 3800 tekens, hoogstens 5 berichten), `/help`. Een bericht met "tijd"/"time" als eerste of laatste woord: dat woord verdwijnt en het verzenduur komt eronder (`setMessage` in display.html). | Berichten en foto's van op afstand, "gezien"-meldingen, screenshot van het scherm. |
| Tekst-helper | Een `input_text.*` gekozen in de Studio | Berichten uit automatiseringen ("de was is klaar"). |
| Deurbel | Elke bel met een HA-integratie: liefst lokaal (Reolink, Amcrest, Doorbird, UniFi Protect), ook Ring/Nest (trager). Een `event.*` (verandert bij elke druk) of `binary_sensor.*` (gaat aan) + een `camera.*`. | Foto in een kader naast Kamiel, honden blaffen, Telegram met foto. |
| Fully Kiosk Browser | Op de Android-tablet, Start URL `http://<ip-HA>:8100`, Keep Screen On, Launch on Boot, Reload on network reconnect, Reload on idle | Kamiel permanent tonen. Fully PLUS (betalend) nodig voor kiosk-vergrendeling, bewegingsdetectie en bediening vanuit HA. Voor de camera van de tablet: *Advanced Web Settings → Enable JavaScript Interface* en *Motion Detection → Enable Visual Motion Detection*; de pagina doet `fully.bind('onMotion', …)`, `fully.turnScreenOn()`, `fully.turnScreenOff(true)`. `getUserMedia` werkt niet (http, geen https), daarom via Fully. |

De tablet laadt ook lettertypes van Google Fonts (VT323, Titan One, Arimo): zonder internet valt hij terug op systeemlettertypes.

## De echte lucht (sinds 0.22.0)

Alles staat in `static/sky.js` (`window.KamielSky.create(A)`), met twee MIT-bibliotheken in `static/lib/`: `astronomy.min.js` (astronomy-engine: sterren, planeten, verduisteringen) en `satellite.min.js` (satellite.js: het ISS). Het scherm kijkt naar het **zuiden**: `azX`/`altY` zoals voor zon en maan (azimut 80–280° over de breedte, hoogte 0–~75°). De maan zelf staat op haar eigen boog (`moonArc`), niet op haar echte plek; een maansverduistering wordt op die maan getekend, maar alleen als de echte maan op dat moment op staat.

- **Sterren**: ~110 heldere sterren (RA/Dec/magnitude in `STARS`) en de lijnen van 17 sterrenbeelden (`LINES`), elke 20 s omgerekend naar azimut/hoogte. Alleen bij donker (`darkness`) en helder weer (`clearness`). Planeten: Venus, Jupiter, Mars, Saturnus, Mercurius met hun echte helderheid; ze twinkelen niet.
- **Vallende sterren**: sporadisch ongeveer één per 3 minuten; tijdens de meteorenzwermen in `SHOWERS` (piekdatum, radiant, ZHR, breedte in dagen) veel meer, vanuit de radiant, minder bij volle maan. Soms een vuurbol met nagloeiend spoor. Een zwermnacht komt één keer in het logboek.
- **Nevel**: kans per nacht (`sky.nebula`, standaard 10 %), vast per nacht (geseed op de datum); twee lagen ruis in twee kleuren die zacht tegen elkaar in drijven.
- **ISS**: de add-on haalt twee keer per dag de baan (TLE) bij CelesTrak (`tle_loop`, bewaard in `/data/iss_tle.json`) en geeft die mee in `/api/state` (`sky.tle`); de tablet rekent zelf de positie uit. Altijd zichtbaar als hij boven de horizon is (ook overdag, kleiner). Tikken → ISS.exe.
- **Verduisteringen**: `SearchLocalSolarEclipse`/`SearchLunarEclipse` per dag; de maanschijf schuift echt (iets overdreven) voor de zon en de wereld wordt donkerder; bij een totale maansverduistering wordt de maan koperrood.
- **Regenboog**: tot 20 minuten nadat de regen stopt, als de zon tussen 2° en 40° staat; altijd aan de kant tegenover de zon.
- **Ganzen**: half september t/m november en februari–maart, overdag, een paar V's per dag (najaar naar rechts/zuidwest, voorjaar naar links).
- **Vliegtuigen (sinds 0.24.0)**: `opensky_api_loop` vraagt OpenSky zelf (`/api/states/all` met een vak rond het huis, straal `sky.plane_km`); met een API-client (OAuth2 client credentials, token bij auth.opensky-network.org) om de 30 s, zonder om de 4 min, bij 429 10 min wachten. Elke vlucht één keer per 10 min (`add_plane`), met echte richting (`track`) en afstand. De oude weg blijft ook werken: `opensky_loop` luistert via de websocket naar `opensky_entry` van de OpenSky-integratie. `/api/live` geeft de vluchten van de laatste 90 s mee (`sky.planes`). Hoogte bepaalt grootte en snelheid; overdag zilver met condensspoor boven 7 km, 's nachts lichten (op het scherm-niveau, boven de nachttint). Tikken → Vlucht.exe (maatschappij uit de eerste drie letters van de callsign, `AIRLINES`).
- **Bliksem**: `lightning_loop` zoekt zelf de Blitzortung-sensoren (`find_blitz`: eerst in het entiteitenregister via de websocket, platform `blitzortung`, dan op naam; `counter`, `distance`, `azimuth`). Studio: `POST /api/lightning-test` toont wat gevonden is, met `{flash: true}` een testflits op de tablet en meldt elke stijging van de teller; `/api/live` → `sky.strikes`. Alleen binnen `sky.lightning_km`; dichterbij = fellere flits, met een bliksemschicht als de richting in beeld is.
- **Noorderlicht**: niet meer alleen 's avonds, maar op elk donker uur (de kans per nacht blijft in Gebeurtenissen).
- **Volle maan** (`events.js`, categorie `maan`): op een nacht waarop de maan (bijna) vol is, plant `planFor` om ~21:30–22:45 `volle-maan` (de huisdieren zitten op een rij naar de maan te kijken, honden huilen, katten zetten op met lichtende ogen, Dobby stampt, en dan draaien ze allemaal tegelijk hun kop naar Kamiel) en om ~22:55–23:50 `nachtmerrie` (Kamiel valt in slaap, de wereld verliest zijn kleur, ogen gaan open in de lucht en volgen hem, een lange gedaante komt bij elke hapering dichterbij, dan wordt hij wakker). `A.fullMoon(d)` (fase binnen ±0,034 van vol om 22:00); `?volle=1` om te testen.
- **Sterren (sinds 0.23.0)**: `lib/skydata.js` (gegenereerd uit d3-celestial, BSD-3) bevat ±1600 sterren tot magnitude 5 (`STARS`: RA, Dec, magnitude, B-V-kleur), de lijnen van alle 88 sterrenbeelden (`LINES`) en hun namen met Nederlandse vertaling (`NAMES`). Positie met een eigen snelle omrekening (sterrentijd → azimut/hoogte, elke 20 s); zwakke sterren verdwijnen bij volle maan en laag bij de horizon. De willekeurige sterren in `drawSky` worden alleen nog getekend als de echte uit staan.
- **Telescoop**: tik op de maan (de zon opent Weer.exe) → event `telescoop` (Kamiel zet zijn telescoop op en kijkt) → `openTelescope()` met **Telescoop.exe**: links een oculair (`SKY.eyepiece`: maan in de juiste fase, Jupiter met de vier manen op hun echte plek, Saturnus met ringen, Venus met fase, Mars, sterrenhopen, nevels, stelsels, dubbelsterren), rechts `SKY.tonight()`: maan, planeten (nu of opkomst), sterrenbeelden die goed staan, deep-sky-objecten (`DSO`), ISS-overgangen de komende 12 uur, actieve zwerm, eerstvolgende verduisteringen, zon onder/op. Tik op een regel om hem in het oculair te zien.
- **Zonsop- en ondergang**: `drawTwilight` (koepel van goud, roze en violet rond de zon, ook net onder de horizon; een lichtstreep op de horizon; de roze gordel van Venus boven de blauwe aardschaduw aan de overkant), wolken van onderen warm verlicht, gouden uur en blauw uur als tint over de wereld.
- **Weer dat je voelt** (`sky.js`, `WX`): `/api/state` geeft `temp`, `uv`, `gust`, `bearing` (weerentiteit, of de eigen sensoren `sky.temp_entity`/`sky.uv_entity`) en `sky.rain_soon` (uit `rain_loop`: een regenradar-sensor, zelf gevonden als Buienradar `…precipitation_forecast_average`, of `sky.rain_entity`; anders de uurlijkse weersverwachting via `weather.get_forecasts`). **Regenwolk**: een donkere versie van een wolkenbeeld komt vanaf de windkant in ±15 min dichterbij, achter Kamiel maar voor de heuvels; tegen het einde valt er al regen uit. **Storm** (`SKY.storm()`, vanaf ±50 km/u): donkere lucht, rondvliegende bladeren en papiertjes, elementen wiegen vanaf hun voet, Kamiel leunt in de wind, schuine regen. **Vorst** (< 0°C): ijsbloemen vanuit de hoeken en randen, Kamiels adem. **Hitte** (> 28°C): de lucht boven de horizon trilt, warme waas. **UV ≥ 6**: zonnebril (`sunOutfit`) en een zachte lensflare.
- **Logboek van de lucht**: soort `lucht` gaat naar een eigen lijst (`/data/logboek_lucht.json`, max 1000), zodat het de rest niet verdringt: `GET/DELETE /api/logboek?soort=lucht`, in de Studio de knop 🌌 Lucht, op Telegram `/logboek lucht [uren]`. De server schrijft er vliegtuigen, bliksem, de ISS-baan en regen op komst in; de tablet vallende sterren (per uur), ISS-overgangen, ganzen, regenboog, nevel, verduisteringen, storm, vorst, hitte, UV en de telescoop.
- **Testen**: `?sky=meteoor,nevel,iss,eclips,regenboog,ganzen,vliegtuig,bliksem,regenwolk,storm,vorst,hitte,uv` dwingt af (`?wind=80` voor een echte windsnelheid); `?ev=volle-maan`, `?ev=nachtmerrie`; `__kamiel.sky()` met `?debug=1`.

## Plattegrond (sinds 0.19.0)

Een tabblad in Kamiel Studio (poort 8099, alleen via Home Assistant; de tablet op 8100 kent het niet). Windows-95-stijl, bedoeld voor de gsm.
- Code: `app/house.py` (pure logica: controleren, vertalen van commando's, getest zonder Home Assistant), `app/server.py` (sectie "Plattegrond", `/api/house*`), `app/static/house.js` (het scherm).
- Alles wat van het huis is (verdiepingen, tekeningen, ruimtes, apparaten, scenes) staat in `/data` (`kamiel.json` sleutel `house` + map `/data/house`). Niets daarvan in de repo. Back-ups nemen het mee.
- Tekeningen: de eigenaar uploadt ze zelf; coördinaten zijn breuken (0..1) van de tekening.
- Veiligheid: de pagina kan alleen een vaste lijst commando's uitvoeren op apparaten die op de plattegrond staan (`house.command`), en alleen scenes/scripts die bij een ruimte zijn gezet.
- Heel huis: apparaten met het vinkje "Doet mee"; luidsprekers pauzeren enkel bij uit.
- Eigen knoppen (0.20.0): een apparaat met `knop: true` in `house.devices` (geen entity), met een aan-reeks en een uit-reeks van stappen (zet aan/uit/wissel, start scène/script, IR-commando via `remote.send_command`, wacht). `house.clean_steps` en `house.steps_to_actions` zijn de enige weg naar Home Assistant (vaste lijst); `/api/house/knop` voert de reeks op de achtergrond uit, één tegelijk per knop. Optioneel status-apparaat bepaalt of de knop "aan" is.
- Volledig scherm (0.20.0): de knop zet `html.hs-full` (verbergt de Studio-kop en tabs) en vraagt waar kan echte fullscreen aan; op gsm onthoudt hij dit. In de HA-app blijft de HA-balk zichtbaar.
- Later: grafiek van sensoren, muziekfavorieten, Heel huis als helper op het HA-dashboard, installeerbare app (vraagt https), toegang buiten wifi (Nabu Casa/Tailscale, keuze van de eigenaar).
- Gsm: opent in de HA-app (aangemeld), met een vastgezette snelkoppeling.

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

**Versiegeschiedenis in het kort:** 0.24.1 testknoppen voor Blitzortung in de Studio (gevonden sensoren en hun waarde, en een testflits op de tablet), Blitzortung wordt gevonden via het register van Home Assistant (ook als de plaats een andere naam kreeg), de trekkende ganzen braken de tekening (fout sinds 0.22.0), een fout in de lucht kan de rest van het beeld niet meer meenemen, het jarige huisdier vloog mee met de raket; 0.24.0 vliegtuigen werken weer: Kamiel vraagt het zelf aan OpenSky (gratis account met client id en secret, om de 30 s; zonder account om de 4 min), met testknop en status in de Studio; buitentemperatuur als waarde op elke OSD-regel (met een teken als het regent); batterijen: een ballonnetje met ! boven Kamiel als een toestel bijna plat is (Batterij.exe, wegtikken = een week stil); verjaardagen van de huisdieren (feesthoedje, wandelt de hele dag mee, iedereen komt vaker langs); sterrenbeeldlijnen aan/uit in Telescoop.exe; de zon opent altijd Weer.exe en de maan Telescoop.exe (zon- en maanscripts zijn weg); 0.23.0 echte sterren (±1600, met kleur) en alle sterrenbeelden, telescoop (tik op de maan: Telescoop.exe met wat er vannacht te zien is en een oculair), mooiere zonsop- en ondergangen, regenwolk die nadert als er regen op komst is, storm, ijsbloemen bij vorst, trillende lucht bij hitte, zonnebril en lensflare bij hoge UV, en een apart logboek voor de lucht (Studio en `/logboek lucht`); 0.22.1 geen foutmeldingen meer over OpenSky terwijl Home Assistant herstart (pas na een kwartier zonder verbinding); 0.22.0 de echte lucht: sterrenbeelden en planeten die echt op staan, vallende sterren met de echte meteorenzwermen, nevelnachten, het ISS als het echt overkomt, echte zons- en maansverduisteringen, regenboog na de regen, trekkende ganzen, vliegtuigen via OpenSky, echte bliksem via Blitzortung, noorderlicht op elk uur van de nacht, volle maan (huisdieren doen raar) en een nachtmerrie; 0.21.2 de echte oorzaak van "alle elementen weg, alleen wolken" (13, 22 en 26 oktober): na een paar rondjes wandelen in dezelfde richting tekende Kamiel de elementen nog rond het eerste rondje van de wereld; de Studio telt nu wat echt getekend wordt; 0.21.1 kaders die als tv gemarkeerd zijn doen weer gewoon mee in de scènes; muziek: de plek die je ziet krijgt niets nieuws op de grond (zonder kader een tv op een wolk), de volgende plekken krijgen een kader van de componist met de hoes erin; 0.21.0 rechts bovenaan tot vier regels met waarden (temperatuur, vochtigheid, kWh, gas…); tik op een waarde voor Meter.exe: grafiek van 24 uur, 7 of 30 dagen, laagste/hoogste met tijdstip, gemiddelde, verbruik tegenover de periode daarvoor; 0.20.0 eigen knoppen met reeksen in de plattegrond (aan/uit, wachten, IR, scène/script), volledig scherm en gsm-indeling; 0.19.0 plattegrond in Kamiel Studio (eigen tekeningen, ruimtes, apparaten bedienen, scènes per ruimte); 0.18.2 het scherm knippert niet meer aan en uit: één beslissing voor iedereen, met rem (uit pas na minstens 10 min zonder teken, aan alleen op een nieuw teken, beweging vlak na het uitgaan telt niet), het logboek zegt waarom; 0.18.1 wie er thuis is via de gsm's op het thuisnetwerk (Kamiel klopt aan bij hun vaste adres, om de 20–60 s), een wifi-sensor telt alleen zolang de gsm hem blijft doorgeven, beweging voor de tablet telt mee, scherm uit na 15 min zonder enig teken van iemand thuis; 0.18.0 thuis = verbonden met de thuiswifi (of elke andere entiteit, één is genoeg, met wachttijd), slimme stekker voor de lader (tussen twee percentages), tot drie waarden per regel onder de datum, wolken verschijnen en verdwijnen nooit meer half in beeld (en nieuwe wolken faden in), vleermuizen, harten, ballonnen, pepernoten en noorderlicht bewegen organisch en rustiger, het wolkdier zweeft rustig, pompoenen (en paaseieren) komen als laatste op vrije plekken met verschillende gezichten en soms verlicht, kaders vaker (standaard 1 per scène), muziek gebruikt je eigen kaders of de tv op een wolk in plaats van het gouden standaardkader; 0.17.11 een beeld dat blijft hangen (geen antwoord, geen fout) wordt na 30 s opnieuw gevraagd, verzoeken die nooit antwoorden worden na 25 s opgegeven, en blijft de plek op het scherm 3 minuten leeg terwijl er elementen staan, dan vraagt de tablet alles opnieuw en herlaadt hij zichzelf; 0.17.10 één kapot element kan de scène niet meer leegmaken (grond en horizon verdwenen), maten worden hersteld bij het opstarten, beelden die niet laden staan in het logboek en in de Studio (De tablet: wat er nu op het scherm staat); 0.17.9 "tijd"/"time" voor of achter een bericht verdwijnt uit de tekst en zet het verzenduur eronder (alleen "tijd" = het uur groot), Telegram `/logboek [uren]`; 0.17.8 de tablet laadt na elke update van de add-on vanzelf de nieuwe code; 0.17.7 aantallen per soort werken echt (krimpen i.p.v. weglaten), kaders eerst, nieuwe instelling Drukte (heel rustig … heel druk, soms helemaal leeg), tijdstip onder berichten met "tijd"/"time", foutmelding `indexOf` opgelost, Valentijn-event werkte nooit (dubbele naam); 0.17.6 beelden die niet laden worden opnieuw geprobeerd (geen lege wereld meer na een hapering), geen foutmelding meer bij snel twee keer tikken; 0.17.5 bij zonsondergang (en -opgang) wandelt Kamiel binnen een minuut naar een nieuwe plek met de juiste elementen; geen verouderde zonnestand meer als Home Assistant wegvalt; 0.17.4 nacht-elementen volgen de zon (zonsondergang tot zonsopgang), de rusttijd van het scherm wordt apart ingesteld bij de tablet; 0.17.3 geen persoonlijke datums meer in de code (eigen dagen staan alleen in de Studio); 0.17.2 dunne filmbalken, bioscoop- in plaats van VHS-look tijdens films, nieuw event: een huisdier zoeft voorbij op een wolk; 0.17.1 het scherm gaat 's ochtends (en als er weer iemand thuis is) vanzelf terug aan, met extra zekerheid via Fully's Remote Administration; 0.17.0 twaalf films van 5–10 minuten (filmset met balken, gradaties, camera, licht en decors) en elf nieuwe kleren; 0.16.4 meerdere speakers en plekken voor de muziek (Kamiel volgt de speaker die speelt); 0.16.3 foutmelding bij het verdwijnen van het vertrekbord opgelost; 0.16.2 lucht-objecten voor/tussen/achter de wolken, feestthema's ook de dagen rond de feestdag, jullie dagen (liefdesfoto op Telegram, groot hart, alles in roze); 0.16.1 zes nieuwe verhaaltjes met de huisdieren; 0.16.0 noorderlicht, Wifi's bal gooien, feestdagen en verjaardagen (veel meer events, versiering, eigen events), verhaaltjes (Heidi's wraak, ufo, verhuis, ogen in het donker), zalen (museum, disco, sterrenwacht, eigen zalen), luchtkwaliteit; 0.15.1 de scène blijft dezelfde als de tablet herlaadt na een wijziging in de Studio; 0.15.0 scherm uit als niemand thuis is, statuslijst van de tablet in de Studio met testknop, batterij/lader/scherm/beweging als entiteiten in Home Assistant; 0.14.0 dansfeest op muziek (alle huisdieren en Heidi, in de maat); 0.13.0 logboek, inklapbare muziek en gebeurtenissen, huisdieren die blijven liggen en hun eigen ding doen (nieuwe houdingen), opgeruimde vensters, back-up en terugzetten, selfies op Telegram (/selfie); 0.12.0 objecten op heuvels alleen waar de heuvel vlak genoeg is en een beetje erachter (geen zwevende objecten meer), stapelen alleen op een vlak stuk en net achter de rand van de drager, Lampen.exe opgegaan in Knoppen.exe (tot 30 knoppen), knoppen en regels kunnen elke actie van Home Assistant (ook keuzelijsten: volgende, vorige, een optie kiezen); 0.11.0 toekomstbestendig: deurbel met camerafoto in een kader (Kamiel gaat kijken, Wifi en Snoet blaffen, Telegram met foto), "Als dit, dan dat"-regels, camera van de tablet via Fully (Kamiel komt kijken, scherm aan/uit), Lampen.exe, nieuw tabblad Huis; 0.1.x basis (Studio, tablet, panorama, borden, kaders, weer, HA-token), 0.1.7–0.1.10 percentages, grootte, plaatsing, horizon, 0.2.0 herinneringen, 0.3.0 berichten, muziek-tv, tikken, seizoenen, maan, 0.4.x Telegram, 0.5.0 vertrekbord, timers, zakdiepte per element, weer- en maanfixes, 0.6.0 Windows-vensters en kleerkast, 0.7.0 meeknikken, herinneringen wegtikken, tv-vormen, weer per element, 0.7.1 geen zwart scherm meer bij fouten, 0.7.2 scripts altijd vers, 0.10.1 huisdieren getekend naar echte foto's (pluizige oren en staart, Snoets crème masker, Pippa smoking met witte buik en poten, Pebbels met M-streep en witte pootjes, Dobby als compact dwergkonijn met witte bef en vlekje op de neus); 0.10.0 huisdieren (Wifi, Snoet, Pippa, Pebbels, Dobby) + Roepen.exe; 0.9.1 Heidi met eigen uiterlijk en karakter, geen tekstballonnen, persoonlijke info uit de handleiding, locatie uit Home Assistant; 0.9.0 compositie als een fotograaf (kijkwijzen + score, geen raakvlakken, grond nooit vóór horizon), heuvels, stapelen, enkel gras, kijkrichting, albumhoes in fotokaders, nieuwe bibliotheek in de Studio, kleerkast-bug (`outfits_off`); 0.8.0 wereldgebeurtenissen, scènes vernieuwen echt (visible-bug), ook 's nachts wandelen, maanboog, Wandel.exe, 13 nieuwe kleren, aantallen per soort, nieuwe plaatsingsregels, Telegram-foto in bestaand kader, eigen nummerlijst voor meeknikken.

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
| `?snel=8` | Events en films 8× sneller afspelen (samen met `?ev=film-…`). |
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
| "Cannot read properties of null (reading 'flap')" in `tickSigns` | `updateBoard()` haalt het vertrekbord weg als alles vertrokken is (of na 15 s "GEEN VERTREK"), en de regel erna tikte het bord dat al weg was. | Na `updateBoard()`/`updateTimers()` opnieuw kijken of het bord er nog is (0.16.3). |
| Films 's avonds onleesbaar donker | De nachttint van de wereld valt over alles, ook over de acteurs, en daarbovenop kwam de duisternis van de film. | Tijdens een film zwakt de wereldtint af (`EV.nightK()`), in een eigen decor helemaal (0.17.0). |
| Voeten en dingen op de grond onder de zwarte balk | Volle balken (`bars` 1) zijn 69 px hoog en `FEET` ligt op 548. | In films met veel op de grond: `K.setv('bars', .55)` (0.17.0). |
| Een apart filmscript kan niet bij Kamiel | Alles in display.html zit in één grote functie. | Films registreren zich in `window.KamielFilms` en krijgen alles via de filmset `K` (0.17.0). |
| Scherm 's ochtends niet terug aan | `applyScreen()` zette het scherm alleen uit; aan ging het enkel bij beweging, en met het scherm uit kijkt Fully meestal niet naar de camera. | `offByUs`: zette Kamiel het scherm zelf uit, dan zet hij het weer aan zodra de reden voorbij is (het einde van de nacht, iemand thuis). Met de hand uitgezet overdag blijft uit. Vangnet: `screen_guard_loop` in de server wekt de tablet via Fully's Remote Administration (`http://<ip>:2323/?cmd=screenOn&password=…`) bij het einde van de nacht en als er iemand thuiskomt, als `motion.fully_pw` ingevuld is (nooit naar de tablet gestuurd). Testknop: `POST /api/screen-wake` (0.17.1). |
| Nacht-elementen nooit te zien | De nachtperiode uit de instellingen werd ook gebruikt om het scherm uit te zetten: tijdens de "nacht" was het scherm dus altijd uit. | Twee aparte dingen: de wereld volgt de zon, het scherm volgt de rusttijd (0.17.4). |
| Na zonsondergang nog dag-elementen | Een plek verandert nooit terwijl je kijkt; de plek waar Kamiel stond bij zonsondergang hield zijn dag-elementen tot de volgende wandeling (tot `walk_minutes`). En viel Home Assistant weg, dan bleef de laatste zonnestand hangen. | `schedule()`: past de plek niet meer bij `isDark()`, dan wandelt hij binnen 45 s verder. `pollState` zet `haSun` op null als er geen zon komt, dan rekent de tablet zelf (0.17.5). |
| Wereld plots leeg (geen elementen, geen wolken; dieren wel) | Elk beeld werd één keer geladen (`load()`); lukte dat niet (add-on herstart, netwerkhapering), dan bleef dat beeld voor altijd onzichtbaar tot de tablet herstartte. Elementen laden pas als ze voor het eerst geplaatst worden, dus één hapering kon alles treffen. | `load()` probeert opnieuw na 4, 15, 45, 120 s en daarna elke 5 min (met `?r=n` tegen de cache) (0.17.6). |
| "Cannot read properties of undefined (reading 'offsetWidth')" bij tikken | Twee keer tikken terwijl de vensters nog opengingen: de tweede opening maakte alles leeg tijdens de 120 ms van de eerste, die daarna vensters wilde schikken die er niet meer waren. | `deskGen`: elke opening krijgt een nummer en stopt als er een nieuwere (of sluiten) kwam; `arrange` neemt alleen vensters die bestaan; een venster dat faalt, breekt de andere niet (0.17.6). |
| Aantallen per soort hadden bijna geen effect; kaders bijna nooit | Grond en horizon delen één rij naast Kamiel (±720 px); wat niet paste, werd weggelaten, en grote kaders vielen het eerst weg. | `compose.js`: past de rij niet, dan krimpt alles (tot ±de helft) in plaats van weg te vallen; kaders worden eerst geplaatst; `compose.busy` (Drukte 0–4) vermenigvuldigt de aantallen (× .35/.65/1/1.45/1.9) en de grootte, en maakt de kijkwijze Leegte vaker of minder vaak; Leegte is soms helemaal leeg (0.17.7). |
| "Cannot read properties of undefined (reading 'indexOf')" | `load()` (0.17.6) kreeg soms geen adres (een kader zonder foto) en het opnieuw proberen viel daarover. | `load()` zonder adres geeft een leeg beeld terug (0.17.7). |
| Het Valentijn-event gebeurde nooit | Twee events heetten `verliefd`; het tweede overschreef het eerste. | Het feest-event heet nu `valentijn`. Controle: geen dubbele id's in LIST (0.17.7). |
| Na een update draaide de tablet nog de oude code | De tablet herlaadde alleen als `version` (wijziging in de Studio) veranderde, niet bij een nieuwe add-on-versie. | `BUILD` (jongste wijzigingstijd van de .js/.html-bestanden) in `api/world`; de tablet herlaadt als die verandert, en bij het opstarten na een update verhoogt de server één keer `version`, zodat ook oudere tablets herladen (0.17.8). |
| Weer geen grond- of horizonobjecten, wel wolken en lucht | Sinds 0.17.7 krimpen grond en horizon samen als ze niet passen; had één element een kapotte maat (geen hoogte/breedte), dan werd die berekening NaN voor de hele rij en werd alles op de grond en aan de horizon onzichtbaar. Lucht en wolken doen niet mee in die rij. | `compose.js`: elementen zonder geldige maat worden overgeslagen (`sane`), kandidaten met NaN vallen weg, de krimpfactor wordt alleen toegepast als hij eindig is; `placeItems` tekent niets met een ongeldige positie; de tablet slaat elementen zonder maat over en meldt ze; de server meet een ontbrekende maat opnieuw uit het beeld bij het opstarten; `load()` probeert ook een beeld dat "laadt" maar niet te tonen is opnieuw en meldt na 3 pogingen welk element; de tablet stuurt `scene` (wat er op de huidige plek staat en hoeveel zichtbaar is) mee naar de Studio (0.17.10). |
| Alle elementen weg (lucht, horizon, grond), alleen wolken en heuvels blijven | Wolken laden meteen bij het opstarten, elementen pas als ze geplaatst worden. Hapert de wifi of de verbinding met de HA Green, dan kan een beeldverzoek blijven hangen zonder antwoord én zonder fout: dan probeerde `load()` nooit opnieuw, en bleven alle elementen die daarna geplaatst werden onzichtbaar tot een herstart. | `load()` houdt hangende beelden bij en vraagt ze na 30 s opnieuw (een nieuwe `src` breekt het oude verzoek af); `fetch` geeft het na 25 s op (AbortController), zodat vastgelopen verzoeken de browser niet volstoppen; staat de huidige plek 3 minuten vol onzichtbare elementen, dan worden alle beelden opnieuw gevraagd en na 6 minuten herlaadt de pagina (hooguit eens per 30 minuten, de scène blijft dezelfde), met een regel in het logboek (0.17.11). |
| Geen vliegtuigen, ook al staat de OpenSky-integratie aan | OpenSky schafte op 18 maart 2026 inloggen met gebruikersnaam en wachtwoord af (alleen nog API-clients met OAuth2), en de integratie van Home Assistant kent alleen dat oude inloggen; anoniem vraagt ze maar om de 15 min, zodat een vliegtuig bijna nooit op het juiste moment boven het huis is. | Kamiel vraagt OpenSky zelf met een API-client (0.24.0). |
| Tikken op de maan deed niets | Er stond nog een maanscript ingesteld; dat ging voor de telescoop. | Zon- en maanscripts weg: zon = Weer.exe, maan = Telescoop.exe (0.24.0). |
| In het najaar viel het beeld deels weg zodra er ganzen overvlogen | In `drawGeese` stond een losse `X` in plaats van de regel met `t`, `u` en `col` (sinds 0.22.0): de fout brak de rest van de tekening af. | Regel hersteld; `SKY.back/flyers/screen` lopen nu in `skySafe` (fout één keer in het logboek, de rest van het beeld gaat door) (0.24.1). Een controle met eslint (`no-undef`) vindt dit soort fouten. |
| Foutmelding "major-axis radius … is negative" bij de raket | Het jarige huisdier volgde Kamiels voeten de lucht in; de diepteschaal werd negatief. | Het blijft op de grond en verdwijnt zolang Kamiel van de grond is; `drawPet` tekent nooit met een negatieve maat (0.24.1). |
| Logboek vol vliegtuigen en vallende sterren | Alles in één lijst van 1500 regels: de lucht zou de rest eruit duwen. | Soort `lucht` heeft een eigen lijst en bestand (0.23.0). |
| "OpenSky (vliegtuigen): 502 … ws://supervisor/core/websocket" in het logboek | De Supervisor antwoordt 502 op de websocket zolang Home Assistant Core niet `RUNNING` is, bv. tijdens de herstart na het toevoegen van een integratie. De lus probeerde om de 30 s opnieuw en meldde elke mislukte poging. | Opnieuw proberen blijft, maar het logboek zegt pas iets als het een kwartier aanhoudt (en één keer als het weer werkt); na 5 minuten wordt om de 2 minuten geprobeerd (0.22.1). |
| Het ISS bleef weg met `?t=` (vaste tijd) | De positie werd alleen herberekend als de tijd veranderde, en de eerste berekening gebeurde voor de baan binnen was. | Bij een nieuwe baan wordt `issT` op 0 gezet (0.22.0). |
| De speciale `ev=geen` in testadressen | `?ev=` met een onbekende naam start een **willekeurig** event (bv. lens-breken), wat schermafbeeldingen verwart. | Laat `ev` weg om niets te forceren (0.22.0). |
| **Alle elementen, heuvels en pompoenen weg, wolken en huisdieren wel** (13, 22 en 26 oktober) | Kamiels positie `kx` groeit eindeloos als hij lang dezelfde kant op wandelt, maar elementen, heuvels, pompoenen, zalen en `visible()` werden alleen getekend voor de wereld-kopieën `k = -1, 0, 1`. Na meer dan ±2 rondjes stond alles buiten beeld. Wolken (met `mod`) en huisdieren (met `wrapD`) hadden er geen last van. Een herlaadbeurt hielp niet: `saveScene` bewaart `kx`. De status zei "alles zichtbaar" omdat hij alleen keek of de beelden geladen waren. | Alle lussen tekenen rond de kopie waar de camera is: `kb() = floor(kx / PW)`, `k = kb()-1 … kb()+1`. `sceneNow()` telt als zichtbaar wat in de laatste frame echt getekend is (`hits`); het zelfherstel gebruikt dat (niet tijdens events, vensters of zalen). Test: `?debug=1` en `__kamiel.setKx(3 * PW + 480)` (0.21.2). |
| Kaders alleen nog op wolken bij muziek, nooit op de grond | Kaders met "tv" aangevinkt werden uit de compositie geweerd (`ok()` had `!o.tv`) en telden niet als kader voor muziek (`FRAMES` had `!o.tv`); zonder ander kader viel muziek terug op de tv op een wolk. | `ok()` laat tv-kaders toe, `FRAMES` = elk kader met fotovlak. Muziek: zichtbare plek = bestaand kader, anders tv op een wolk; plekken verderop krijgen via `compose(…, {minFrames: 1})` een kader van de componist (0.21.1). |
| Meter.exe: grafiek bedekte de knoppen | De algemene regel `canvas{position:absolute;inset:0}` (voor de wereld) gold ook voor het grafiekje in het venster. | `.meter canvas` krijgt `position:static` en geen VHS-filter (0.21.0). |
| Twee functies met dezelfde naam in server.py | `_ts` bestond al (voor berichten); een tweede `_ts` voor de statistieken overschreef de eerste stilletjes, en de statistieken gaven niets terug. | Nieuwe helpers altijd een unieke naam (`_stat_t`); `grep -n "^def naam"` voor je iets toevoegt (0.21.0). |
| Scherm ging elke minuut uit en weer aan ("niemand thuis" / "iemand thuis") | Thuis/weg werd op meerdere plekken los berekend (elke 5 s voor de tablet, elke minuut in de schermwacht) zonder rem; een korte wachttijd, een gsm die maar af en toe antwoordt en beweging die de camera ziet als het scherm zelf uitgaat, deden het steeds omslaan. | `presence_loop` beslist om de 15 s, de rest leest alleen `PRES`. Weg pas als het laatste teken ouder is dan `away_delay` (minstens 10 min); terug thuis alleen op een teken van ná het uitgaan, beweging in de eerste 2 min na het uitgaan telt niet. Het logboek noemt de reden (0.18.2). |
| Scherm ging niet uit als we vertrokken (wifi-sensor) | Zonder toegang van buitenaf (Nabu Casa, Tailscale…) kan een gsm die vertrokken is Home Assistant niet meer bereiken: zijn wifi-sensor blijft voor altijd op de thuiswifi staan. Thuiskomen werkte wel. | Kamiel klopt zelf aan bij de gsm's op hun vaste adres (TCP naar een paar poorten: "geweigerd" = er is iemand; daarna `ping`, `iputils` in de Dockerfile). Elk teken van iemand thuis heeft een tijdstip (`proof`): gsm-antwoord, `last_reported` van de wifi-sensor (stil > 30 min = weg), beweging voor de tablet, entiteiten. Scherm uit als het laatste teken ouder is dan `away_delay` (0.18.1). |
| Wolken verschenen plots half in beeld aan de linkerkant | Het omslagpunt van de wolken lag 400 px buiten beeld, maar grote wolken zijn tot 700 px breed: een wolk die van rechts naar links omsloeg, stond meteen voor de helft in beeld. | Het omslagpunt ligt nu per wolk een volle wolkbreedte (+80 px) buiten beeld aan beide kanten; nieuwe wolken na een weerswissel faden in over 6 s (0.18.0). |
| Pompoenen stonden vóór (of in) andere elementen | Ze werden op vaste plekken getekend, los van de compositie en vóór de grondlaag. | `festDecor(i)` zoekt per plek als laatste vrije stukken grond (geen overlap met grondelementen, niet op Kamiels plek) en `placeItems(2)` tekent ze mee in dieptevolgorde (0.18.0). |
| Muziek kwam in een gouden kader met kruisvoet, vóór andere elementen | Zonder eigen kader mét fotovlak (`hole`) viel `FRAME()` terug op het ingebouwde kader, en `tryTV` hield alleen rekening met de grondlaag. | Muziek kiest een bestaand kader met fotovlak, dan een eigen kader op een vrije plek (eerst ook vrij van de horizon), anders de tv op een wolk; `addThing` haalt pas na 5 rondes een grondelement weg (0.18.0). |
| Kaders zeldzaam | Standaard "0 tot 1" kader per scène, en bij Rustig werd 1 × 0,65 afgerond; samen ongeveer één scène op drie. | Standaard 1 kader; opgeslagen `[0, 1]` wordt eenmalig `[1, 1]` (`counts_v`); aantallen worden met kans afgerond (0.18.0). |
| Migratie liep nooit | De versie-sleutel (`feest.v`) werd gelezen ná het samenvoegen met `DEFAULT_SETTINGS`, die al de nieuwe versie bevat. | Lees een migratie-sleutel altijd uit `stored`, nooit uit de samengevoegde instellingen (0.16.2). |
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
| Objecten op heuvels zweefden half | De voet werd alleen in het midden op de heuvel gezet; een breed object boven een helling hing in de lucht. | Op een heuvel alleen als de kam onder de hele voet hoogstens 16% van de objecthoogte verschilt; de voet staat op het laagste punt en het object staat net áchter de voorste heuvel (eerst achterste heuvels, dan heuvel-objecten, dan de voorste heuvel, dan de rest) (0.12.0). |
| Gestapelde dingen zweefden of zakten scheef | Ze werden op het hoogste punt van een willekeurige plek van de drager gezet. | `fitOn`/`flatSpot`: zoek een stuk bovenkant dat vlak genoeg is voor de voet (ruwheid ≤ 7% van de hoogte), anders kleiner proberen, anders niet plaatsen. Het ding staat net achter de voorrand (wordt vóór de drager getekend) en zakt een paar procent weg; op een wolk zit het een stukje ín de wolk (0.12.0). |
| De tablet "startte vanzelf opnieuw" en stond plots in een andere omgeving | Elke wijziging in de Studio (instellingen, elementen, foto's, herinneringen) verandert `version`; de tablet merkt dat binnen 2 min en herlaadt, en maakte dan alle scènes opnieuw. | `saveScene()` vóór het herladen: plekken (elementen per id), wolken, Kamiels positie en de liggende huisdieren gaan naar `localStorage` (5 min geldig); `restoreScene()` zet ze terug. Het logboek zegt nu "Opnieuw geladen: er veranderde iets in Kamiel Studio", en meldt bij een echte start of het de tablet (Fully) of een browser is (0.15.1). |
| Lokale testservers vielen weg | Achtergrondprocessen stierven tussen shell-aanroepen. | Starten met `setsid nohup … < /dev/null &`. |

**Verder goed om te weten:**

- De tablet is mogelijk een goedkope Android met een oudere WebView: houd de JavaScript op ES2019, test met `acorn`.
- Het panorama heeft een echt horizonprofiel; alles wat op de grond staat moet dat volgen.
- De Studio-pagina tekent na elke `load()` alles opnieuw: niet-opgeslagen invoer in herinneringskaarten verdwijnt als je ondertussen iets anders opslaat.
- Alleen-lezen op poort 8100 is een belofte aan de eigenaar: nieuwe schrijvende endpoints daar mogen alleen dingen doen die vooraf in de Studio zijn ingesteld.
- Een rule-actie `ha` mag alles starten wat in de Studio gekozen werd; via poort 8100 kan dat niet (rule-test bestaat alleen op 8099).
- De Telegram-sleutel staat in `kamiel.json` en mag nooit via `api/world` of `api/live` naar de tablet; chat-id's worden er ook uit gefilterd.

## Beslissingen en openstaande ideeën

- **Privacy (9 oktober 2026):** de repo is publiek (Home Assistant haalt de add-on zonder wachtwoord op), dus er staat geen persoonlijke info in: geen adres, namen van mensen, eigen datums, wachtwoorden, tokens of chat-ids. Alles wat persoonlijk is, staat alleen in `/data` (de instellingen in Home Assistant). De git-geschiedenis is die dag herschreven (`git filter-repo`) om oudere vermeldingen te wissen; commits van de eigenaar gebruiken zijn GitHub-noreply-adres. Nieuwe code en deze handleiding: hou het zo.

**Bewuste keuzes (niet terugdraaien zonder te vragen):**

- Objecten bewegen nooit en verschijnen niet zomaar; verandering gebeurt buiten beeld (bij het wandelen). Uitzonderingen zijn live dingen die de eigenaar zelf oproept of die nieuws brengen (tv, borden, foto, berichten).
- Geen glitch-scènes, geen hut, geen plant/afval-scènes, geen afstand tussen personen.
- Elke upload krijgt de dreamcore-filter, ook foto's van bv. het Belfort.
- Weinig tekst op het scherm; info komt pas tevoorschijn als je erom vraagt (tikken) of als ze er echt toe doet.
- Berichten en herinneringen in dezelfde vage memestijl (rood met cyaan spook, Arimo).
- Uitleg aan de eigenaar altijd in het Nederlands en op beginnersniveau.

**Openstaande ideeën (niet gebouwd):**

- [ ] Pixel-editor in Kamiel Studio om zelf hoeden en kleren te tekenen (raster over Kamiels hoofd, kleuren kiezen, lichaamsdeel en naam); de eigenaar vroeg ernaar, wacht op zijn "ja".
- [ ] Diepte door een lichte blauwe waas op horizon-objecten; schaduwen die van de zon weg vallen en langer worden bij lage zon.
- [ ] Kleurharmonie per scène (hoofdkleur bij upload bepalen) en thema-labels per element.
- [ ] Boodschappen.txt (HA-boodschappenlijst), Agenda.exe, Kamiel.exe ("over Kamiel"), een zeldzame nep-foutmelding.
- [ ] Kleren per seizoen of feestdag automatisch (de kerstmuts, paasoortjes en heksenhoed bestaan sinds 0.8.0).
- [ ] Kamiels dagboek: elke dag automatisch een screenshot bewaren als postkaart.
- [ ] Foto's "vandaag, x jaar geleden" in de kaders (EXIF-datum).
- [ ] Berichten per e-mail als tweede weg naast Telegram (met goedkeuring vooraf voor vreemden).

**Concept- en plandocument:** er bestaat ook een ouder document "Kamiel: concept en plan van aanpak" uit de begindagen; dit technische document is nieuwer en gaat voor.
