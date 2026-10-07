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


def fluff(g, col, box, prob, seed, dirs=((0, -1), (-1, 0), (1, 0), (0, 1))):
    """Long hair: little tufts sticking out of the edge, inside a box."""
    x0, y0, x1, y1 = box
    add = []
    for (x, y), c in list(g.c.items()):
        if not (x0 <= x <= x1 and y0 <= y <= y1):
            continue
        for dx, dy in dirs:
            p = (x + dx, y + dy)
            if p in g.c:
                continue
            hsh = int(hashlib.md5(f"{seed}{p}".encode()).hexdigest()[:4], 16) / 65535
            if hsh < prob:
                add.append(p)
    for p in add:
        g.put(p[0], p[1], col)


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
    W, H = 36, 31
    OY = 3
    def body(legs, crouch=0, jump=False):
        g = Grid(W, H); dy = crouch + OY
        # tail: a long fluffy plume curling up over the back
        g.thick([(25, 16 + dy), (28, 12 + dy), (29.5, 8 + dy), (28, 5 + dy)], 1.7, C["fur"])
        g.ell(29.5, 9 + dy, 2.6, 3.8, C["fur"]); g.ell(28.6, 5.6 + dy, 1.8, 1.9, C["tip"])
        fluff(g, C["fringe"], (26, 2 + dy, 33, 14 + dy), .55, name + "tail", dirs=((1, 0), (0, -1), (1, -1)))
        # legs (behind the body first: far legs darker)
        for (x, top, bottom, far, dx) in legs:
            col = shade(C["leg"], .78) if far else C["leg"]
            front = x < 18
            g.rect(int(x + dx), top + dy, int(x + dx) + 1, bottom + OY, C["fur2"] if far else C["fur"])
            g.rect(int(x + dx), (top + 2 if front and C.get("leg_full") else bottom - 2) + dy - (0 if front and C.get("leg_full") else 0), int(x + dx) + 1, bottom + OY, col) if front and C.get("leg_full") else g.rect(int(x + dx), bottom - 2 + OY, int(x + dx) + 1, bottom + OY, col)
            g.put(int(x + dx) - 1, bottom + OY, col)   # a little paw
        g.ell(19, 17 + dy, 8.6, 5.2, C["fur"])               # body
        g.ell(11.5, 15 + dy, 4.4, 5.4, C["fur"])             # neck and chest
        g.ell(10.5, 17.2 + dy, 2.8, 3.8, C["bib"])           # chest bib
        g.ell(8.5, 9.6 + dy, 6.2, 5.6, C["fur"])             # head
        # ears: big, wide, fluffy
        g.poly([(3, 7.5 + dy), (0.5, -2.5 + dy), (9, 5 + dy)], C["fur"])
        g.poly([(9, 5 + dy), (16.5, -1.5 + dy), (14.5, 8.5 + dy)], C["fur"])
        g.poly([(4, 6.5 + dy), (2, 0 + dy), (7.5, 5 + dy)], C["ear"])
        g.poly([(10.5, 5.5 + dy), (14.8, 1 + dy), (13.5, 7.5 + dy)], C["ear"])
        fluff(g, C["fringe"], (0, -3 + dy, 3, 8 + dy), .6, name + "earl", dirs=((-1, 0), (0, -1), (-1, -1)))
        fluff(g, C["fringe"], (14, -3 + dy, 18, 9 + dy), .6, name + "earr", dirs=((1, 0), (0, -1), (1, -1), (1, 1)))
        # long hair under the belly and on the chest
        fluff(g, C["fringe"], (12, 20 + dy, 27, 23 + dy), .7, name + "belly", dirs=((0, 1),))
        fluff(g, C["bib"], (8, 16 + dy, 13, 22 + dy), .6, name + "bib", dirs=((-1, 0), (0, 1), (-1, 1)))
        if C.get("mask"):   # a light mask around the eyes and down the snout (Snoet)
            g.ell(6.5, 10.5 + dy, 3.2, 2.6, C["mask"], only=(C["fur"],))
        g.ell(3.6, 12 + dy, 3.2, 2.1, C["muzzle"])           # muzzle
        g.ell(7.2, 13.6 + dy, 3, 1.4, C["muzzle"], only=(C["fur"],))   # cheek
        for (x, y) in ((6, 7), (5, 7), (10, 7)):             # eyebrow dots
            g.put(x, y + dy, C["brow"])
        return g
    def legset(phase):
        # (x, top, bottom, far, dx)
        base = [(12, 19, 26, False, 0), (14.5, 19, 26, True, 0), (22, 19, 26, False, 0), (24.5, 19, 26, True, 0)]
        sw = {"stand": (0, 0, 0, 0), "walk1": (-1, 1, 1, -1), "walk2": (0, 0, 0, 0), "walk3": (1, -1, -1, 1), "walk4": (0, 0, 0, 0)}[phase]
        out = []
        for (x, t, b, far, _), d in zip(base, sw):
            lift = 1 if d < 0 else 0
            out.append((x, t, b - lift, far, d))
        return out
    frames = {}
    for ph in ("stand", "walk1", "walk2", "walk3", "walk4"):
        frames[ph] = body(legset(ph))
    frames["down"] = body([(12, 21, 26, False, -1), (14.5, 21, 26, True, -1), (22, 21, 26, False, 1), (24.5, 21, 26, True, 1)], crouch=3)
    frames["jump"] = body([(10, 19, 24, False, 0), (12.5, 19, 24, True, 0), (24, 19, 25, False, 1), (26.5, 19, 25, True, 1)])
    eye, nose, mouth = (6, 10 + OY), (0, 11 + OY), (2, 13 + OY)
    return finish(name, frames, eye, nose, mouth, head=(9, 1), C=C, small=small, oy=OY)


def cat(name, C, chubby=False):
    W, H = 38, 30
    def body(legs, crouch=0):
        g = Grid(W, H); dy = crouch
        g.thick([(28, 18 + dy), (32, 16 + dy), (34, 11 + dy), (33.5, 6 + dy), (35, 3.5 + dy)], 1.1, C["tail"])   # tail up
        for (x, top, bottom, far, dx, sock) in legs:
            col = C["fur2"] if far else C["leg"]
            g.rect(int(x + dx), top + dy, int(x + dx) + 1, bottom, col)
            if C.get("leg_white") and (x < 20 or C.get("hind_white")):
                g.rect(int(x + dx), top + dy + 2, int(x + dx) + 1, bottom, shade(C["leg_white"], .85) if far else C["leg_white"])
            if C.get("stripes") and not far:
                for yy in range(top + dy + 1, bottom - 1, 2):
                    g.put(int(x + dx), yy, C["stripes"])
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
        if C.get("belly"):   # tuxedo: white underneath
            g.ell(19, 22.5 + dy, 10, 3.2, C["belly"], only=(C["fur"],))
            g.ell(28, 19 + dy, 2.5, 2.5, C["belly"], only=(C["fur"],))
        if C.get("warm"):    # warm orange patches in the coat
            g.ell(24, 16.5 + dy, 2.2, 1.4, C["warm"], only=(C["fur"],))
        if C.get("chest"):
            g.ell(11.5, 18.5 + dy, 3 if C.get("narrow") else 3.4, 4.6, C["chest"])
            if not C.get("narrow"):
                g.ell(13, 22 + dy, 5, 2, C["chest"], only=(C["fur"],))
        if C.get("blaze"):
            g.poly([(5.6, 16 + dy), (7.6, 8 + dy), (9.4, 16 + dy)], C["blaze"])   # white blaze up the face
        g.ell(4.4, 13.6 + dy, 3.4, 2.2, C["muzzle"])                    # muzzle/chin
        if C.get("stripes"):
            for sx in range(14, 31, 3):
                g.rect(sx, 13 + dy, sx, 21 + dy, C["stripes"], only=(C["fur"],))
            for sx in (7, 9, 11):   # the "M" on the forehead
                g.rect(sx, 6 + dy, sx, 9 + dy, C["stripes"], only=(C["fur"],))
            g.rect(10, 13 + dy, 13, 13 + dy, C["stripes"], only=(C["fur"],))
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
    W, H = 30, 30
    def body(phase):
        g = Grid(W, H)
        # a hop: gather, push off, fly, land; everything lifts together
        up = {"stand": 0, "walk1": 0, "walk2": 2, "walk3": 4, "walk4": 1, "jump": 5, "down": -1}[phase]
        st = {"stand": 0, "walk1": 0, "walk2": 1, "walk3": 2, "walk4": 1, "jump": 2, "down": 0}[phase]
        dy = 5 - up
        g.ell(20.5 + st * 1.2, 23 + dy, 4.2 + st * .6, 1.4, C["fur2"])                       # hind foot
        g.ell(17 + st * .5, 16.5 + dy, 8 + st * .5, 6.8 - (1 if phase == "down" else 0), C["fur"])   # round, compact body
        g.ell(23.5 + st * .5, 14 + dy, 2, 2, C["fur"])                                         # rump / tail
        g.rect(9 - st, 20 + dy, 10 - st, 23 + dy - (1 if phase in ("walk3", "jump") else 0), C["fur"])   # front paw
        g.ell(8, 11.5 + dy, 5.8, 5.2, C["fur"])                                               # big round head
        tilt = 1 if phase == "down" else 0
        # short, upright ears close together
        g.ell(9.5 - tilt, 3.6 + dy + tilt * 2, 1.4, 3.6, C["fur"]); g.ell(12 - tilt, 4 + dy + tilt * 2, 1.3, 3.4, C["fur2"])
        g.ell(9.5 - tilt, 3.8 + dy + tilt * 2, .6, 2.4, C["ear"])
        g.ell(10.5, 18.5 + dy, 3, 4.2, C["chest"])                                            # white bib on the chest
        fluff(g, C["chest"], (7, 15 + dy, 14, 24 + dy), .45, name + "bib", dirs=((-1, 0), (0, 1)))
        g.ell(10.5, 18.5 + dy, 1.2, 1.6, C["chest2"], only=(C["chest"],))
        g.ell(3.5, 13.5 + dy, 2.2, 2, C["muzzle"], only=(C["fur"],))
        g.put(3, 14 + dy, C["blaze"]); g.put(4, 14 + dy, C["blaze"]); g.put(3, 15 + dy, C["blaze"])   # the white spot on his nose
        return g
    frames = {ph: body(ph) for ph in ("stand", "walk1", "walk2", "walk3", "walk4", "down", "jump")}
    return finish(name, frames, (7, 11), (1, 14), (2, 15), head=(10, 0), C=C, ground_fix=True)


def finish(name, frames, eye, nose, mouth, head, C, small=False, ground_fix=False, oy=0):
    out = {}
    seed = name
    for ph, g in frames.items():
        g = outline(g)
        # face details after the outline, so they stay crisp
        dy = 0
        if ph == "down":
            dy = 3 if name in ("wifi", "snoet") else 4 if name in ("pippa", "pebbels") else 1
        if name == "dobby":
            dy = 5 + {"walk2": -2, "walk3": -4, "walk4": -1, "jump": -5, "down": 1}.get(ph, 0)
        ex, ey = eye[0], eye[1] + dy
        if C.get("ring"):   # a brownish ring around a big dark eye (Dobby)
            for (x, y) in ((ex - 2, ey), (ex - 2, ey + 1), (ex + 1, ey), (ex + 1, ey + 1), (ex - 1, ey - 1), (ex, ey - 1), (ex - 1, ey + 2), (ex, ey + 2)):
                g.put(x, y, C["ring"])
        g.put(ex, ey, C["eye"]); g.put(ex, ey + 1, C["eye"]); g.put(ex - 1, ey + 1, C["eye"]); g.put(ex - 1, ey, C["eye"])
        g.put(ex - 1, ey, "#ffffff")
        g.put(nose[0], nose[1] + dy, C["nose"]); g.put(nose[0] + 1, nose[1] + dy, C["nose"])
        g.put(mouth[0] + 1, mouth[1] + dy, shade(C["muzzle"], .55))
        g = texture(g, seed + ph, skip=(C["eye"], "#ffffff", C["nose"]))
        out[ph] = g
    blink = out["stand"].copy()
    ex, ey = eye[0], eye[1] + (5 if name == "dobby" else 0)
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
    "wifi": dog("wifi", {"fur": "#1e1815", "fur2": "#140f0d", "tip": "#2f2620", "fringe": "#3e3229", "bib": "#efe6d6", "leg": "#c9864a", "leg_full": True,
                         "ear": "#a8703f", "muzzle": "#c48548", "brow": "#d39556", "eye": "#3b200f", "nose": "#0b0909"}),
    "snoet": dog("snoet", {"fur": "#8a3b19", "fur2": "#6a2b11", "tip": "#e6c9a0", "fringe": "#d9b085", "bib": "#ecd3ad", "leg": "#e6c9a0", "leg_full": True,
                           "mask": "#e8c79c", "ear": "#e3b98f", "muzzle": "#ecd0a8", "brow": "#ecd0a8", "eye": "#2a1408", "nose": "#5a2a18"}, small=True),
    "pippa": cat("pippa", {"fur": "#1b191b", "fur2": "#121112", "tail": "#1b191b", "leg": "#1b191b", "ear": "#5a3c40", "chest": "#f3f1ec",
                           "belly": "#f3f1ec", "leg_white": "#f3f1ec", "hind_white": True, "blaze": "#f3f1ec", "muzzle": "#f3f1ec",
                           "socks": "#f3f1ec", "hind_socks": "#f3f1ec", "eye": "#d9a51e", "nose": "#eaa1a6"}),
    "pebbels": cat("pebbels", {"fur": "#6e5f50", "fur2": "#54483d", "tail": "#6e5f50", "leg": "#6e5f50", "ear": "#a07f70", "chest": "#efeae1", "narrow": True,
                               "warm": "#7f6047", "muzzle": "#efeae1", "socks": "#f3efe8", "stripes": "#342b23", "eye": "#9a9a3a", "nose": "#e0a39a"}, chubby=True),
    "dobby": rabbit("dobby", {"fur": "#1c1a1d", "fur2": "#121113", "tail": "#1c1a1d", "ear": "#3a2a2e", "muzzle": "#262428", "blaze": "#f0ede8",
                              "chest": "#eeebe6", "chest2": "#c9c6c2", "eye": "#1a1418", "ring": "#7a4a36", "nose": "#2a2224"}),
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
