# Kamiel Studio

Kamiel de alpaca in een eindeloze droomwereld, als add-on voor Home Assistant.

- **Kamiel Studio** (in de zijbalk van Home Assistant): elementen, wolken, kaders, foto's, panorama, bordteksten en instellingen beheren. Alles wat je uploadt krijgt automatisch de dreamcore-filter.
- **Tabletweergave**: `http://<adres-van-je-home-assistant>:8100`. Deze pagina kan alleen lezen, nooit iets veranderen.

## Installeren

1. Installeer de add-on **Samba share** (Instellingen → Add-ons → Add-on-winkel), stel een wachtwoord in en start hem.
2. Open op je computer de gedeelde map `addons` op je Home Assistant:
   - Windows: `\\homeassistant.local\addons`
   - Mac: Finder → Ga → Verbind met server → `smb://homeassistant.local/addons`
3. Kopieer de map `kamiel_studio` (deze map) in `addons`.
4. In Home Assistant: Add-on-winkel → menu rechtsboven → **Controleren op updates**. Onderaan verschijnt **Lokale add-ons → Kamiel Studio**.
5. Klik op Kamiel Studio → **Installeren** (dit duurt enkele minuten) → **Toon in zijbalk** aan → **Starten**.

## Testen in de browser

`http://<adres>:8100/?t=22:30&w=regen&demo=10`
- `t`: doe alsof het dit uur is
- `w`: weer (`helder`, `licht`, `bewolkt`, `regen`, `mist`)
- `demo`: laat Kamiel om de zoveel seconden verder wandelen

## Gegevens

Alles wat je toevoegt staat in de opslag van de add-on en zit mee in de back-ups van Home Assistant.

## Koppelingen met Home Assistant (optioneel)

Alles stel je in via **Instellingen** in Kamiel Studio.

- **Telegram**: tabblad *Bericht* → *Berichten via Telegram*. Maak een bot bij @BotFather, plak de sleutel, koppel jullie gsm met de code. Stuur tekst, een foto, /bus, /kijk of /wis.
- **Berichten**: tabblad *Bericht* (werkt ook van op afstand via de Home Assistant-app). Wil je berichten uit automatiseringen, maak dan een tekst-helper aan (Instellingen → Apparaten en diensten → Helpers → Tekst) en kies die in Kamiel Studio.
- **Muziek-tv**: kies de speaker (bijvoorbeeld je Google Home). Een eigen tv: upload een kader en vink "Tv voor muziek" aan.
- **Vertrekbord**: tik op de klok. Instellen bij Instellingen → Vertrekbord (met uitleg, De Lijn-integratie nodig).
- **Timers**: de HACS-integratie Google Home; kies de _timers-sensor bij Instellingen.
- **Tikken op zon, maan of een element**: kies een script, scène of automatisering.

Testen in de browser: `?d=2026-12-24` doet alsof het die datum is, `?w=sneeuw` laat het sneeuwen.
