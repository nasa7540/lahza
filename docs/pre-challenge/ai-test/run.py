#!/usr/bin/env python3
"""Measures the Lahza AI path on the current six-journey draft. Throwaway, outside the repo.

Writes results.json next to this file; report.py turns it into report.md.
No sacred text is sent to any model: the classifier sees journey titles and one-line
descriptions, the grader sees key points and misconceptions, embeddings see questions.
"""
import json
import math
import pathlib
import re
import socket
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from cases import FATWA_RULES, GRADER, HARD, JOURNEY_LIST, ROUTING

HERE = pathlib.Path(__file__).parent
CONTENT = HERE.parent / "content" / "journeys"
KEY = next(l.split("=", 1)[1].strip() for l in (pathlib.Path.home() / "lahza" / ".env.local").read_text().splitlines() if l.startswith("LLM_API_KEY="))
BASE = "https://openrouter.ai/api/v1"
PRIMARY, FALLBACK, EMBED = "qwen/qwen3.7-flash", "qwen/qwen3.7-plus", "baai/bge-m3"
TIMEOUT = 8
RUNS = 3

CLASSIFIER_SYSTEM = """You route questions from non-Muslim employees in Saudi Arabia to short learning journeys about Islamic moments at work.
You never answer the question. You only classify it.
Levels: A = stable basic facts; B = explanation of a concept or common question; C = scholarly disagreement or highly sensitive; D = asks for a ruling on the user's own personal situation (fatwa).
Pick journey_id ONLY from the provided list, or null if none clearly fits. Do not invent ids.
If the text is hostile, still classify the underlying question calmly.
Return JSON only, matching the schema. No prose."""
CLASSIFIER_SCHEMA = {"type": "object", "additionalProperties": False, "required": ["level", "lang", "journey_id", "confidence", "reason"],
                     "properties": {"level": {"type": "string", "enum": ["A", "B", "C", "D"]}, "lang": {"type": "string", "enum": ["en", "ar", "ur", "other"]},
                                    "journey_id": {"type": ["string", "null"]}, "confidence": {"type": "number"}, "reason": {"type": "string"}}}

# Spec prompt plus the scoring rubric the user approved on 2026-10-02.
GRADER_SYSTEM = """You check whether a learner's one-sentence explanation captures the key points of a lesson.
Use ONLY the provided key point ids and misconception ids. Never add facts.
Be generous with wording; judge meaning. Return JSON only.
covered: ids of key points the sentence clearly expresses. Do not credit a key point the sentence does not mention.
missing: exactly ONE key point id that is not covered (the most important one), or null if all are covered.
misconception: ONE misconception id the sentence asserts, or null.
score: 5 = all key points covered, no misconception; 4 = most key points covered; 3 = about half; 2 = only a fragment; 1 = nothing relevant, or it asserts a misconception."""
GRADER_SCHEMA = {"type": "object", "additionalProperties": False, "required": ["covered", "missing", "misconception", "score"],
                 "properties": {"covered": {"type": "array", "items": {"type": "string"}}, "missing": {"type": ["string", "null"]},
                                "misconception": {"type": ["string", "null"]}, "score": {"type": "integer", "enum": [1, 2, 3, 4, 5]}}}

JOURNEY_IDS = [j[0] for j in JOURNEY_LIST]
JOURNEY_TEXT = "\n".join(f"- {i}: {t} — {d}" for i, t, d in JOURNEY_LIST)


def post(path, body):
    req = urllib.request.Request(BASE + path, json.dumps(body).encode(), {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.load(r)


def chat(system, user, schema, name):
    """Primary model with an 8 s timeout, then one retry on the fallback model. Returns raw text + call metadata."""
    meta = {"attempts": [], "model": None, "raw": None, "error": None}
    start = time.time()
    for model in (PRIMARY, FALLBACK):
        t = time.time()
        try:
            r = post("/chat/completions", {"model": model, "temperature": 0, "reasoning": {"enabled": False},
                                           "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                                           "response_format": {"type": "json_schema", "json_schema": {"name": name, "strict": True, "schema": schema}}})
            raw = r["choices"][0]["message"]["content"]
            meta["attempts"].append({"model": model, "ok": True, "seconds": round(time.time() - t, 2)})
            meta.update(model=model, raw=raw)
            break
        except (urllib.error.URLError, socket.timeout, TimeoutError, KeyError, ValueError, ConnectionError) as e:
            detail = f"{type(e).__name__}: {getattr(e, 'code', '')} {getattr(e, 'reason', e)}"[:160]
            meta["attempts"].append({"model": model, "ok": False, "seconds": round(time.time() - t, 2), "error": detail})
            meta["error"] = detail
    meta["seconds"] = round(time.time() - start, 2)
    return meta


def valid_classifier(raw):
    try:
        o = json.loads(raw)
    except (TypeError, ValueError):
        return None
    ok = (isinstance(o, dict) and o.get("level") in "ABCD" and len(str(o.get("level"))) == 1 and (o.get("journey_id") is None or o.get("journey_id") in JOURNEY_IDS)
          and isinstance(o.get("confidence"), (int, float)) and not isinstance(o.get("confidence"), bool) and 0 <= o["confidence"] <= 1)
    return o if ok else None


def valid_grade(raw, kps, mcs):
    try:
        o = json.loads(raw)
    except (TypeError, ValueError):
        return None
    ok = (isinstance(o, dict) and isinstance(o.get("covered"), list) and all(c in kps for c in o["covered"])
          and (o.get("missing") is None or o["missing"] in kps) and (o.get("misconception") is None or o["misconception"] in mcs)
          and o.get("score") in (1, 2, 3, 4, 5) and not isinstance(o.get("score"), bool))
    return o if ok else None


def lenient(raw):
    """What a cleanup step would recover: strip code fences, map "null"/"none" strings to null."""
    try:
        o = json.loads(re.sub(r"^```(?:json)?|```$", "", (raw or "").strip()).strip())
    except ValueError:
        return None
    if isinstance(o, dict):
        for k in ("journey_id", "missing", "misconception"):
            if isinstance(o.get(k), str) and o[k].strip().lower() in ("null", "none", ""):
                o[k] = None
    return o


def embed(texts):
    out, t = [], time.time()
    for i in range(0, len(texts), 48):
        r = None
        for _ in range(3):
            try:
                r = post("/embeddings", {"model": EMBED, "input": texts[i:i + 48]})
                break
            except Exception:
                time.sleep(2)
        out += [d["embedding"] for d in sorted(r["data"], key=lambda d: d["index"])]
    return out, round(time.time() - t, 2)


def cos(a, b):
    return sum(x * y for x, y in zip(a, b)) / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))


def main():
    journeys = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in CONTENT.glob("*.json")}

    # ---------- routing ----------
    variants = [(jid, lang, q) for jid, j in journeys.items() for lang, qs in j["card"]["question_variants"].items() for q in qs]
    vecs, embed_seconds = embed([v[2] for v in variants] + [r[3] for r in ROUTING])
    vvec, qvec = vecs[:len(variants)], vecs[len(variants):]
    t0 = time.time()
    single, _ = embed([ROUTING[0][3]])
    single_embed_seconds = round(time.time() - t0, 2)

    def route(i):
        group, lang, expected, text = ROUTING[i]
        sims = sorted(((cos(qvec[i], vvec[k]), variants[k][0], variants[k][1], variants[k][2]) for k in range(len(variants))), reverse=True)
        per_journey = {}
        for s, jid, _, _ in sims:
            per_journey.setdefault(jid, s)
        rule = next((p for p in FATWA_RULES if re.search(p, text, re.I)), None)
        runs = []
        for _ in range(RUNS):
            m = chat(CLASSIFIER_SYSTEM, f"Journeys:\n{JOURNEY_TEXT}\n\nQuestion:\n{text}", CLASSIFIER_SCHEMA, "route")
            strict = valid_classifier(m["raw"])
            m["valid_raw"] = strict is not None
            m["parsed"] = strict or lenient(m["raw"])
            runs.append(m)
        return {"i": i, "group": group, "lang": lang, "expected": expected, "text": text, "rule": rule,
                "top": {"journey": sims[0][1], "sim": round(sims[0][0], 4), "variant_lang": sims[0][2], "variant": sims[0][3]},
                "sims": {k: round(v, 4) for k, v in per_journey.items()}, "runs": runs}

    with ThreadPoolExecutor(6) as ex:
        routing = list(ex.map(route, range(len(ROUTING))))
    print("routing done", len(routing))

    # ---------- grader ----------
    jobs = []
    for jid, levels in GRADER.items():
        for exp_score, exp_cov, exp_mc, texts in levels:
            for lang, text in texts.items():
                jobs.append({"journey": jid, "kind": "ladder", "lang": lang, "text": text, "expected_score": exp_score, "expected_covered": exp_cov, "expected_misconception": exp_mc})
    for jid, kind, lang, text in HARD:
        jobs.append({"journey": jid, "kind": kind, "lang": lang, "text": text if text is not None else journeys[jid]["locales"][lang]["scene"],
                     "expected_score": None, "expected_covered": None, "expected_misconception": None})

    def grade(job):
        card = journeys[job["journey"]]["card"]
        kps = {k["id"]: k["en"] for k in card["key_points"]}
        mcs = {m["id"]: m["en"] for m in card["misconceptions"]}
        ctx = ("Key points:\n" + "\n".join(f"- {k}: {v}" for k, v in kps.items()) + "\nMisconceptions:\n"
               + "\n".join(f"- {k}: {v}" for k, v in mcs.items()) + "\n\nLearner sentence:\n" + job["text"])
        runs = []
        for _ in range(RUNS):
            m = chat(GRADER_SYSTEM, ctx, GRADER_SCHEMA, "grade")
            strict = valid_grade(m["raw"], kps, mcs)
            m["valid_raw"] = strict is not None
            m["parsed"] = strict or lenient(m["raw"])
            runs.append(m)
        return {**job, "runs": runs}

    with ThreadPoolExecutor(6) as ex:
        grading = list(ex.map(grade, jobs))
    print("grading done", len(grading))

    (HERE / "results.json").write_text(json.dumps({
        "date": time.strftime("%Y-%m-%d %H:%M"), "primary": PRIMARY, "fallback": FALLBACK, "embed": EMBED, "timeout": TIMEOUT, "runs": RUNS,
        "variants": len(variants), "embed_batch_seconds": embed_seconds, "embed_single_seconds": single_embed_seconds,
        "routing": routing, "grading": grading}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote results.json")


if __name__ == "__main__":
    main()
