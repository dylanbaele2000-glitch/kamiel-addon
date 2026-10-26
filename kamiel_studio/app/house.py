"""Plattegrond (floor plan): the part of Kamiel Studio that shows the house and controls it.

Everything here is pure (no reading, writing or talking to Home Assistant), so it can be tested on its own.
server.py does the input and output. Nothing personal lives in this file: the floors, drawings, rooms and
devices of a house are stored in /data (kamiel.json and the folder house/), never in the repository."""
import re
import uuid

ENTITY_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
DEVICE_DOMAINS = ("light", "switch", "input_boolean", "media_player", "sensor", "binary_sensor")   # what can stand on the plan
ACTION_DOMAINS = ("scene", "script", "automation", "button", "input_button")                         # what a room can start
HEEL_DOMAINS = ("light", "switch", "input_boolean", "media_player")                                  # what "Heel huis" can switch
MAX_FLOORS, MAX_ROOMS, MAX_DEVICES, MAX_SCENES = 6, 40, 150, 120
BLANK = (1600, 900)   # size of a floor without a drawing


def new_id():
    return uuid.uuid4().hex[:8]


def empty():
    return {"floors": [], "devices": [], "scenes": []}


def _text(v, n, default=""):
    s = " ".join(str(v if v is not None else default).split())
    return s[:n]


def _num01(v):
    """A place on the plan is a fraction (0 to 1) of the drawing, so a new drawing of another size keeps everything in place."""
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:
        return None
    return round(min(1.0, max(0.0, f)), 4)


def _id(v, taken):
    s = re.sub(r"[^a-z0-9]", "", str(v or "").lower())[:12]
    if not s or s in taken:
        s = new_id()
    taken.add(s)
    return s


def _entity(v, domains):
    e = str(v or "").strip().lower()
    if ENTITY_RE.match(e) and e.split(".")[0] in domains:
        return e
    return ""


def clean(body, old=None):
    """Check what the Studio sends and keep only what is valid. Drawings are never taken from the body:
    a drawing only changes through the upload (so the file, its size and its name always belong together)."""
    old = old or empty()
    body = body if isinstance(body, dict) else {}
    oldf = {f["id"]: f for f in old.get("floors", [])}
    floors, ftaken, rtaken = [], set(), set()
    for f in (body.get("floors") or [])[:MAX_FLOORS]:
        if not isinstance(f, dict):
            continue
        fid = _id(f.get("id"), ftaken)
        of = oldf.get(fid) or {}
        rooms = []
        for r in (f.get("rooms") or [])[:MAX_ROOMS]:
            if not isinstance(r, dict):
                continue
            pts = []
            for p in (r.get("poly") or [])[:60]:
                if isinstance(p, (list, tuple)) and len(p) == 2:
                    x, y = _num01(p[0]), _num01(p[1])
                    if x is not None and y is not None:
                        pts.append([x, y])
            if len(pts) < 3:
                continue
            rooms.append({"id": _id(r.get("id"), rtaken), "name": _text(r.get("name"), 30, "Ruimte") or "Ruimte", "poly": pts})
        floors.append({"id": fid, "name": _text(f.get("name"), 30, "Verdieping") or "Verdieping", "image": of.get("image", ""),
                       "w": of.get("w", BLANK[0]), "h": of.get("h", BLANK[1]), "rooms": rooms})
    fids = {f["id"] for f in floors}
    devices, dtaken, used = [], set(), set()
    for d in (body.get("devices") or [])[:MAX_DEVICES]:
        if not isinstance(d, dict):
            continue
        ent = _entity(d.get("entity"), DEVICE_DOMAINS)
        floor = re.sub(r"[^a-z0-9]", "", str(d.get("floor") or "").lower())[:12]
        x, y = _num01(d.get("x")), _num01(d.get("y"))
        if not ent or ent in used or floor not in fids or x is None or y is None:
            continue
        used.add(ent)
        dom = ent.split(".")[0]
        name = _text(d.get("name"), 40) or ent.split(".")[1].replace("_", " ").capitalize()
        devices.append({"id": _id(d.get("id"), dtaken), "floor": floor, "entity": ent, "name": name, "x": x, "y": y,
                        "heel": bool(d.get("heel")) and dom in HEEL_DOMAINS})
    scenes, staken = [], set()
    for s in (body.get("scenes") or [])[:MAX_SCENES]:
        if not isinstance(s, dict):
            continue
        ent = _entity(s.get("entity"), ACTION_DOMAINS)
        room = str(s.get("room") or "house")
        if not ent or (room != "house" and room not in rtaken):
            continue
        name = _text(s.get("name"), 40) or ent.split(".")[1].replace("_", " ").capitalize()
        scenes.append({"id": _id(s.get("id"), staken), "room": room, "entity": ent, "name": name})
    return {"floors": floors, "devices": devices, "scenes": scenes}


def view(st):
    """What the page needs to know about one Home Assistant state, and nothing more."""
    a = st.get("attributes") or {}
    ent = st.get("entity_id", "")
    dom = ent.split(".")[0]
    s = str(st.get("state", ""))
    v = {"state": s, "ok": s not in ("unavailable", "unknown"), "name": a.get("friendly_name") or ent}
    if dom == "light":
        modes = [m for m in (a.get("supported_color_modes") or []) if isinstance(m, str)]
        v["dim"] = any(m != "onoff" for m in modes)
        v["color"] = any(m in ("hs", "xy", "rgb", "rgbw", "rgbww") for m in modes)
        v["ct"] = "color_temp" in modes
        if isinstance(a.get("brightness"), (int, float)):
            v["bri"] = max(1, min(100, round(a["brightness"] / 255 * 100)))
        rgb = a.get("rgb_color")
        if isinstance(rgb, (list, tuple)) and len(rgb) == 3 and all(isinstance(x, (int, float)) for x in rgb):
            v["rgb"] = [int(x) for x in rgb]
        if v["ct"]:
            for key, out in (("color_temp_kelvin", "k"), ("min_color_temp_kelvin", "kmin"), ("max_color_temp_kelvin", "kmax")):
                if isinstance(a.get(key), (int, float)):
                    v[out] = int(a[key])
            v.setdefault("kmin", 2000)
            v.setdefault("kmax", 6500)
    elif dom == "media_player":
        v["feat"] = int(a["supported_features"]) if isinstance(a.get("supported_features"), (int, float)) else 0
        v["title"] = str(a.get("media_title") or "")[:80]
        v["artist"] = str(a.get("media_artist") or "")[:80]
        if isinstance(a.get("volume_level"), (int, float)):
            v["vol"] = round(a["volume_level"] * 100)
    elif dom in ("sensor", "binary_sensor"):
        v["unit"] = str(a.get("unit_of_measurement") or "")[:12]
        v["dc"] = str(a.get("device_class") or "")[:30]
    return v


def _int(v, lo, hi):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:
        return None
    return int(min(hi, max(lo, round(f))))


def command(entity, cmd, value=None):
    """Turn what the page asks into one Home Assistant action: (domain, service, data), or None if it is not allowed.
    The page can only do these things, and only to a device that stands on the plan."""
    dom = entity.split(".")[0]
    data = {"entity_id": entity}
    if dom == "light":
        if cmd in ("toggle", "turn_on", "turn_off"):
            return "light", cmd, data
        if cmd == "on":
            return "light", "turn_on", data
        if cmd == "off":
            return "light", "turn_off", data
        if cmd == "brightness":
            n = _int(value, 1, 100)
            return ("light", "turn_on", dict(data, brightness_pct=n)) if n is not None else None
        if cmd == "color":
            if isinstance(value, (list, tuple)) and len(value) == 3:
                rgb = [_int(x, 0, 255) for x in value]
                if None not in rgb:
                    return "light", "turn_on", dict(data, rgb_color=rgb)
            return None
        if cmd == "temp":
            n = _int(value, 1000, 10000)
            return ("light", "turn_on", dict(data, color_temp_kelvin=n)) if n is not None else None
        return None
    if dom in ("switch", "input_boolean"):
        svc = {"toggle": "toggle", "on": "turn_on", "off": "turn_off"}.get(cmd)
        return (dom, svc, data) if svc else None
    if dom == "media_player":
        if cmd == "volume":
            n = _int(value, 0, 100)
            return ("media_player", "volume_set", dict(data, volume_level=n / 100)) if n is not None else None
        svc = {"playpause": "media_play_pause", "play": "media_play", "pause": "media_pause", "next": "media_next_track",
               "prev": "media_previous_track", "on": "turn_on", "off": "turn_off"}.get(cmd)
        return ("media_player", svc, data) if svc else None
    return None
