"""Builds the pixel-art pets for Kamiel (static/pets.js) and a preview sheet.
Each pet is drawn from simple shapes on a grid, outlined, given a little fur texture,
and gets its frames: stand, blink, walk1-4, down (crouched), jump."""
import json, math, sys, hashlib
from PIL import Image

OUT_JS = sys.argv[1] if len(sys.argv) > 1 else "pets.js"
PREVIEW = sys.argv[2] if len(sys.argv) > 2 else "pets.png"


def hexc(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, f):
    r, g, b = hexc(c); return "#%02x%02x%02x" % tuple(max(0, min(255, int(v * f))) for v in (r, g, b))


class Grid:
    def __init__(s, w, h):
        s.w, s.h, s.c = w, h, {}

    def put(s, x, y, col):
        if 0 <= x < s.w and 0 <= y < s.h:
            s.c[(x, y)] = col

    def ell(s, cx, cy, rx, ry, col, only=None):
        for y in range(s.h):
            for x in range(s.w):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                    if only is None or s.c.get((x, y)) in only:
                        s.put(x, y, col)

    def rect(s, x0, y0, x1, y1, col, only=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if only is None or s.c.get((x, y)) in only:
                    s.put(x, y, col)

    def poly(s, pts, col, only=None):
        n = len(pts)
        for y in range(s.h):
            for x in range(s.w):
                px, py, inside = x + .5, y + .5, False
                for i in range(n):
                    (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
                    if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
                        inside = not inside
                if inside and (only is None or s.c.get((x, y)) in only):
                    s.put(x, y, col)

    def thick(s, pts, r, col):   # a thick line through points (tails)
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            steps = int(max(abs(x2 - x1), abs(y2 - y1)) * 3) + 1
            for k in range(steps + 1):
                t = k / steps; s.ell(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r, r, col)

    def copy(s):
        g = Grid(s.w, s.h); g.c = dict(s.c); return g


def outline(g, keep=()):
    """Selective outline: edge pixels get a darker version of their own colour."""
    out = g.copy()
    for (x, y), col in g.c.items():
        if col in keep:
            continue
        if any((x + dx, y + dy) not in g.c for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            out.c[(x, y)] = shade(col, .55)
    return out


def texture(g, seed, amount=.07, skip=()):
    """A little fur noise, like Kamiel's own pixels."""
    out = g.copy()
    for (x, y), col in g.c.items():
        if col in skip:
            continue
        hsh = int(hashlib.md5(f"{seed}{x},{y}".encode()).hexdigest()[:4], 16) / 65535
        if hsh < .22:
            out.c[(x, y)] = shade(col, 1 + amount)
        elif hsh > .82:
            out.c[(x, y)] = shade(col, 1 - amount)
    return out


def rows_of(g):
    pal, inv, rows = {}, {}, []
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*+-=@^_~"
    for y in range(g.h):
        row = ""
        for x in range(g.w):
            col = g.c.get((x, y))
            if col is None:
                row += "."; continue
            if col not in inv:
                ch = chars[len(inv)]; inv[col] = ch; pal[ch] = col
            row += inv[col]
        rows.append(row)
    return rows, pal


# ------------------------------------------------------------------ the pets (all facing left)
def dog(name, C, small=False):
    """Long-haired chihuahua. C: colours."""
    W, H = 34, 28
    def body(legs, crouch=0, jump=False):
        g = Grid(W, H); dy = crouch
        # tail: a fluffy plume curling up over the back
        g.thick([(25, 16 + dy), (28, 12 + dy), (29, 8 + dy), (27.5, 5.5 + dy)], 1.6, C["fur"])
        g.ell(29, 9 + dy, 2.2, 3.4, C["fur"]); g.ell(28.4, 6.5 + dy, 1.6, 1.8, C["tip"])
        # legs (behind the body first: far legs darker)
        for (x, top, bottom, far, dx) in legs:
            col = shade(C["leg"], .78) if far else C["leg"]
            g.rect(int(x + dx), top + dy, int(x + dx) + 1, bottom, C["fur2"] if far else C["fur"])
            g.rect(int(x + dx), bottom - 2, int(x + dx) + 1, bottom, col)
            g.put(int(x + dx) - 1, bottom, col)   # a little paw
        g.ell(19, 17 + dy, 8.6, 5.2, C["fur"])               # body
        g.ell(19, 21.5 + dy, 6.5, 1.3, C["fringe"])          # long belly fringe
        g.ell(11.5, 15 + dy, 4.4, 5.4, C["fur"])             # neck and chest
        g.ell(10.8, 17 + dy, 2.6, 3.4, C["bib"])             # chest bib
        g.ell(8.5, 9.6 + dy, 6.2, 5.6, C["fur"])             # head
        # ears: big, a bit fluffy
        g.poly([(3.5, 7 + dy), (1.5, -0.5 + dy), (8.5, 5 + dy)], C["fur"])
        g.poly([(9.5, 5 + dy), (15, 0 + dy), (14, 8 + dy)], C["fur"])
        g.poly([(4.5, 6 + dy), (3, 1.5 + dy), (7, 5 + dy)], C["ear"])
        g.poly([(10.5, 5.5 + dy), (13.7, 2 + dy), (13, 7 + dy)], C["ear"])
        for (x, y) in ((1, 1), (2, 3), (15, 1), (15, 4), (14, 7), (0, 0)):
            g.put(x, y + dy, C["fringe"])
        g.ell(3.6, 12 + dy, 3.2, 2.1, C["muzzle"])           # muzzle
        g.ell(7.2, 13.6 + dy, 3, 1.3, C["muzzle"], only=(C["fur"],))
        for (x, y) in ((6, 7), (10, 7)):                     # eyebrow dots / face mask
            g.put(x, y + dy, C["brow"])
        return g
    def legset(phase):
        # (x, top, bottom, far, dx)
        base = [(12, 19, 26, False, 0), (14.5, 19, 26, True, 0), (22, 19, 26, False, 0), (24.5, 19, 26, True, 0)]
        sw = {"stand": (0, 0, 0, 0), "walk1": (-1, 1, 1, -1), "walk2": (0, 0, 0, 0), "walk3": (1, -1, -1, 1), "walk4": (0, 0, 0, 0)}[phase]
        out = []
        for (x, t, b, far, _), d in zip(base, sw):
            lift = 1 if (phase == "walk1" and d < 0) or (phase == "walk3" and d < 0) else 0
            out.append((x, t, b - lift, far, d))
        return out
    frames = {}
    for ph in ("stand", "walk1", "walk2", "walk3", "walk4"):
        frames[ph] = body(legset(ph))
    frames["down"] = body([(12, 21, 26, False, -1), (14.5, 21, 26, True, -1), (22, 21, 26, False, 1), (24.5, 21, 26, True, 1)], crouch=3)
    frames["jump"] = body([(10, 19, 24, False, 0), (12.5, 19, 24, True, 0), (24, 19, 25, False, 1), (26.5, 19, 25, True, 1)])
    eye, nose, mouth = (6, 10), (0, 11), (2, 13)
    return finish(name, frames, eye, nose, mouth, head=(9, 1), C=C, small=small)


def cat(name, C, chubby=False):
    W, H = 38, 30
    def body(legs, crouch=0):
        g = Grid(W, H); dy = crouch
        g.thick([(28, 18 + dy), (32, 16 + dy), (34, 11 + dy), (33.5, 6 + dy), (35, 3.5 + dy)], 1.1, C["tail"])   # tail up
        for (x, top, bottom, far, dx, sock) in legs:
            col = C["fur2"] if far else C["leg"]
            g.rect(int(x + dx), top + dy, int(x + dx) + 1, bottom, col)
            g.rect(int(x + dx) - 1, bottom, int(x + dx) + 1, bottom, sock)
            if sock != col:
                g.rect(int(x + dx), bottom - 1, int(x + dx) + 1, bottom, sock)
        g.ell(21, 18.5 + dy, 10.5, 5.6 if not chubby else 6.6, C["fur"])   # body
        g.ell(12, 16 + dy, 4.2, 5.2, C["fur"])                             # neck/chest
        g.ell(8.5, 11 + dy, 6, 5.4, C["fur"])                              # head
        g.poly([(3.2, 8 + dy), (3.5, 1.5 + dy), (7.6, 6 + dy)], C["fur"])   # ears: pointy
        g.poly([(9.5, 6 + dy), (13.6, 1.6 + dy), (13.4, 9 + dy)], C["fur"])
        g.poly([(4.3, 7 + dy), (4.5, 3.4 + dy), (6.6, 6 + dy)], C["ear"])
        g.poly([(10.6, 6.5 + dy), (12.9, 3.6 + dy), (12.6, 8.3 + dy)], C["ear"])
        if C.get("chest"):
            g.ell(11.5, 18.5 + dy, 3.4, 4.4, C["chest"])
            g.ell(13, 22 + dy, 5, 2, C["chest"], only=(C["fur"],))
        if C.get("blaze"):
            g.poly([(5.6, 16 + dy), (7.6, 8 + dy), (9.4, 16 + dy)], C["blaze"])   # white blaze up the face
        g.ell(4.4, 13.6 + dy, 3.4, 2.2, C["muzzle"])                    # muzzle/chin
        if C.get("stripes"):
            for sx in range(14, 31, 3):
                g.rect(sx, 13 + dy, sx, 21 + dy, C["stripes"], only=(C["fur"],))
            for sy in (9, 11):
                g.rect(6, sy + dy, 12, sy + dy, C["stripes"], only=(C["fur"],))
            for k in range(29, 36, 2):
                g.rect(k, 2, k, 18, C["stripes"], only=(C["tail"],))
        return g
    def legset(phase):
        socks = C.get("socks", C["leg"])
        base = [(12, 21, 28, False, 0, socks), (14.5, 21, 28, True, 0, socks), (26, 21, 28, False, 0, C.get("hind_socks", socks)), (28.5, 21, 28, True, 0, C.get("hind_socks", socks))]
        sw = {"stand": (0, 0, 0, 0), "walk1": (-1, 1, 1, -1), "walk2": (0, 0, 0, 0), "walk3": (1, -1, -1, 1), "walk4": (0, 0, 0, 0)}[phase]
        return [(x, t, b - (1 if d < 0 else 0), far, d, s) for (x, t, b, far, _, s), d in zip(base, sw)]
    frames = {ph: body(legset(ph)) for ph in ("stand", "walk1", "walk2", "walk3", "walk4")}
    socks = C.get("socks", C["leg"])
    frames["down"] = body([(11, 23, 28, False, -1, socks), (13.5, 23, 28, True, -1, socks), (27, 23, 28, False, 1, socks), (29.5, 23, 28, True, 1, socks)], crouch=4)
    frames["jump"] = body([(9, 21, 26, False, 0, socks), (11.5, 21, 26, True, 0, socks), (29, 21, 27, False, 1, socks), (31.5, 21, 27, True, 1, socks)])
    return finish(name, frames, (6, 11), (1, 13), (3, 15), head=(9, 1), C=C)


def rabbit(name, C):
    W, H = 30, 31
    def body(phase):
        g = Grid(W, H)
        # a hop: gather, push off, fly, land; everything lifts together
        up = {"stand": 0, "walk1": 0, "walk2": 2, "walk3": 4, "walk4": 1, "jump": 5, "down": -1}[phase]
        st = {"stand": 0, "walk1": 0, "walk2": 1, "walk3": 2, "walk4": 1, "jump": 2, "down": 0}[phase]
        dy = 5 - up
        g.ell(24.5 + st * .5, 16 + dy, 2.4, 2.4, C["tail"])                                   # cotton tail
        g.ell(20.5 + st * 1.2, 23 + dy, 4.5 + st * .6, 1.4, C["fur2"])                        # big hind foot
        g.ell(17 + st * .5, 17 + dy, 8.2 + st * .5, 6.4 - (1 if phase == "down" else 0), C["fur"])   # round body
        g.rect(9 - st, 20 + dy, 10 - st, 23 + dy - (1 if phase in ("walk3", "jump") else 0), C["fur"])   # front paw
        g.ell(8, 12.5 + dy, 5.2, 4.6, C["fur"])                                               # head
        tilt = 1 if phase == "down" else 0
        g.ell(8.5 - tilt, 4.5 + dy + tilt * 2, 1.5, 5.2, C["fur"]); g.ell(11.2 - tilt, 4.8 + dy + tilt * 2, 1.4, 5, C["fur2"])   # long ears
        g.ell(8.5 - tilt, 4.5 + dy + tilt * 2, .7, 3.6, C["ear"])
        g.ell(4, 14 + dy, 2.4, 2, C["muzzle"], only=(C["fur"],))
        g.rect(3, 12 + dy, 3, 13 + dy, C["blaze"])                                            # little white blaze on the nose
        g.ell(10, 17.5 + dy, 2.2, 2.2, C["chest"], only=(C["fur"],))                          # lighter bit on the chest
        return g
    frames = {ph: body(ph) for ph in ("stand", "walk1", "walk2", "walk3", "walk4", "down", "jump")}
    return finish(name, frames, (6, 13), (1, 15), (2, 16), head=(9, 0), C=C, ground_fix=True)


def finish(name, frames, eye, nose, mouth, head, C, small=False, ground_fix=False):
    out = {}
    seed = name
    for ph, g in frames.items():
        g = outline(g)
        # face details after the outline, so they stay crisp
        dy = 0
        if ph == "down":
            dy = 3 if name in ("wifi", "snoet") else 4 if name in ("pippa", "pebbels") else 1
        if name == "dobby":
            dy = 4 + {"walk2": -2, "walk3": -4, "walk4": -1, "jump": -5, "down": 1}.get(ph, 0)
        ex, ey = eye[0], eye[1] + dy
        g.put(ex, ey, C["eye"]); g.put(ex, ey + 1, C["eye"]); g.put(ex - 1, ey + 1, C["eye"]); g.put(ex - 1, ey, C["eye"])
        g.put(ex - 1, ey, "#ffffff")
        g.put(nose[0], nose[1] + dy, C["nose"]); g.put(nose[0] + 1, nose[1] + dy, C["nose"])
        g.put(mouth[0] + 1, mouth[1] + dy, shade(C["muzzle"], .55))
        g = texture(g, seed + ph, skip=(C["eye"], "#ffffff", C["nose"]))
        out[ph] = g
    blink = out["stand"].copy()
    ex, ey = eye[0], eye[1] + (4 if name == "dobby" else 0)
    lid = shade(C["fur"], .9)
    for (x, y) in ((ex, ey), (ex - 1, ey), (ex, ey + 1), (ex - 1, ey + 1)):
        blink.c[(x, y)] = lid
    blink.c[(ex, ey + 1)] = shade(C["fur"], .45); blink.c[(ex - 1, ey + 1)] = shade(C["fur"], .45)
    out["blink"] = blink
    res = {"w": frames["stand"].w, "h": frames["stand"].h, "eye": [ex, ey], "nose": list(nose), "head": list(head), "frames": {}}
    for ph, g in out.items():
        rows, pal = rows_of(g)
        res["frames"][ph] = {"rows": rows, "pal": pal}
    return res


PETS = {
    "wifi": dog("wifi", {"fur": "#231c18", "fur2": "#17120f", "tip": "#3a2f28", "fringe": "#4a3d33", "bib": "#efe6d6", "leg": "#c9864a",
                         "ear": "#b97a4c", "muzzle": "#c98a4f", "brow": "#d39556", "eye": "#3b200f", "nose": "#0b0909"}),
    "snoet": dog("snoet", {"fur": "#7c3f1d", "fur2": "#5d2d14", "tip": "#e2c39a", "fringe": "#a8622f", "bib": "#ead2ac", "leg": "#e2c39a",
                           "ear": "#e0b48c", "muzzle": "#e7caa1", "brow": "#e7caa1", "eye": "#2a1408", "nose": "#4a2416"}, small=True),
    "pippa": cat("pippa", {"fur": "#1d1b1d", "fur2": "#121112", "tail": "#1d1b1d", "leg": "#1d1b1d", "ear": "#5a3c40", "chest": "#f2f0ea",
                           "blaze": "#f2f0ea", "muzzle": "#f2f0ea", "socks": "#f2f0ea", "hind_socks": "#f2f0ea", "eye": "#c9a227", "nose": "#e8a3a6"}),
    "pebbels": cat("pebbels", {"fur": "#776656", "fur2": "#5a4c40", "tail": "#776656", "leg": "#776656", "ear": "#a07f70", "chest": "#ece6dc",
                               "muzzle": "#ece6dc", "socks": "#f1ede6", "stripes": "#3e342b", "eye": "#8a8f3a", "nose": "#d79b8f"}, chubby=True),
    "dobby": rabbit("dobby", {"fur": "#1f1d20", "fur2": "#141315", "tail": "#4a4750", "ear": "#3a2c2f", "muzzle": "#2c2a2e", "blaze": "#f0ede8",
                              "chest": "#4c4952", "eye": "#5a2a12", "nose": "#2a2224"}),
}

with open(OUT_JS, "w") as f:
    f.write("/* Kamiel's housemates in pixel art (made by petgen.py): Wifi, Snoet, Pippa, Pebbels and Dobby.\n"
            "   Each frame is a grid of characters with its own palette; all face left. */\n")
    f.write("window.KamielPetArt = " + json.dumps(PETS, separators=(",", ":")) + ";\n")

# preview: every frame, big
S = 6
order = ["stand", "blink", "walk1", "walk2", "walk3", "walk4", "down", "jump"]
Wt = sum(max(p["w"] for p in PETS.values()) * S + 10 for _ in order)
Ht = sum(p["h"] * S + 10 for p in PETS.values())
im = Image.new("RGB", (Wt, Ht), (78, 130, 236))
y = 0
for name, p in PETS.items():
    x = 0
    for ph in order:
        fr = p["frames"][ph]
        for r, row in enumerate(fr["rows"]):
            for c, ch in enumerate(row):
                if ch != ".":
                    col = hexc(fr["pal"][ch])
                    for yy in range(S):
                        for xx in range(S):
                            im.putpixel((x + c * S + xx, y + r * S + yy), col)
        x += max(q["w"] for q in PETS.values()) * S + 10
    y += p["h"] * S + 10
im.save(PREVIEW)
print("ok", {k: (v["w"], v["h"]) for k, v in PETS.items()})
