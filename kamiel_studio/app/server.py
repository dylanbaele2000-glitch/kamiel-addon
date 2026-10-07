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
    "hills": {"chance": 40, "height": 18},           # % of places with hills; how high, in % of the screen
    "stack": {"chance": 35, "max": 3},              # % chance that a carrier gets something on top; tallest stack
    "events": {"on": True, "lama_per_day": 1, "common_per_day": 3, "normal_per_week": 4, "evening": True, "off": [],
               "pets_per_day": {"wifi": 2, "snoet": 2, "pippa": 2, "pebbels": 2, "dobby": 2}, "pets_together": 25},
    # height on screen, in % of the screen height: [smallest, largest]
    "sizes": {"grond": [10, 40], "horizon": [15, 42], "lucht": [12, 38], "kader": [18, 42]},
    "giant_chance": 10,
    "season_colors": True,
    "message_entity": "",
    "message_minutes": 60,
    "sun_script": "",
    "moon_script": "",
    "empty_tap": "vensters",
    "media_player": "",
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
    for k in ("hills", "stack"):
        merged = copy.deepcopy(DEFAULT_SETTINGS[k]); merged.update(stored.get(k) or {}); s[k] = merged
    cp = copy.deepcopy(DEFAULT_SETTINGS["compose"]); sc = stored.get("compose") or {}
    cp["styles"].update(sc.get("styles") or {}); cp["color"] = sc.get("color", cp["color"]); s["compose"] = cp
    for k in ("windows", "window_titles"):
        merged = copy.deepcopy(DEFAULT_SETTINGS[k]); merged.update(stored.get(k) or {}); s[k] = merged
    if "songs" not in db:
        db["songs"] = [{"id": uuid.uuid4().hex[:8], "title": t, "bpm": b} for t, b in SONGS]
    if "chances" not in stored:
        # older versions had "1 frame in N places"; carry that over
        r = int(stored.get("frame_ratio", 2))
        for part in ("dag", "nacht"):
            s["chances"][part]["kader"] = round(100 / r) if r > 0 else 0
    db["settings"] = s
    return db


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
                wa = w.get("attributes", {})
                out["wind"] = wa.get("wind_speed")
                out["clouds"] = wa.get("cloud_coverage")
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
    ents = [{"id": s["entity_id"], "name": s.get("attributes", {}).get("friendly_name", s["entity_id"])}
            for s in states if s["entity_id"].startswith(doms)]
    ents.sort(key=lambda e: e["name"].lower())
    return web.json_response({"connected": bool(TOKEN), "entities": ents})


# ----------------------------------------------------------------- world (read only)
async def api_world(request):
    db = load_db()
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
            print("Meten mislukt voor " + a.get("label", a["id"]) + ": " + str(e), flush=True)
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
            s["buttons"] = [{"label": str(b.get("label", "")).strip()[:16], "icon": str(b.get("icon", "")).strip()[:4],
                             "entity": str(b.get("entity", "")).strip()[:120]} for b in body["buttons"][:9] if isinstance(b, dict)]
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
           "snapshot": SNAP.get("id"), "event": db.get("event_req")}
    try:
        out["message"] = await current_message(db)
        if s.get("media_player"):
            st = await ha_get("/states/" + s["media_player"])
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
    ent = db["settings"].get("media_player")
    st = await ha_get("/states/" + ent) if ent else None
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
           "/event  er gebeurt iets in Kamielland\n/event lijst  alle events")


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
            print("Telegram: versturen mislukt: " + str(e), flush=True)


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
            else:
                reply = "Ik ken je nog niet. Vraag thuis om je te koppelen in Kamiel Studio."
            await tg_call(token, "sendMessage", {"chat_id": chat, "text": reply})
            return
        minutes = conf.get("minutes", 60)
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
        SNAP.clear(); SNAP.update({"id": uuid.uuid4().hex[:8], "chat": chat, "event": asyncio.Event(), "data": None})
        await tg_say(chat, "📼 Even kijken…")
        try:
            await asyncio.wait_for(SNAP["event"].wait(), 25)
            await tg_call(token, "sendPhoto", {"chat_id": chat}, files={"photo": ("kamiel.jpg", SNAP["data"], "image/jpeg")})
        except asyncio.TimeoutError:
            await tg_say(chat, "De tablet antwoordt niet. Staat hij aan?")
        finally:
            SNAP.clear()
        return
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
            groups = {"lama": "Elke dag", "dier": "Huisdieren", "vaak": "Vaak", "soms": "Soms"}
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
                    print("Telegram: bericht kon niet verwerkt worden: " + str(e), flush=True)
        except Exception as e:
            print("Telegram: " + str(e), flush=True)
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
            out["buttons"].append({"i": i, "label": b.get("label") or ((st or {}).get("attributes", {}).get("friendly_name", "")),
                                   "icon": b.get("icon", ""), "on": (st or {}).get("state") in ("on", "open", "playing", "home", "unlocked"),
                                   "ok": bool(st)})
        if s.get("media_player"):
            st = await ha_get("/states/" + s["media_player"])
            if st:
                a = st.get("attributes", {})
                pic = a.get("entity_picture") or ""
                out["media"] = {"state": st.get("state"), "title": a.get("media_title", ""), "artist": a.get("media_artist", ""),
                                "volume": a.get("volume_level"), "art": str(abs(hash(pic))) if pic else "",
                                "name": a.get("friendly_name", "")}
    except Exception as e:
        out["error"] = str(e)
    return web.json_response(out)


TOGGLE = ("light", "switch", "input_boolean", "fan", "cover", "climate", "humidifier", "siren", "lock")


async def api_button(request):
    """One of the 9 buttons. Only does what was set up in the Studio for that button."""
    i = int(request.match_info["i"])
    btns = load_db()["settings"].get("buttons", [])
    if i >= len(btns) or not btns[i].get("entity"):
        return web.json_response({"ok": False})
    ent = btns[i]["entity"]
    dom = ent.split(".")[0]
    if dom in TOGGLE:
        ok = await ha_service("homeassistant", "toggle", {"entity_id": ent})
    elif dom in ("script", "scene"):
        ok = await ha_service(dom, "turn_on", {"entity_id": ent})
    elif dom == "automation":
        ok = await ha_service("automation", "trigger", {"entity_id": ent})
    elif dom in ("button", "input_button"):
        ok = await ha_service(dom, "press", {"entity_id": ent})
    elif dom == "media_player":
        ok = await ha_service("media_player", "media_play_pause", {"entity_id": ent})
    else:
        ok = False
    return web.json_response({"ok": ok})


MEDIA_CMDS = {"playpause": "media_play_pause", "next": "media_next_track", "prev": "media_previous_track",
              "volup": "volume_up", "voldown": "volume_down"}


async def api_media(request):
    cmd = MEDIA_CMDS.get(request.match_info["cmd"])
    ent = load_db()["settings"].get("media_player")
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


def make_studio():
    app = web.Application(client_max_size=60 * 1024 * 1024, middlewares=[fresh_scripts])
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
    if not TOKEN:
        print("Let op: geen toegang tot Home Assistant (geen token gevonden). Weer en sensoren werken niet.", flush=True)
    else:
        try:
            ok = await ha_get("/states/sun.sun")
            conf = await ha_get("/config")   # where the house is, for the sun (only used if sun.sun is missing)
            if conf and conf.get("latitude") is not None:
                LOCATION.update({"lat": float(conf["latitude"]), "lon": float(conf["longitude"])})
            print("Verbonden met Home Assistant." if ok else "Token gevonden, maar Home Assistant antwoordt niet.", flush=True)
        except Exception as e:
            print("Verbinding met Home Assistant mislukt: " + str(e), flush=True)
    asyncio.ensure_future(tg_loop())
    asyncio.ensure_future(measure_old_assets())
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
