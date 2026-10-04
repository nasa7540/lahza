#!/usr/bin/env python3
"""Test 2, part 2: lexical (normalised) vs bge-m3 vectors vs both fused, on Qur'an QA 2023.
Fusion: reciprocal rank fusion of the top 50 of each. Also: does the vector similarity separate no-answer questions?
Reads the embeddings t2_qqa.py saved; makes no model calls.
"""
import json
import math
import pathlib

import t2_qqa as t

HERE = pathlib.Path(__file__).parent
D = t.D


def load_emb(name, n):
    done = {}
    for l in (D / f"emb_{name}.jsonl").read_text().splitlines():
        o = json.loads(l)
        done[o["i"]] = o["v"]
    if len(done) != n:
        raise SystemExit(f"embeddings for {name} incomplete: {len(done)}/{n}")
    return [done[i] for i in range(n)]


qs = t.load()
V = t.VERSES
ve = load_emb("verses", len(V))
qe = load_emb("questions", len(qs))
norms = [math.sqrt(sum(x * x for x in v)) for v in ve]


def vec_rank(qv, k=50):
    qn = math.sqrt(sum(x * x for x in qv))
    sc = sorted(((sum(a * b for a, b in zip(qv, v)) / (qn * n), i) for i, (v, n) in enumerate(zip(ve, norms))), reverse=True)[:k]
    return [(i, s) for s, i in sc]


bm = t.BM25([t.tok_b(v["ar"]) for v in V])
lex = {q["id"]: bm.search(t.tok_b(q["q"]), 50) for q in qs}
vec = {q["id"]: vec_rank(qe[k]) for k, q in enumerate(qs)}


def rrf(a, b, k=60, top=10):
    score = {}
    for lst in (a, b):
        for rank, (i, _) in enumerate(lst, 1):
            score[i] = score.get(i, 0.0) + 1 / (k + rank)
    return sorted(score.items(), key=lambda x: -x[1])[:top]


hyb = {q["id"]: rrf(lex[q["id"]], vec[q["id"]]) for q in qs}
hold = [q for q in qs if q["split"] == "holdout"]
res = {"source": "Qur'an QA 2023 shared task, Task A (AyaTEC v1.2), CC BY-NC-ND 4.0, used as published", "systems": {}}
for name, ranked in (("lexical_normalised", lex), ("bge_m3", vec), ("hybrid_rrf", hyb)):
    res["systems"][name] = {"all": t.metrics(qs, ranked), "holdout": t.metrics(hold, ranked)}
res["no_answer_by_vector_similarity"] = t.no_answer(qs, vec)
top = {q["id"]: vec[q["id"]][0][1] for q in qs}
res["vector_top_similarity"] = {"answerable": sorted(round(top[q["id"]], 3) for q in qs if q["answerable"]), "no_answer": sorted(round(top[q["id"]], 3) for q in qs if not q["answerable"])}
res["misses_holdout_hybrid"] = [{"id": q["id"], "q": q["q"], "gold": q["gold"], "top5": [f"{V[i]['s']}:{V[i]['a']}" for i, _ in hyb[q["id"]][:5]]}
                                for q in hold if q["answerable"] and not any(t.is_hit(i, q["gold"]) for i, _ in hyb[q["id"]][:5])]
# English sample, if translations and their embeddings exist
enp = D / "questions_en.jsonl"
if enp.exists() and (D / "emb_questions_en.jsonl").exists():
    en = {json.loads(l)["id"]: json.loads(l)["en"] for l in enp.read_text().splitlines()}
    sub = [q for q in qs if q["id"] in en]  # same order t2_qqa.py used when it embedded the English questions
    eq = load_emb("questions_en", len(sub))
    e = t.BM25([t.tok_en(v["en"]) for v in V])
    lex_en = {q["id"]: e.search(t.tok_en(en[q["id"]]), 50) for q in sub}
    vec_en = {q["id"]: vec_rank(eq[k]) for k, q in enumerate(sub)}
    hyb_en = {q["id"]: rrf(lex_en[q["id"]], vec_en[q["id"]]) for q in sub}
    res["english_sample"] = {"n": len(sub), "note": "questions machine-translated by google/gemini-2.5-flash, not reviewed",
                             "lexical_on_rowwad_translation": t.metrics(sub, lex_en), "bge_m3_english_question_vs_arabic_verses": t.metrics(sub, vec_en), "hybrid_rrf": t.metrics(sub, hyb_en)}
(HERE / "t2-hybrid-results.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps({k: v for k, v in res.items() if k not in ("vector_top_similarity", "misses_holdout_hybrid")}, ensure_ascii=False, indent=1))
va, vn = res["vector_top_similarity"]["answerable"], res["vector_top_similarity"]["no_answer"]
print("vector top-1 similarity — answerable: min", va[0], "median", va[len(va) // 2], "max", va[-1], "| no-answer: min", vn[0], "median", vn[len(vn) // 2], "max", vn[-1])
