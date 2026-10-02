"""Kamiel Studio: a Home Assistant add-on.

Port 8099 (ingress, inside Home Assistant): the Studio, where everything is managed.
Port 8100 (your network): the tablet view. It can only read, never change anything.
"""
import asyncio
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
HA_URL = "http://supervisor/core/api"

KINDS = ["grond", "horizon", "lucht", "wolk", "kader"]
RARITY = ["gewoon", "zeldzaam", "heelzeldzaam"]

DEFAULT_SETTINGS = {
    "weather_entity": "",
    "walk_minutes": 20,
    "night_start": "22:00",
    "night_end": "06:00",
    "night_walks": ["00:00", "03:00"],
    "min_frames": 1,
    "frame_ratio": 2,
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
            save_db({"assets": [], "photos": [], "panorama": None, "settings": dict(DEFAULT_SETTINGS), "version": 1})


def load_db():
    with open(DB_FILE) as f:
        db = json.load(f)
    s = dict(DEFAULT_SETTINGS)
    s.update(db.get("settings", {}))
    db["settings"] = s
    return db


def save_db(db):
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
        out["osd"] = lines
    except Exception as e:  # never break the tablet over a missing value
        out["error"] = str(e)
    return web.json_response(out)


async def api_entities(request):
    states = await ha_get("/states") or []
    dom = request.query.get("domain", "weather")
    ents = [{"id": s["entity_id"], "name": s.get("attributes", {}).get("friendly_name", s["entity_id"])}
            for s in states if s["entity_id"].startswith(dom + ".")]
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


async def api_edit_asset(request):
    aid = request.match_info["id"]
    body = await request.json()
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
                if body.get("kind") in KINDS and body["kind"] != "wolk" and a["kind"] != "wolk" and body["kind"] != "kader" and a["kind"] != "kader":
                    a["kind"] = body["kind"]
                if "label" in body:
                    a["label"] = str(body["label"])[:60]
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
    added = []
    async for part in reader:
        if part.filename:
            try:
                p = await run_blocking(_photo, await part.read())
                p["label"] = os.path.splitext(os.path.basename(part.filename))[0][:60]
                added.append(p)
            except Exception:
                pass
    async with lock:
        db = load_db()
        db["photos"].extend(added)
        save_db(db)
    return web.json_response({"added": added})


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


# ----------------------------------------------------------------- apps
def common_routes(app):
    app.router.add_get("/display", page("display.html"))
    app.router.add_get("/api/world", api_world)
    app.router.add_get("/api/state", api_state)
    app.router.add_get("/media/{name}", media)
    app.router.add_static("/static/", os.path.join(APP, "static"))


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
    return app


def make_display():
    app = web.Application()
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
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
