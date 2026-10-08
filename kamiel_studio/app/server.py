"""Kamiel Studio: a Home Assistant add-on.

Port 8099 (ingress, inside Home Assistant): the Studio, where everything is managed.
Port 8100 (your network): the tablet view. It can only read, never change anything.
"""
import asyncio
import copy
import json
import os
import re
import shutil
import time
import uuid
from functools import partial

from aiohttp import ClientSession, ClientTimeout, web

import process

APP = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("KAMIEL_DATA", "/data")
MEDIA = os.path.join(DATA, "media")
ORIG = os.path.join(DATA, "originals")
DB_FILE = os.path.join(DATA, "kamiel.json")
LOG_FILE = os.path.join(DATA, "logboek.json")


def _addon_version():
    for p in (os.path.join(APP, "addon_config.yaml"), os.path.join(APP, "..", "config.yaml")):
        try:
            with open(p) as f:
                m = re.search(r'^version:\s*"?([^"\n]+)', f.read(), re.M)
                if m:
                    return m.group(1)
        except OSError:
            pass
    return "?"


ADDON_VERSION = _addon_version()
def read_token():
    """The Supervisor hands the add-on a token. Depending on how the add-on starts, it is
    either in the environment or only in s6's container environment folder."""
    for key in ("SUPERVISOR_TOKEN", "HASSIO_TOKEN"):
        if os.environ.get(key):
            return os.environ[key].strip()
        for folder in ("/run/s6/container_environment", "/var/run/s6/container_environment"):
            path = os.path.join(folder, key)
            if os.path.exists(path):
                with open(path) as f:
                    value = f.read().strip()
                if value:
                    return value
    return None


TOKEN = read_token()
HA_URL = os.environ.get("KAMIEL_HA_URL", "http://supervisor/core/api")
HA_ROOT = HA_URL[:-4] if HA_URL.endswith("/api") else HA_URL

KINDS = ["grond", "horizon", "lucht", "wolk", "kader"]
RARITY = ["gewoon", "zeldzaam", "heelzeldzaam"]
WEATHER_BUCKETS = ("zon", "bewolkt", "regen", "sneeuw", "mist")
WINDOWS = ("weer", "vertrek", "knoppen", "kleerkast", "muziek", "wandel", "roepen")
def _read_static(name, pattern):
    """The tablet's own lists (clothes, events) are the single source: read the ids from its scripts."""
    try:
        with open(os.path.join(APP, "static", name), encoding="utf-8") as f:
            return re.findall(pattern, f.read())
    except OSError:
        return []


OUTFIT_SLOTS = dict(_read_static("outfits.js", r"id: '([\w-]+)', name: '[^']*', slot: '(\w+)'")) or {
    "feesthoed": "hoofd", "kroon": "hoofd", "muts": "hoofd", "cowboy": "hoofd", "bloemen": "hoofd", "koptelefoon": "hoofd",
    "zonnebril": "ogen", "nerdbril": "ogen", "sjaal": "nek", "strik": "nek", "rodeneus": "neus", "snor": "neus"}
OUTFIT_SLOT_ORDER = ("hoofd", "ogen", "nek", "neus", "lijf")
# the world events: (id, name, kind) — kind "lama" (daily visit), "vaak" (a few a day) or "soms" (a few a week)
EVENTS = _read_static("events.js", r"id: '([\w-]+)', name: '([^']*)', cat: '(\w+)'")
EVENT_IDS = {e[0] for e in EVENTS}
SONGS = [("Roma", 104), ("All the things she said", 90), ("Why'd you only call me when you're high", 92), ("Backseat", 120),
         ("Everything is Romantic (reimagined)", 91), ("DANCE...", 113), ("Nicole Kidman", 140), ("Brand new chanel$", 126),
         ("Storm II", 137), ("Party", 151), ("SaWaDiKa", 140), ("Wet Vagina", 150), ("Atlas", 120)]
PERIODS = ["altijd", "lente", "zomer", "herfst", "winter", "valentijn", "pasen", "halloween",
           "sinterklaas", "kerst", "nieuwjaar", "eigen"]

DEFAULT_SETTINGS = {
    "weather_entity": "",
    "walk_minutes": 20,
    "night_start": "22:00",
    "night_end": "06:00",
    "night_walks": ["00:00", "03:00"],
    "min_frames": 1,
    "frame_ratio": 2,
    "chances": {"dag": {"grond": 100, "horizon": 100, "lucht": 60, "kader": 50},
                "nacht": {"grond": 100, "horizon": 100, "lucht": 75, "kader": 50}},
    # how many objects of each kind per scene: [at least, at most], by day and by night
    "counts": {"dag": {"grond": [2, 4], "horizon": [1, 3], "lucht": [1, 2], "kader": [0, 1]},
               "nacht": {"grond": [2, 4], "horizon": [1, 3], "lucht": [1, 3], "kader": [0, 1]}},
    "max_objects": 12,
    "spacing": 30,          # px between objects
    "lane": 94,             # px kept free on each side of Kamiel's middle
    "mix_layers": False,    # (no longer used: ground objects never stand in front of horizon objects)
    # composing a scene like a photographer: which ways of looking may be used, and colour harmony
    "compose": {"styles": {"vrij": True, "held": True, "diepte": True, "leegte": True, "groepje": True, "ritme": True,
                           "verhouding": True, "lijn": True}, "color": True},
    # a doorbell with a camera: when it rings, a still from the camera hangs in a frame next to Kamiel
    "doorbell": {"on": False, "trigger": "", "mode": "auto", "camera": "", "minutes": 10, "keep": False, "telegram": True, "pets": True},
    # "if this happens, then Kamiel does that": a list of rules (see RULES below)
    "rules": [],
    # the tablet's own camera (Fully Kiosk PLUS: motion detection + JavaScript interface)
    "motion": {"on": False, "look": True, "wake": True, "screen_off": "nooit", "off_after": 10, "entity": "",
               "away_off": False, "away_entity": "zone.home", "to_ha": True},
    # lights and sockets to switch from the Lampen window on the tablet
    "lamps": [],
    # selfies on Telegram: when someone is away for days, and once a month out of the blue
    "selfie": {"on": False, "people": [], "days": 3, "monthly": True, "pets": True},
    "hills": {"chance": 40, "height": 18},           # % of places with hills; how high, in % of the screen
    "stack": {"chance": 35, "max": 3},              # % chance that a carrier gets something on top; tallest stack
    "events": {"on": True, "lama_per_day": 1, "common_per_day": 3, "normal_per_week": 4, "evening": True, "off": [],
               "pets_per_day": {"wifi": 2, "snoet": 2, "pippa": 2, "pebbels": 2, "dobby": 2}, "pets_together": 25,
               "pets_stay": 35, "pets_lying": 20, "pets_stay_min": 45, "dance_chance": 20,
               "aurora_chance": 15, "stories_per_week": 3},
    # feast days and birthdays: much more happens, with decorations and events of their own
    "feest": {"on": True, "boost": 3, "v": 2,
              "days": [{"name": "Verjaardag", "date": "01-01", "kind": "verjaardag"}, {"name": "Verjaardag", "date": "01-01", "kind": "verjaardag"},
                       {"name": "We werden een koppel", "date": "01-01", "kind": "liefde"}, {"name": "Onze eerste date", "date": "01-01", "kind": "liefde"}],
              "holidays": {"halloween": True, "kerst": True, "nieuwjaar": True, "pasen": True, "valentijn": True, "sinterklaas": True}},
    # halls: now and then a place is a room (museum, disco, observatory, or one of your own)
    "halls": {"chance": 12, "off": [], "custom": []},
    # air quality: with bad air Kamiel gets drowsy
    "air": {"on": False, "entity": "", "warn": 1000, "bad": 1500, "invert": False},
    # height on screen, in % of the screen height: [smallest, largest]
    "sizes": {"grond": [10, 40], "horizon": [15, 42], "lucht": [12, 38], "kader": [18, 42]},
    "giant_chance": 10,
    "season_colors": True,
    "message_entity": "",
    "message_minutes": 60,
    "sun_script": "",
    "moon_script": "",
    "empty_tap": "vensters",
    "media_player": "",   # the first of media_players (older versions had only this one)
    "media_players": [],  # [{entity, name}]: every speaker/room Kamiel listens to; he follows the one that plays
    "departures": [],
    "board": [],
    "windows": {"weer": True, "vertrek": True, "knoppen": True, "kleerkast": True, "muziek": True, "wandel": True, "roepen": True},
    "window_titles": {"weer": "Weer.exe", "vertrek": "Vertrek.exe", "knoppen": "Knoppen.exe", "kleerkast": "Kleerkast.exe", "muziek": "Muziek.exe",
                      "wandel": "Wandel.exe", "roepen": "Roepen.exe"},
    "window_close": 60,
    "window_layout": "verspreid",
    "buttons": [],
    "outfit_mode": "kiezen",
    "outfits_on": [],
    "outfits_off": [],      # clothes NOT in the wardrobe; new clothes are in it by themselves
    "kamiel_tap": "kleerkast",
    "timer_entities": [],
    "departure_trigger": "",
    "people": [],
    "horizon_sink": 3,
    "tap_url": "",
    "osd_entities": [],
    "words": ["WELKOM IN KAMIELLAND", "JE BENT HIER AL EENS GEWEEST", "HIER WOONT KAMIEL",
              "NIETS AAN DE HAND", "BLIJF NOG EVEN", "HET IS ALTIJD 4:12"],
}

lock = asyncio.Lock()
LOCATION = {"lat": 50.5, "lon": 4.5}   # replaced at start-up by the location set in Home Assistant


# ----------------------------------------------------------------- storage
def first_run():
    shutil.rmtree(os.path.join(DATA, "backup-tmp"), ignore_errors=True)   # left-over downloads and half uploads
    os.makedirs(MEDIA, exist_ok=True)
    os.makedirs(ORIG, exist_ok=True)
    if not os.path.exists(DB_FILE):
        src = os.path.join(APP, "defaults")
        if os.path.isdir(src):
            for f in os.listdir(os.path.join(src, "media")):
                shutil.copy(os.path.join(src, "media", f), MEDIA)
            shutil.copy(os.path.join(src, "kamiel.json"), DB_FILE)
        else:
            save_db({"assets": [], "photos": [], "panorama": None, "settings": copy.deepcopy(DEFAULT_SETTINGS), "version": 1})


def load_db():
    with open(DB_FILE) as f:
        db = json.load(f)
    stored = db.get("settings", {})
    s = copy.deepcopy(DEFAULT_SETTINGS)
    s.update(stored)
    if stored.get("empty_tap", "url") == "url" and not stored.get("tap_url"):
        s["empty_tap"] = "vensters"
    if "board" not in stored and stored.get("departures"):
        s["board"] = [{"entity": d["entity"], "label": d.get("label", "")[:14], "lines": d.get("lines", ""),
                       "dest": "", "kind": "alles", "count": 1} for d in stored["departures"]]
    if "outfits_off" not in stored and stored.get("outfits_on"):
        # up to 0.8.0 the Studio saved the clothes that were ON, so clothes added later never showed up
        first12 = ["feesthoed", "kroon", "muts", "cowboy", "bloemen", "koptelefoon", "zonnebril", "nerdbril", "sjaal", "strik", "rodeneus", "snor"]
        s["outfits_off"] = [o for o in first12 if o not in stored["outfits_on"]]
    if "counts" not in stored and "chances" in stored:
        # older versions had a chance per kind; start from the new, fuller defaults but keep "never" as never
        for part in ("dag", "nacht"):
            for kind, v in stored["chances"].get(part, {}).items():
                if kind in s["counts"][part] and int(v) == 0:
                    s["counts"][part][kind] = [0, 0]
    ev = copy.deepcopy(DEFAULT_SETTINGS["events"]); ev.update(stored.get("events") or {}); s["events"] = ev
    ev["pets_per_day"] = dict(DEFAULT_SETTINGS["events"]["pets_per_day"], **((stored.get("events") or {}).get("pets_per_day") or {}))
    for k in ("hills", "stack", "doorbell", "motion", "selfie", "feest", "halls", "air"):
        merged = copy.deepcopy(DEFAULT_SETTINGS[k]); merged.update(stored.get(k) or {}); s[k] = merged
    cp = copy.deepcopy(DEFAULT_SETTINGS["compose"]); sc = stored.get("compose") or {}
    cp["styles"].update(sc.get("styles") or {}); cp["color"] = sc.get("color", cp["color"]); s["compose"] = cp
    for k in ("windows", "window_titles"):
        merged = copy.deepcopy(DEFAULT_SETTINGS[k]); merged.update(stored.get(k) or {}); merged.pop("lampen", None); s[k] = merged
    if "songs" not in db:
        db["songs"] = [{"id": uuid.uuid4().hex[:8], "title": t, "bpm": b} for t, b in SONGS]
    if "chances" not in stored:
        # older versions had "1 frame in N places"; carry that over
        r = int(stored.get("frame_ratio", 2))
        for part in ("dag", "nacht"):
            s["chances"][part]["kader"] = round(100 / r) if r > 0 else 0
    s["buttons"] = [b for b in (s.get("buttons") or []) if isinstance(b, dict) and (b.get("entity") or b.get("service"))]   # empty slots of the old 9-button grid
    if not s.get("media_players") and s.get("media_player"):   # 0.16.4: one speaker became a list
        s["media_players"] = [{"entity": s["media_player"], "name": ""}]
    if (stored.get("feest") or {}).get("v", 1) < 2:   # 0.16.2: your days as a couple join the list
        have = {d.get("date") for d in s["feest"].get("days", [])}
        for d in DEFAULT_SETTINGS["feest"]["days"]:
            if d["kind"] == "liefde" and d["date"] not in have:
                s["feest"]["days"].append(dict(d))
        s["feest"]["v"] = 2
    if s.get("lamps"):   # 0.11.0 had a separate Lampen window; since 0.12.0 they are ordinary buttons
        have = {b.get("entity") for b in s.get("buttons", [])}
        s["buttons"] = (s.get("buttons") or []) + [{"label": "", "icon": "", "entity": e, "service": "", "data": {}} for e in s["lamps"] if e not in have]
        s["buttons"] = s["buttons"][:MAX_BUTTONS]
        s["lamps"] = []
    db["settings"] = s
    return db


# ----------------------------------------------------------------- the logbook (Studio → Logboek)
LOG_KINDS = ("event", "dier", "weer", "huis", "deurbel", "telegram", "selfie", "tablet", "systeem", "fout")
LOG = {"items": None, "dirty": False, "n": 0}
LOG_MAX = 1500


def _log_items():
    if LOG["items"] is None:
        try:
            with open(LOG_FILE) as f:
                LOG["items"] = json.load(f)[-LOG_MAX:]
        except (OSError, ValueError):
            LOG["items"] = []
        LOG["n"] = LOG["items"][-1]["n"] if LOG["items"] else 0
    return LOG["items"]


def log(kind, text, quiet=False):
    """One line in the logbook (and in the add-on log)."""
    items = _log_items()
    LOG["n"] += 1
    items.append({"n": LOG["n"], "t": time.time(), "kind": kind if kind in LOG_KINDS else "systeem", "text": str(text)[:300]})
    del items[:-LOG_MAX]
    LOG["dirty"] = True
    if not quiet:
        print(f"[{kind}] {text}", flush=True)


async def log_writer():
    while True:
        await asyncio.sleep(5)
        if LOG["dirty"] and LOG["items"] is not None:
            LOG["dirty"] = False
            try:
                tmp = LOG_FILE + ".tmp"
                with open(tmp, "w") as f:
                    json.dump(LOG["items"], f)
                os.replace(tmp, LOG_FILE)
            except OSError as e:
                print("Logboek bewaren mislukt: " + str(e), flush=True)


async def api_log_get(request):
    after = int(request.query.get("after", 0) or 0)
    return web.json_response([x for x in _log_items() if x["n"] > after][-600:])


async def api_log_clear(request):
    LOG["items"] = []; LOG["dirty"] = True
    log("systeem", "Logboek gewist in de Studio.")
    return web.json_response({"ok": True})


TABLET_LOG = {"times": []}


async def api_log_post(request):
    """The tablet reports what happens on screen (events, housemates, errors). Only short lines, not too many."""
    now = time.time()
    TABLET_LOG["times"] = [t for t in TABLET_LOG["times"] if now - t < 60]
    if len(TABLET_LOG["times"]) >= 20:
        return web.json_response({"ok": False}, status=429)
    TABLET_LOG["times"].append(now)
    try:
        b = await request.json()
    except ValueError:
        raise web.HTTPBadRequest()
    kind = b.get("kind") if b.get("kind") in ("event", "dier", "tablet", "fout") else "tablet"
    log(kind, ("Tablet: " if kind == "fout" else "") + str(b.get("text", ""))[:200], quiet=kind != "fout")
    return web.json_response({"ok": True})


def save_db(db, bump=True):
    # "version" tells the tablet to reload the world; a new message alone does not need that
    if bump:
        db["version"] = int(time.time() * 1000)
    tmp = DB_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(db, f)
    os.replace(tmp, DB_FILE)


def save_img(arr, name):
    path = process.save(process.to_image(arr), os.path.join(MEDIA, name))
    return os.path.basename(path)


def remove_files(names):
    for n in names:
        p = os.path.join(MEDIA, os.path.basename(n))
        if os.path.exists(p):
            os.remove(p)


def keep_original(data, name):
    """Keep the untouched upload, so it can be processed again if the filter changes."""
    with open(os.path.join(ORIG, name), "wb") as f:
        f.write(data)
    return name


async def run_blocking(fn, *args):
    return await asyncio.get_running_loop().run_in_executor(None, partial(fn, *args))


# ----------------------------------------------------------------- Home Assistant
WEATHER_MAP = {
    "sunny": "helder", "clear-night": "helder", "partlycloudy": "licht", "windy": "licht",
    "windy-variant": "bewolkt", "cloudy": "bewolkt", "rainy": "regen", "pouring": "regen",
    "lightning": "onweer", "lightning-rainy": "onweer", "snowy": "bewolkt", "snowy-rainy": "regen",
    "hail": "regen", "fog": "mist", "exceptional": "bewolkt",
}
WEATHER_MAP["snowy"] = "sneeuw"


async def ha_get(path):
    if not TOKEN:
        return None
    async with ClientSession(timeout=ClientTimeout(total=10)) as s:
        async with s.get(HA_URL + path, headers={"Authorization": "Bearer " + TOKEN}) as r:
            if r.status != 200:
                return None
            return await r.json()


LAST = {}   # last seen values, for the logbook


async def api_state(request):
    db = load_db()
    out = {"sun": None, "weather": None, "wind": None, "connected": bool(TOKEN)}
    try:
        sun = await ha_get("/states/sun.sun")
        if sun:
            a = sun.get("attributes", {})
            if "elevation" in a and "azimuth" in a:
                out["sun"] = {"alt": a["elevation"], "az": a["azimuth"]}
        ent = db["settings"].get("weather_entity")
        if ent:
            w = await ha_get("/states/" + ent)
            if w:
                out["weather"] = WEATHER_MAP.get(w.get("state"), "licht")
                if LAST.get("weather") != w.get("state"):
                    if LAST.get("weather"):
                        log("weer", f"Het weer veranderde: {COND_NL.get(LAST['weather'], LAST['weather'])} → {COND_NL.get(w.get('state'), w.get('state'))}")
                    LAST["weather"] = w.get("state")
                wa = w.get("attributes", {})
                out["wind"] = wa.get("wind_speed")
                out["clouds"] = wa.get("cloud_coverage")
        air = db["settings"].get("air") or {}
        if air.get("on") and air.get("entity"):
            st = await ha_get("/states/" + air["entity"])
            try:
                v = float(st.get("state"))
                warn, bad = float(air.get("warn", 1000)), float(air.get("bad", 1500))
                lv = (2 if v <= bad else 1 if v <= warn else 0) if air.get("invert") else (2 if v >= bad else 1 if v >= warn else 0)
                out["air"] = {"level": lv, "value": v, "unit": (st.get("attributes") or {}).get("unit_of_measurement", "")}
                if LAST.get("air") is not None and LAST["air"] != lv:
                    log("huis", ["De lucht is weer fris", "De lucht wordt wat bedompt: Kamiel wordt suf", "De lucht is slecht: Kamiel valt bijna in slaap"][lv] + f" ({v:g} {out['air']['unit']}).")
                LAST["air"] = lv
            except (TypeError, ValueError, AttributeError):
                pass
        lines = []
        for ent in db["settings"].get("osd_entities", []):
            st = await ha_get("/states/" + ent)
            if not st or st.get("state") in (None, "unknown", "unavailable"):
                continue
            val = st["state"]
            try:
                f = float(val)
                val = (f"{f:.1f}".rstrip("0").rstrip(".")) if abs(f) < 1000 else str(round(f))
            except ValueError:
                pass
            unit = st.get("attributes", {}).get("unit_of_measurement", "")
            lines.append((val + (unit if unit in ("°C", "°F", "%") else (" " + unit if unit else ""))).upper())
        out["osd"] = lines
    except Exception as e:  # never break the tablet over a missing value
        out["error"] = str(e)
    return web.json_response(out)


async def api_entities(request):
    states = await ha_get("/states") or []
    doms = tuple(d.strip() + "." for d in request.query.get("domain", "weather").split(",") if d.strip())
    ents = [{"id": s["entity_id"], "name": s.get("attributes", {}).get("friendly_name", s["entity_id"]), "state": s.get("state", ""),
             **({"options": s["attributes"]["options"][:60]} if isinstance(s.get("attributes", {}).get("options"), list) else {})}
            for s in states if request.query.get("domain") == "*" or s["entity_id"].startswith(doms)]
    ents.sort(key=lambda e: e["name"].lower())
    return web.json_response({"connected": bool(TOKEN), "entities": ents})


# ----------------------------------------------------------------- world (read only)
async def api_world(request):
    db = load_db()
    if not request.app.get("studio"):   # the tablet never gets Telegram chat ids
        st = copy.deepcopy(db["settings"]); st.get("selfie", {}).pop("people", None); db["settings"] = st
    return web.json_response({
        "version": db.get("version", 0),
        "assets": db["assets"],
        "photos": db["photos"],
        "panorama": db.get("panorama"),
        "settings": db["settings"],
        "reminders": db.get("reminders", []),
        "dismissed": db.get("dismissed", {}),
        "songs": db.get("songs", []),
        "location": LOCATION,
        "events": [{"id": e[0], "name": e[1], "cat": e[2]} for e in EVENTS],
    })


async def media(request):
    name = os.path.basename(request.match_info["name"])
    p = os.path.join(MEDIA, name)
    if not os.path.exists(p):
        raise web.HTTPNotFound()
    return web.FileResponse(p, headers={"Cache-Control": "public, max-age=31536000, immutable"})


def page(name):
    """Serve a page; every script it loads gets its own version in the address (static/x.js?v=…),
    so after an update browsers can never mix a new page with an old, remembered script."""
    import re

    def stamp(m):
        f = os.path.join(APP, "static", m.group(2))
        v = int(os.path.getmtime(f)) if os.path.exists(f) else 0
        return f'{m.group(1)}static/{m.group(2)}?v={v}"'

    async def handler(request):
        with open(os.path.join(APP, "static", name), encoding="utf-8") as f:
            html = re.sub(r'(src=")static/([\w.-]+\.js)"', stamp, f.read())
        return web.Response(text=html, content_type="text/html", headers={"Cache-Control": "no-cache"})
    return handler


@web.middleware
async def fresh_scripts(request, handler):
    """Scripts and styles: the browser must check for a newer version every time (cheap: unchanged = 304)."""
    resp = await handler(request)
    if request.path.startswith("/static/") and request.path.endswith((".js", ".css", ".html")):
        resp.headers["Cache-Control"] = "no-cache"
    return resp


# ----------------------------------------------------------------- studio (write)
def _asset_from_upload(data, kind, moment, rare, is_sign, label):
    imgs, meta = process.process_asset(data, kind, is_sign)
    aid = uuid.uuid4().hex[:10]
    files = {}
    for key, arr in imgs.items():
        files[key] = save_img(arr, f"{aid}_{key}")
    main = imgs["main"]
    original = keep_original(data, f"{aid}_origineel")
    return {
        "id": aid, "label": label, "kind": kind, "moment": moment, "rare": rare,
        "sign": bool(is_sign and meta.get("plate")),
        "size": [int(main.shape[1]), int(main.shape[0])],
        "files": files, "original": original, **meta, **process.metrics(main),
    }


def _measure_old_assets():
    """Elements from before 0.9.0 have no weight and colour yet: measure them once, in the background."""
    db = load_db()
    todo = [a for a in db["assets"] if "wt" not in a]
    found = {}
    for a in todo:
        try:
            with open(os.path.join(MEDIA, a["files"]["main"]), "rb") as f:
                found[a["id"]] = process.metrics(process.load_rgba(f.read()))
        except Exception as e:
            log("fout", "Meten mislukt voor " + a.get("label", a["id"]) + ": " + str(e))
    return found


def parse_moment(day, night):
    if day and night:
        return "altijd"
    return "nacht" if night else "dag"


async def api_upload_assets(request):
    reader = await request.multipart()
    fields, uploads = {}, []
    async for part in reader:
        if part.filename:
            uploads.append((part.filename, await part.read()))
        else:
            fields[part.name] = (await part.text()).strip()
    kind = fields.get("kind", "grond")
    if kind not in KINDS:
        raise web.HTTPBadRequest(text="Onbekende soort")
    moment = parse_moment(fields.get("dag") == "1", fields.get("nacht") == "1")
    rare = fields.get("rare", "gewoon") if fields.get("rare") in RARITY else "gewoon"
    is_sign = fields.get("sign") == "1" and kind == "grond"
    added, failed = [], []
    for fname, data in uploads:
        label = os.path.splitext(os.path.basename(fname))[0][:60]
        try:
            asset = await run_blocking(_asset_from_upload, data, kind, moment, rare, is_sign, label)
            wb = [w for w in fields.get("weer", "").split(",") if w in WEATHER_BUCKETS]
            if wb:
                asset["weather"] = wb
            added.append(asset)
        except Exception as e:
            failed.append({"file": fname, "error": str(e)})
    async with lock:
        db = load_db()
        db["assets"].extend(added)
        save_db(db)
    return web.json_response({"added": added, "failed": failed})


def _make_sign(asset, on):
    """Turn the text-sign option on or off for an existing element, using its original upload."""
    for k in [k for k in asset["files"] if k.startswith("kleur_")]:
        remove_files([asset["files"].pop(k)])
    for k in ("plate", "colors"):
        asset.pop(k, None)
    asset["sign"] = False
    if not on:
        return asset
    orig = asset.get("original")
    path = os.path.join(ORIG, os.path.basename(orig)) if orig else None
    if not path or not os.path.exists(path):
        raise ValueError("Het origineel van dit element is niet bewaard. Verwijder het en voeg het opnieuw toe met 'Dit is een tekstbord' aangevinkt.")
    with open(path, "rb") as f:
        imgs, meta = process.process_asset(f.read(), "grond", True)
    if not meta.get("plate"):
        raise ValueError("Op dit element werd geen gekleurd bordvlak gevonden.")
    for key, arr in imgs.items():
        if key.startswith("kleur_"):
            asset["files"][key] = save_img(arr, f"{asset['id']}_{key}_{uuid.uuid4().hex[:4]}")
    asset.update(meta)
    asset["sign"] = True
    return asset


SIMPLE_KINDS = ("grond", "horizon", "lucht")  # these share the same processing


def _change_kind(asset, kind):
    """Change what an element is. Clouds and frames are processed differently, so those
    switches redo the processing from the original upload."""
    old = asset["kind"]
    if old in SIMPLE_KINDS and kind in SIMPLE_KINDS:
        if kind != "grond" and asset.get("sign"):
            asset = _make_sign(asset, False)
        asset["kind"] = kind
        return asset
    orig = asset.get("original")
    path = os.path.join(ORIG, os.path.basename(orig)) if orig else None
    if not path or not os.path.exists(path):
        raise ValueError("Het origineel van dit element is niet bewaard. Verwijder het en voeg het opnieuw toe als de juiste soort.")
    with open(path, "rb") as f:
        imgs, meta = process.process_asset(f.read(), kind, False)
    old_files = list(asset["files"].values())
    tag = uuid.uuid4().hex[:4]
    asset["files"] = {key: save_img(arr, f"{asset['id']}_{key}_{tag}") for key, arr in imgs.items()}
    remove_files(old_files)
    for k in ("plate", "colors", "hole"):
        asset.pop(k, None)
    asset.update(meta)
    asset["sign"] = False
    asset["kind"] = kind
    main = imgs["main"]
    asset["size"] = [int(main.shape[1]), int(main.shape[0])]
    return asset


async def api_edit_asset(request):
    aid = request.match_info["id"]
    body = await request.json()
    if body.get("kind") in KINDS:
        db = load_db()
        a = next((x for x in db["assets"] if x["id"] == aid), None)
        if not a:
            raise web.HTTPNotFound()
        if body["kind"] != a["kind"]:
            try:
                updated = await run_blocking(_change_kind, dict(a, files=dict(a["files"])), body["kind"])
            except ValueError as e:
                raise web.HTTPBadRequest(text=str(e))
            async with lock:
                db = load_db()
                for i, x in enumerate(db["assets"]):
                    if x["id"] == aid:
                        db["assets"][i] = updated
                save_db(db)
            return web.json_response(updated)
    if "sign" in body:
        db = load_db()
        a = next((x for x in db["assets"] if x["id"] == aid), None)
        if not a:
            raise web.HTTPNotFound()
        if a["kind"] != "grond":
            raise web.HTTPBadRequest(text="Alleen grondelementen kunnen een tekstbord zijn.")
        try:
            updated = await run_blocking(_make_sign, dict(a, files=dict(a["files"])), bool(body["sign"]))
        except ValueError as e:
            raise web.HTTPBadRequest(text=str(e))
        async with lock:
            db = load_db()
            for i, x in enumerate(db["assets"]):
                if x["id"] == aid:
                    db["assets"][i] = updated
            save_db(db)
        return web.json_response(updated)
    async with lock:
        db = load_db()
        for a in db["assets"]:
            if a["id"] == aid:
                if "dag" in body or "nacht" in body:
                    a["moment"] = parse_moment(body.get("dag"), body.get("nacht"))
                if body.get("rare") in RARITY:
                    a["rare"] = body["rare"]
                if "label" in body:
                    a["label"] = str(body["label"])[:60]
                if body.get("period") in PERIODS:
                    a["period"] = body["period"]
                for k in ("period_from", "period_to"):
                    if k in body:
                        v = str(body[k])
                        a[k] = v if len(v) == 5 and v[2] == "-" else ""
                if "tv" in body and a["kind"] == "kader":
                    a["tv"] = bool(body["tv"])
                if "tap" in body:
                    t = body["tap"] or {}
                    act = t.get("action") if t.get("action") in ("niets", "vertrek", "script") else "niets"
                    a["tap"] = {"action": act, "entity": str(t.get("entity", ""))[:120] if act == "script" else ""}
                if isinstance(body.get("weather"), list):
                    a["weather"] = [w for w in body["weather"] if w in WEATHER_BUCKETS]
                if "sink" in body:
                    a["sink"] = None if body["sink"] in (None, "", "standaard") else max(0, min(60, int(body["sink"])))
                if "scale" in body:
                    a["scale"] = max(0.3, min(3.0, float(body["scale"])))
                if "active" in body:
                    a["active"] = bool(body["active"])
                for k in ("grass_only", "stack", "carry"):   # only on the grass / can stand on others / can carry others
                    if k in body:
                        a[k] = bool(body[k])
                if body.get("gaze") in ("", "links", "rechts"):   # which way it looks (it then looks toward Kamiel)
                    a["gaze"] = body["gaze"]
                if body.get("clouds") in ("voor", "tussen", "achter"):   # sky objects: in front of, between or behind the clouds
                    a["clouds"] = body["clouds"]
                save_db(db)
                return web.json_response(a)
    raise web.HTTPNotFound()


async def api_delete_asset(request):
    aid = request.match_info["id"]
    async with lock:
        db = load_db()
        gone = next((a for a in db["assets"] if a["id"] == aid), None)
        keep = [a for a in db["assets"] if a["id"] != aid]
        if not gone:
            raise web.HTTPNotFound()
        db["assets"] = keep
        save_db(db)
    remove_files(gone["files"].values())
    if gone.get("original"):
        p = os.path.join(ORIG, os.path.basename(gone["original"]))
        if os.path.exists(p):
            os.remove(p)
    return web.json_response({"ok": True})


def _photo(data):
    arr = process.process_photo(data)
    pid = uuid.uuid4().hex[:10]
    return {"id": pid, "file": save_img(arr, f"foto_{pid}"), "original": keep_original(data, f"foto_{pid}_origineel"),
            "size": [int(arr.shape[1]), int(arr.shape[0])]}


async def api_upload_photos(request):
    reader = await request.multipart()
    added, failed = [], []
    async for part in reader:
        if part.filename:
            try:
                p = await run_blocking(_photo, await part.read())
                p["label"] = os.path.splitext(os.path.basename(part.filename))[0][:60]
                added.append(p)
            except Exception:
                failed.append({"file": part.filename})
    async with lock:
        db = load_db()
        db["photos"].extend(added)
        save_db(db)
    return web.json_response({"added": added, "failed": failed})


async def api_hall_upload(request):
    """A background for a hall of your own (one screen wide is best)."""
    reader = await request.multipart()
    name, data = "Eigen zaal", None
    async for part in reader:
        if part.name == "name":
            name = (await part.text()).strip()[:40] or name
        elif part.filename:
            data = await part.read()
    if not data:
        raise web.HTTPBadRequest()
    try:
        p = await run_blocking(_photo, data)
    except Exception:
        return web.json_response({"ok": False, "error": "Dit beeld kon niet gelezen worden."}, status=400)
    hall = {"id": "z" + p["id"], "name": name, "file": p["file"], "original": p.get("original"), "on": True, "elements": False}
    async with lock:
        db = load_db()
        db["settings"].setdefault("halls", copy.deepcopy(DEFAULT_SETTINGS["halls"])).setdefault("custom", []).append(hall)
        save_db(db)
    log("systeem", f"Nieuwe zaal: {name}.")
    return web.json_response({"ok": True, "hall": hall})


async def api_hall_delete(request):
    hid = request.match_info["id"]
    async with lock:
        db = load_db()
        hs = db["settings"].get("halls", {})
        gone = [c for c in hs.get("custom", []) if c["id"] == hid]
        hs["custom"] = [c for c in hs.get("custom", []) if c["id"] != hid]
        remove_files([c["file"] for c in gone] + [c["original"] for c in gone if c.get("original")])
        save_db(db)
    return web.json_response({"ok": True})


async def api_hall_visit(request):
    b = await request.json()
    async with lock:
        db = load_db(); push_action(db, {"type": "zaal", "id": str(b.get("id", ""))[:20]}); save_db(db, bump=False)
    return web.json_response({"ok": True})


async def api_delete_photo(request):
    pid = request.match_info["id"]
    async with lock:
        db = load_db()
        gone = [p for p in db["photos"] if p["id"] == pid]
        db["photos"] = [p for p in db["photos"] if p["id"] != pid]
        save_db(db)
    remove_files([p["file"] for p in gone])
    return web.json_response({"ok": True})


def _panorama(files):
    arr, horizon = process.process_panorama(files)
    name = save_img(arr, "panorama_" + uuid.uuid4().hex[:8])
    return {"file": name, "width": int(arr.shape[1]), "height": int(arr.shape[0]), "horizon": horizon}


async def api_upload_panorama(request):
    reader = await request.multipart()
    parts = []
    async for part in reader:
        if part.filename:
            parts.append((part.filename, await part.read()))
    if not parts:
        raise web.HTTPBadRequest(text="Geen bestanden ontvangen")
    pano = await run_blocking(_panorama, [d for _, d in parts])
    pano["sources"] = [n for n, _ in parts]
    pano["originals"] = [keep_original(d, f"panorama_{i + 1}_origineel") for i, (_, d) in enumerate(parts)]
    async with lock:
        db = load_db()
        old = db.get("panorama")
        db["panorama"] = pano
        save_db(db)
    if old:
        remove_files([old["file"]])
    return web.json_response(pano)


async def api_settings(request):
    body = await request.json()
    async with lock:
        db = load_db()
        s = db["settings"]
        if "weather_entity" in body:
            s["weather_entity"] = str(body["weather_entity"])
        if "walk_minutes" in body:
            s["walk_minutes"] = max(1, min(240, int(body["walk_minutes"])))
        for k in ("night_start", "night_end"):
            if k in body:
                s[k] = str(body[k])[:5]
        if "night_walks" in body:
            s["night_walks"] = [str(x)[:5] for x in body["night_walks"] if str(x).strip()][:12]
        if "frame_ratio" in body and int(body["frame_ratio"]) in (0, 1, 2, 4, 8):
            s["frame_ratio"] = int(body["frame_ratio"])
        if isinstance(body.get("chances"), dict):
            for part in ("dag", "nacht"):
                for kind in ("grond", "horizon", "lucht", "kader"):
                    try:
                        v = int(body["chances"][part][kind])
                    except (KeyError, TypeError, ValueError):
                        continue
                    s["chances"][part][kind] = max(0, min(100, v))
        if isinstance(body.get("counts"), dict):
            for part in ("dag", "nacht"):
                for kind in ("grond", "horizon", "lucht", "kader"):
                    try:
                        lo, hi = (int(v) for v in body["counts"][part][kind])
                    except (KeyError, TypeError, ValueError):
                        continue
                    lo, hi = max(0, min(12, lo)), max(0, min(12, hi))
                    s["counts"][part][kind] = [min(lo, hi), max(lo, hi)]
        if "spacing" in body:
            s["spacing"] = max(-150, min(200, int(body["spacing"])))
        if "lane" in body:
            s["lane"] = max(64, min(300, int(body["lane"])))
        if isinstance(body.get("compose"), dict):
            c = body["compose"]
            if isinstance(c.get("styles"), dict):
                for k in s["compose"]["styles"]:
                    if k in c["styles"]:
                        s["compose"]["styles"][k] = bool(c["styles"][k])
            if "color" in c:
                s["compose"]["color"] = bool(c["color"])
        if isinstance(body.get("doorbell"), dict):
            d, b = s["doorbell"], body["doorbell"]
            for k in ("on", "keep", "telegram", "pets"):
                if k in b:
                    d[k] = bool(b[k])
            for k in ("trigger", "camera"):
                if k in b:
                    d[k] = str(b[k]).strip()[:120]
            if b.get("mode") in ("auto", "aan", "verandert"):
                d["mode"] = b["mode"]
            if "minutes" in b:
                d["minutes"] = max(1, min(240, int(b["minutes"])))
        if isinstance(body.get("motion"), dict):
            m, b = s["motion"], body["motion"]
            for k in ("on", "look", "wake"):
                if k in b:
                    m[k] = bool(b[k])
            if b.get("screen_off") in ("nooit", "nacht", "altijd"):
                m["screen_off"] = b["screen_off"]
            if "off_after" in b:
                m["off_after"] = max(1, min(240, int(b["off_after"])))
            if "entity" in b:
                m["entity"] = str(b["entity"]).strip()[:120]
            for k in ("away_off", "to_ha"):
                if k in b:
                    m[k] = bool(b[k])
            if "away_entity" in b:
                m["away_entity"] = str(b["away_entity"]).strip()[:120] or "zone.home"
        if isinstance(body.get("feest"), dict):
            f, b = s["feest"], body["feest"]
            if "on" in b:
                f["on"] = bool(b["on"])
            if "boost" in b:
                f["boost"] = max(1, min(6, int(b["boost"] or 3)))
            if isinstance(b.get("days"), list):
                f["days"] = [{"name": str(x.get("name", "")).strip()[:30] or "Verjaardag", "date": str(x.get("date", ""))[:5],
                              "kind": "liefde" if x.get("kind") == "liefde" else "verjaardag",
                              **({"year": int(x["year"])} if str(x.get("year", "")).isdigit() and 1950 < int(x["year"]) < 2100 else {})}
                             for x in b["days"][:20] if isinstance(x, dict) and re.match(r"^\d\d-\d\d$", str(x.get("date", "")))]
            if isinstance(b.get("holidays"), dict):
                for k in f["holidays"]:
                    if k in b["holidays"]:
                        f["holidays"][k] = bool(b["holidays"][k])
        if isinstance(body.get("halls"), dict):
            h, b = s["halls"], body["halls"]
            if "chance" in b:
                h["chance"] = max(0, min(100, int(b["chance"] or 0)))
            if isinstance(b.get("off"), list):
                h["off"] = [x for x in b["off"] if x in ("museum", "disco", "sterren")]
            if isinstance(b.get("custom"), list):   # names and switches; files only come from an upload
                known = {c["id"]: c for c in h.get("custom", [])}
                h["custom"] = [dict(known[x["id"]], name=str(x.get("name", known[x["id"]]["name"]))[:40], on=bool(x.get("on", True)), elements=bool(x.get("elements", False)))
                               for x in b["custom"] if isinstance(x, dict) and x.get("id") in known]
        if isinstance(body.get("air"), dict):
            a, b = s["air"], body["air"]
            for k in ("on", "invert"):
                if k in b:
                    a[k] = bool(b[k])
            if "entity" in b:
                a["entity"] = str(b["entity"]).strip()[:120]
            for k in ("warn", "bad"):
                if k in b:
                    try:
                        a[k] = float(str(b[k]).replace(",", "."))
                    except ValueError:
                        pass
        if isinstance(body.get("selfie"), dict):
            m, b = s["selfie"], body["selfie"]
            for k in ("on", "monthly", "pets"):
                if k in b:
                    m[k] = bool(b[k])
            if "days" in b:
                m["days"] = max(1, min(30, int(b["days"] or 3)))
            if isinstance(b.get("people"), list):
                m["people"] = [{"entity": str(x.get("entity", "")).strip()[:120], "chat": x.get("chat") if isinstance(x.get("chat"), int) else ""}
                               for x in b["people"][:10] if isinstance(x, dict) and str(x.get("entity", "")).startswith(("person.", "device_tracker."))]
        if isinstance(body.get("rules"), list):
            s["rules"] = [r for r in (_clean_rule(x) for x in body["rules"][:40]) if r]
        if isinstance(body.get("hills"), dict):
            if "chance" in body["hills"]:
                s["hills"]["chance"] = max(0, min(100, int(body["hills"]["chance"])))
            if "height" in body["hills"]:
                s["hills"]["height"] = max(4, min(40, int(body["hills"]["height"])))
        if isinstance(body.get("stack"), dict):
            if "chance" in body["stack"]:
                s["stack"]["chance"] = max(0, min(100, int(body["stack"]["chance"])))
            if "max" in body["stack"]:
                s["stack"]["max"] = max(2, min(4, int(body["stack"]["max"])))
        if isinstance(body.get("events"), dict):
            e, b = s["events"], body["events"]
            if "on" in b:
                e["on"] = bool(b["on"])
            if "evening" in b:
                e["evening"] = bool(b["evening"])
            for k, top in (("lama_per_day", 5), ("common_per_day", 24), ("normal_per_week", 50)):
                if k in b:
                    e[k] = max(0, min(top, int(b[k])))
            if isinstance(b.get("pets_per_day"), dict):
                e["pets_per_day"] = {k: max(0, min(12, int(v or 0))) for k, v in b["pets_per_day"].items() if k in EVENT_IDS}
            if "pets_together" in b:
                e["pets_together"] = max(0, min(100, int(b["pets_together"])))
            for k, top in (("pets_stay", 100), ("pets_lying", 100), ("pets_stay_min", 240), ("dance_chance", 500), ("aurora_chance", 100), ("stories_per_week", 30)):
                if k in b:
                    e[k] = max(0, min(top, int(b[k] or 0)))
            if isinstance(b.get("off"), list):
                e["off"] = [x for x in b["off"] if x in EVENT_IDS]
        if isinstance(body.get("sizes"), dict):
            for kind in ("grond", "horizon", "lucht", "kader"):
                try:
                    lo, hi = (int(v) for v in body["sizes"][kind])
                except (KeyError, TypeError, ValueError):
                    continue
                lo, hi = max(3, min(90, lo)), max(3, min(90, hi))
                s["sizes"][kind] = [min(lo, hi), max(lo, hi)]
        for k in ("message_entity", "sun_script", "moon_script", "media_player", "departure_trigger"):
            if k in body:
                s[k] = str(body[k]).strip()[:120]
        if isinstance(body.get("media_players"), list):
            mp, seen = [], set()
            for m in body["media_players"][:12]:
                ent = str((m or {}).get("entity") or "").strip()[:120] if isinstance(m, dict) else ""
                if ent.startswith("media_player.") and ent not in seen:
                    seen.add(ent); mp.append({"entity": ent, "name": str(m.get("name") or "").strip()[:30]})
            s["media_players"] = mp
            s["media_player"] = mp[0]["entity"] if mp else ""
        if "message_minutes" in body:
            s["message_minutes"] = max(1, min(24 * 60, int(body["message_minutes"])))
        if body.get("empty_tap") in ("url", "vertrek", "niets", "vensters"):
            s["empty_tap"] = body["empty_tap"]
        if "season_colors" in body:
            s["season_colors"] = bool(body["season_colors"])
        if isinstance(body.get("windows"), dict):
            for k in WINDOWS:
                if k in body["windows"]:
                    s["windows"][k] = bool(body["windows"][k])
        if isinstance(body.get("window_titles"), dict):
            for k in WINDOWS:
                if k in body["window_titles"]:
                    s["window_titles"][k] = str(body["window_titles"][k]).strip()[:24] or DEFAULT_SETTINGS["window_titles"][k]
        if "window_close" in body:
            s["window_close"] = max(10, min(600, int(body["window_close"])))
        if body.get("window_layout") in ("verspreid", "netjes"):
            s["window_layout"] = body["window_layout"]
        if isinstance(body.get("buttons"), list):
            s["buttons"] = [dict({"label": str(b.get("label", "")).strip()[:16], "icon": str(b.get("icon", "")).strip()[:4],
                                  "entity": str(b.get("entity", "")).strip()[:120]}, **clean_call(b))
                            for b in body["buttons"][:MAX_BUTTONS] if isinstance(b, dict)]
        if body.get("outfit_mode") in ("kiezen", "dag", "uit"):
            s["outfit_mode"] = body["outfit_mode"]
        if isinstance(body.get("outfits_off"), list):
            s["outfits_off"] = [x for x in body["outfits_off"] if x in OUTFIT_SLOTS]
        if body.get("kamiel_tap") in ("kleerkast", "niets"):
            s["kamiel_tap"] = body["kamiel_tap"]
        if isinstance(body.get("board"), list):
            rows = []
            for d in body["board"][:5]:
                if isinstance(d, dict) and str(d.get("entity", "")).strip():
                    rows.append({"entity": str(d["entity"]).strip()[:120], "label": str(d.get("label", "")).strip()[:14],
                                 "lines": str(d.get("lines", "")).strip()[:60], "dest": str(d.get("dest", "")).strip()[:80],
                                 "kind": d.get("kind") if d.get("kind") in ("alles", "tram", "bus", "metro") else "alles",
                                 "count": max(1, min(3, int(d.get("count", 1) or 1)))})
            s["board"] = rows
        if isinstance(body.get("timer_entities"), list):
            s["timer_entities"] = [str(e) for e in body["timer_entities"] if str(e).strip()][:3]
        if isinstance(body.get("departures"), list):
            deps = []
            for d in body["departures"][:3]:
                if isinstance(d, dict) and str(d.get("entity", "")).strip():
                    deps.append({"entity": str(d["entity"]).strip()[:120], "label": str(d.get("label", "")).strip()[:40],
                                 "lines": str(d.get("lines", "")).strip()[:60]})
            s["departures"] = deps
        if "horizon_sink" in body:
            s["horizon_sink"] = max(0, min(40, int(body["horizon_sink"])))
        if "giant_chance" in body:
            s["giant_chance"] = max(0, min(100, int(body["giant_chance"])))
        if "max_objects" in body:
            s["max_objects"] = max(1, min(40, int(body["max_objects"])))
        if "min_frames" in body:
            s["min_frames"] = max(0, min(8, int(body["min_frames"])))
        if "tap_url" in body:
            s["tap_url"] = str(body["tap_url"]).strip()[:500]
        if "osd_entities" in body:
            s["osd_entities"] = [str(e) for e in body["osd_entities"] if str(e).strip()][:3]
        if "words" in body:
            s["words"] = [str(w).strip().upper()[:60] for w in body["words"] if str(w).strip()][:200]
        save_db(db)
    return web.json_response(s)



# ----------------------------------------------------------------- live: messages, music, departures, taps
async def ha_service(domain, service, data):
    if not TOKEN:
        return False
    async with ClientSession(timeout=ClientTimeout(total=10)) as s:
        async with s.post(f"{HA_URL}/services/{domain}/{service}", json=data,
                          headers={"Authorization": "Bearer " + TOKEN}) as r:
            return r.status < 300


def _ts(v):
    from datetime import datetime
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


async def current_message(db):
    """The newest message that is still valid: from the Studio, or from a text helper in Home Assistant."""
    now = time.time()
    best = None
    m = db.get("message")
    if m and m.get("until", 0) > now:
        best = {k: v for k, v in m.items() if k != "chat"}   # the tablet doesn't need to know who's chat it was
    ent = db["settings"].get("message_entity")
    if ent:
        st = await ha_get("/states/" + ent)
        if st and st.get("state") not in (None, "", "unknown", "unavailable"):
            since = _ts(st.get("last_changed")) or now
            until = since + 60 * db["settings"].get("message_minutes", 60)
            if until > now and (not best or since > best.get("since", 0)):
                best = {"id": "ha-" + str(int(since)), "text": st["state"], "since": since, "until": until, "sign": ""}
    return best


async def api_live(request):
    """Polled every few seconds by the tablet: only things that change quickly."""
    db = load_db()
    s = db["settings"]
    out = {"message": None, "media": None, "trigger": None, "outfit": current_outfit(db), "dismissed": db.get("dismissed", {}),
           "spotlight": ({k: v for k, v in db["spotlight"].items() if k != "chat"}
                         if (db.get("spotlight") or {}).get("until", 0) > time.time() else None),
           "snapshot": SNAP.get("id"), "snap": SNAP.get("opts"), "event": db.get("event_req"),
           "actions": [a for a in db.get("actions", []) if a.get("at", 0) > time.time() - 120]}
    try:
        out["message"] = await current_message(db)
        if (s.get("motion") or {}).get("away_off"):
            out["away"] = await nobody_home(s)
        ent, st, _ = await active_player(s)
        if ent:
            if st:
                a = st.get("attributes", {})
                pic = a.get("entity_picture") or ""
                out["media"] = {"playing": st.get("state") == "playing", "title": a.get("media_title", ""),
                                "artist": a.get("media_artist", ""), "art": str(abs(hash(pic))) if pic else "",
                                "bpm": song_bpm(db, a.get("media_title", "")),
                                "position": a.get("media_position"), "updated": _ts(a.get("media_position_updated_at") or "")}
        timers = []
        for ent in s.get("timer_entities", []):
            st = await ha_get("/states/" + ent)
            for t in ((st or {}).get("attributes", {}).get("timers") or []):
                status = t.get("status", "set")
                if status not in ("set", "ringing", "paused"):
                    continue
                end = _ts(t.get("local_time_iso") or "") if t.get("local_time_iso") else None
                if end is None and isinstance(t.get("fire_time"), (int, float)):
                    end = time.time() + t["fire_time"]
                timers.append({"id": str(t.get("timer_id", ""))[-12:], "label": str(t.get("label") or "")[:14],
                               "end": end, "status": status, "duration": t.get("duration"),
                               "left": t.get("fire_time") if status == "paused" else None})
        out["timers"] = timers
        if s.get("departure_trigger"):
            st = await ha_get("/states/" + s["departure_trigger"])
            if st:
                out["trigger"] = {"on": st.get("state") in ("on", "open", "home", "detected"), "changed": st.get("last_changed")}
    except Exception as e:
        out["error"] = str(e)
    return web.json_response(out)


_active = {"ent": None}


async def active_player(s):
    """Which of the speakers Kamiel listens to right now: the one that is playing (stays with the same one while it
    keeps playing; if several start, the newest), else the last one that played. Returns (entity, state, name)."""
    players = s.get("media_players") or ([{"entity": s["media_player"], "name": ""}] if s.get("media_player") else [])
    if not players:
        return None, None, ""
    states = await asyncio.gather(*(ha_get("/states/" + p["entity"]) for p in players), return_exceptions=True)
    got = [(p, st) for p, st in zip(players, states) if isinstance(st, dict)]
    if not got:
        return None, None, ""
    playing = [(p, st) for p, st in got if st.get("state") == "playing"]
    cur = next(((p, st) for p, st in playing if p["entity"] == _active["ent"]), None)
    if not cur and playing:
        cur = max(playing, key=lambda x: x[1].get("last_changed") or "")
    if not cur:
        cur = next(((p, st) for p, st in got if p["entity"] == _active["ent"]), None) or got[0]
    _active["ent"] = cur[0]["entity"]
    return cur[0]["entity"], cur[1], cur[0].get("name") or ""


_cover = {"key": None, "body": None}


def _cover_process(data):
    import io
    from PIL import Image
    im = Image.open(io.BytesIO(data)).convert("RGBA")
    im.thumbnail((420, 420))
    a = process.load_rgba(_png(im))
    a[..., 3] = 1
    g = process.dream(a, 0.7, outer=False)
    buf = io.BytesIO()
    process.to_image(g).convert("RGB").save(buf, "JPEG", quality=88)
    return buf.getvalue()


def _png(im):
    import io
    b = io.BytesIO()
    im.save(b, "PNG")
    return b.getvalue()


async def api_cover(request):
    db = load_db()
    ent, st, _ = await active_player(db["settings"])
    pic = (st or {}).get("attributes", {}).get("entity_picture")
    if not pic:
        raise web.HTTPNotFound()
    if _cover["key"] != pic:
        url = pic if pic.startswith("http") else HA_ROOT + pic
        headers = {} if pic.startswith("http") else {"Authorization": "Bearer " + (TOKEN or "")}
        async with ClientSession(timeout=ClientTimeout(total=10)) as s:
            async with s.get(url, headers=headers) as r:
                if r.status != 200:
                    raise web.HTTPNotFound()
                data = await r.read()
        _cover["body"] = await run_blocking(_cover_process, data)
        _cover["key"] = pic
    return web.Response(body=_cover["body"], content_type="image/jpeg", headers={"Cache-Control": "no-store"})


TRANSPORT = {"TRAM": "TRAM", "BUS": "BUS", "METRO": "METRO"}


KIND_OF = {"TRAM": "tram", "BUS": "bus", "METRO": "metro"}


async def board_rows(db):
    """The departure board: per row you chose in the Studio, the next departure(s) that match.
    Each row: a name for the board (CENTRUM), a stop sensor, and optional filters
    (line numbers, words in the destination, tram or bus)."""
    now = time.time()
    rows = []
    for r in db["settings"].get("board", []):
        st = await ha_get("/states/" + r["entity"]) if r.get("entity") else None
        if not st:
            continue
        a = st.get("attributes", {})
        passages = a.get("next_passages") or ([a] if a.get("line_number_public") else [])
        lines = {x.strip().upper() for x in r.get("lines", "").replace(";", ",").split(",") if x.strip()}
        words = [x.strip().upper() for x in r.get("dest", "").replace(";", ",").split(",") if x.strip()]
        kind_want = r.get("kind", "alles")
        found = []
        for p in passages:
            num = str(p.get("line_number_public", "")).upper()
            kind = KIND_OF.get(str(p.get("line_transport_type", "")).upper(), "")
            dest = str(p.get("final_destination", "")).upper()
            due = _ts(p.get("due_at_realtime") or p.get("due_at_schedule") or "")
            if due is None or due < now - 30:
                continue
            if lines and num not in lines:
                continue
            if words and not any(w in dest for w in words):
                continue
            if kind_want != "alles" and kind and kind != kind_want:
                continue
            found.append({"label": r.get("label", "")[:14].upper() or dest[:14], "line": num, "kind": kind,
                          "dest": dest[:22], "due": due, "realtime": bool(p.get("due_at_realtime"))})
            if len(found) >= r.get("count", 1):
                break
        if not passages:   # any other sensor whose state is a time: use it as is
            due = _ts(st.get("state"))
            if due and due > now - 30:
                found.append({"label": r.get("label", "")[:14].upper(), "line": "", "kind": "", "dest": "", "due": due, "realtime": False})
        rows += found
    return rows


async def api_departures(request):
    return web.json_response({"rows": await board_rows(load_db())})


async def api_tap(request):
    """The tablet asks to run what the Studio set up for this target. It can only start scripts
    or scenes that were chosen in the Studio, nothing else."""
    target = request.match_info["target"]
    db = load_db()
    s = db["settings"]
    ent = ""
    if target == "sun":
        ent = s.get("sun_script", "")
    elif target == "moon":
        ent = s.get("moon_script", "")
    elif target.startswith("el-"):
        a = next((x for x in db["assets"] if x["id"] == target[3:]), None)
        if a and (a.get("tap") or {}).get("action") == "script":
            ent = a["tap"].get("entity", "")
    dom = ent.split(".")[0] if ent else ""
    if dom not in ("script", "scene", "automation", "input_button", "button"):
        return web.json_response({"ok": False})
    service = {"automation": "trigger", "input_button": "press", "button": "press"}.get(dom, "turn_on")
    ok = await ha_service(dom, service, {"entity_id": ent})
    return web.json_response({"ok": ok})


async def api_send_message(request):
    body = await request.json()
    text = str(body.get("text", "")).strip()[:200]
    minutes = max(1, min(24 * 60, int(body.get("minutes", 60))))
    sign = ""
    if body.get("sign"):
        sign = (request.headers.get("X-Remote-User-Display-Name") or request.headers.get("X-Remote-User-Name") or "").strip().split(" ")[0][:30]
    async with lock:
        db = load_db()
        if text:
            now = time.time()
            db["message"] = {"id": uuid.uuid4().hex[:8], "text": text, "since": now, "until": now + minutes * 60, "sign": sign}
        else:
            db.pop("message", None)
        save_db(db, bump=False)
    return web.json_response(db.get("message") or {})


async def api_clear_message(request):
    async with lock:
        db = load_db()
        db.pop("message", None)
        db.pop("spotlight", None)
        save_db(db, bump=False)
    return web.json_response({"ok": True})


# ----------------------------------------------------------------- Telegram
# Kamiel fetches messages himself (long polling), so nothing has to be opened on the router.
TG_URL = os.environ.get("KAMIEL_TG_URL", "https://api.telegram.org")
SNAP = {}          # a pending /kijk: {"id", "chat", "event", "data"}
TG_HELP = ("Stuur me gewoon een tekst en hij verschijnt op het scherm thuis.\n"
           "Een foto komt in een kader in de scène.\n\n"
           "/bus  de volgende trams en bussen\n/kijk  een foto van het scherm nu\n/wis  het bericht weghalen\n"
           "/muziek Titel 127  Kamiel knikt mee op dat nummer (127 = tempo)\n/muziek  de lijst met nummers\n"
           "/event  er gebeurt iets in Kamielland\n/event lijst  alle events\n/selfie  Kamiel stuurt een selfie")


def tg_conf(db=None):
    return (db or load_db()).setdefault("telegram", {"token": "", "bot": "", "chats": [], "offset": 0, "minutes": 60})


async def tg_call(token, method, data=None, files=None, timeout=20):
    async with ClientSession(timeout=ClientTimeout(total=timeout + 10)) as s:
        if files:
            from aiohttp import FormData
            fd = FormData()
            for k, v in (data or {}).items():
                fd.add_field(k, str(v))
            for k, (name, body, ctype) in files.items():
                fd.add_field(k, body, filename=name, content_type=ctype)
            r = await s.post(f"{TG_URL}/bot{token}/{method}", data=fd)
        else:
            r = await s.post(f"{TG_URL}/bot{token}/{method}", json=data or {})
        j = await r.json(content_type=None)
        if not j.get("ok"):
            raise RuntimeError(j.get("description", "Telegram gaf een fout"))
        return j["result"]


async def tg_say(chat, text):
    tok = tg_conf().get("token")
    if tok:
        try:
            await tg_call(tok, "sendMessage", {"chat_id": chat, "text": text})
        except Exception as e:
            log("fout", "Telegram: versturen mislukt: " + str(e))


def _hm(ts):
    return time.strftime("%H:%M", time.localtime(ts))


async def tg_handle(token, upd):
    msg = upd.get("message") or upd.get("edited_message")
    if not msg:
        return
    chat = msg["chat"]["id"]
    who = (msg.get("from") or {}).get("first_name") or "iemand"
    text = (msg.get("text") or msg.get("caption") or "").strip()
    async with lock:
        db = load_db()
        conf = tg_conf(db)
        known = any(c["id"] == chat for c in conf["chats"])
        pair = conf.get("pair") or {}
        if not known:
            if pair.get("code") and text.replace(" ", "") == pair["code"] and pair.get("until", 0) > time.time():
                conf["chats"].append({"id": chat, "name": who[:30]})
                conf.pop("pair", None)
                save_db(db, bump=False)
                reply = f"Hallo {who}! Je bent gekoppeld aan Kamiel. 🦙\n\n" + TG_HELP
                log("telegram", f"{who} is gekoppeld aan Telegram.")
            else:
                reply = "Ik ken je nog niet. Vraag thuis om je te koppelen in Kamiel Studio."
            await tg_call(token, "sendMessage", {"chat_id": chat, "text": reply})
            return
        minutes = conf.get("minutes", 60)
    log("telegram", f"{who}: " + (text[:90] if text else ("een foto" if msg.get("photo") else "iets")), quiet=True)
    cmd = text.split()[0].lower().split("@")[0] if text.startswith("/") else ""
    if cmd in ("/start", "/help", "/hulp"):
        return await tg_say(chat, TG_HELP)
    if cmd == "/wis":
        async with lock:
            db = load_db(); db.pop("message", None); db.pop("spotlight", None); save_db(db, bump=False)
        return await tg_say(chat, "Weg van het scherm.")
    if cmd == "/bus":
        db = load_db()
        if not db["settings"].get("board"):
            return await tg_say(chat, "Er staat nog niets op het vertrekbord. Stel het in bij Instellingen in Kamiel Studio.")
        rows = await board_rows(db)
        if not rows:
            return await tg_say(chat, "Er vertrekt de komende tijd niets.")
        out = []
        for r in rows:
            m = max(0, int((r["due"] - time.time()) // 60))
            out.append(f"{r['label'].capitalize()}: {r['kind']} {r['line']} om {_hm(r['due'])}" + (" (nu)" if m == 0 else f" (over {m} min)"))
        return await tg_say(chat, "\n".join(x.replace("  ", " ") for x in out))
    if cmd == "/kijk":
        if SNAP.get("id"):
            return await tg_say(chat, "Even geduld, ik ben al een foto aan het maken.")
        await tg_say(chat, "📼 Even kijken…")
        data = await take_picture()
        if not data:
            return await tg_say(chat, "De tablet antwoordt niet. Staat hij aan?")
        return await tg_call(token, "sendPhoto", {"chat_id": chat}, files={"photo": ("kamiel.jpg", data, "image/jpeg")})
    if cmd == "/selfie":
        if SNAP.get("id"):
            return await tg_say(chat, "Even geduld, ik ben al een foto aan het maken.")
        ok = await send_selfie([chat], "maand", who)
        return None if ok else await tg_say(chat, "De tablet antwoordt niet. Staat hij aan?")
    if cmd == "/muziek":
        rest = text.split(None, 1)[1].strip() if len(text.split(None, 1)) > 1 else ""
        if not rest:
            songs = load_db().get("songs", [])
            if not songs:
                return await tg_say(chat, "Nog geen nummers. Stuur bv. /muziek Entertainment 127")
            return await tg_say(chat, "Kamiel knikt mee op:\n" + "\n".join(f"{x['title']} ({x['bpm']})" for x in songs))
        m = re.match(r"^(.*\S)\s+(\d{2,3}(?:[.,]\d+)?)\s*(bpm)?$", rest, re.I)
        song = _clean_song({"title": m.group(1), "bpm": m.group(2)}) if m else None
        if not song:
            return await tg_say(chat, "Zet het tempo achteraan, bv. /muziek Entertainment 127")
        async with lock:
            db = load_db()
            db["songs"] = [x for x in db.get("songs", []) if _norm(x["title"]) != _norm(song["title"])] + [song]
            save_db(db, bump=False)
        return await tg_say(chat, f"🎵 Genoteerd: {song['title']} ({song['bpm']} bpm). Kamiel knikt mee als het speelt.")
    if cmd == "/event":
        rest = text.split(None, 1)[1].strip() if len(text.split(None, 1)) > 1 else ""
        if rest.lower() in ("lijst", "list", "alle"):
            groups = {"lama": "Elke dag", "dier": "Huisdieren", "muziek": "Op muziek", "verhaal": "Verhaaltjes", "feest": "Op feestdagen", "vaak": "Vaak", "soms": "Soms"}
            out = []
            for cat, title in groups.items():
                out.append(title + ":\n" + "\n".join(f"• {name} ({eid})" for eid, name, c in EVENTS if c == cat))
            return await tg_say(chat, "\n\n".join(out) + "\n\nStuur /event en een naam, bv. /event mol")
        eid = find_event(rest)
        if eid is None:
            return await tg_say(chat, "Dat event ken ik niet. Stuur /event lijst voor alle namen.")
        async with lock:
            db = load_db()
            request_event(db, eid)
            save_db(db, bump=False)
        name = next((n for e, n, c in EVENTS if e == eid), "")
        return await tg_say(chat, f"✨ {name}… kijk maar op het scherm." if eid else "✨ Er gebeurt iets in Kamielland… kijk maar op het scherm.")
    if cmd:
        return await tg_say(chat, "Dat commando ken ik niet.\n\n" + TG_HELP)
    if msg.get("photo"):
        big = msg["photo"][-1]
        f = await tg_call(token, "getFile", {"file_id": big["file_id"]})
        async with ClientSession(timeout=ClientTimeout(total=30)) as s:
            async with s.get(f"{TG_URL}/file/bot{token}/{f['file_path']}") as r:
                data = await r.read()
        p = await run_blocking(_photo, data)
        p["label"] = f"Telegram van {who}"[:60]
        now = time.time()
        async with lock:
            db = load_db()
            db["photos"].append(p)
            db["spotlight"] = {"id": p["id"], "file": p["file"], "until": now + minutes * 60, "chat": chat}
            if text:
                db["message"] = {"id": uuid.uuid4().hex[:8], "text": text[:200], "since": now, "until": now + minutes * 60,
                                 "sign": who.split(" ")[0][:30], "chat": chat}
            save_db(db, bump=False)
        return await tg_say(chat, f"🖼 Hangt in een kader tot {_hm(now + minutes * 60)}." + (" Met je tekst erbij." if text else ""))
    if text:
        now = time.time()
        async with lock:
            db = load_db()
            db["message"] = {"id": uuid.uuid4().hex[:8], "text": text[:200], "since": now, "until": now + minutes * 60,
                             "sign": who.split(" ")[0][:30], "chat": chat}
            save_db(db, bump=False)
        return await tg_say(chat, f"✓ Staat op het scherm tot {_hm(now + minutes * 60)}.")
    await tg_say(chat, "Dat kan ik niet tonen. Stuur een tekst of een foto.")


async def tg_loop():
    """Runs for as long as the add-on runs; picks up a new key from the Studio by itself."""
    while True:
        conf = tg_conf()
        token = conf.get("token")
        if not token:
            await asyncio.sleep(5)
            continue
        try:
            ups = await tg_call(token, "getUpdates", {"offset": conf.get("offset", 0), "timeout": 25,
                                                     "allowed_updates": ["message", "edited_message"]}, timeout=25)
            for u in ups:
                async with lock:
                    db = load_db()
                    tg_conf(db)["offset"] = u["update_id"] + 1
                    save_db(db, bump=False)
                try:
                    await tg_handle(token, u)
                except Exception as e:
                    log("fout", "Telegram: bericht kon niet verwerkt worden: " + str(e))
        except Exception as e:
            log("fout", "Telegram: " + str(e))
            await asyncio.sleep(15)


async def api_tg_get(request):
    conf = tg_conf()
    pair = conf.get("pair") or {}
    return web.json_response({"connected": bool(conf.get("token")), "bot": conf.get("bot", ""), "minutes": conf.get("minutes", 60),
                              "chats": conf.get("chats", []),
                              "pair": pair.get("code") if pair.get("until", 0) > time.time() else None})


async def api_tg_put(request):
    body = await request.json()
    async with lock:
        db = load_db()
        conf = tg_conf(db)
        if "token" in body:
            tok = str(body["token"]).strip()
            if tok:
                try:
                    me = await tg_call(tok, "getMe", timeout=10)
                except Exception:
                    raise web.HTTPBadRequest(text="Deze sleutel werkt niet. Kopieer hem opnieuw uit je gesprek met BotFather.")
                conf.update({"token": tok, "bot": "@" + me.get("username", ""), "offset": 0})
            else:
                conf.update({"token": "", "bot": ""})
        if "minutes" in body:
            conf["minutes"] = max(1, min(1440, int(body["minutes"])))
        save_db(db, bump=False)
    return await api_tg_get(request)


async def api_tg_pair(request):
    import secrets
    async with lock:
        db = load_db()
        code = str(secrets.randbelow(900000) + 100000)
        tg_conf(db)["pair"] = {"code": code, "until": time.time() + 600}
        save_db(db, bump=False)
    return web.json_response({"code": code})


async def api_tg_unlink(request):
    cid = int(request.match_info["id"])
    async with lock:
        db = load_db()
        conf = tg_conf(db)
        conf["chats"] = [c for c in conf["chats"] if c["id"] != cid]
        save_db(db, bump=False)
    return web.json_response({"ok": True})


async def api_seen(request):
    """The tablet says someone tapped the message away: tell whoever sent it."""
    mid = request.match_info["id"]
    async with lock:
        db = load_db()
        m = db.get("message") or {}
        if m.get("id") != mid or m.get("seen"):
            return web.json_response({"ok": False})
        m["seen"] = True
        chat = m.get("chat")
        save_db(db, bump=False)
    if chat:
        asyncio.ensure_future(tg_say(chat, f"👀 Gezien om {_hm(time.time())}."))
    return web.json_response({"ok": True})


async def api_photo_seen(request):
    """Someone at home tapped the sent photo away."""
    pid = request.match_info["id"]
    async with lock:
        db = load_db()
        sp = db.get("spotlight") or {}
        if sp.get("id") != pid:
            return web.json_response({"ok": False})
        chat = sp.get("chat")
        db.pop("spotlight", None)
        save_db(db, bump=False)
    if chat:
        asyncio.ensure_future(tg_say(chat, f"👀 Foto gezien om {_hm(time.time())}."))
    return web.json_response({"ok": True})


async def take_picture(opts=None, wait=25):
    """Ask the tablet for a picture: the screen as it is (/kijk), or a selfie of Kamiel (opts kind 'selfie'). JPEG bytes or None."""
    if SNAP.get("id"):
        return None
    SNAP.clear(); SNAP.update({"id": uuid.uuid4().hex[:8], "event": asyncio.Event(), "data": None, "opts": opts})
    try:
        await asyncio.wait_for(SNAP["event"].wait(), wait)
        return SNAP["data"]
    except asyncio.TimeoutError:
        return None
    finally:
        SNAP.clear()


# ----------------------------------------------------------------- selfies: Kamiel sends a (much too close) selfie on Telegram
SELFIE_AWAY = [
    "{naam}. Het is al {dagen} dagen. Ik sta hier gewoon. Te kijken.",
    "Dag {dagen} zonder {naam}. Wifi slaapt op je plek. Ik heb niets gezegd.",
    "Ik weet niet waar je bent, {naam}, maar ik weet wel dat het hier stil is.",
    "Geen paniek. Alles is goed. Behalve dat jij er niet bent. Groetjes, Kamiel",
    "Ik heb je kussen niet opgegeten. Dit is gewoon mijn gezicht. Kom naar huis, {naam}.",
    "Ze zeggen dat lama's niet kunnen missen. Ze zeggen veel. — K.",
    "{dagen} dagen. Ik tel ze. Ik ben een lama, ik heb tijd.",
    "Is het daar leuker dan hier? Wees eerlijk, {naam}.",
    "Ik ben niet boos. Ik ben gewoon heel dichtbij.",
    "Pippa doet alsof het haar niet kan schelen. Het kan haar schelen. Mij ook.",
]
SELFIE_MONTH = [
    "Gewoon een selfie. Geen reden.",
    "Mijn goede kant. Ze zijn allebei goed.",
    "Dacht dat je dit moest zien.",
    "Vandaag voelde ik me mooi.",
    "Maandelijkse controle: ik ben er nog. Jij ook?",
    "Niemand vroeg erom. Graag gedaan.",
    "Ik heb een nieuwe camera ontdekt. Hij is van jou.",
]
SELFIE_PET = [
    "Selfie met {dier}. {dier} wilde niet. Te laat.",
    "{dier} en ik. Beste vrienden. Officieel.",
    "Iemand moest het huis bewaken. Ik doe dat. Met {dier}.",
    "{dier} zegt hallo. (Dat zei {dier} niet. Ik vertaal.)",
]
PET_NAMES = {"wifi": "Wifi", "snoet": "Snoet", "pippa": "Pippa", "pebbels": "Pebbels", "dobby": "Dobby"}


async def send_selfie(chats, why, naam="", dagen=0):
    """why: 'weg' (someone is away for days) or 'maand' (the monthly one). Returns True when sent."""
    import random
    conf = tg_conf()
    if not conf.get("token") or not chats:
        return False
    s = load_db()["settings"].get("selfie") or {}
    pet = random.choice(list(PET_NAMES)) if why == "maand" and s.get("pets", True) and random.random() < .5 else ""
    variant = random.choice(["neus", "schuin", "boven", "wazig"]) if not pet else "dier"
    if why == "weg":
        text = random.choice(SELFIE_AWAY).format(naam=naam or "jij", dagen=dagen)
    elif pet:
        text = random.choice(SELFIE_PET).format(dier=PET_NAMES[pet])
    else:
        text = random.choice(SELFIE_MONTH)
    data = await take_picture({"kind": "selfie", "variant": variant, "pet": pet}, wait=30)
    if not data:
        log("fout", "Selfie: de tablet antwoordde niet.")
        return False
    for c in chats:
        try:
            await tg_call(conf["token"], "sendPhoto", {"chat_id": c, "caption": text}, files={"photo": ("kamiel-selfie.jpg", data, "image/jpeg")})
        except Exception as e:
            log("fout", "Selfie versturen mislukt: " + str(e))
    names = ", ".join(x.get("name", "") for x in conf.get("chats", []) if x["id"] in chats)
    log("selfie", f"Selfie gestuurd naar {names or 'Telegram'}: “{text}”")
    return True


def _month_plan(now):
    import random
    key = time.strftime("%Y-%m", time.localtime(now))
    r = random.Random("selfie " + key)
    t = time.localtime(now)
    day = r.randint(1, 28)
    at = time.mktime((t.tm_year, t.tm_mon, day, r.randint(11, 19), r.randint(0, 59), 0, 0, 0, -1))
    return key, at


async def selfie_loop():
    while True:
        await asyncio.sleep(15 if not SELFIE_STATE["started"] else 600)
        SELFIE_STATE["started"] = True
        try:
            db = load_db()
            s = db["settings"].get("selfie") or {}
            conf = tg_conf(db)
            if not conf.get("token") or not conf.get("chats"):
                continue
            now, hour = time.time(), time.localtime().tm_hour
            st = db.get("selfie_state") or {}
            all_chats = [c["id"] for c in conf["chats"]]
            changed = False
            # your days as a couple: a photo from Kamiel, once that day, at a moment of its own between 10 and 20 h
            fe = db["settings"].get("feest") or {}
            today = time.strftime("%m-%d")
            for d in fe.get("days", []) if fe.get("on", True) else []:
                key = time.strftime("%Y-") + d.get("date", "")
                if d.get("kind") == "liefde" and d.get("date") == today and (st.get("love") or {}).get(d["date"]) != key:
                    import random
                    at = random.Random(key).randint(10 * 60, 19 * 60)
                    if time.localtime().tm_hour * 60 + time.localtime().tm_min >= at and await send_love(d):
                        st.setdefault("love", {})[d["date"]] = key; changed = True
            if not s.get("on"):
                if changed:
                    async with lock:
                        db = load_db(); db["selfie_state"] = st; save_db(db, bump=False)
                continue
            # someone away for days
            for p in s.get("people", []):
                ent = p.get("entity")
                if not ent:
                    continue
                cur = await ha_get("/states/" + ent)
                if not cur or cur.get("state") in ("home", "unknown", "unavailable", None):
                    if (st.get("away") or {}).pop(ent, None) is not None:
                        changed = True
                    continue
                since = _ts(cur.get("last_changed")) or now
                days = int((now - since) // 86400)
                rec = (st.setdefault("away", {})).get(ent) or {}
                if rec.get("since") != since:
                    rec = {"since": since, "n": 0}
                step = max(1, int(s.get("days", 3)))
                if days >= step * (rec["n"] + 1) and 10 <= hour < 21:
                    naam = (cur.get("attributes") or {}).get("friendly_name") or ent.split(".")[-1].title()
                    chats = [p["chat"]] if p.get("chat") in all_chats else all_chats
                    if await send_selfie(chats, "weg", naam, days):
                        rec["n"] = days // step
                st["away"][ent] = rec; changed = True
            # once a month, out of the blue
            if s.get("monthly", True):
                key, at = _month_plan(now)
                if st.get("month") != key and now >= at and 10 <= hour < 21:
                    if await send_selfie(all_chats, "maand"):
                        st["month"] = key; changed = True
            if changed:
                async with lock:
                    db = load_db(); db["selfie_state"] = st; save_db(db, bump=False)
        except Exception as e:
            log("fout", "Selfies: " + str(e))


SELFIE_STATE = {"started": False}

def love_texts(naam, years):
    n = naam[0].lower() + naam[1:] if naam[:1].isupper() and not naam[:2].isupper() else naam
    when = f"precies {years} jaar geleden" if years > 0 else "een speciale dag"
    return [
        f"Vandaag {when}: {n}. 💕 Heel Kamielland is er roze van. Ik ook een beetje.",
        (f"{years} jaar sinds {n}! " if years > 0 else "") + "Ik heb taart geregeld. (Wifi heeft ervan gegeten.) 💕",
        "Gelukkige dag, jullie twee. Heidi is jaloers. Ik niet. Ik ben gewoon blij. 💕",
        "Op deze dag begon het. Vandaag vieren Wifi, Snoet, Pippa, Pebbels, Dobby en ik mee. 💕",
    ]


async def send_love(day):
    import random
    conf = tg_conf()
    if not conf.get("token") or not conf.get("chats"):
        return False
    naam = (day.get("name") or "jullie dag").strip()
    years = time.localtime().tm_year - int(day["year"]) if day.get("year") else 0
    text = random.choice(love_texts(naam, years))
    data = await take_picture({"kind": "selfie", "variant": "liefde", "pet": ""}, wait=35)
    if not data:
        log("fout", "Liefdesfoto: de tablet antwoordde niet.")
        return False
    for c in conf["chats"]:
        try:
            await tg_call(conf["token"], "sendPhoto", {"chat_id": c["id"], "caption": text}, files={"photo": ("kamiel-liefde.jpg", data, "image/jpeg")})
        except Exception as e:
            log("fout", "Liefdesfoto versturen mislukt: " + str(e))
    log("selfie", f"Liefdesfoto gestuurd voor {naam}: “{text}”")
    return True


async def api_selfie_preview(request):
    """Studio: show a selfie (not sent)."""
    v = request.query.get("variant", "")
    pet = request.query.get("pet", "")
    data = await take_picture({"kind": "selfie", "variant": v if v in ("neus", "schuin", "boven", "wazig", "dier", "liefde") else "neus",
                               "pet": pet if pet in PET_NAMES else ""}, wait=20)
    if not data:
        return web.json_response({"ok": False, "error": "De tablet antwoordt niet. Staat hij aan?"}, status=504)
    return web.Response(body=data, content_type="image/jpeg")


async def api_love_test(request):
    """Studio: send the love photo now (for the first of your days as a couple)."""
    days = [d for d in (load_db()["settings"].get("feest") or {}).get("days", []) if d.get("kind") == "liefde"]
    ok = await send_love(days[0] if days else {"name": "Jullie dag"})
    return web.json_response({"ok": ok, "error": "" if ok else "Lukte niet: is Telegram ingesteld en staat de tablet aan?"})


async def api_selfie_send(request):
    conf = tg_conf()
    if not conf.get("token") or not conf.get("chats"):
        return web.json_response({"ok": False, "error": "Telegram is nog niet ingesteld (tabblad Bericht)."}, status=400)
    ok = await send_selfie([c["id"] for c in conf["chats"]], "maand")
    return web.json_response({"ok": ok, "error": "" if ok else "De tablet antwoordt niet. Staat hij aan?"})


# ----------------------------------------------------------------- back-up and restore (Studio → Instellingen → Back-up)
BACKUP_TMP = os.path.join(DATA, "backup-tmp")


def _strip_secrets(db):
    db = copy.deepcopy(db)
    tg = db.get("telegram")
    if tg:   # the bot's key stays at home; the linked phones come along
        db["telegram"] = {"chats": tg.get("chats", []), "minutes": tg.get("minutes", 60)}
    for k in ("actions", "event_req", "message", "spotlight", "selfie_state"):
        db.pop(k, None)
    return db


def _make_backup(full):
    import zipfile
    os.makedirs(BACKUP_TMP, exist_ok=True)
    name = time.strftime("kamiel-backup-%Y-%m-%d") + ("" if full else "-instellingen") + ".zip"
    path = os.path.join(BACKUP_TMP, name)
    db = _strip_secrets(load_db())
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("kamiel.json", json.dumps(db, indent=1))
        z.writestr("LEESMIJ.txt", "Back-up van Kamiel Studio, " + time.strftime("%d/%m/%Y %H:%M") + ".\n"
                   "Terugzetten: Kamiel Studio > Instellingen > Back-up > Terugzetten.\n"
                   + ("Met alle elementen, foto's en het panorama.\n" if full else "Alleen de instellingen, regels, herinneringen en nummers (geen afbeeldingen).\n"))
        if full:
            for d, pre in ((MEDIA, "media/"), (ORIG, "originals/")):
                if os.path.isdir(d):
                    for f in sorted(os.listdir(d)):
                        fp = os.path.join(d, f)
                        if os.path.isfile(fp):
                            z.write(fp, pre + f, compress_type=zipfile.ZIP_STORED)
    return path, name


async def api_backup(request):
    full = request.query.get("full", "1") != "0"
    for f in os.listdir(BACKUP_TMP) if os.path.isdir(BACKUP_TMP) else []:   # yesterday's leftovers
        if not f.endswith(".part"):
            try: os.remove(os.path.join(BACKUP_TMP, f))
            except OSError: pass
    path, name = await run_blocking(_make_backup, full)
    log("systeem", f"Back-up gemaakt ({'alles' if full else 'alleen instellingen'}, {os.path.getsize(path) // 1024} kB).")
    return web.FileResponse(path, headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})


async def api_restore_chunk(request):
    """A back-up comes in in pieces (Home Assistant does not let more than 16 MB through at once)."""
    rid = re.sub(r"[^a-z0-9]", "", request.query.get("id", ""))[:16]
    if not rid:
        raise web.HTTPBadRequest()
    os.makedirs(BACKUP_TMP, exist_ok=True)
    data = await request.read()
    with open(os.path.join(BACKUP_TMP, rid + ".part"), "wb" if request.query.get("i") == "0" else "ab") as f:
        f.write(data)
    return web.json_response({"ok": True})


def _restore(path):
    import zipfile
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        if "kamiel.json" not in names:
            raise ValueError("Dit is geen back-up van Kamiel (kamiel.json ontbreekt).")
        new = json.loads(z.read("kamiel.json"))
        if not isinstance(new, dict) or "settings" not in new:
            raise ValueError("De back-up is beschadigd.")
        files = [n for n in names if n.startswith(("media/", "originals/")) and not n.endswith("/")]
        cur = load_db()
        if files:   # everything: elements, photos, panorama and settings
            for n in files:
                base = os.path.basename(n)
                if not base or base.startswith("."):
                    continue
                dest = os.path.join(MEDIA if n.startswith("media/") else ORIG, base)
                with z.open(n) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)
            keep = {k: cur[k] for k in ("telegram",) if k in cur}
            tg = new.get("telegram") or {}
            if keep.get("telegram"):   # keep the bot key that is here now; take the linked phones from the back-up if there are none
                keep["telegram"]["chats"] = keep["telegram"].get("chats") or tg.get("chats", [])
            new.update(keep)
            what = f"alles ({len(new.get('assets', []))} elementen, {len(new.get('photos', []))} foto's)"
        else:   # settings only: the pictures stay as they are
            for k in ("settings", "reminders", "songs", "dismissed"):
                if k in new:
                    cur[k] = new[k]
            new = cur
            what = "de instellingen"
        save_db(new)
        return what


async def api_restore_finish(request):
    rid = re.sub(r"[^a-z0-9]", "", request.query.get("id", ""))[:16]
    path = os.path.join(BACKUP_TMP, rid + ".part")
    if not rid or not os.path.exists(path):
        raise web.HTTPBadRequest()
    try:
        async with lock:
            what = await run_blocking(_restore, path)
    except Exception as e:
        log("fout", "Back-up terugzetten mislukt: " + str(e))
        return web.json_response({"ok": False, "error": str(e) if isinstance(e, ValueError) else "Dit bestand kon niet gelezen worden."}, status=400)
    finally:
        try: os.remove(path)
        except OSError: pass
    log("systeem", f"Back-up teruggezet: {what}.")
    return web.json_response({"ok": True, "what": what})


async def api_snapshot(request):
    """Only accepted while a /kijk is waiting for it."""
    if SNAP.get("id") != request.match_info["id"] or SNAP.get("data"):
        raise web.HTTPNotFound()
    data = await request.read()
    if not data.startswith(b"\xff\xd8") or len(data) > 4 * 1024 * 1024:
        raise web.HTTPBadRequest()
    SNAP["data"] = data
    SNAP["event"].set()
    return web.json_response({"ok": True})


# ----------------------------------------------------------------- windows on the tablet
COND_NL = {"sunny": "Zonnig", "clear-night": "Heldere nacht", "partlycloudy": "Half bewolkt", "cloudy": "Bewolkt",
           "rainy": "Regen", "pouring": "Stortregen", "lightning": "Onweer", "lightning-rainy": "Onweer en regen",
           "snowy": "Sneeuw", "snowy-rainy": "Natte sneeuw", "hail": "Hagel", "fog": "Mist", "windy": "Winderig",
           "windy-variant": "Winderig en bewolkt", "exceptional": "Uitzonderlijk"}


def current_outfit(db):
    s = db["settings"]
    mode = s.get("outfit_mode", "kiezen")
    allowed = [o for o in OUTFIT_SLOTS if o not in s.get("outfits_off", [])] or list(OUTFIT_SLOTS)
    if mode == "uit":
        return []
    if mode == "dag" and db.get("outfit_day") == time.strftime("%Y-%m-%d"):
        mode = "kiezen"   # someone picked something on the tablet today: that wins until tomorrow
    if mode == "dag":   # a surprise outfit, the same all day
        import random
        rnd = random.Random(time.strftime("%Y-%m-%d"))
        out = []
        for slot in OUTFIT_SLOT_ORDER:
            opts = [o for o in allowed if OUTFIT_SLOTS.get(o) == slot]
            if opts and rnd.random() < (.8 if slot == "hoofd" else .2 if slot == "lijf" else .45):
                out.append(rnd.choice(opts))
        return out
    return [o for o in db.get("outfit", []) if o in OUTFIT_SLOTS]


async def ha_service_response(domain, service, data):
    if not TOKEN:
        return None
    async with ClientSession(timeout=ClientTimeout(total=10)) as s:
        async with s.post(f"{HA_URL}/services/{domain}/{service}?return_response", json=data,
                          headers={"Authorization": "Bearer " + TOKEN}) as r:
            if r.status >= 300:
                return None
            return await r.json(content_type=None)


async def api_desk(request):
    """Everything the windows show, in one go."""
    db = load_db()
    s = db["settings"]
    out = {"weather": None, "buttons": [], "media": None, "outfit": current_outfit(db)}
    try:
        ent = s.get("weather_entity")
        if ent:
            w = await ha_get("/states/" + ent)
            if w:
                a = w.get("attributes", {})
                fc = []
                try:
                    j = await ha_service_response("weather", "get_forecasts", {"entity_id": ent, "type": "daily"})
                    items = ((j or {}).get("service_response") or {}).get(ent, {}).get("forecast", [])
                    for f in items[:4]:
                        fc.append({"dt": f.get("datetime"), "cond": f.get("condition"), "nl": COND_NL.get(f.get("condition"), ""),
                                   "hi": f.get("temperature"), "lo": f.get("templow"), "rain": f.get("precipitation")})
                except Exception:
                    pass
                out["weather"] = {"cond": w.get("state"), "nl": COND_NL.get(w.get("state"), w.get("state")),
                                  "temp": a.get("temperature"), "unit": a.get("temperature_unit", "°C"),
                                  "humidity": a.get("humidity"), "wind": a.get("wind_speed"), "wind_unit": a.get("wind_speed_unit", "km/h"),
                                  "pressure": a.get("pressure"), "clouds": a.get("cloud_coverage"), "forecast": fc,
                                  "name": a.get("friendly_name", "")}
        for i, b in enumerate(s.get("buttons", [])):
            st = await ha_get("/states/" + b["entity"]) if b.get("entity") else None
            dom = (b.get("entity") or b.get("service") or ".").split(".")[0]
            state = (st or {}).get("state", "")
            # a small line under the name for things that have a value (an input_select's option, a temperature…)
            show = state if dom in ("input_select", "select", "input_number", "number", "sensor", "climate", "input_text", "counter", "timer", "cover", "vacuum") else ""
            unit = (st or {}).get("attributes", {}).get("unit_of_measurement", "")
            out["buttons"].append({"i": i, "label": b.get("label") or ((st or {}).get("attributes", {}).get("friendly_name", "")) or SVC_NL.get(b.get("service", ""), ""),
                                   "icon": b.get("icon", ""), "kind": dom, "on": state in ("on", "open", "playing", "home", "unlocked", "heat", "cool", "cleaning"),
                                   "led": dom in TOGGLE or dom in ("media_player", "input_boolean"), "state": (show + (" " + unit if show and unit else ""))[:20],
                                   "ok": bool(st) or not b.get("entity")})
        ent, st, room = await active_player(s)
        if ent:
            if st:
                a = st.get("attributes", {})
                pic = a.get("entity_picture") or ""
                out["media"] = {"room": room, "state": st.get("state"), "title": a.get("media_title", ""), "artist": a.get("media_artist", ""),
                                "volume": a.get("volume_level"), "art": str(abs(hash(pic))) if pic else "",
                                # the room name from the Studio; Spotify also says on which device it plays
                                "name": " · ".join(x for x in (room or a.get("friendly_name", ""),
                                                               a.get("source", "") if ent.startswith("media_player.spotify") else "") if x)}
    except Exception as e:
        out["error"] = str(e)
    return web.json_response(out)


TOGGLE = ("light", "switch", "input_boolean", "fan", "cover", "climate", "humidifier", "siren", "lock")
MAX_BUTTONS = 30
SERVICE_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")


def clean_call(b):
    """A Home Assistant action as stored for a button or a rule: a service ("domain.service", empty = automatic) and its data."""
    svc = str(b.get("service", "") or "").strip()
    data = b.get("data") if isinstance(b.get("data"), dict) else {}
    try:
        if len(json.dumps(data)) > 3000:
            data = {}
    except (TypeError, ValueError):
        data = {}
    data = {str(k)[:60]: v for k, v in data.items() if k not in ("entity_id", "target")}
    return {"service": svc if SERVICE_RE.match(svc) else "", "data": data}


async def do_call(entity, service="", data=None):
    """Run what a button or a rule asks: the chosen service, or the sensible default for that kind of entity."""
    data = dict(data or {})
    if service:
        dom, svc = service.split(".", 1)
        if entity:
            data["entity_id"] = entity
        return await ha_service(dom, svc, data)
    if not entity:
        return False
    dom = entity.split(".")[0]
    if dom in TOGGLE:
        return await ha_service("homeassistant", "toggle", {"entity_id": entity})
    if dom in ("script", "scene"):
        return await ha_service(dom, "turn_on", {"entity_id": entity})
    if dom == "automation":
        return await ha_service("automation", "trigger", {"entity_id": entity})
    if dom in ("button", "input_button"):
        return await ha_service(dom, "press", {"entity_id": entity})
    if dom == "media_player":
        return await ha_service("media_player", "media_play_pause", {"entity_id": entity})
    if dom in ("input_select", "select"):
        return await ha_service(dom, "select_next", {"entity_id": entity, "cycle": True})
    if dom == "vacuum":
        return await ha_service("vacuum", "start", {"entity_id": entity})
    return False


async def api_button(request):
    """One of the 9 buttons. Only does what was set up in the Studio for that button."""
    i = int(request.match_info["i"])
    btns = load_db()["settings"].get("buttons", [])
    if i >= len(btns) or not (btns[i].get("entity") or btns[i].get("service")):
        return web.json_response({"ok": False})
    b = btns[i]
    return web.json_response({"ok": await do_call(b.get("entity", ""), b.get("service", ""), b.get("data"))})


async def api_call_test(request):
    """Studio: try a button or an action right now."""
    b = await request.json()
    c = clean_call(b)
    return web.json_response({"ok": await do_call(str(b.get("entity", "")).strip(), c["service"], c["data"])})


# Dutch names for the actions people use most; everything else Home Assistant can do is listed too, with its own name
SVC_NL = {
    "homeassistant.toggle": "Aan/uit wisselen", "homeassistant.turn_on": "Aanzetten", "homeassistant.turn_off": "Uitzetten",
    "light.toggle": "Aan/uit wisselen", "light.turn_on": "Aanzetten (helderheid, kleur…)", "light.turn_off": "Uitzetten",
    "switch.toggle": "Aan/uit wisselen", "switch.turn_on": "Aanzetten", "switch.turn_off": "Uitzetten",
    "input_boolean.toggle": "Aan/uit wisselen", "input_boolean.turn_on": "Aanzetten", "input_boolean.turn_off": "Uitzetten",
    "input_select.select_next": "Volgende optie", "input_select.select_previous": "Vorige optie", "input_select.select_option": "Een bepaalde optie kiezen",
    "input_select.select_first": "Eerste optie", "input_select.select_last": "Laatste optie",
    "select.select_next": "Volgende optie", "select.select_previous": "Vorige optie", "select.select_option": "Een bepaalde optie kiezen",
    "select.select_first": "Eerste optie", "select.select_last": "Laatste optie",
    "input_number.set_value": "Waarde instellen", "input_number.increment": "Eén hoger", "input_number.decrement": "Eén lager",
    "number.set_value": "Waarde instellen", "input_text.set_value": "Tekst instellen", "input_datetime.set_datetime": "Datum/tijd instellen",
    "input_button.press": "Indrukken", "button.press": "Indrukken",
    "script.turn_on": "Starten", "script.toggle": "Starten/stoppen", "script.turn_off": "Stoppen", "scene.turn_on": "Activeren",
    "automation.trigger": "Nu uitvoeren", "automation.turn_on": "Inschakelen", "automation.turn_off": "Uitschakelen", "automation.toggle": "In/uitschakelen",
    "cover.open_cover": "Openen", "cover.close_cover": "Sluiten", "cover.stop_cover": "Stoppen", "cover.toggle": "Open/dicht wisselen", "cover.set_cover_position": "Op een positie zetten",
    "lock.lock": "Op slot", "lock.unlock": "Van slot", "lock.open": "Openen",
    "fan.toggle": "Aan/uit wisselen", "fan.turn_on": "Aanzetten", "fan.turn_off": "Uitzetten", "fan.set_percentage": "Snelheid instellen", "fan.oscillate": "Draaien aan/uit",
    "climate.set_temperature": "Temperatuur instellen", "climate.set_hvac_mode": "Stand kiezen (verwarmen, koelen…)", "climate.set_preset_mode": "Voorinstelling kiezen",
    "climate.turn_on": "Aanzetten", "climate.turn_off": "Uitzetten", "water_heater.set_temperature": "Temperatuur instellen",
    "media_player.media_play_pause": "Afspelen/pauze", "media_player.media_play": "Afspelen", "media_player.media_pause": "Pauze", "media_player.media_stop": "Stoppen",
    "media_player.media_next_track": "Volgend nummer", "media_player.media_previous_track": "Vorig nummer", "media_player.volume_up": "Luider", "media_player.volume_down": "Stiller",
    "media_player.volume_set": "Volume instellen", "media_player.volume_mute": "Dempen", "media_player.play_media": "Iets afspelen", "media_player.turn_on": "Aanzetten",
    "media_player.turn_off": "Uitzetten", "media_player.select_source": "Bron kiezen", "media_player.shuffle_set": "Shuffle", "media_player.repeat_set": "Herhalen",
    "vacuum.start": "Starten", "vacuum.pause": "Pauze", "vacuum.stop": "Stoppen", "vacuum.return_to_base": "Terug naar de basis", "vacuum.locate": "Zoeken (piept)",
    "timer.start": "Starten", "timer.pause": "Pauzeren", "timer.cancel": "Annuleren", "timer.finish": "Afronden", "counter.increment": "Eén erbij", "counter.decrement": "Eén eraf", "counter.reset": "Op nul",
    "siren.turn_on": "Aanzetten", "siren.turn_off": "Uitzetten", "humidifier.toggle": "Aan/uit wisselen", "humidifier.set_humidity": "Vochtigheid instellen",
    "tts.speak": "Laten uitspreken", "notify.persistent_notification": "Melding in Home Assistant", "persistent_notification.create": "Melding in Home Assistant",
    "valve.open_valve": "Openen", "valve.close_valve": "Sluiten", "lawn_mower.start_mowing": "Beginnen maaien", "lawn_mower.dock": "Terug naar het dok",
}


async def api_services(request):
    """Studio: everything Home Assistant can do (its services), with their fields, for the action pickers."""
    raw = await ha_get("/services") or []
    out = []
    for d in raw:
        dom = d.get("domain", "")
        svcs = []
        for sid, info in sorted((d.get("services") or {}).items()):
            info = info or {}
            fields = []
            def walk(fs):
                for k, f in (fs or {}).items():
                    f = f or {}
                    if "fields" in f and isinstance(f["fields"], dict) and not f.get("selector"):   # a collapsed section
                        walk(f["fields"]); continue
                    if k in ("entity_id", "device_id", "area_id"):
                        continue
                    fields.append({"key": k, "name": f.get("name") or k.replace("_", " "), "desc": f.get("description", ""),
                                   "required": bool(f.get("required")), "selector": f.get("selector") or {}, "example": f.get("example")})
            walk(info.get("fields"))
            full = dom + "." + sid
            svcs.append({"id": full, "name": SVC_NL.get(full) or info.get("name") or sid.replace("_", " "), "desc": info.get("description", ""),
                         "target": bool(info.get("target")) or any(k == "entity_id" for k in (info.get("fields") or {})), "fields": fields[:30]})
        if svcs:
            out.append({"domain": dom, "services": svcs})
    out.sort(key=lambda x: x["domain"])
    return web.json_response({"connected": bool(TOKEN), "domains": out})


MEDIA_CMDS = {"playpause": "media_play_pause", "next": "media_next_track", "prev": "media_previous_track",
              "volup": "volume_up", "voldown": "volume_down"}


async def api_media(request):
    cmd = MEDIA_CMDS.get(request.match_info["cmd"])
    ent, _, _ = await active_player(load_db()["settings"])
    if not cmd or not ent:
        return web.json_response({"ok": False})
    return web.json_response({"ok": await ha_service("media_player", cmd, {"entity_id": ent})})


async def api_outfit(request):
    body = await request.json()
    ids = [x for x in body.get("ids", []) if x in OUTFIT_SLOTS]
    seen, keep = set(), []
    for x in ids:                      # one piece per slot
        if OUTFIT_SLOTS[x] not in seen:
            seen.add(OUTFIT_SLOTS[x]); keep.append(x)
    async with lock:
        db = load_db()
        db["outfit"] = keep
        db["outfit_day"] = time.strftime("%Y-%m-%d")
        save_db(db, bump=False)
    return web.json_response({"ids": keep})


# ----------------------------------------------------------------- songs Kamiel nods along to
def _words(t):
    """The words of a title, lower case, without '(feat. …)' and the like."""
    t = re.sub(r"\((feat|ft|with|live|remaster)[^)]*\)|\[[^\]]*\]| - .*remaster.*$", "", str(t).lower())
    return re.findall(r"[0-9a-z\u00c0-\u024f]+", t)


def _norm(t):
    """'Brand New Chanel$ (feat. X)' and 'brand new chanel' are the same title."""
    return "".join(_words(t))


def song_bpm(db, title):
    """The tempo from the song list in the Studio, or None: Kamiel only nods to songs on that list."""
    n = _words(title)
    if not n:
        return None
    best = None
    for song in db.get("songs", []):
        m = _words(song.get("title", ""))
        if not m:
            continue
        if m == n or "".join(m) == "".join(n):
            return song["bpm"]
        # 'Everything Is Romantic' vs 'Everything is Romantic (reimagined)': whole words, one is the start of the other
        short, long_ = (m, n) if len(m) <= len(n) else (n, m)
        if long_[:len(short)] == short and len(short) >= 2:
            best = best or song["bpm"]
    return best


def _clean_song(body, old=None):
    title = str(body.get("title", (old or {}).get("title", ""))).strip()[:120]
    try:
        bpm = float(str(body.get("bpm", (old or {}).get("bpm", 0))).replace(",", "."))
    except ValueError:
        bpm = 0
    if not title or not 30 <= bpm <= 300:
        return None
    return {"id": (old or {}).get("id") or uuid.uuid4().hex[:8], "title": title, "bpm": round(bpm, 1) if bpm % 1 else int(bpm)}


async def api_songs(request):
    return web.json_response(load_db().get("songs", []))


async def api_add_song(request):
    song = _clean_song(await request.json())
    if not song:
        return web.json_response({"error": "Geef een titel en een tempo tussen 30 en 300."}, status=400)
    async with lock:
        db = load_db()
        db["songs"] = [x for x in db.get("songs", []) if _norm(x["title"]) != _norm(song["title"])] + [song]
        save_db(db, bump=False)
    return web.json_response(db["songs"])


async def api_edit_song(request):
    sid = request.match_info["id"]
    body = await request.json()
    async with lock:
        db = load_db()
        for i, x in enumerate(db.get("songs", [])):
            if x["id"] == sid:
                new = _clean_song(body, x)
                if not new:
                    return web.json_response({"error": "Geef een titel en een tempo tussen 30 en 300."}, status=400)
                db["songs"][i] = new
                save_db(db, bump=False)
                return web.json_response(db["songs"])
    raise web.HTTPNotFound()


async def api_delete_song(request):
    sid = request.match_info["id"]
    async with lock:
        db = load_db()
        db["songs"] = [x for x in db.get("songs", []) if x["id"] != sid]
        save_db(db, bump=False)
    return web.json_response(db["songs"])


# ----------------------------------------------------------------- world events on request (Studio button, /event)
def find_event(word):
    word = _norm(word)
    if not word:
        return ""
    for eid, name, cat in EVENTS:
        if word == _norm(eid) or word == _norm(name):
            return eid
    for eid, name, cat in EVENTS:
        if word in _norm(eid) or word in _norm(name):
            return eid
    return None


def request_event(db, eid):
    n = int((db.get("event_req") or {}).get("n", 0)) + 1
    db["event_req"] = {"n": n, "id": eid or "", "at": time.time()}


async def api_event(request):
    body = await request.json()
    eid = find_event(body.get("id", ""))
    if eid is None:
        return web.json_response({"error": "Dat event ken ik niet."}, status=400)
    async with lock:
        db = load_db()
        request_event(db, eid)
        save_db(db, bump=False)
    return web.json_response({"ok": True, "id": eid})


async def api_dismiss_reminder(request):
    """Someone tapped a reminder away: gone until its next time."""
    rid = request.match_info["id"]
    body = await request.json()
    async with lock:
        db = load_db()
        db.setdefault("dismissed", {})[rid] = str(body.get("key", ""))[:40]
        save_db(db, bump=False)
    return web.json_response({"ok": True})

# ----------------------------------------------------------------- reminders
REPEATS = ("once", "daily", "weekly", "monthly", "yearly")
POSITIONS = ("midden", "boven", "onder")


def _clean_reminder(body, old=None):
    r = dict(old or {"id": uuid.uuid4().hex[:10]})
    hm = lambda v, d: v if isinstance(v, str) and len(v) == 5 and v[2] == ":" and v.replace(":", "").isdigit() else d
    day = lambda v: v if isinstance(v, str) and len(v) == 10 and v[4] == "-" and v[7] == "-" else ""
    r["text"] = str(body.get("text", r.get("text", ""))).strip()[:200]
    r["active"] = bool(body.get("active", r.get("active", True)))
    r["repeat"] = body.get("repeat") if body.get("repeat") in REPEATS else r.get("repeat", "weekly")
    r["date"] = day(body.get("date", r.get("date", "")))
    r["until"] = day(body.get("until", r.get("until", "")))
    r["days"] = sorted({int(d) for d in body.get("days", r.get("days", [])) if str(d).isdigit() and 1 <= int(d) <= 7})
    r["every_weeks"] = max(1, min(8, int(body.get("every_weeks", r.get("every_weeks", 1)) or 1)))
    r["month_day"] = max(1, min(31, int(body.get("month_day", r.get("month_day", 1)) or 1)))
    r["from"] = hm(body.get("from", r.get("from")), "18:00")
    r["to"] = hm(body.get("to", r.get("to")), "23:00")
    r["scenes"] = max(1, min(20, int(body.get("scenes", r.get("scenes", 3)) or 3)))
    col = str(body.get("color", r.get("color", "#c8202a")))
    r["color"] = col if len(col) == 7 and col.startswith("#") else "#c8202a"
    r["position"] = body.get("position") if body.get("position") in POSITIONS else r.get("position", "midden")
    return r


async def api_add_reminder(request):
    body = await request.json()
    async with lock:
        db = load_db()
        r = _clean_reminder(body)
        db.setdefault("reminders", []).append(r)
        save_db(db)
    return web.json_response(r)


async def api_edit_reminder(request):
    rid = request.match_info["id"]
    body = await request.json()
    async with lock:
        db = load_db()
        for i, r in enumerate(db.get("reminders", [])):
            if r["id"] == rid:
                db["reminders"][i] = _clean_reminder(body, r)
                save_db(db)
                return web.json_response(db["reminders"][i])
    raise web.HTTPNotFound()


async def api_delete_reminder(request):
    rid = request.match_info["id"]
    async with lock:
        db = load_db()
        before = len(db.get("reminders", []))
        db["reminders"] = [r for r in db.get("reminders", []) if r["id"] != rid]
        if len(db["reminders"]) == before:
            raise web.HTTPNotFound()
        save_db(db)
    return web.json_response({"ok": True})


# ----------------------------------------------------------------- if this, then that
CONDS = ("aan", "uit", "verandert", "is", "boven", "onder")
ACTIONS = ("event", "bericht", "camera", "kleren", "rust", "vertrek", "ha", "telegram")
ON_STATES = ("on", "open", "home", "detected", "playing", "unlocked", "ringing", "active", "true")
OFF_STATES = ("off", "closed", "not_home", "clear", "idle", "paused", "locked", "false", "standby")


def _clean_rule(r):
    if not isinstance(r, dict):
        return None
    out = {"id": str(r.get("id") or uuid.uuid4().hex[:8])[:12], "name": str(r.get("name", "")).strip()[:60],
           "on": bool(r.get("on", True)), "entity": str(r.get("entity", "")).strip()[:120],
           "cond": r.get("cond") if r.get("cond") in CONDS else "aan", "value": str(r.get("value", "")).strip()[:60],
           "from": str(r.get("from", ""))[:5], "to": str(r.get("to", ""))[:5],
           "when": r.get("when") if r.get("when") in ("altijd", "dag", "nacht") else "altijd",
           "cooldown": max(0, min(1440, int(r.get("cooldown", 5) or 0))), "actions": []}
    for a in (r.get("actions") or [])[:6]:
        if not isinstance(a, dict) or a.get("type") not in ACTIONS:
            continue
        out["actions"].append({"type": a["type"], "id": str(a.get("id", ""))[:40], "text": str(a.get("text", ""))[:200],
                               "entity": str(a.get("entity", "")).strip()[:120], "minutes": max(1, min(240, int(a.get("minutes", 10) or 10))),
                               "ids": [x for x in (a.get("ids") or []) if x in OUTFIT_SLOTS][:5], "photo": bool(a.get("photo", False)),
                               "keep": bool(a.get("keep", False)), "on": bool(a.get("on", True)), **clean_call(a)})
    return out if out["entity"] else None


WATCH = {"last": {}, "fired": {}, "motion": 0.0}


def _now_hm():
    t = time.localtime()
    return t.tm_hour * 60 + t.tm_min


def _hm_min(v, default):
    try:
        h, m = str(v).split(":"); return int(h) * 60 + int(m)
    except ValueError:
        return default


def _in_window(a, b):
    if not a or not b:
        return True
    m, x, y = _now_hm(), _hm_min(a, 0), _hm_min(b, 1440)
    return x <= m < y if x <= y else (m >= x or m < y)


def _matches(cond, value, old, new):
    lo, ln = str(old).lower(), str(new).lower()
    if ln in ("unavailable", "unknown") or old is None:
        return False
    if cond == "aan":
        return ln in ON_STATES and lo not in ON_STATES
    if cond == "uit":
        return ln in OFF_STATES and lo not in OFF_STATES
    if cond == "verandert":
        return ln != lo
    if cond == "is":
        return ln == value.lower() and lo != value.lower()
    try:
        fv, fo, fn = float(value.replace(",", ".")), float(lo), float(ln)
    except ValueError:
        return False
    return (fn > fv and not fo > fv) if cond == "boven" else (fn < fv and not fo < fv)


def push_action(db, act):
    """Something for the tablet to do; it picks these up via api/live."""
    acts = db.setdefault("actions", [])
    n = (acts[-1]["n"] if acts else 0) + 1
    acts.append(dict(act, n=n, at=time.time()))
    db["actions"] = acts[-20:]


async def camera_still(entity):
    """A still from a camera in Home Assistant (as JPEG bytes), or None."""
    if not TOKEN or not entity:
        return None
    async with ClientSession(timeout=ClientTimeout(total=12)) as s:
        async with s.get(f"{HA_URL}/camera_proxy/{entity}", headers={"Authorization": "Bearer " + TOKEN}) as r:
            return await r.read() if r.status == 200 else None


async def tg_broadcast(text, photo=None):
    conf = tg_conf()
    if not conf.get("token"):
        return
    for c in conf.get("chats", []):
        try:
            if photo:
                await tg_call(conf["token"], "sendPhoto", {"chat_id": c["id"], "caption": text}, files={"photo": ("deur.jpg", photo, "image/jpeg")})
            else:
                await tg_call(conf["token"], "sendMessage", {"chat_id": c["id"], "text": text})
        except Exception as e:
            log("fout", "Telegram: " + str(e))


async def run_actions(rule_name, actions):
    for a in actions:
        try:
            t = a["type"]
            if t in ("event", "kleren", "rust", "vertrek", "beweging"):
                async with lock:
                    db = load_db(); push_action(db, {k: a[k] for k in ("type", "id", "ids", "minutes", "on")}); save_db(db, bump=False)
            elif t == "bericht" and a.get("text"):
                now = time.time()
                async with lock:
                    db = load_db()
                    db["message"] = {"id": uuid.uuid4().hex[:8], "text": a["text"][:200], "since": now, "until": now + 60 * a["minutes"], "sign": ""}
                    save_db(db, bump=False)
            elif t == "camera":
                data = await camera_still(a.get("entity"))
                if not data:
                    log("fout", f"Regel '{rule_name}': geen camerabeeld van {a.get('entity')}"); continue
                p = await run_blocking(_photo, data)
                p["label"] = (rule_name or "Camera")[:40] + " " + time.strftime("%d/%m %H:%M")
                async with lock:
                    db = load_db()
                    if a.get("keep"):
                        db["photos"].append(p)
                    else:
                        db.setdefault("camera_stills", []).append(p)
                        old = db["camera_stills"][:-10]   # only the last ten stay
                        db["camera_stills"] = db["camera_stills"][-10:]
                        remove_files([o["file"] for o in old] + [o.get("original") for o in old if o.get("original")])
                    push_action(db, {"type": "frame", "file": p["file"], "minutes": a["minutes"], "door": bool(a.get("on", True)), "pets": a.get("id") == "pets"})
                    save_db(db, bump=False)
            elif t == "ha" and (a.get("entity") or a.get("service")):
                await do_call(a.get("entity", ""), a.get("service", ""), a.get("data"))
            elif t == "telegram":
                photo = await camera_still(a.get("entity")) if a.get("photo") and a.get("entity") else None
                await tg_broadcast(a.get("text") or rule_name or "Kamiel", photo)
        except Exception as e:
            log("fout", f"Regel '{rule_name}': {e}")


def doorbell_rule(s):
    d = s.get("doorbell") or {}
    if not d.get("on") or not d.get("trigger"):
        return None
    mode = d.get("mode", "auto")
    if mode == "auto":   # an event entity (event.*) changes its state on every ring; a binary sensor turns on
        mode = "verandert" if d["trigger"].startswith(("event.", "button.", "input_button.")) else "aan"
    acts = []
    if d.get("camera"):
        acts.append({"type": "camera", "entity": d["camera"], "minutes": d.get("minutes", 10), "keep": d.get("keep", False), "on": True,
                     "id": "pets" if d.get("pets") else ""})
    else:   # no camera: Kamiel (and maybe the dogs) still go and look
        acts.append({"type": "event", "id": "deurbel", "minutes": 1, "ids": [], "on": bool(d.get("pets"))})
    if d.get("telegram"):
        acts.append({"type": "telegram", "text": "🔔 Er werd aangebeld", "entity": d.get("camera", ""), "photo": bool(d.get("camera"))})
    return {"id": "deurbel", "name": "Deurbel", "on": True, "entity": d["trigger"], "cond": mode, "value": "", "from": "", "to": "",
            "when": "altijd", "cooldown": 0.5, "actions": acts}


def is_night(s):
    return not _in_window(s.get("night_end", "06:00"), s.get("night_start", "22:00"))


async def watch_loop():
    """Every two seconds: look at the entities the rules (and the doorbell) depend on, and act on changes."""
    while True:
        await asyncio.sleep(2)
        try:
            s = load_db()["settings"]
            rules = [r for r in s.get("rules", []) if r.get("on")]
            db_rule = doorbell_rule(s)
            if db_rule:
                rules.append(db_rule)
            m = s.get("motion") or {}
            if m.get("on") and m.get("entity"):   # a motion sensor in Home Assistant instead of (or next to) the tablet's camera
                rules.append({"id": "beweging", "name": "Beweging", "on": True, "entity": m["entity"], "cond": "aan", "value": "", "from": "", "to": "",
                              "when": "altijd", "cooldown": .3, "actions": [{"type": "beweging", "id": "", "ids": [], "minutes": 1, "on": True}]})
            if not rules:
                continue
            states = {}
            for ent in {r["entity"] for r in rules}:
                if ent == "kamiel.beweging":   # movement in front of the tablet (its camera)
                    states[ent] = "on" if time.time() - WATCH["motion"] < 60 else "off"
                    continue
                st = await ha_get("/states/" + ent)
                if st:
                    states[ent] = st.get("state")
            for r in rules:
                ent = r["entity"]
                if ent not in states:
                    continue
                old = WATCH["last"].get(ent)
                new = states[ent]
                if old is None or not _matches(r["cond"], r.get("value", ""), old, new):
                    continue
                if not _in_window(r.get("from"), r.get("to")):
                    continue
                if r.get("when") == "dag" and is_night(s) or r.get("when") == "nacht" and not is_night(s):
                    continue
                key = r["id"]
                if time.time() - WATCH["fired"].get(key, 0) < 60 * float(r.get("cooldown", 0)):
                    continue
                WATCH["fired"][key] = time.time()
                log("deurbel" if r["id"] == "deurbel" else "huis", ("🔔 Er werd aangebeld" if r["id"] == "deurbel" else f"Regel '{r.get('name') or ent}'") + f" ({old} → {new})")
                asyncio.ensure_future(run_actions(r.get("name") or ent, r["actions"]))
            WATCH["last"].update(states)
        except Exception as e:
            log("fout", "Regels: " + str(e))
            await asyncio.sleep(10)


async def api_motion(request):
    """The tablet saw someone (Fully Kiosk motion detection)."""
    first = time.time() - WATCH["motion"] > 60
    WATCH["motion"] = time.time()
    if first:
        asyncio.ensure_future(tablet_to_ha())
    return web.json_response({"ok": True})


# ----------------------------------------------------------------- the tablet itself: how it is doing (Studio → Huis → De tablet)
TABLET = {"seen": 0, "info": {}, "last_away": None, "pushed": 0}


async def nobody_home(s):
    """True when nobody is home: zone.home counts the people at home (or a person/group entity that is not 'home')."""
    ent = (s.get("motion") or {}).get("away_entity") or "zone.home"
    st = await ha_get("/states/" + ent)
    if not st:
        return None
    v = str(st.get("state", ""))
    away = v == "0" if ent.startswith("zone.") else v not in ("home", "on", "unknown", "unavailable")
    if TABLET["last_away"] is not None and away != TABLET["last_away"]:
        log("huis", "Niemand meer thuis: het scherm gaat uit." if away else "Er is iemand thuis: het scherm gaat weer aan.")
    TABLET["last_away"] = away
    return away


async def ha_set_state(entity, state, attrs):
    """Make (or update) an entity in Home Assistant, so automations there can use what the tablet knows."""
    if not TOKEN:
        return False
    async with ClientSession(timeout=ClientTimeout(total=8)) as sess:
        async with sess.post(f"{HA_URL}/states/{entity}", json={"state": state, "attributes": attrs},
                             headers={"Authorization": "Bearer " + TOKEN}) as r:
            return r.status < 300


async def tablet_to_ha():
    s = load_db()["settings"].get("motion") or {}
    if not s.get("to_ha", True):
        return
    i = TABLET["info"]
    try:
        if i.get("battery") is not None:
            await ha_set_state("sensor.kamiel_tablet_batterij", int(i["battery"]), {"unit_of_measurement": "%", "device_class": "battery",
                               "state_class": "measurement", "friendly_name": "Kamiel tablet batterij", "icon": "mdi:tablet"})
        if i.get("plugged") is not None:
            await ha_set_state("binary_sensor.kamiel_tablet_lader", "on" if i["plugged"] else "off", {"device_class": "plug", "friendly_name": "Kamiel tablet aan de lader"})
        if i.get("screen") is not None:
            await ha_set_state("binary_sensor.kamiel_tablet_scherm", "on" if i["screen"] else "off", {"friendly_name": "Kamiel tablet scherm aan", "icon": "mdi:monitor"})
        if await ha_set_state("binary_sensor.kamiel_tablet_beweging", "on" if time.time() - WATCH["motion"] < 60 else "off",
                              {"device_class": "motion", "friendly_name": "Kamiel tablet beweging"}):
            TABLET["pushed"] = time.time()
    except Exception as e:
        log("fout", "Tabletgegevens naar Home Assistant sturen mislukt: " + str(e), quiet=True)


async def api_tablet_status_post(request):
    """Every minute the tablet tells how it is doing (Fully Kiosk: battery, screen, motion detection…)."""
    try:
        b = await request.json()
    except ValueError:
        raise web.HTTPBadRequest()
    keep = {}
    for k in ("fully", "js", "motion_detect", "screen", "plugged"):
        if k in b and b[k] is not None:
            keep[k] = bool(b[k])
    for k in ("battery", "w", "h", "last_motion"):
        try:
            if b.get(k) is not None:
                keep[k] = float(b[k])
        except (TypeError, ValueError):
            pass
    for k in ("version", "ip", "plan"):
        if b.get(k):
            keep[k] = str(b[k])[:60]
    TABLET["seen"] = time.time(); TABLET["info"] = keep
    asyncio.ensure_future(tablet_to_ha())
    return web.json_response({"ok": True})


async def api_tablet_status_get(request):
    s = load_db()["settings"]
    m = s.get("motion") or {}
    away = await nobody_home(s) if m.get("away_off") else None
    zone = await ha_get("/states/" + (m.get("away_entity") or "zone.home"))
    return web.json_response({"seen": TABLET["seen"], "ago": time.time() - TABLET["seen"] if TABLET["seen"] else None, "info": TABLET["info"],
                              "night": is_night(s), "night_start": s.get("night_start"), "night_end": s.get("night_end"),
                              "away": away, "home_count": (zone or {}).get("state"), "motion_ago": time.time() - WATCH["motion"] if WATCH["motion"] else None,
                              "pushed": TABLET["pushed"], "connected": bool(TOKEN)})


async def api_screen_test(request):
    async with lock:
        db = load_db(); push_action(db, {"type": "scherm", "secs": 10}); save_db(db, bump=False)
    return web.json_response({"ok": True})


async def api_rule_test(request):
    """Studio: try the actions of a rule right now."""
    body = await request.json()
    r = _clean_rule(dict(body, entity=body.get("entity") or "test.test"))
    if not r:
        return web.json_response({"ok": False}, status=400)
    if body.get("doorbell"):
        r = doorbell_rule(dict(load_db()["settings"], doorbell=dict(load_db()["settings"]["doorbell"], on=True, trigger="test.bel")))
        if not r:
            return web.json_response({"ok": False}, status=400)
    asyncio.ensure_future(run_actions(r.get("name") or "Test", r["actions"]))
    return web.json_response({"ok": True})


# ----------------------------------------------------------------- apps
def common_routes(app):
    app.router.add_get("/display", page("display.html"))
    app.router.add_get("/api/world", api_world)
    app.router.add_get("/api/state", api_state)
    app.router.add_get("/media/{name}", media)
    app.router.add_static("/static/", os.path.join(APP, "static"))
    app.router.add_get("/api/live", api_live)
    app.router.add_get("/api/cover", api_cover)
    app.router.add_get("/api/departures", api_departures)
    app.router.add_post("/api/tap/{target}", api_tap)
    app.router.add_post("/api/seen/{id}", api_seen)
    app.router.add_get("/api/desk", api_desk)
    app.router.add_post("/api/button/{i}", api_button)
    app.router.add_post("/api/media/{cmd}", api_media)
    app.router.add_post("/api/outfit", api_outfit)
    app.router.add_post("/api/reminder-dismiss/{id}", api_dismiss_reminder)
    app.router.add_post("/api/photo-seen/{id}", api_photo_seen)
    app.router.add_post("/api/snapshot/{id}", api_snapshot)
    app.router.add_post("/api/log", api_log_post)
    app.router.add_post("/api/motion", api_motion)
    app.router.add_post("/api/tablet-status", api_tablet_status_post)


def make_studio():
    app = web.Application(client_max_size=60 * 1024 * 1024, middlewares=[fresh_scripts])
    app["studio"] = True
    app.router.add_get("/", page("studio.html"))
    common_routes(app)
    app.router.add_get("/api/entities", api_entities)
    app.router.add_post("/api/assets", api_upload_assets)
    app.router.add_patch("/api/assets/{id}", api_edit_asset)
    app.router.add_delete("/api/assets/{id}", api_delete_asset)
    app.router.add_post("/api/photos", api_upload_photos)
    app.router.add_delete("/api/photos/{id}", api_delete_photo)
    app.router.add_post("/api/panorama", api_upload_panorama)
    app.router.add_put("/api/settings", api_settings)
    app.router.add_post("/api/message", api_send_message)
    app.router.add_get("/api/telegram", api_tg_get)
    app.router.add_put("/api/telegram", api_tg_put)
    app.router.add_post("/api/telegram/pair", api_tg_pair)
    app.router.add_delete("/api/telegram/chats/{id}", api_tg_unlink)
    app.router.add_delete("/api/message", api_clear_message)
    app.router.add_post("/api/reminders", api_add_reminder)
    app.router.add_put("/api/reminders/{id}", api_edit_reminder)
    app.router.add_delete("/api/reminders/{id}", api_delete_reminder)
    app.router.add_get("/api/songs", api_songs)
    app.router.add_post("/api/songs", api_add_song)
    app.router.add_put("/api/songs/{id}", api_edit_song)
    app.router.add_delete("/api/songs/{id}", api_delete_song)
    app.router.add_post("/api/event", api_event)
    app.router.add_post("/api/rule-test", api_rule_test)
    app.router.add_get("/api/services", api_services)
    app.router.add_get("/api/logboek", api_log_get)
    app.router.add_get("/api/tablet-status", api_tablet_status_get)
    app.router.add_post("/api/screen-test", api_screen_test)
    app.router.add_get("/api/selfie-preview", api_selfie_preview)
    app.router.add_post("/api/halls", api_hall_upload)
    app.router.add_delete("/api/halls/{id}", api_hall_delete)
    app.router.add_post("/api/hall-visit", api_hall_visit)
    app.router.add_get("/api/backup", api_backup)
    app.router.add_post("/api/restore/chunk", api_restore_chunk)
    app.router.add_post("/api/restore/finish", api_restore_finish)
    app.router.add_post("/api/selfie-send", api_selfie_send)
    app.router.add_post("/api/love-test", api_love_test)
    app.router.add_delete("/api/logboek", api_log_clear)
    app.router.add_post("/api/call-test", api_call_test)
    return app


def make_display():
    app = web.Application(client_max_size=5 * 1024 * 1024, middlewares=[fresh_scripts])   # room for a /kijk snapshot
    app.router.add_get("/", page("display.html"))
    common_routes(app)
    return app


async def measure_old_assets():
    found = await run_blocking(_measure_old_assets)
    if found:
        async with lock:
            db = load_db()
            for a in db["assets"]:
                if a["id"] in found:
                    a.update(found[a["id"]])
            save_db(db)
        print(f"{len(found)} elementen gemeten voor de compositie.", flush=True)


async def main():
    first_run()
    runners = []
    for app, port in ((make_studio(), int(os.environ.get("STUDIO_PORT", 8099))),
                      (make_display(), int(os.environ.get("DISPLAY_PORT", 8100)))):
        r = web.AppRunner(app)
        await r.setup()
        await web.TCPSite(r, "0.0.0.0", port).start()
        runners.append(r)
    print("Kamiel Studio draait: studio op 8099 (via Home Assistant), tablet op 8100", flush=True)
    log("systeem", f"Kamiel Studio gestart (versie {ADDON_VERSION}).", quiet=True)
    if not TOKEN:
        log("fout", "Geen toegang tot Home Assistant (geen token gevonden). Weer en sensoren werken niet.")
    else:
        try:
            ok = await ha_get("/states/sun.sun")
            conf = await ha_get("/config")   # where the house is, for the sun (only used if sun.sun is missing)
            if conf and conf.get("latitude") is not None:
                LOCATION.update({"lat": float(conf["latitude"]), "lon": float(conf["longitude"])})
            if ok:
                print("Verbonden met Home Assistant.", flush=True)
            else:
                log("fout", "Token gevonden, maar Home Assistant antwoordt niet.")
        except Exception as e:
            log("fout", "Verbinding met Home Assistant mislukt: " + str(e))
    asyncio.ensure_future(tg_loop())
    asyncio.ensure_future(measure_old_assets())
    asyncio.ensure_future(watch_loop())
    asyncio.ensure_future(log_writer())
    asyncio.ensure_future(selfie_loop())
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
