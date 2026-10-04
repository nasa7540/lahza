#!/usr/bin/env python3
"""Turns journeys-draft.md into content JSON and fetches source texts verbatim.

Throwaway content-preparation helper; lives outside the repo. Sacred texts are
copied byte-for-byte from quranenc.com / hadeethenc.com and never pass through
a language model. Everything is written with verified=false.

Usage: python3 build-content.py            (reads journeys-draft.md next to it)
"""
import datetime
import hashlib
import json
import pathlib
import re
import sys
import urllib.request

HERE = pathlib.Path(__file__).parent
OUT = HERE / "content"
PROTOTYPE = pathlib.Path.home() / "Downloads" / "lahza-prototype.html"
TODAY = datetime.date.today().isoformat()

LEVELS = {"أ": "A", "ب": "B", "ج": "C", "د": "D"}
WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]  # same numbering as JS Date.getDay()


def parse_when(text):
    """`always` | `weekday fri [sat ...]` | `hijri 9/1-9/30[, 12/10-12/13]` -> dict."""
    text = text.strip()
    if text == "always":
        return {"type": "always"}
    kind, _, rest = text.partition(" ")
    if kind == "weekday":
        days = rest.split()
        if not days or any(d not in WEEKDAYS for d in days):
            raise SystemExit(f"bad weekday in when: {text}")
        return {"type": "weekday", "weekdays": [WEEKDAYS.index(d) for d in days]}
    if kind == "hijri":
        windows = []
        for part in rest.split(","):
            m = re.fullmatch(r"\s*(\d{1,2})/(\d{1,2})\s*-\s*(\d{1,2})/(\d{1,2})\s*", part)
            if not m:
                raise SystemExit(f"bad hijri window in when: {part!r}")
            fm, fd, tm, td = map(int, m.groups())
            if not (1 <= fm <= 12 and 1 <= tm <= 12 and 1 <= fd <= 30 and 1 <= td <= 30 and (fm, fd) <= (tm, td)):
                raise SystemExit(f"hijri window out of range: {part!r}")
            windows.append({"from": {"month": fm, "day": fd}, "to": {"month": tm, "day": td}})
        return {"type": "hijri", "windows": windows}
    raise SystemExit(f"unknown when: {text}")
# journey -> source ids, in display order
SOURCES_FOR = {
    "ramadan": ["quran-2-183"],
    "prayer": ["quran-4-103"],
    "friday": ["quran-62-9"],
    "eid": ["hadith-hadeethenc-5322"],
    "team-dinner": ["quran-2-173", "quran-5-90"],
    "inshallah": ["quran-18-23", "quran-18-24"],
}
QURAN = {
    "quran-2-183": (2, 183, "Al-Baqarah", "البقرة"),
    "quran-4-103": (4, 103, "An-Nisa", "النساء"),
    "quran-62-9": (62, 9, "Al-Jumu'ah", "الجمعة"),
    "quran-2-173": (2, 173, "Al-Baqarah", "البقرة"),
    "quran-5-90": (5, 90, "Al-Ma'idah", "المائدة"),
    "quran-18-23": (18, 23, "Al-Kahf", "الكهف"),
    "quran-18-24": (18, 24, "Al-Kahf", "الكهف"),
}
TRANSLATIONS = {"en": "english_rwwad", "ur": "urdu_junagarhi"}
HADITH_ID = 5322

LABELS = {
    "ar": dict(title="العنوان", teaser="التشويق", scene="المشهد", options="الخيارات", reveals="الكشف",
               explanation="الشرح المبسط (مسودة)", explain="اشرحها بكلماتك", tip="نصيحة للدوام",
               kps="نقاط الفهم", variants="أسئلة الأمثلة", picked="اخترت: «{}»"),
    "en": dict(title="Title", teaser="Teaser", scene="Scene", options="Options", reveals="Reveals",
               explanation="Simplified explanation (draft)", explain="Explain prompt", tip="Tip",
               kps="Key points", variants="Question variants", picked='You picked: "{}"'),
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "lahza-content/0.1"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def field(block, label):
    m = re.search(r"\*\*" + re.escape(label) + r":\*\*[ \t]*(.*)", block)
    if not m:
        raise SystemExit(f"missing field: {label}")
    return m.group(1).strip()


def section(block, label):
    """Text after a '**label:**' line up to the next blank-line-separated bold label."""
    m = re.search(r"\*\*" + re.escape(label) + r":\*\*[^\n]*\n(.*?)(?=\n\*\*|\n⚠️|\n###|\n---|\Z)", block, re.S)
    if not m:
        raise SystemExit(f"missing section: {label}")
    return m.group(1)


def parse_locale(block, lang):
    L = LABELS[lang]
    options = [{"id": i, "label": t.strip()} for i, t in re.findall(r"\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|", section(block, L["options"]))]
    labels = {o["id"]: o["label"] for o in options}
    reveals = {}
    for oid, head, body in re.findall(r"- \*\*`([^`]+)`\*\* — \*(.+?)\* (.+)", section(block, L["reveals"])):
        reveals[oid] = {"picked": L["picked"].format(labels[oid]), "headline": head.strip(), "body": body.strip()}
    if set(reveals) != set(labels) or len(options) != 4:
        raise SystemExit(f"{lang}: options/reveals mismatch {sorted(labels)} vs {sorted(reveals)}")
    tip_line = field(block, L["tip"])
    tm = re.match(r"\*(.+?)\*\s*(.*)", tip_line)
    tip_items = re.findall(r"^- (.+)$", section(block, L["tip"]), re.M)
    kps = re.findall(r"^- `(kp\d+)` (.+)$", section(block, L["kps"]), re.M)
    variants = re.findall(r"^\d+\. (.+)$", section(block, L["variants"]), re.M)
    if len(kps) != 3 or len(variants) != 5 or not tip_items:
        raise SystemExit(f"{lang}: expected 3 key points / 5 variants / tip items, got {len(kps)}/{len(variants)}/{len(tip_items)}")
    content = {
        "title": field(block, L["title"]),
        "teaser": field(block, L["teaser"]),
        "scene": field(block, L["scene"]),
        "options": options,
        "reveals": reveals,
        "explain_prompt": field(block, L["explain"]),
        "tip": {"headline": tm.group(1).strip(), "lead": tm.group(2).strip(), "items": [t.strip() for t in tip_items]},
    }
    return content, field(block, L["explanation"]), dict(kps), variants


def parse_urdu_additions(block):
    opt = re.search(r"`m-culture` \(الخيار\):\*\* (.+)", block).group(1).strip()
    rv = re.search(r"`m-culture` \(الكشف\):\*\* \*(.+?)\* (.+)", block)
    kps = dict(re.findall(r"^- `(kp\d+)` (.+)$", block, re.M))
    variants = re.findall(r"^\d+\. (.+)$", block, re.M)
    return opt, (rv.group(1).strip(), rv.group(2).strip()), kps, variants


def urdu_from_prototype():
    """Ramadan Urdu strings as written in the design prototype (no reviewer; disclosed)."""
    src = PROTOTYPE.read_text(encoding="utf-8")
    ur = src[src.index("ur: {"):src.index("const I = {")]

    def s(key):
        return re.search(r"\b" + key + r": '([^']*)'", ur).group(1)

    def arr(key):
        return re.findall(r"'([^']*)'", re.search(r"\b" + key + r": \[(.*?)\]", ur).group(1))

    return s, arr


def build_sources():
    meta = {}
    for lang, key in TRANSLATIONS.items():
        for t in get(f"https://quranenc.com/api/v1/translations/list/{lang}")["translations"]:
            if t["key"] == key:
                meta[lang] = t
    sources = []
    for sid, (sura, aya, name_en, name_ar) in QURAN.items():
        tr, text_ar = {}, None
        for lang, key in TRANSLATIONS.items():
            r = get(f"https://quranenc.com/api/v1/translation/aya/{key}/{sura}/{aya}")["result"]
            text_ar = text_ar or r["arabic_text"]
            if r["arabic_text"] != text_ar:
                raise SystemExit(f"{sid}: Arabic text differs between translations")
            tr[lang] = {"text": r["translation"], "footnotes": r.get("footnotes") or "", "translator": meta[lang]["title"],
                        "translation_key": key, "translation_version": meta[lang]["version"]}
        sources.append({"id": sid, "kind": "quran", "text_ar": text_ar, "translations": tr,
                        "reference": f"{name_en} {sura}:{aya}", "reference_ar": f"{name_ar} {sura}:{aya}", "grade": None,
                        "source_url": f"https://quranenc.com/en/browse/{TRANSLATIONS['en']}/{sura}/{aya}"})
    h = {lang: get(f"https://hadeethenc.com/api/v1/hadeeths/one/?language={lang}&id={HADITH_ID}") for lang in ("ar", "en", "ur")}
    sources.append({"id": f"hadith-hadeethenc-{HADITH_ID}", "kind": "hadith", "text_ar": h["ar"]["hadeeth"],
                    "translations": {lang: {"text": h[lang]["hadeeth"], "footnotes": "", "translator": "HadeethEnc.com",
                                            "translation_key": f"hadeethenc-{lang}", "translation_version": None,
                                            "grade": h[lang]["grade"], "attribution": h[lang]["attribution"]} for lang in ("en", "ur")},
                    "reference": h["en"]["attribution"], "reference_ar": h["ar"]["attribution"], "grade": h["ar"]["grade"],
                    "source_url": f"https://hadeethenc.com/ar/browse/hadith/{HADITH_ID}"})
    for s in sources:
        payload = s["text_ar"] + json.dumps(s["translations"], ensure_ascii=False, sort_keys=True)
        s.update(verified=False, verified_by=None, verified_at=None, fetched_at=TODAY,
                 content_hash=hashlib.sha256(payload.encode("utf-8")).hexdigest())
    return sources


def main():
    md = (HERE / "journeys-draft.md").read_text(encoding="utf-8")
    md = md[:md.index("## ملخص ما يحتاج قرارك")]
    journeys = []
    for n, chunk in enumerate(re.split(r"\n## (?=\d+\. )", md)[1:], start=1):
        head = chunk.splitlines()[0]
        jid = re.search(r"`([^`]+)`", head).group(1)
        level = LEVELS[re.search(r"المستوى (\S)", head).group(1)]
        when = parse_when(re.search(r"\*\*التوقيت \(`when`\):\*\* `([^`]+)`", chunk).group(1))
        parts = re.split(r"\n### ", chunk)
        blocks = {"ar": next(p for p in parts if p.startswith("عربي")), "en": next(p for p in parts if p.startswith("English"))}
        locales, explanation, key_points, variants = {}, {}, {}, {}
        for lang in ("en", "ar"):
            locales[lang], explanation[lang], kp, variants[lang] = parse_locale(blocks[lang], lang)
            for k, v in kp.items():
                key_points.setdefault(k, {"id": k})[lang] = v
        misconceptions = [{"id": o["id"], "en": o["label"], "ar": next(a["label"] for a in locales["ar"]["options"] if a["id"] == o["id"])}
                          for o in locales["en"]["options"]]
        if jid == "ramadan":
            s, arr = urdu_from_prototype()
            opt, (rh, rb), ukp, uvar = parse_urdu_additions(next(p for p in parts if p.startswith("اردو")))
            labels = {"m-diet": s("oDiet"), "m-punish": s("oPunish"), "m-upset": s("oUpset"), "m-culture": opt}
            reveals = {f"m-{k}": {"picked": arr(f"r_{k}")[0], "headline": arr(f"r_{k}")[1], "body": arr(f"r_{k}")[2]} for k in ("diet", "punish", "upset")}
            reveals["m-culture"] = {"picked": f"آپ نے چنا: «{opt}»", "headline": rh, "body": rb}
            locales["ur"] = {"title": s("mRamadan"), "teaser": s("upT1") + s("upT2") + s("upT3") + " " + s("upB"), "scene": s("sceneQ"),
                             "options": [{"id": i, "label": l} for i, l in labels.items()], "reveals": reveals, "explain_prompt": s("eH"),
                             "tip": {"headline": s("tH"), "lead": s("tB1") + s("tKareem") + s("tB2"), "items": [s("t1"), s("t2"), s("t3")]}}
            explanation["ur"] = s("expl")
            variants["ur"] = uvar
            for k, v in ukp.items():
                key_points[k]["ur"] = v
            for m in misconceptions:
                m["ur"] = labels[m["id"]]
        journeys.append({
            "id": jid, "level": level, "sort": n, "when": when, "locales": locales, "card_id": f"card-{jid}-1",
            "card": {"id": f"card-{jid}-1", "journey_id": jid, "source_ids": SOURCES_FOR[jid], "explanation": explanation,
                     "generated_by": "claude-draft", "reviewed": False, "reviewed_by": None,
                     "key_points": list(key_points.values()), "misconceptions": misconceptions, "question_variants": variants},
        })
    if [j["id"] for j in journeys] != list(SOURCES_FOR):
        raise SystemExit("journey ids do not match the expected six")

    sources = build_sources()
    known = {s["id"] for s in sources}
    for j in journeys:
        missing = [i for i in j["card"]["source_ids"] if i not in known]
        if missing:
            raise SystemExit(f"{j['id']}: unknown sources {missing}")

    (OUT / "journeys").mkdir(parents=True, exist_ok=True)
    for j in journeys:
        (OUT / "journeys" / f"{j['id']}.json").write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(journeys)} journeys and {len(sources)} sources to {OUT}")
    import subprocess
    subprocess.run([sys.executable, str(HERE / "build-review.py")], check=True)
    for j in journeys:
        print(f"  {j['id']:12} when {json.dumps(j['when'])}")
        print(f"  {j['id']:12} level {j['level']} locales {','.join(j['locales'])} sources {','.join(j['card']['source_ids'])}")


if __name__ == "__main__":
    sys.exit(main())
