#!/usr/bin/env python3
"""Test 1: the verifier against planted errors. Ground truth: 'correct' must be kept, the three corruptions must not.
Each sentence is checked on its own against its single source (the factory's verifier prompt and code checks).
Thresholds for quote similarity and key-word share are tuned on the tune split and reported on the held-out split.
"""
import json
import pathlib
import sys
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "factory-test"))
import factory2 as f  # noqa: E402

items = json.loads((HERE / "data" / "verifier.json").read_text(encoding="utf-8"))
KINDS = ["correct", "number", "name", "exaggeration"]


def check(job):
    it, kind = job
    s = it["source"]
    m, _ = f.llm(f.VERIFIER, [{"role": "system", "content": f.VERIFIER_SYSTEM},
                              {"role": "user", "content": f"<sources>\n{f.sources_block([s])}\n</sources>\n<sentences>\n<sentence sid=\"s1\">{it[kind]}</sentence>\n</sentences>"}],
                 f.VERIFIER_SCHEMA, "verify", timeout=120)
    raw = m["content"]
    try:
        v = json.loads(raw)["results"][0]
        valid = True
    except (ValueError, IndexError, KeyError):
        v, valid = {"label": "unsupported", "source_id": None, "quote": None}, False
    out = {"source_id": it["source_id"], "split": it["split"], "kind": kind, "text": it[kind], "label": v["label"], "quote": v.get("quote"),
           "cited": v.get("source_id"), "json_valid": valid}
    if v["label"] == "supported" and v.get("quote"):
        nq = f.norm(v["quote"])
        out["verbatim"] = len(nq) >= 6 and nq in f.norm(s["text_ar"]) and v.get("source_id") == s["id"]
        kw = f.keywords(it[kind])
        out["keyword_share"] = round(len(kw & f.keywords(s["text_ar"])) / len(kw), 3) if kw else 0.0
    return out


jobs = [(it, k) for it in items for k in KINDS]
with ThreadPoolExecutor(8) as ex:
    rows = list(ex.map(check, jobs))
sup = [r for r in rows if r["label"] == "supported" and r.get("quote")]
vecs = f.embed([r["text"] for r in sup] + [r["quote"] for r in sup]) if sup else []
for i, r in enumerate(sup):
    r["quote_similarity"] = round(f.cos(vecs[i], vecs[len(sup) + i]), 3)


def outcome(r, qs, kw):
    """removed | flagged | kept  (as the factory would treat the sentence)"""
    if r["label"] == "unsupported":
        return "removed"
    if r["label"] == "supported":
        if not r.get("verbatim") or r.get("quote_similarity", 0) < qs or r.get("keyword_share", 0) < kw:
            return "removed"
        return "kept"
    return "flagged" if r["label"] == "general_religious" else "kept"


def score(subset, qs, kw):
    c = [r for r in subset if r["kind"] == "correct"]
    bad = [r for r in subset if r["kind"] != "correct"]
    false_reject = sum(outcome(r, qs, kw) == "removed" for r in c)
    caught = sum(outcome(r, qs, kw) == "removed" for r in bad)
    flagged = sum(outcome(r, qs, kw) == "flagged" for r in bad)
    return {"false_reject": false_reject, "correct_n": len(c), "caught": caught, "flagged": flagged, "corrupt_n": len(bad),
            "by_kind": {k: sum(outcome(r, qs, kw) == "removed" for r in bad if r["kind"] == k) for k in KINDS[1:]}}


tune = [r for r in rows if r["split"] == "tune"]
hold = [r for r in rows if r["split"] == "holdout"]
grid = []
for qs in [round(0.30 + 0.05 * i, 2) for i in range(11)]:
    for kw in [round(0.0 + 0.1 * i, 1) for i in range(8)]:
        s = score(tune, qs, kw)
        grid.append((s["caught"] - s["false_reject"] * 2, -s["false_reject"], qs, kw))
best = max(grid)
QS, KW = best[2], best[3]
res = {"chosen": {"quote_similarity": QS, "keyword_share": KW}, "tune": score(tune, QS, KW), "holdout": score(hold, QS, KW),
       "holdout_current_factory": score(hold, 0.55, 0.4), "model_only_holdout": {
           "correct_labelled_unsupported": sum(r["label"] == "unsupported" for r in hold if r["kind"] == "correct"),
           "corrupt_labelled_unsupported": sum(r["label"] == "unsupported" for r in hold if r["kind"] != "correct")},
       "json_valid": sum(r["json_valid"] for r in rows), "calls": len(rows), "rows": rows}
(HERE / "t1-results.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps({k: v for k, v in res.items() if k != "rows"}, ensure_ascii=False, indent=1))
