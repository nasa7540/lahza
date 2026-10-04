#!/usr/bin/env python3
"""Builds local lookup indexes for the factory experiment (no model involved):
  idx/quran.json  — every verse: Arabic text (King Fahd Complex script via quranenc) + Rowwad English
  idx/terms.json  — every term title in the Islamic terminology encyclopedia (definitions fetched on demand)
"""
import json
import pathlib
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).parent
IDX = HERE / "idx"
UA = {"User-Agent": "lahza-factory-test/0.1"}
DIACRITICS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")


def get(url):
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except Exception:  # noqa: BLE001
            continue
    raise RuntimeError(url)


def norm_ar(t):
    t = DIACRITICS.sub("", t or "")
    t = re.sub("[إأآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه").replace("ۡ", "")
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", t)).strip()


def sura(n):
    rows = get(f"https://quranenc.com/api/v1/translation/sura/english_rwwad/{n}")["result"]
    return [{"s": int(r["sura"]), "a": int(r["aya"]), "ar": r["arabic_text"], "en": re.sub(r"\[\d+\]", "", r["translation"]),
             "nar": norm_ar(r["arabic_text"]), "nen": r["translation"].lower()} for r in rows]


def main():
    IDX.mkdir(exist_ok=True)
    with ThreadPoolExecutor(8) as ex:
        verses = [v for rows in ex.map(sura, range(1, 115)) for v in rows]
    (IDX / "quran.json").write_text(json.dumps(verses, ensure_ascii=False), encoding="utf-8")
    print("verses", len(verses))

    terms = {}
    for c in get("https://terminologyenc.com/api/v1/categories/list/?language=ar"):
        page = 1
        while True:
            r = get(f"https://terminologyenc.com/api/v1/terms/list/?language=ar&category_id={c['id']}&page={page}&per_page=100")
            for t in r.get("data", []):
                terms[t["id"]] = {"id": t["id"], "term": t["term"], "n": norm_ar(t["term"]), "has_en": "en" in (t.get("translations") or [])}
            if page >= int(r.get("meta", {}).get("last_page", 1) or 1):
                break
            page += 1
    (IDX / "terms.json").write_text(json.dumps(list(terms.values()), ensure_ascii=False), encoding="utf-8")
    print("terms", len(terms))


if __name__ == "__main__":
    main()
