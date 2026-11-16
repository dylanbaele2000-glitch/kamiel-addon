"""Recipes for cooking with Kamiel: turn whatever comes in (pasted text, a link, a photo) into
{title, servings, ingredients: [str], steps: [{text, timers: [{sec, label}]}]}.

Without AI: links are read from the recipe data most sites hide in their page (schema.org Recipe in JSON-LD);
text is split by its own headings ("Ingrediënten", "Bereiding"...), numbered steps or paragraphs, and when all
else fails sentence by sentence, so nothing ever gets lost.
With AI (Gemini, a key in the Studio): photos and messy text become a clean recipe, in Dutch.
Nothing here keeps state; server.py stores the result."""
import base64
import html
import json
import re

import asyncio

from aiohttp import ClientError, ClientSession, ClientTimeout

# ---------- small helpers ----------
UNITS = r"(?:g|gr|gram|kg|kilo|mg|ml|cl|dl|l|liter|el|tl|eetlepels?|theelepels?|koffielepels?|kl|tbsp|tsp|cups?|oz|lb|teentjes?|tenen|snufje|snuifje|scheutje|scheut|blikjes?|blik|zakjes?|pakjes?|stuks?|stuk|takjes?|plakjes?|plakken|bosjes?|handjes?|handvol|kopjes?|glas|glazen|bollen|bol|pond|ons)"
QTY = r"(?:\d+(?:[.,/]\d+)?|[½¼¾⅓⅔⅛]|een|één|twee|drie|vier|vijf|zes|halve?|paar)"
ING_RE = re.compile(rf"^\s*(?:[-•*·▪◦–]\s*)?{QTY}(?:\s*(?:-|à|tot)\s*{QTY})?\s*{UNITS}?\b", re.I)
BULLET_RE = re.compile(r"^\s*[-•*·▪◦–]\s+")
NUM_RE = re.compile(r"^\s*(?:stap\s*)?(\d{1,2})\s*[.):\-]\s+|^\s*stap\s*(\d{1,2})\b[:.]?\s*", re.I)
H_ING = re.compile(r"^\s*(?:#+\s*)?(ingredi[eë]nten|ingredients|benodigdheden|wat heb je nodig|boodschappen|nodig)\b.*$", re.I)
H_STEP = re.compile(r"^\s*(?:#+\s*)?(bereiding(?:swijze)?|werkwijze|instructies|stappen|aan de slag|zo maak je (?:het|het recept)|method|directions|instructions|preparation)\b.*$", re.I)
SERV_RE = re.compile(r"(\d{1,2})\s*(?:personen|persoon|pers\.?|porties?|servings|people|stuks)\b", re.I)
TIME_RE = re.compile(r"(\d+(?:[.,]\d+)?|een half|anderhalf|een kwartier|een)\s*(?:(?:-|à|tot|a)\s*(\d+(?:[.,]\d+)?)\s*)?(minuten|minuutjes|minuut|min\.?|uur|uren|u\b|seconden|sec\.?|kwartier)", re.I)
WORDS = {"een": 1, "een half": .5, "anderhalf": 1.5, "een kwartier": 15}


def clean(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", str(t or "")))
    return re.sub(r"[ \t ]+", " ", t).strip()


def timers_in(text):
    """'laat 10-12 minuten sudderen' -> [{sec: 720, label: '10-12 min'}] (the longest of a range: better to check early)."""
    out = []
    for m in TIME_RE.finditer(text):
        a, b, unit = m.group(1).lower(), m.group(2), m.group(3).lower()
        try:
            v = WORDS[a] if a in WORDS else float(a.replace(",", "."))
            if b:
                v = float(b.replace(",", "."))
        except ValueError:
            continue
        if a == "een kwartier":
            sec = 15 * 60
        elif unit == "kwartier":
            sec = 15 * 60 * v
        elif unit.startswith(("uur", "uren")) or unit == "u":
            sec = v * 3600
        elif unit.startswith("sec"):
            sec = v
        else:
            sec = v * 60
        if 20 <= sec <= 12 * 3600:
            label = (m.group(1) + ("-" + b if b else "") + " " + ("min" if unit.startswith("min") else unit)).strip()
            if not any(abs(x["sec"] - sec) < 1 for x in out):
                out.append({"sec": int(sec), "label": label})
    return out[:3]


def finish(title, servings, ingredients, steps, source=""):
    """One shape for every recipe: cleaned, timers found, nothing empty."""
    ings = [clean(i) for i in ingredients if clean(i)][:80]
    st = []
    for s in steps:
        text = clean(s.get("text") if isinstance(s, dict) else s)
        if not text:
            continue
        tm = s.get("timers") if isinstance(s, dict) and s.get("timers") else timers_in(text)
        st.append({"text": text[:1500], "timers": tm})
    return {"title": clean(title)[:90] or "Recept", "servings": clean(servings)[:30], "ingredients": ings, "steps": st[:60], "source": source}


# ---------- text, without AI ----------
def split_sentences(par, maxlen=240):
    sents = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])", par.strip())
    out, cur = [], ""
    for s in sents:
        if cur and len(cur) + len(s) > maxlen:
            out.append(cur.strip()); cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        out.append(cur.strip())
    return out


def parse_text(txt):
    lines = [l.rstrip() for l in str(txt or "").replace("\r", "").split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    if not lines:
        return None
    title, servings = "", ""
    m = SERV_RE.search(txt)
    if m:
        servings = m.group(0)
    first = lines[0].strip()
    if len(first) < 80 and not ING_RE.match(first) and not NUM_RE.match(first) and not H_ING.match(first) and not H_STEP.match(first):
        title = first.strip("#*: ")
        lines = lines[1:]
    ings, steps, mode = [], [], None
    has_heads = any(H_ING.match(l) for l in lines) or any(H_STEP.match(l) for l in lines)
    if has_heads:
        buf = []
        for l in lines:
            if H_ING.match(l):
                mode = "ing"; continue
            if H_STEP.match(l):
                mode = "step"; continue
            if mode == "ing":
                if l.strip():
                    ings.append(BULLET_RE.sub("", l).strip())
            elif mode == "step":
                buf.append(l)
            elif l.strip() and not title:
                title = l.strip()
        steps = steps_from("\n".join(buf))
    else:
        # no headings: short lines with an amount (or a bullet) are ingredients, the rest are the steps
        rest = []
        for l in lines:
            s = l.strip()
            if not s:
                rest.append(""); continue
            if (ING_RE.match(s) or (BULLET_RE.match(s) and len(s) < 70)) and len(s) < 90 and not NUM_RE.match(s) and not s.endswith("."):
                ings.append(BULLET_RE.sub("", s))
            else:
                rest.append(l)
        steps = steps_from("\n".join(rest))
    if not steps and ings:   # only a list: show it as steps, better than nothing
        steps = ings[:]; ings = []
    return finish(title, servings, ings, steps)


def steps_from(block):
    block = block.strip()
    if not block:
        return []
    lines = block.split("\n")
    if sum(1 for l in lines if NUM_RE.match(l)) >= 2:   # numbered: every number starts a step, lines in between belong to it
        steps, cur = [], ""
        for l in lines:
            if NUM_RE.match(l):
                if cur.strip():
                    steps.append(cur.strip())
                cur = NUM_RE.sub("", l, count=1)
            else:
                cur += " " + l.strip()
        if cur.strip():
            steps.append(cur.strip())
        return [s for p in steps for s in ([p] if len(p) < 600 else split_sentences(p, 300))]
    pars = [p.strip().replace("\n", " ") for p in re.split(r"\n\s*\n", block) if p.strip()]
    if len(pars) == 1:   # one block of text: a few sentences per step
        bl = [BULLET_RE.sub("", l).strip() for l in lines if l.strip()]
        if len(bl) >= 3 and all(len(l) < 300 for l in bl):
            return bl
        return split_sentences(pars[0], 80)
    return [s for p in pars for s in ([p] if len(p) < 600 else split_sentences(p, 300))]


# ---------- links ----------
def _walk(o):
    if isinstance(o, list):
        for x in o:
            yield from _walk(x)
    elif isinstance(o, dict):
        yield o
        for k in ("@graph", "mainEntity", "itemListElement"):
            if k in o:
                yield from _walk(o[k])


def _is_recipe(o):
    t = o.get("@type")
    return t == "Recipe" or (isinstance(t, list) and "Recipe" in t)


def _instr(x):
    if isinstance(x, str):
        return [p for p in re.split(r"\n+", x) if clean(p)]
    if isinstance(x, list):
        return [s for y in x for s in _instr(y)]
    if isinstance(x, dict):
        if x.get("itemListElement"):
            return _instr(x["itemListElement"])
        return [x.get("text") or x.get("name") or ""]
    return []


def parse_jsonld(page):
    for m in re.finditer(r"<script[^>]+application/ld\+json[^>]*>(.*?)</script>", page, re.S | re.I):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except ValueError:
            try:
                data = json.loads(re.sub(r"[\x00-\x1f]", " ", raw))
            except ValueError:
                continue
        for o in _walk(data):
            if _is_recipe(o):
                y = o.get("recipeYield")
                y = y[0] if isinstance(y, list) and y else y
                ings = o.get("recipeIngredient") or o.get("ingredients") or []
                return finish(o.get("name"), str(y or ""), ings if isinstance(ings, list) else [ings], _instr(o.get("recipeInstructions")))
    return None


def page_text(page):
    page = re.sub(r"<(script|style|noscript|svg|nav|footer|header)[^>]*>.*?</\1>", " ", page, flags=re.S | re.I)
    page = re.sub(r"<(br|/p|/li|/h\d|/div|li|h\d)[^>]*>", "\n", page, flags=re.I)
    t = clean(page.replace("\n", " \n "))
    return re.sub(r"\n\s*\n+", "\n\n", t)


async def fetch(url):
    try:
        return await _fetch(url)
    except (ClientError, asyncio.TimeoutError, UnicodeError) as e:
        raise RuntimeError("ik kon die pagina niet openen (" + (type(e).__name__) + ")") from None


async def _fetch(url):
    async with ClientSession(timeout=ClientTimeout(total=20), headers={"User-Agent": "Mozilla/5.0 (Linux; Android 13) Kamiel/1.0", "Accept-Language": "nl,en;q=.8"}) as s:
        async with s.get(url, allow_redirects=True) as r:
            if r.status >= 400:
                raise RuntimeError(f"de site antwoordde met fout {r.status}")
            raw = await r.content.read(4_000_000)
            return raw.decode(r.charset or "utf-8", errors="replace")


# ---------- Gemini ----------
MODELS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]
GOOD = {"model": None}
SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"}, "servings": {"type": "STRING"},
        "ingredients": {"type": "ARRAY", "items": {"type": "STRING"}},
        "steps": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "text": {"type": "STRING"},
            "timers": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"minutes": {"type": "NUMBER"}, "label": {"type": "STRING"}}, "required": ["minutes"]}}},
            "required": ["text"]}},
        "is_recipe": {"type": "BOOLEAN"},
    },
    "required": ["title", "ingredients", "steps", "is_recipe"],
}
PROMPT = """Je bent de keukenhulp van Kamiel, een scherm in de keuken. Zet het recept hieronder (tekst en/of foto's) om naar JSON.
Regels:
- Schrijf alles in het Nederlands (vertaal als het recept in een andere taal is), in korte, duidelijke zinnen.
- ingredients: één ingrediënt per item, met hoeveelheid en eenheid zoals in het recept ("200 g spaghetti").
- steps: in de juiste volgorde, één handeling of een paar die samen horen per stap (liever 8 korte stappen dan 3 lange). Laat niets weg: elke hoeveelheid, temperatuur en tijd uit het recept moet ergens staan.
- timers: voor elke stap met een wachttijd (koken, bakken, laten rusten, marineren…) de minuten en een korte naam ("pasta", "oven"). Geen timer als er niet gewacht wordt.
- servings: zoals "4 personen", of leeg.
- is_recipe: false als het helemaal geen recept is.
Recept:
"""


async def gemini(key, prompt, images=(), model=None):
    try:
        return await _gemini(key, prompt, images, model)
    except (ClientError, asyncio.TimeoutError) as e:
        raise RuntimeError("Gemini is niet bereikbaar (" + type(e).__name__ + ")") from None


async def _gemini(key, prompt, images=(), model=None):
    """One call to Gemini with JSON output; tries the next model name when one doesn't exist (anymore)."""
    parts = [{"text": prompt}] + [{"inline_data": {"mime_type": mt, "data": base64.b64encode(b).decode()}} for b, mt in images]
    body = {"contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"responseMimeType": "application/json", "responseSchema": SCHEMA, "temperature": 0.2}}
    tried, last = [], ""
    order = [m for m in ([model] if model else []) + ([GOOD["model"]] if GOOD["model"] else []) + MODELS if m]
    async with ClientSession(timeout=ClientTimeout(total=90)) as s:
        for m in dict.fromkeys(order):
            tried.append(m)
            async with s.post(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent",
                              headers={"x-goog-api-key": key, "Content-Type": "application/json"}, json=body) as r:
                txt = await r.text()
                if r.status == 404:
                    last = f"model {m} bestaat niet"; continue
                if r.status in (400, 401, 403) and ("API key" in txt or "PERMISSION" in txt or "API_KEY" in txt):
                    raise RuntimeError("de Gemini-sleutel klopt niet of is niet actief")
                if r.status == 429:
                    raise RuntimeError("Gemini zegt dat de daglimiet bereikt is; probeer later of zonder AI")
                if r.status >= 400:
                    last = f"Gemini gaf fout {r.status}"; continue
                j = json.loads(txt)
                GOOD["model"] = m
                cand = (j.get("candidates") or [{}])[0]
                out = "".join(p.get("text", "") for p in ((cand.get("content") or {}).get("parts") or []))
                return json.loads(out), m
    raise RuntimeError(last or "Gemini antwoordde niet")


async def ai_recipe(key, text="", images=(), model=None):
    j, m = await gemini(key, PROMPT + (text or "(zie de foto's)"), images, model)
    if not j.get("is_recipe", True) and not j.get("steps"):
        raise ValueError("Gemini ziet hier geen recept in")
    steps = []
    for s in j.get("steps") or []:
        tm = []
        for t in s.get("timers") or []:
            try:
                sec = int(float(t.get("minutes")) * 60)
            except (TypeError, ValueError):
                continue
            if 20 <= sec <= 12 * 3600:
                tm.append({"sec": sec, "label": clean(t.get("label"))[:20] or f"{round(sec / 60)} min"})
        steps.append({"text": s.get("text", ""), "timers": tm[:3]})
    r = finish(j.get("title"), j.get("servings", ""), j.get("ingredients") or [], steps)
    r["ai"] = m
    return r


URL_RE = re.compile(r"https?://\S+", re.I)


def looks_like_recipe(text):
    """A long message with recipe words: probably a recipe (without /recept in front)."""
    t = text.lower()
    if len(t) < 220:
        return False
    hits = sum(1 for w in ("ingrediënt", "ingredient", "bereiding", "werkwijze", "eetlepel", " el ", " tl ", " gram", " g ", "minuten", "oven", "pan", "snipper", "roer", "kook", "bak") if w in t)
    return hits >= 3
