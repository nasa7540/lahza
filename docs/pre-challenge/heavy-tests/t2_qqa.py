#!/usr/bin/env python3
"""Test 2: Qur'an verse retrieval on the Qur'an QA 2023 shared-task data (AyaTEC v1.2, Task A).

Data: https://gitlab.com/bigirqu/quran-qa-2023 — used as published, not modified, not redistributed.
License: CC BY-NC-ND 4.0 (see data/qqa23/LICENSE.txt). 251 Arabic questions, human relevance judgements
(question -> Qur'anic passages "sura:from-to"); 37 questions have no answer in the Qur'an ("-1").

A retrieved verse is a hit when it falls inside any gold passage. Metrics: Hit@5 and MRR@10.
Indexes compared: (A) lexical over the Uthmani text with diacritics removed, (B) lexical over a normalised
text, (C) bge-m3 embeddings. No-answer questions: the top score should be low; the cut-off is tuned on
train+dev and reported on the official test split.

Long-running parts save every item as it finishes and resume where they stopped; short timeouts, low concurrency.
"""
import json
import math
import pathlib
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).parent
D = HERE / "data" / "qqa23"
KEY = next(l.split("=", 1)[1].strip() for l in (pathlib.Path.home() / "lahza" / ".env.local").read_text().splitlines() if l.startswith("LLM_API_KEY="))
VERSES = json.loads((HERE.parent / "factory-test" / "idx" / "quran.json").read_text(encoding="utf-8"))
HARAKAT = re.compile(r"[ؐ-ًؚ-ٟۖ-ۭـ]")  # keeps the dagger alef (U+0670) for the normaliser
STOP = set("في من على الى إلى عن مع هذا هذه ذلك التي الذي الذين ان أن إن كان كانت او أو ثم كما لا ما لم لن قد هو هي هم كل عند بين حتى هل ماذا لماذا كيف متى اين أين كم اي أي ام أم ولا وما".split())


def post(path, body, timeout=45):
    req = urllib.request.Request("https://openrouter.ai/api/v1" + path, json.dumps(body).encode(), {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


# ---------- text forms ----------
def uthmani(t):
    """Index A: the Uthmani text with diacritics and the dagger alef removed, nothing else."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", HARAKAT.sub("", t).replace("ٰ", ""))).strip()


def normalised(t):
    """Index B: approximate everyday spelling, then unify letter forms."""
    t = t.replace("وٰة", "اة").replace("ٰ", "ا")          # الصلوٰة -> الصلاة ; dagger alef -> alef
    t = HARAKAT.sub("", t)
    t = t.replace("ٱ", "ا").replace("ءا", "ا")
    t = re.sub("[إأآ]", "ا", t).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    t = re.sub(r"اا+", "ا", t)
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", t)).strip()


def stem(w):
    for p in ("وال", "بال", "فال", "كال", "لل", "ال"):
        if w.startswith(p) and len(w) - len(p) >= 3:
            return w[len(p):]
    if w[:1] in "وفبل" and len(w) >= 5:
        return w[1:]
    return w


def tok_a(t):
    return [w for w in uthmani(t).split() if len(w) >= 2 and w not in STOP]


def tok_b(t):
    return [stem(w) for w in normalised(t).split() if len(w) >= 2 and w not in {normalised(s) for s in STOP}]


def tok_en(t):
    return [w for w in re.findall(r"[a-z]+", t.lower()) if len(w) >= 3 and w not in {"the", "and", "who", "what", "which", "did", "does", "how", "was", "were", "are", "for", "that", "this", "with", "from", "why", "when", "where", "his", "her", "their", "has", "have", "had", "not", "will", "you", "they", "them"}]


class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.docs, self.k1, self.b = docs, k1, b
        self.avg = sum(len(d) for d in docs) / len(docs)
        self.inv = {}
        for i, d in enumerate(docs):
            tf = {}
            for w in d:
                tf[w] = tf.get(w, 0) + 1
            for w, c in tf.items():
                self.inv.setdefault(w, []).append((i, c))
        self.n = len(docs)

    def search(self, q, k=10):
        scores = {}
        for w in set(q):
            post_ = self.inv.get(w)
            if not post_:
                continue
            idf = math.log(1 + (self.n - len(post_) + 0.5) / (len(post_) + 0.5))
            for i, c in post_:
                scores[i] = scores.get(i, 0.0) + idf * c * (self.k1 + 1) / (c + self.k1 * (1 - self.b + self.b * len(self.docs[i]) / self.avg))
        return sorted(scores.items(), key=lambda x: -x[1])[:k]


# ---------- data ----------
def load():
    qs = []
    for split in ("train", "dev", "test"):
        rel = {}
        for l in (D / f"qrels_{split}.gold").read_text().splitlines():
            p = l.split()
            if len(p) >= 4:
                rel.setdefault(p[0], []).append(p[2])
        for l in (D / f"q_{split}.tsv").read_text(encoding="utf-8").splitlines():
            if l.strip():
                qid, text = l.split("\t", 1)
                gold = rel.get(qid)
                if gold is None:
                    continue
                qs.append({"id": qid, "q": text.strip(), "gold": gold, "answerable": gold != ["-1"], "split": "holdout" if split == "test" else "tune"})
    return qs


def is_hit(vi, gold):
    v = VERSES[vi]
    for g in gold:
        m = re.fullmatch(r"(\d+):(\d+)-(\d+)", g)
        if m and v["s"] == int(m.group(1)) and int(m.group(2)) <= v["a"] <= int(m.group(3)):
            return True
    return False


# ---------- resumable embeddings ----------
def embed_all(name, texts, batch=48):
    path = D / f"emb_{name}.jsonl"
    done = {}
    if path.exists():
        for l in path.read_text().splitlines():
            o = json.loads(l)
            done[o["i"]] = o["v"]
    todo = [i for i in range(len(texts)) if i not in done]
    batches = [todo[i:i + batch] for i in range(0, len(todo), batch)]

    def one(ids):
        for attempt in range(4):
            try:
                r = post("/embeddings", {"model": "baai/bge-m3", "input": [texts[i] for i in ids]})
                return [(i, d["embedding"]) for i, d in zip(ids, sorted(r["data"], key=lambda d: d["index"]))]
            except Exception:  # noqa: BLE001
                time.sleep(3 * (attempt + 1))
        return []

    with ThreadPoolExecutor(2) as ex, open(path, "a") as out:
        for n, res in enumerate(ex.map(one, batches)):
            for i, v in res:
                done[i] = v
                out.write(json.dumps({"i": i, "v": [round(x, 5) for x in v]}) + "\n")
            out.flush()
            if n % 20 == 0:
                print(f"  {name}: {len(done)}/{len(texts)}", flush=True)
    return done


def translate(qs):
    """English versions of a sample of answerable questions, by a non-Qwen model. Saved one by one, resumable."""
    path = D / "questions_en.jsonl"
    done = {json.loads(l)["id"]: json.loads(l)["en"] for l in path.read_text().splitlines()} if path.exists() else {}
    sample = [q for q in qs if q["answerable"] and q["split"] == "holdout"] + [q for q in qs if q["answerable"] and q["split"] == "tune"][:16]

    def one(q):
        if q["id"] in done:
            return q["id"], done[q["id"]]
        for attempt in range(3):
            try:
                r = post("/chat/completions", {"model": "google/gemini-2.5-flash", "temperature": 0, "max_tokens": 200,
                                               "messages": [{"role": "system", "content": "Translate the Arabic question about the Qur'an into plain English. Output the English question only."},
                                                            {"role": "user", "content": q["q"]}]})
                return q["id"], r["choices"][0]["message"]["content"].strip()
            except Exception:  # noqa: BLE001
                time.sleep(3)
        return q["id"], None

    with ThreadPoolExecutor(2) as ex, open(path, "a") as out:
        for qid, en in ex.map(one, sample):
            if en and qid not in done:
                done[qid] = en
                out.write(json.dumps({"id": qid, "en": en}, ensure_ascii=False) + "\n")
                out.flush()
    return {q["id"]: done[q["id"]] for q in sample if q["id"] in done}


def cos_top(qv, mat, k=10):
    qn = math.sqrt(sum(x * x for x in qv))
    scored = []
    for i, (v, n) in enumerate(mat):
        scored.append((sum(a * b for a, b in zip(qv, v)) / (qn * n), i))
    scored.sort(reverse=True)
    return [(i, s) for s, i in scored[:k]]


def metrics(qs, ranked):
    ans = [q for q in qs if q["answerable"]]
    hit5 = sum(any(is_hit(i, q["gold"]) for i, _ in ranked[q["id"]][:5]) for q in ans)
    rr = 0.0
    for q in ans:
        for rank, (i, _) in enumerate(ranked[q["id"]][:10], 1):
            if is_hit(i, q["gold"]):
                rr += 1 / rank
                break
    return {"answerable": len(ans), "hit_at_5": hit5, "mrr_at_10": round(rr / len(ans), 3) if ans else 0}


def no_answer(qs, ranked):
    top = {q["id"]: (ranked[q["id"]][0][1] if ranked[q["id"]] else 0.0) for q in qs}
    tune = [q for q in qs if q["split"] == "tune"]
    hold = [q for q in qs if q["split"] == "holdout"]
    cands = sorted(set(top[q["id"]] for q in tune))
    best = None
    for t in cands:
        tn = sum(top[q["id"]] < t for q in tune if not q["answerable"]) / max(1, sum(not q["answerable"] for q in tune))
        tp = sum(top[q["id"]] >= t for q in tune if q["answerable"]) / max(1, sum(q["answerable"] for q in tune))
        if best is None or (tn + tp) / 2 > best[0]:
            best = ((tn + tp) / 2, t)
    t = best[1]
    na_h, an_h = [q for q in hold if not q["answerable"]], [q for q in hold if q["answerable"]]
    med = lambda xs: sorted(xs)[len(xs) // 2] if xs else 0  # noqa: E731
    return {"threshold": round(t, 4), "holdout_no_answer_below": sum(top[q["id"]] < t for q in na_h), "holdout_no_answer_n": len(na_h),
            "holdout_answerable_above": sum(top[q["id"]] >= t for q in an_h), "holdout_answerable_n": len(an_h),
            "median_top_score_answerable": round(med([top[q["id"]] for q in qs if q["answerable"]]), 4),
            "median_top_score_no_answer": round(med([top[q["id"]] for q in qs if not q["answerable"]]), 4)}


def main():
    qs = load()
    print("questions", len(qs), "answerable", sum(q["answerable"] for q in qs), "no-answer", sum(not q["answerable"] for q in qs), flush=True)
    res = {"source": "Qur'an QA 2023 shared task, Task A (AyaTEC v1.2) — https://gitlab.com/bigirqu/quran-qa-2023", "license": "CC BY-NC-ND 4.0",
           "questions": len(qs), "no_answer": sum(not q["answerable"] for q in qs), "verses": len(VERSES)}
    systems = {}
    a = BM25([tok_a(v["ar"]) for v in VERSES])
    b = BM25([tok_b(v["ar"]) for v in VERSES])
    systems["A_lexical_uthmani"] = {q["id"]: a.search(tok_a(q["q"])) for q in qs}
    systems["B_lexical_normalised"] = {q["id"]: b.search(tok_b(q["q"])) for q in qs}
    if "--no-embed" not in sys.argv:
        ve = embed_all("verses", [normalised(v["ar"]) for v in VERSES])
        qe = embed_all("questions", [q["q"] for q in qs])
        if len(ve) == len(VERSES) and len(qe) == len(qs):
            mat = [(ve[i], math.sqrt(sum(x * x for x in ve[i]))) for i in range(len(VERSES))]
            systems["C_bge_m3"] = {q["id"]: cos_top(qe[k], mat) for k, q in enumerate(qs)}
        else:
            res["embedding_incomplete"] = {"verses": len(ve), "questions": len(qe)}
    for name, ranked in systems.items():
        hold = [q for q in qs if q["split"] == "holdout"]
        res[name] = {"all": metrics(qs, ranked), "holdout": metrics(hold, ranked), "no_answer": no_answer(qs, ranked)}
        print(name, json.dumps(res[name], ensure_ascii=False), flush=True)
    # English side
    if "--no-embed" not in sys.argv and "C_bge_m3" in systems:
        en = translate(qs)
        sub = [q for q in qs if q["id"] in en]
        e = BM25([tok_en(v["en"]) for v in VERSES])
        ranked_en = {q["id"]: e.search(tok_en(en[q["id"]])) for q in sub}
        eq = embed_all("questions_en", [en[q["id"]] for q in sub])
        mat = [(ve[i], math.sqrt(sum(x * x for x in ve[i]))) for i in range(len(VERSES))]
        ranked_x = {q["id"]: cos_top(eq[k], mat) for k, q in enumerate(sub) if k in eq}
        res["english_sample"] = {"n": len(sub), "translator": "google/gemini-2.5-flash (machine translation, not reviewed)",
                                 "lexical_on_rowwad_translation": metrics(sub, ranked_en),
                                 "bge_m3_english_question_vs_arabic_verses": metrics([q for q in sub if q["id"] in ranked_x], ranked_x)}
        print("english", json.dumps(res["english_sample"], ensure_ascii=False), flush=True)
    res["misses_holdout"] = {name: [{"id": q["id"], "q": q["q"], "gold": q["gold"], "top5": [f"{VERSES[i]['s']}:{VERSES[i]['a']}" for i, _ in ranked[q["id"]][:5]]}
                                    for q in qs if q["split"] == "holdout" and q["answerable"] and not any(is_hit(i, q["gold"]) for i, _ in ranked[q["id"]][:5])]
                             for name, ranked in systems.items()}
    (HERE / "t2-results.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote t2-results.json")


if __name__ == "__main__":
    main()
