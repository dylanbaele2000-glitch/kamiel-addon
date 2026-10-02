"""Kamiel Studio: a Home Assistant add-on.

Port 8099 (ingress, inside Home Assistant): the Studio, where everything is managed.
Port 8100 (your network): the tablet view. It can only read, never change anything.
"""
import asyncio
import copy
import json
import os
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
    "max_objects": 9,
    # height on screen, in % of the screen height: [smallest, largest]
    "sizes": {"grond": [10, 40], "horizon": [15, 42], "lucht": [12, 38], "kader": [18, 42]},
    "giant_chance": 10,
    "season_colors": True,
    "message_entity": "",
    "message_minutes": 60,
    "sun_script": "",
    "moon_script": "",
    "empty_tap": "url",
    "media_player": "",
    "departures": [],
    "departure_trigger": "",
    "people": [],
    "horizon_sink": 3,
    "tap_url": "",
    "osd_entities": [],
    "words": ["WELKOM IN KAMIELLAND", "JE BENT HIER AL EENS GEWEEST", "DROOMSTRAAT",
              "NIETS AAN DE HAND", "BLIJF NOG EVEN", "HET IS ALTIJD 4:12"],
}

lock = asyncio.Lock()


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
    "lightning": "regen", "lightning-rainy": "regen", "snowy": "bewolkt", "snowy-rainy": "regen",
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
                out["wind"] = w.get("attributes", {}).get("wind_speed")
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
        if db["settings"].get("people"):
            lines += await people_lines(db["settings"]["people"])
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
    })


async def media(request):
    name = os.path.basename(request.match_info["name"])
    p = os.path.join(MEDIA, name)
    if not os.path.exists(p):
        raise web.HTTPNotFound()
    return web.FileResponse(p, headers={"Cache-Control": "public, max-age=31536000, immutable"})


def page(name):
    async def handler(request):
        return web.FileResponse(os.path.join(APP, "static", name), headers={"Cache-Control": "no-cache"})
    return handler


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
        "files": files, "original": original, **meta,
    }


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
                if "scale" in body:
                    a["scale"] = max(0.3, min(3.0, float(body["scale"])))
                if "active" in body:
                    a["active"] = bool(body["active"])
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
        if body.get("empty_tap") in ("url", "vertrek", "niets"):
            s["empty_tap"] = body["empty_tap"]
        if "season_colors" in body:
            s["season_colors"] = bool(body["season_colors"])
        if isinstance(body.get("people"), list):
            s["people"] = [str(e) for e in body["people"] if str(e).strip()][:3]
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
            s["max_objects"] = max(1, min(20, int(body["max_objects"])))
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
    out = {"message": None, "media": None, "trigger": None,
           "spotlight": db.get("spotlight") if (db.get("spotlight") or {}).get("until", 0) > time.time() else None,
           "snapshot": SNAP.get("id")}
    try:
        out["message"] = await current_message(db)
        if s.get("media_player"):
            st = await ha_get("/states/" + s["media_player"])
            if st:
                a = st.get("attributes", {})
                pic = a.get("entity_picture") or ""
                out["media"] = {"playing": st.get("state") == "playing", "title": a.get("media_title", ""),
                                "artist": a.get("media_artist", ""), "art": str(abs(hash(pic))) if pic else ""}
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


async def api_departures(request):
    """Next departures, already as short camcorder-style lines."""
    return web.json_response({"blocks": await departure_blocks(load_db())})


async def departure_blocks(db):
    now = time.time()
    blocks = []
    for d in db["settings"].get("departures", []):
        st = await ha_get("/states/" + d["entity"])
        if not st:
            continue
        a = st.get("attributes", {})
        passages = a.get("next_passages") or ([a] if a.get("line_number_public") else [])
        want = {x.strip().upper() for x in d.get("lines", "").split(",") if x.strip()}
        lines = []
        for p in passages:
            num = str(p.get("line_number_public", "")).upper()
            if want and num not in want:
                continue
            due = _ts(p.get("due_at_realtime") or p.get("due_at_schedule") or "")
            if due is None:
                continue
            mins = int((due - now) // 60)
            if mins < 0:
                continue
            kind = TRANSPORT.get(str(p.get("line_transport_type", "")).upper(), "")
            dest = str(p.get("final_destination", "")).upper()[:22]
            lines.append({"line": (kind + " " + num).strip(), "dest": dest, "min": mins})
            if len(lines) >= 3:
                break
        if not lines and not passages:
            due = _ts(st.get("state"))
            if due:
                lines.append({"line": "", "dest": "", "min": max(0, int((due - now) // 60))})
            elif st.get("state") not in (None, "unknown", "unavailable"):
                lines.append({"line": str(st["state"]).upper()[:30], "dest": "", "min": None})
        name = d.get("label") or a.get("stopname") or a.get("friendly_name") or d["entity"]
        blocks.append({"label": str(name).upper()[:30], "lines": lines})
    return blocks


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
        save_db(db, bump=False)
    return web.json_response({"ok": True})


def _km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, asin, sqrt
    p1, p2 = radians(lat1), radians(lat2)
    h = sin((p2 - p1) / 2) ** 2 + cos(p1) * cos(p2) * sin(radians(lon2 - lon1) / 2) ** 2
    return 12742 * asin(sqrt(h))


async def people_lines(ents):
    home = await ha_get("/states/zone.home")
    ha = (home or {}).get("attributes", {})
    out = []
    for e in ents:
        st = await ha_get("/states/" + e)
        if not st:
            continue
        a = st.get("attributes", {})
        name = str(a.get("friendly_name", e.split(".")[-1])).split(" ")[0].upper()[:12]
        if st.get("state") == "home":
            out.append(f"{name} THUIS")
        elif a.get("latitude") is not None and ha.get("latitude") is not None:
            km = _km(ha["latitude"], ha["longitude"], a["latitude"], a["longitude"])
            dist = f"{km:.1f}".replace(".", ",") if km < 10 else str(round(km))
            out.append(f"{name} {dist} KM")
        elif st.get("state") not in (None, "unknown", "unavailable", "not_home"):
            out.append(f"{name} {str(st['state']).upper()[:14]}")
    return out


# ----------------------------------------------------------------- Telegram
# Kamiel fetches messages himself (long polling), so nothing has to be opened on the router.
TG_URL = os.environ.get("KAMIEL_TG_URL", "https://api.telegram.org")
SNAP = {}          # a pending /kijk: {"id", "chat", "event", "data"}
TG_HELP = ("Stuur me gewoon een tekst en hij verschijnt op het scherm thuis.\n"
           "Een foto komt in een kader in de scène.\n\n"
           "/bus  de volgende trams en bussen\n/kijk  een foto van het scherm nu\n/wis  het bericht weghalen")


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
            db = load_db(); db.pop("message", None); save_db(db, bump=False)
        return await tg_say(chat, "Het bericht is weg.")
    if cmd == "/bus":
        blocks = await departure_blocks(load_db())
        if not blocks:
            return await tg_say(chat, "Er zijn nog geen haltes ingesteld in Kamiel Studio.")
        out = []
        for b in blocks:
            out.append(b["label"].capitalize())
            for l in b["lines"] or [{"line": "niets in de komende tijd", "dest": "", "min": None}]:
                when = "" if l["min"] is None else (" nu" if l["min"] == 0 else f" over {l['min']} min")
                out.append(f"  {l['line']} {l['dest'].title()}{when}".rstrip())
        return await tg_say(chat, "\n".join(out))
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
            db["spotlight"] = {"id": p["id"], "file": p["file"], "until": now + minutes * 60}
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
    app.router.add_post("/api/snapshot/{id}", api_snapshot)


def make_studio():
    app = web.Application(client_max_size=60 * 1024 * 1024)
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
    return app


def make_display():
    app = web.Application(client_max_size=5 * 1024 * 1024)   # room for a /kijk snapshot
    app.router.add_get("/", page("display.html"))
    common_routes(app)
    return app


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
            print("Verbonden met Home Assistant." if ok else "Token gevonden, maar Home Assistant antwoordt niet.", flush=True)
        except Exception as e:
            print("Verbinding met Home Assistant mislukt: " + str(e), flush=True)
    asyncio.ensure_future(tg_loop())
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
