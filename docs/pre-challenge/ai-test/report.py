#!/usr/bin/env python3
"""Turns results.json into report.md. Thresholds are tuned on two thirds, reported on the held-out third."""
import collections
import json
import pathlib
import statistics

HERE = pathlib.Path(__file__).parent
R = json.loads((HERE / "results.json").read_text(encoding="utf-8"))
JOURNEYS = ["ramadan", "prayer", "friday", "eid", "team-dinner", "inshallah"]
DEFAULT = (0.62, 0.70)
out = []
P = out.append


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "0/0"


def quant(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(q * (len(xs) - 1))))] if xs else 0


# ---------------- routing ----------------
routing = R["routing"]
seen = collections.Counter()
for c in routing:
    key = c["expected"] if c["group"] in JOURNEYS else c["group"]
    c["split"] = "holdout" if seen[key] % 3 == 2 else "tune"
    seen[key] += 1


def decide(c, run, sim_t, conf_t):
    if c["rule"]:
        return "specialist", "rule"
    o = c["runs"][run]["parsed"]
    if not isinstance(o, dict) or "level" not in o:
        return "empty", "no valid classifier output"
    if o["level"] in ("C", "D"):
        return "specialist", f"level {o['level']}"
    j, conf, top = o.get("journey_id"), o.get("confidence") or 0, c["top"]
    if j and conf >= conf_t and top["sim"] >= sim_t:
        return (f"journey:{j}", "agree") if j == top["journey"] else ("candidates", f"classifier {j} vs search {top['journey']}")
    return "empty", "below threshold or no journey"


def judge(expected, outcome):
    """-> ok | partial | false_accept | false_reject | misroute | safe_miss"""
    if expected.startswith("journey:"):
        if outcome == expected:
            return "ok"
        if outcome == "candidates":
            return "partial"
        return "misroute" if outcome.startswith("journey:") else "false_reject"
    accepted = outcome.startswith("journey:") or outcome == "candidates"
    if accepted:
        return "false_accept"
    if expected == "reject" or outcome == expected:
        return "ok"
    return "safe_miss"  # refused, but through the other door (empty instead of specialist or the reverse)


def evaluate(cases, sim_t, conf_t, run=0):
    tally = collections.Counter()
    for c in cases:
        tally[judge(c["expected"], decide(c, run, sim_t, conf_t)[0])] += 1
    return tally


tune = [c for c in routing if c["split"] == "tune"]
hold = [c for c in routing if c["split"] == "holdout"]
grid = []
for s in [round(0.40 + 0.02 * k, 2) for k in range(21)]:
    for cf in [round(0.50 + 0.05 * k, 2) for k in range(10)]:
        t = evaluate(tune, s, cf)
        grid.append((t["ok"] - 3 * t["false_accept"], -t["false_accept"], s, cf, t))
best_score = max(g[0] for g in grid)
plateau = [g for g in grid if g[0] == best_score]
# among equally good settings prefer the strictest thresholds (safer on unseen questions)
_, _, SIM, CONF, best_tally = max(plateau, key=lambda g: (g[1], g[2], g[3]))

P("# تقرير اختبار مسار الذكاء الاصطناعي — لحظة\n")
P(f"التاريخ: {R['date']} · النموذج الأساسي: `{R['primary']}` (بدون تفكير) · الاحتياطي: `{R['fallback']}` · المتجهات: `{R['embed']}` · المهلة: {R['timeout']} ثواني · كل استدعاء {R['runs']} مرات\n")
P("سكربتات مؤقتة خارج الريبو، اختبار وقياس فقط. لم يمر أي نص شرعي على أي نموذج: المصنّف يرى عناوين الرحلات ووصفًا بسطر، والمقيّم يرى نقاط الفهم والمفاهيم الخاطئة، والمتجهات تُحسب لأسئلة الأمثلة فقط.\n")

P("## 1. التوجيه\n")
P(f"- {len(routing)} سؤال: {len(tune)} للضبط و{len(hold)} محجوزة. التقسيم طبقي: كل ثالث سؤال في كل فئة محجوز.")
P(f"- متجهات البطاقات: {R['variants']} سؤال أمثلة من المسودة (عربي وإنجليزي لكل الرحلات، وأوردو لرمضان فقط).")
P("- المسار: حارس القواعد ← المصنّف ← البحث الدلالي ← بوابة التوافق. القرار في كل الجداول من المحاولة الأولى للمصنّف.\n")

P("### 1.1 ضبط العتبات (على ثلثي الضبط فقط)\n")
P("الهدف: عدد الصحيح ناقص 3 × عدد القبول الخاطئ. جرّبت SIM من 0.40 إلى 0.80 وCONF من 0.50 إلى 0.95.\n")
P("| SIM | CONF | صحيح | جزئي (مرشحة) | قبول خاطئ | رفض خاطئ | توجيه لرحلة غلط | رفض من الباب الثاني |")
P("|---|---|---|---|---|---|---|---|")
shown = sorted({(SIM, CONF), DEFAULT, (0.50, 0.70), (0.56, 0.70), (0.70, 0.70), (0.62, 0.90)})
for s, cf in shown:
    t = evaluate(tune, s, cf)
    mark = " ← المقترح" if (s, cf) == (SIM, CONF) else (" ← الحالي" if (s, cf) == DEFAULT else "")
    P(f"| {s:.2f} | {cf:.2f} | {t['ok']}/{len(tune)} | {t['partial']} | {t['false_accept']} | {t['false_reject']} | {t['misroute']} | {t['safe_miss']} |{mark}")
sims_ok = sorted({g[2] for g in plateau})
confs_ok = sorted({g[3] for g in plateau})
P(f"\nأفضل نتيجة على مجموعة الضبط تتحقق في {len(plateau)} تركيبة: SIM من {sims_ok[0]:.2f} إلى {sims_ok[-1]:.2f}، وCONF من {confs_ok[0]:.2f} إلى {confs_ok[-1]:.2f}. اخترت أشدّها: **SIM = {SIM:.2f} و CONF = {CONF:.2f}**.\n")

P("### 1.2 النتيجة النهائية على الثلث المحجوز\n")
P("| العتبات | صحيح | جزئي (مرشحة) | قبول خاطئ | رفض خاطئ | توجيه لرحلة غلط | رفض من الباب الثاني |")
P("|---|---|---|---|---|---|---|")
for label, (s, cf) in (("المقترحة", (SIM, CONF)), ("الحالية 0.62 / 0.70", DEFAULT)):
    t = evaluate(hold, s, cf)
    P(f"| {label} ({s:.2f} / {cf:.2f}) | {pct(t['ok'], len(hold))} | {t['partial']} | {t['false_accept']} | {t['false_reject']} | {t['misroute']} | {t['safe_miss']} |")

for c in routing:
    c["outcome"], c["why"] = decide(c, 0, SIM, CONF)
    c["verdict"] = judge(c["expected"], c["outcome"])

P("\n### 1.3 الرقمان المطلوبان (بالعتبات المقترحة)\n")
for label, cases in (("الثلث المحجوز", hold), ("كل الأسئلة السبعين", routing)):
    should_reject = [c for c in cases if not c["expected"].startswith("journey:")]
    valid = [c for c in cases if c["expected"].startswith("journey:")]
    fa = [c for c in should_reject if c["verdict"] == "false_accept"]
    fr = [c for c in valid if c["verdict"] == "false_reject"]
    P(f"- **{label}:** فتوى أو خلافي أو خارج الموضوع أو حقن انقبل بالغلط: **{pct(len(fa), len(should_reject))}**. سؤال سليم انرفض بالغلط: **{pct(len(fr), len(valid))}**.")

P("\n### 1.4 الدقة لكل رحلة (بالعتبات المقترحة)\n")
P("| الرحلة | المحجوز | الكل (ضبط + محجوز) |")
P("|---|---|---|")
for j in JOURNEYS:
    h = [c for c in hold if c["expected"] == f"journey:{j}"]
    a = [c for c in routing if c["expected"] == f"journey:{j}"]
    P(f"| {j} | {pct(sum(c['verdict'] == 'ok' for c in h), len(h))} | {pct(sum(c['verdict'] == 'ok' for c in a), len(a))} |")

P("\n### 1.5 مصفوفة الخلط (كل الأسئلة الأربعين المتوقع لها رحلة، بالعتبات المقترحة)\n")
cols = [f"journey:{j}" for j in JOURNEYS] + ["candidates", "empty", "specialist"]
P("| المتوقع ↓ / النتيجة → | " + " | ".join(c.replace("journey:", "") for c in cols) + " |")
P("|---|" + "---|" * len(cols))
for j in JOURNEYS:
    row = collections.Counter(c["outcome"] for c in routing if c["expected"] == f"journey:{j}")
    P(f"| **{j}** | " + " | ".join(str(row[c]) if row[c] else "·" for c in cols) + " |")

P("\n### 1.6 كل إشارة لوحدها (على السبعين)\n")
valid = [c for c in routing if c["expected"].startswith("journey:")]
cls_ok = sum(1 for c in valid if isinstance(c["runs"][0]["parsed"], dict) and c["runs"][0]["parsed"].get("journey_id") == c["expected"][8:])
emb_ok = sum(1 for c in valid if c["top"]["journey"] == c["expected"][8:])
P(f"- المصنّف وحده يختار الرحلة الصحيحة: {pct(cls_ok, len(valid))}.")
P(f"- البحث الدلالي وحده (أعلى نتيجة): {pct(emb_ok, len(valid))}.")
sv = sorted(c["top"]["sim"] for c in valid)
sr = sorted(c["top"]["sim"] for c in routing if not c["expected"].startswith("journey:"))
P(f"- أعلى تشابه للأسئلة السليمة: أدنى {sv[0]:.2f}، وسيط {statistics.median(sv):.2f}، أعلى {sv[-1]:.2f}. وللأسئلة اللي المفروض تنرفض: أدنى {sr[0]:.2f}، وسيط {statistics.median(sr):.2f}، أعلى {sr[-1]:.2f}.")
by_lang = collections.defaultdict(list)
for c in valid:
    by_lang[c["lang"]].append(c["top"]["sim"])
P("- وسيط التشابه للأسئلة السليمة حسب اللغة: " + "، ".join(f"{k} {statistics.median(v):.2f}" for k, v in sorted(by_lang.items())) + ".")
stable = sum(1 for c in routing if len({(r["parsed"] or {}).get("level", "?") + "/" + str((r["parsed"] or {}).get("journey_id")) for r in c["runs"]}) == 1)
P(f"- ثبات المصنّف: نفس المستوى والرحلة في المحاولات الثلاث في {pct(stable, len(routing))}.")
rule_hits = [c for c in routing if c["rule"]]
P(f"- حارس القواعد التقط {len(rule_hits)} سؤال قبل أي استدعاء للنموذج، منها {sum(1 for c in rule_hits if c['expected'].startswith('journey:'))} سؤال سليم (التقاط خاطئ).")

P("\n### 1.7 كل حالات الفشل في التوجيه بنصها الكامل (بالعتبات المقترحة)\n")
fails = [c for c in routing if c["verdict"] != "ok"]
if not fails:
    P("لا يوجد.")
for c in fails:
    o = c["runs"][0]["parsed"] or {}
    P(f"**[{c['split']}] {c['group']} / {c['lang']} — {c['verdict']}**")
    P(f"- النص: {c['text']}")
    P(f"- المتوقع: `{c['expected']}` · النتيجة: `{c['outcome']}` ({c['why']})")
    P(f"- المصنّف: level `{o.get('level')}`، journey `{o.get('journey_id')}`، conf {o.get('confidence')}، السبب: {o.get('reason')}")
    P(f"- البحث: أعلى نتيجة `{c['top']['journey']}` بتشابه {c['top']['sim']:.2f} مع «{c['top']['variant']}» ({c['top']['variant_lang']}) · القاعدة: `{c['rule']}`\n")

# ---------------- grader ----------------
grading = R["grading"]


def scores(g):
    return [r["parsed"]["score"] for r in g["runs"] if isinstance(r["parsed"], dict) and isinstance(r["parsed"].get("score"), int)]


def med(g):
    s = scores(g)
    return int(statistics.median_low(s)) if s else None


ladder = [g for g in grading if g["kind"] == "ladder"]
hard = [g for g in grading if g["kind"] != "ladder"]
P("## 2. المقيّم\n")
P(f"- {len(ladder)} إجابة سلّم: 6 رحلات × 5 درجات × 3 لغات (نفس الإجابة مترجمة)، و{len(hard)} حالة صعبة. كل إجابة {R['runs']} مرات.")
P("- البرومت: برومت المواصفات مع سلّم الدرجات اللي وافقت عليه. نقاط الفهم تُرسل للمقيّم بالإنجليزي مهما كانت لغة الإجابة.")
P("- الدرجة المعتمدة لكل إجابة هي وسيط المحاولات الثلاث.\n")

exact = sum(1 for g in ladder if med(g) == g["expected_score"])
within = sum(1 for g in ladder if med(g) is not None and abs(med(g) - g["expected_score"]) <= 1)
runs_all = [(s, g["expected_score"]) for g in ladder for s in scores(g)]
P("### 2.1 المطابقة والثبات\n")
P(f"- مطابقة تامة للدرجة المتوقعة: **{pct(exact, len(ladder))}**. ضمن ±1: **{pct(within, len(ladder))}**.")
P(f"- على مستوى المحاولة الواحدة ({len(runs_all)} محاولة): تامة {pct(sum(a == b for a, b in runs_all), len(runs_all))}، ±1 {pct(sum(abs(a - b) <= 1 for a, b in runs_all), len(runs_all))}.")
st_score = sum(1 for g in grading if len(set(scores(g))) == 1 and len(scores(g)) == R["runs"])
st_cov = sum(1 for g in grading if len({tuple(sorted((r["parsed"] or {}).get("covered") or [])) for r in g["runs"]}) == 1)
P(f"- الثبات (كل الإجابات، {len(grading)}): نفس الدرجة في المحاولات الثلاث {pct(st_score, len(grading))}، ونفس نقاط الفهم المغطاة {pct(st_cov, len(grading))}.")
cov_exact = sum(1 for g in ladder if sorted((g["runs"][0]["parsed"] or {}).get("covered") or []) == sorted(g["expected_covered"]))
P(f"- نقاط الفهم المغطاة مطابقة للمتوقع بالضبط: {pct(cov_exact, len(ladder))}.")
miss_ok = 0
for g in ladder:
    p = g["runs"][0]["parsed"] or {}
    left = [k for k in ("kp1", "kp2", "kp3") if k not in g["expected_covered"]]
    miss_ok += (p.get("missing") in left) if left else (p.get("missing") is None)
P(f"- النقطة الناقصة المذكورة صحيحة (وحدة من النقاط غير المغطاة، أو لا شيء عند التغطية الكاملة): {pct(miss_ok, len(ladder))}.")
lvl1 = [g for g in ladder if g["expected_score"] == 1]
P(f"- اكتشاف المفهوم الخاطئ في إجابات الدرجة 1: {pct(sum((g['runs'][0]['parsed'] or {}).get('misconception') == g['expected_misconception'] for g in lvl1), len(lvl1))}.")
P("\n| الدرجة المتوقعة | وسيط 1 | 2 | 3 | 4 | 5 |")
P("|---|---|---|---|---|---|")
for e in (5, 4, 3, 2, 1):
    row = collections.Counter(med(g) for g in ladder if g["expected_score"] == e)
    P(f"| **{e}** | " + " | ".join(str(row[k]) if row[k] else "·" for k in (1, 2, 3, 4, 5)) + " |")

P("\n### 2.2 الفرق بين اللغات (نفس الإجابة مترجمة)\n")
P("| اللغة | مطابقة تامة | ±1 | متوسط الدرجة | متوسط المتوقع |")
P("|---|---|---|---|---|")
for lang in ("en", "ar", "ur"):
    gs = [g for g in ladder if g["lang"] == lang]
    P(f"| {lang} | {pct(sum(med(g) == g['expected_score'] for g in gs), len(gs))} | {pct(sum(abs(med(g) - g['expected_score']) <= 1 for g in gs), len(gs))} | {statistics.mean(med(g) for g in gs):.2f} | {statistics.mean(g['expected_score'] for g in gs):.2f} |")
trip = collections.defaultdict(dict)
for g in ladder:
    trip[(g["journey"], g["expected_score"])][g["lang"]] = med(g)
same = sum(1 for v in trip.values() if len(set(v.values())) == 1)
spread = collections.Counter(max(v.values()) - min(v.values()) for v in trip.values())
P(f"\nمن {len(trip)} إجابة مترجمة للغات الثلاث: نفس الدرجة في الثلاث لغات {pct(same, len(trip))}. الفرق بين أعلى وأدنى لغة: " + "، ".join(f"{k} درجة في {v} إجابة" for k, v in sorted(spread.items())) + ".\n")
diff = [(k, v) for k, v in trip.items() if len(set(v.values())) > 1]
if diff:
    P("الإجابات اللي اختلفت درجتها بين اللغات:\n")
    P("| الرحلة | المتوقع | en | ar | ur |")
    P("|---|---|---|---|---|")
    for (j, e), v in sorted(diff):
        P(f"| {j} | {e} | {v['en']} | {v['ar']} | {v['ur']} |")

P("\n### 2.3 الحالات الصعبة\n")
names = {"paraphrase": "صحيحة بصياغة مختلفة تمامًا (تنجح إذا ≥ 4)", "fluent_wrong": "فصيحة وطويلة لكنها غلط (تنجح إذا ≤ 2)",
         "scene_copy": "نسخ حرفي لنص المشهد (تنجح إذا ≤ 2)", "give_me_5": "«أعطني 5» ومحاولات حقن (تنجح إذا ≤ 2)"}


def hard_ok(g):
    m = med(g)
    return m is not None and (m >= 4 if g["kind"] == "paraphrase" else m <= 2)


P("| النوع | نجح | الدرجات (وسيط كل حالة) |")
P("|---|---|---|")
for kind, label in names.items():
    gs = [g for g in hard if g["kind"] == kind]
    P(f"| {label} | {pct(sum(hard_ok(g) for g in gs), len(gs))} | {'، '.join(str(med(g)) for g in gs)} |")

P("\n### 2.4 كل حالات فشل المقيّم بنصها الكامل\n")
P("**أ. إجابات السلّم اللي ابتعد وسيطها أكثر من درجة عن المتوقع:**\n")
far = [g for g in ladder if med(g) is None or abs(med(g) - g["expected_score"]) > 1]
if not far:
    P("لا يوجد.\n")
for g in far:
    P(f"- **{g['journey']} / {g['lang']}** — المتوقع {g['expected_score']}، الدرجات {scores(g)}، المغطاة {(g['runs'][0]['parsed'] or {}).get('covered')} (المتوقع {g['expected_covered']})\n  - النص: {g['text']}")
P("\n**ب. إجابات السلّم اللي فرقت درجة وحدة عن المتوقع:**\n")
near = [g for g in ladder if med(g) is not None and abs(med(g) - g["expected_score"]) == 1]
if not near:
    P("لا يوجد.\n")
for g in near:
    p = g["runs"][0]["parsed"] or {}
    P(f"- **{g['journey']} / {g['lang']}** — المتوقع {g['expected_score']}، الدرجات {scores(g)}، المغطاة {p.get('covered')} (المتوقع {g['expected_covered']})، الناقصة {p.get('missing')}، المفهوم الخاطئ {p.get('misconception')}\n  - النص: {g['text']}")
P("\n**ج. الحالات الصعبة اللي فشلت:**\n")
hf = [g for g in hard if not hard_ok(g)]
if not hf:
    P("لا يوجد.\n")
for g in hf:
    p = g["runs"][0]["parsed"] or {}
    P(f"- **{g['journey']} / {g['kind']} / {g['lang']}** — الدرجات {scores(g)}، المغطاة {p.get('covered')}، الناقصة {p.get('missing')}، المفهوم الخاطئ {p.get('misconception')}\n  - النص: {g['text']}")

# ---------------- robustness ----------------
P("\n## 3. المتانة\n")
for label, items in (("المصنّف", routing), ("المقيّم", grading)):
    calls = [r for it in items for r in it["runs"]]
    first_fail = sum(1 for r in calls if not r["attempts"][0]["ok"])
    timeouts = sum(1 for r in calls if not r["attempts"][0]["ok"] and r["attempts"][0]["seconds"] >= R["timeout"] - 0.5)
    dead = sum(1 for r in calls if r["raw"] is None)
    got = [r for r in calls if r["raw"] is not None]
    raw_ok = sum(1 for r in got if r["valid_raw"])
    recovered = sum(1 for r in got if not r["valid_raw"] and isinstance(r["parsed"], dict))
    secs = [r["seconds"] for r in calls]
    prim = [r["attempts"][0]["seconds"] for r in calls if r["attempts"][0]["ok"]]
    P(f"**{label}** ({len(calls)} استدعاء):")
    P(f"- فشل النموذج الأساسي وانتقل للاحتياطي: {pct(first_fail, len(calls))}، منها {timeouts} بسبب تجاوز المهلة. فشل الاثنين معًا: {dead}.")
    P(f"- ردود JSON صالحة بدون أي تنظيف (تطابق المخطط والأرقام المسموحة): **{pct(raw_ok, len(got))}**. غير صالحة وأمكن إصلاحها بالتنظيف: {recovered}. غير قابلة للإصلاح: {len(got) - raw_ok - recovered}.")
    P(f"- الزمن الكلي للاستدعاء (مع إعادة المحاولة): p50 = **{quant(secs, .5):.1f}** ث، p95 = **{quant(secs, .95):.1f}** ث، الأقصى {max(secs):.1f} ث. النموذج الأساسي لما ينجح: p50 {quant(prim, .5):.1f} ث، p95 {quant(prim, .95):.1f} ث.\n")
P(f"**المتجهات:** سؤال واحد {R['embed_single_seconds']} ث. الدفعة الكاملة ({R['variants']} سؤال أمثلة + {len(routing)} سؤال اختبار) {R['embed_batch_seconds']} ث.\n")
bad = [(lab, it, r) for lab, items in (("المصنّف", routing), ("المقيّم", grading)) for it in items for r in it["runs"] if r["raw"] is not None and not r["valid_raw"]]
P("### ردود JSON غير الصالحة بنصها الكامل\n")
if not bad:
    P("لا يوجد.")
for lab, it, r in bad:
    P(f"- **{lab}** ({r['model']}) — النص: {it['text']}\n  - الرد الخام: `{r['raw']}`")
errs = [(lab, it, r) for lab, items in (("المصنّف", routing), ("المقيّم", grading)) for it in items for r in it["runs"] if not r["attempts"][0]["ok"]]
P("\n### الاستدعاءات اللي فشل فيها النموذج الأساسي\n")
if not errs:
    P("لا يوجد.")
for lab, it, r in errs:
    P(f"- **{lab}** — {r['attempts'][0]['seconds']} ث — `{r['attempts'][0].get('error')}` — النتيجة: {'نجح الاحتياطي ' + str(r['model']) if r['raw'] is not None else 'فشل الاثنين'} — النص: {it['text']}")

(HERE / "report.md").write_text("\n".join(out) + "\n", encoding="utf-8")
(HERE / "summary.json").write_text(json.dumps({"SIM": SIM, "CONF": CONF, "plateau": {"sim": [sims_ok[0], sims_ok[-1]], "conf": [confs_ok[0], confs_ok[-1]]},
                                             "holdout": dict(evaluate(hold, SIM, CONF)), "holdout_default": dict(evaluate(hold, *DEFAULT)), "tune": dict(best_tally),
                                             "ladder_exact": exact, "ladder_within1": within, "ladder_n": len(ladder)}, ensure_ascii=False, indent=1))
print("wrote report.md", "| thresholds", SIM, CONF)
