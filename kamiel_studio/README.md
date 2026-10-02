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
