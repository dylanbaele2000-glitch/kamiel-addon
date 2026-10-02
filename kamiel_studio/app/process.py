"""Image processing for Kamiel Studio.

Everything that gets uploaded passes through here: cut-outs are cleaned up,
every image gets the same dreamcore grade, frames get their photo area
detected, text signs get colour variants and the panorama gets soft seams.
"""
import colorsys
import io

import numpy as np
from PIL import Image
from scipy import ndimage

PLACE = 960      # width of one "place" in the half-resolution panorama
PANO_H = 600     # height of the panorama the tablet uses


# ---------------------------------------------------------------- helpers
def load_rgba(data: bytes) -> np.ndarray:
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGBA")
    return np.asarray(im).astype(np.float32) / 255.0


def to_image(a: np.ndarray) -> Image.Image:
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "RGBA")


def save(img: Image.Image, path_no_ext: str) -> str:
    """Save as webp when possible, png otherwise. Returns the file name used."""
    try:
        img.save(path_no_ext + ".webp", "WEBP", quality=85, method=4)
        return path_no_ext + ".webp"
    except Exception:
        img.save(path_no_ext + ".png", "PNG", optimize=True)
        return path_no_ext + ".png"


def resize_max(a: np.ndarray, maxdim: int) -> np.ndarray:
    im = to_image(a)
    im.thumbnail((maxdim, maxdim), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255.0


def gblur(x, s):
    if x.ndim == 3:
        return np.stack([ndimage.gaussian_filter(x[..., c], s) for c in range(x.shape[2])], -1)
    return ndimage.gaussian_filter(x, s)


def white_to_alpha(a: np.ndarray) -> np.ndarray:
    """Images without transparency: treat a flat white or near-white border as background."""
    if a[..., 3].min() < 0.99:
        return a
    border = np.concatenate([a[0, :, :3], a[-1, :, :3], a[:, 0, :3], a[:, -1, :3]])
    if (border.min(-1) > 0.93).mean() < 0.9:
        return a
    bg = a[..., :3].min(-1) > 0.93
    lab, _ = ndimage.label(bg)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    mask = np.isin(lab, list(edge))
    a = a.copy()
    a[..., 3] = np.where(mask, 0, 1)
    a[..., 3] = ndimage.gaussian_filter(a[..., 3], 0.7)
    return a


def clean(a: np.ndarray, defringe: bool = False) -> np.ndarray:
    """Drop stray specks, optionally remove a dark cut-out rim, crop to content."""
    a = a.copy()
    al = a[..., 3] > 0.08
    lab, n = ndimage.label(al)
    if n > 1:
        sz = ndimage.sum(al, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > sz.max() * 0.04])
        a[..., 3] *= keep
    if defringe:
        er = ndimage.grey_erosion(a[..., 3], size=(5, 5))
        lum = (a[..., :3] * [0.299, 0.587, 0.114]).sum(-1)
        rim = (lum < 0.55) & (er < 0.5)
        al2 = np.where(rim, 0, a[..., 3])
        a[..., 3] = ndimage.gaussian_filter(np.minimum(al2, ndimage.grey_erosion(al2, size=(3, 3))), 1.0)
    ys, xs = np.where(a[..., 3] > 0.02)
    if not len(xs):
        return a
    pad = int(max(a.shape[:2]) * 0.03)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, a.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, a.shape[1])
    return a[y0:y1, x0:x1]


# ------------------------------------------------------------- the grade
def dream(rgba: np.ndarray, strength: float = 1.0, outer: bool = True, size=None) -> np.ndarray:
    """The shared dreamcore look: bloom, lifted blacks, pastel split tone, softness, halo."""
    a = rgba[..., 3:4]
    rgb = rgba[..., :3]
    h, w = a.shape[:2]
    size = size or max(h, w)
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1, keepdims=True)
    bright = np.clip((lum - 0.5) / 0.5, 0, 1) * a
    glow = gblur(rgb * bright, size * 0.012)
    rgb = 1 - (1 - rgb) * (1 - 0.75 * strength * glow)
    rgb = 0.09 * strength + rgb * (1 - 0.14 * strength)
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1, keepdims=True)
    rgb = lum + (rgb - lum) * (1 + 0.12 * strength)
    rgb = rgb + strength * ((1 - lum) * np.array([-0.01, 0.015, 0.035]) + lum * np.array([0.035, 0.01, -0.015]))
    rgb = np.clip(rgb, 0, 1)
    rgb = gblur(rgb, max(0.6, size * 0.0008)) * 0.65 + rgb * 0.35
    out = np.concatenate([rgb, a], -1)
    if outer:
        s = size * 0.014
        ba = gblur(a[..., 0], s)
        ha = ba * 0.42 * strength
        hc = gblur(rgb * a, s) / np.maximum(ba[..., None], 1e-4)
        na = np.maximum(a[..., 0], ha)
        col = np.where(a > 0.01, rgb, np.clip(hc * 1.08, 0, 1))
        out = np.concatenate([col, na[..., None]], -1)
    return out.astype(np.float32)


# ------------------------------------------------------------- assets
def frame_hole(a: np.ndarray):
    """Find the photo area of a frame: the biggest white (or see-through) patch inside it."""
    white = (a[..., :3].min(-1) > 0.86) & (a[..., 3] > 0.9)
    inside = ndimage.binary_fill_holes(a[..., 3] > 0.5) & (a[..., 3] < 0.2)
    cand = white | inside
    lab, n = ndimage.label(cand)
    if n == 0:
        return None
    sz = ndimage.sum(cand, lab, range(1, n + 1))
    m = lab == (np.argmax(sz) + 1)
    if m.sum() < a.shape[0] * a.shape[1] * 0.02:
        return None
    return ndimage.binary_dilation(m, iterations=2)


def sign_plate(a: np.ndarray):
    """For a text sign: find the coloured plate and its dominant hue."""
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    colored = (sat > 0.35) & (mx > 0.35) & (a[..., 3] > 0.5)
    lab, n = ndimage.label(colored)
    if n == 0:
        return None
    sz = ndimage.sum(colored, lab, range(1, n + 1))
    plate = ndimage.binary_fill_holes(lab == (np.argmax(sz) + 1))
    ys, xs = np.where(plate)
    s, d = xs + ys, xs - ys
    h, w = a.shape[:2]
    pts = [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]),
           (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])]
    sel = rgb[lab == (np.argmax(sz) + 1)]
    hues = np.array([colorsys.rgb_to_hsv(*p)[0] for p in sel[:: max(1, len(sel) // 2000)]])
    ang = np.angle(np.exp(2j * np.pi * hues).mean()) / (2 * np.pi) % 1
    return [[float(x / w), float(y / h)] for x, y in pts], float(ang)


SIGN_COLORS = {"paars": None, "groen": 0.33, "blauw": 0.62, "oranje": 0.07, "cyaan": 0.5, "rood": 0.98}


def sign_variants(a: np.ndarray, hue0: float):
    """Recolour everything that has the plate's hue; keeps e.g. a yellow smiley intact."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hsv = np.vectorize(colorsys.rgb_to_hsv, otypes=[float, float, float])
    H, S, V = hsv(r, g, b)
    dist = np.minimum(abs(H - hue0), 1 - abs(H - hue0))
    m = ndimage.gaussian_filter(((dist < 0.11) & (S > 0.12)).astype(float), 0.8)[..., None]
    out = {}
    for name, hue in SIGN_COLORS.items():
        if hue is None:
            continue
        rr, gg, bb = np.vectorize(colorsys.hsv_to_rgb, otypes=[float, float, float])(np.full_like(H, hue), S, V)
        v = a.copy()
        v[..., :3] = a[..., :3] * (1 - m) + np.stack([rr, gg, bb], -1) * m
        out[name] = v
    return out


def process_asset(data: bytes, kind: str, is_sign: bool = False):
    """Returns dict with images (name -> array) and metadata for one uploaded element."""
    a = white_to_alpha(load_rgba(data))
    a = clean(a)
    meta = {}
    if kind == "wolk":
        a = resize_max(a, 900)
        a = clean(a, defringe=True)
        img = dream(a, 0.6, outer=False)
        return {"main": img}, meta
    a = resize_max(a, 700)
    if kind == "kader":
        hole = frame_hole(a)
        g = dream(a, 0.8)
        imgs = {"main": g}
        if hole is not None:
            mimg = np.zeros_like(a)
            mimg[..., :3] = 1
            mimg[..., 3] = hole
            imgs["mask"] = mimg
            ys, xs = np.where(hole)
            meta["hole"] = [float(xs.min() / a.shape[1]), float(ys.min() / a.shape[0]),
                            float(xs.max() / a.shape[1]), float(ys.max() / a.shape[0])]
        return imgs, meta
    g = dream(a, 1.3)
    imgs = {"main": g}
    if is_sign:
        found = sign_plate(a)
        if found:
            meta["plate"], hue0 = found
            for name, v in sign_variants(g, hue0).items():
                imgs["kleur_" + name] = v
            meta["colors"] = ["paars"] + [k for k in SIGN_COLORS if SIGN_COLORS[k] is not None]
    return imgs, meta


def process_photo(data: bytes) -> np.ndarray:
    a = load_rgba(data)
    a[..., 3] = 1
    a = resize_max(a, 800)
    return dream(a, 1.0, outer=False)


# ------------------------------------------------------------- panorama
def _horizon(img):
    al = img[..., 3] > 0.5
    h = np.argmax(al, 0).astype(np.float32)
    h[~al.any(0)] = img.shape[0]
    return ndimage.median_filter(h, size=61, mode="nearest")


def _warp(src, h0, h1):
    H = src.shape[0]
    n = src.shape[1]
    ys = np.arange(H, dtype=np.float32)[:, None]
    scale = (H - h0) / np.maximum(H - h1, 1)
    sy = np.clip(h0 + (ys - h1) * scale, 0, H - 1)
    valid = ys >= h1 - 0.5
    y0 = np.floor(sy).astype(int)
    y1 = np.minimum(y0 + 1, H - 1)
    f = (sy - y0)[..., None]
    cols = np.arange(n)[None, :]
    out = src[y0, cols] * (1 - f) + src[y1, cols] * f
    out[..., 3] *= valid
    return out


def _noise(shape, cells, seed):
    r = np.random.default_rng(seed).random(cells)
    z = ndimage.zoom(r, (shape[0] / cells[0], shape[1] / cells[1]), order=3)
    return z[: shape[0], : shape[1]]


def process_panorama(files: list):
    """files: list of bytes in the order the panorama runs. Returns (rgba array, horizon list)."""
    parts = []
    for data in files:
        im = Image.open(io.BytesIO(data)).convert("RGBA")
        w = round(im.width * PANO_H / im.height)
        parts.append(np.asarray(im.resize((w, PANO_H), Image.LANCZOS)).astype(np.float32) / 255.0)
    P = np.concatenate(parts, 1)
    places = max(1, round(P.shape[1] / PLACE))
    P = np.asarray(to_image(P).resize((places * PLACE, PANO_H), Image.LANCZOS)).astype(np.float32) / 255.0
    H, Wt = P.shape[:2]
    if places > 1:
        SH = PLACE // 2
        P = np.roll(P, SH, 1)
        Wb = PLACE // 4
        seams = [SH + k * PLACE for k in range(places)]
        for S in seams:  # remove thin edge lines that design tools leave on tile borders
            for c in range(S - 3, S):
                P[:, c] = P[:, S - 4]
            for c in range(S, S + 3):
                P[:, c] = P[:, S + 3]
        out = P.copy()
        for i, S in enumerate(seams):
            xs = np.arange(S - Wb, S + Wb)
            L = P[:, np.where(xs < S, xs, 2 * S - 1 - xs)]
            R = P[:, np.where(xs >= S, xs, 2 * S - xs)]
            hL, hR = _horizon(L), _horizon(R)
            s = (xs - (S - Wb)) / (2 * Wb)
            sm = s * s * (3 - 2 * s)
            ht = hL + (hR - hL) * sm
            Lw, Rw = _warp(L, hL, ht), _warp(R, hR, ht)
            n = _noise((H, 2 * Wb), (6, 10), i) * 0.65 + _noise((H, 2 * Wb), (30, 60), 100 + i) * 0.35
            n = (n - n.mean()) / (n.std() + 1e-6)
            m = np.clip(sm[None, :] + 0.22 * n * (4 * s * (1 - s))[None, :], 0, 1)[..., None]
            la, ra = Lw[..., 3:], Rw[..., 3:]
            alpha = la * (1 - m) + ra * m
            rgb = (Lw[..., :3] * la * (1 - m) + Rw[..., :3] * ra * m) / np.maximum(alpha, 1e-6)
            out[:, S - Wb:S + Wb, :3] = rgb
            out[:, S - Wb:S + Wb, 3:] = alpha
        P = np.roll(out, -SH, 1)
    P = dream(P, 0.55, outer=False, size=700)
    al = P[..., 3] > 0.5
    hz = np.argmax(al, 0).astype(float)
    hz[~al.any(0)] = H
    hz = ndimage.median_filter(hz, size=31, mode="wrap")
    return P, [int(v) for v in hz[::8]]
