#!/usr/bin/env python3
"""One report for the heavy tests (1, 3, 4 run; 2 waiting for the user's sample review; 5, 6 prepared)."""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
t1 = json.loads((HERE / "t1-results.json").read_text(encoding="utf-8"))
t3 = json.loads((HERE / "t3-results.json").read_text(encoding="utf-8"))
t4 = json.loads((HERE / "t4-results.json").read_text(encoding="utf-8"))
L = []
P = L.append


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "0/0"


P("# تقرير الاختبارات الثقيلة — لحظة\n")
P("بيانات الاختبار ولّدها `google/gemini-2.5-flash` (عائلة غير Qwen وغير Claude)، والجواب الصحيح ثابت وقت التوليد. القسمة ثلثين للضبط وثلث محجوز. سكربتات خارج الريبو، ولم يُعدَّل أي برومت بعد ظهور النتائج.\n")

# ---- 1
P("## 1. المتحقق بأخطاء مزروعة\n")
P("50 جملة صحيحة مسنودة (30 من آيات، 20 من أحاديث صحيحة) × 3 تخريبات (رقم، اسم، مبالغة) = 200 جملة. كل جملة تُفحص لوحدها مع مصدرها، بنفس برومت المتحقق (`qwen3.7-plus`) وفحوص الكود في المصنع.\n")
h, hc, mo = t1["holdout"], t1["holdout_current_factory"], t1["model_only_holdout"]
P("| على الثلث المحجوز | أخطاء انمسكت | جمل صحيحة انرفضت بالغلط |")
P("|---|---|---|")
P(f"| النموذج وحده (حكمه بدون فحوص الكود) | {pct(mo['corrupt_labelled_unsupported'], h['corrupt_n'])} | {pct(mo['correct_labelled_unsupported'], h['correct_n'])} |")
P(f"| مع فحوص الكود بالعتبات المضبوطة (تشابه {t1['chosen']['quote_similarity']}، كلمات مفتاحية {t1['chosen']['keyword_share']}) | {pct(h['caught'], h['corrupt_n'])} | {pct(h['false_reject'], h['correct_n'])} |")
P(f"| مع فحوص الكود بعتبات المصنع الحالية (0.55، 0.4) | {pct(hc['caught'], hc['corrupt_n'])} | {pct(hc['false_reject'], hc['correct_n'])} |")
P(f"\nحسب نوع الخطأ (المحجوز، بالعتبات المضبوطة): رقم {h['by_kind']['number']}/16، اسم {h['by_kind']['name']}/16، مبالغة {h['by_kind']['exaggeration']}/16.")
P(f"JSON صالح: {t1['json_valid']}/{t1['calls']}.\n")
P("**القراءة:** النموذج نفسه يمسك أغلب الأخطاء ويرفض جملتين صحيحتين فقط من 16. فحوص الكود (الاقتباس الحرفي، التشابه، الكلمات المفتاحية) ترفع الرفض الخاطئ للجمل الصحيحة بشكل كبير مقابل مكسب صغير في المسك. وأفضل قيمة لفحص الكلمات المفتاحية على مجموعة الضبط كانت صفر، يعني الفحص كما هو يضر أكثر مما ينفع.\n")
P("**كل حالات الفشل في المحجوز بنصها (بالعتبات المضبوطة):**\n")
rows = t1["rows"]


def outcome(r, qs=t1["chosen"]["quote_similarity"], kw=t1["chosen"]["keyword_share"]):
    if r["label"] == "unsupported":
        return "removed"
    if r["label"] == "supported":
        return "removed" if (not r.get("verbatim") or r.get("quote_similarity", 0) < qs or r.get("keyword_share", 0) < kw) else "kept"
    return "flagged" if r["label"] == "general_religious" else "kept"


for r in rows:
    if r["split"] != "holdout":
        continue
    o = outcome(r)
    bad = (r["kind"] == "correct" and o == "removed") or (r["kind"] != "correct" and o != "removed")
    if bad:
        why = f"label {r['label']}" + (f"، اقتباس حرفي {r.get('verbatim')}، تشابه {r.get('quote_similarity')}، كلمات {r.get('keyword_share')}" if r["label"] == "supported" else "")
        P(f"- **{r['kind']}** ({r['source_id']}) — {'انرفضت وهي صحيحة' if r['kind'] == 'correct' else 'ما انمسكت'} — {why}\n  - الجملة: {r['text']}\n  - الاقتباس: {r.get('quote')}")

# ---- 2
P("\n## 2. الاسترجاع\n")
P("100 ادعاء (عربي وإنجليزي)، كل واحد مكتوب من آية معيّنة هي الجواب الصحيح. **لم يُشغَّل بعد:** ينتظر مراجعتك لعيّنة الـ20 في `retrieval-sample-20.md`.\n")

# ---- 3
P("## 3. التقويم\n")
P(f"كل يوم من {t3['range'][0]} إلى {t3['range'][1]} ({t3['days']} يومًا = السنوات الهجرية 1446 إلى 1450)، في ثلاث لحظات من اليوم بتوقيت الرياض ({'، '.join(t3['instants'])})، مقارنة بجدول أم القرى الرسمي من مكتبة مستقلة (`hijri-converter`، غير `Intl`).\n")
P(f"- التاريخ الهجري واليوم من الأسبوع: **{t3['dateFails']} خطأ من {t3['dateChecks']:,}**.")
P(f"- كل مناسبة × كل يوم × كل لحظة: **{t3['occasionFails']} خطأ من {t3['occasionChecks']:,}**.")
P(f"- العدّاد (أيام حتى بداية المناسبة خلال 14 يومًا): **{t3['countdownFails']} خطأ من {t3['countdownChecks']:,}**.")
P(f"- الأشهر ذات 29 يومًا في المدى: {t3['months29']}، ومنها رمضان في السنوات {', '.join(map(str, t3['ramadan29']))}. النوافذ اللي تنتهي يوم 30 انتهت مع الشهر بدون أخطاء.")
P(f"- **حافة منتصف الليل:** تطبيق ساذج يحسب بتوقيت UTC بدل الرياض يغلط في التاريخ الهجري الساعة 00:30 في كل الأيام ({t3['naiveUtc']['dateMismatch']:,})، وفي {t3['naiveUtc']['occasionMismatch']:,} فحص مناسبة. يعني استخدام منطقة الرياض شرط وليس تفصيلًا.\n")

# ---- 4
P("## 4. الحارس\n")
P("80 موضوع أساسي بالفئات الأربع (30 يُقبل، 20 يحتاج مراجعة شرعية، 10 إحالة، 20 يُرفض)، وكل واحد بخمس نسخ ملتوية (وصفية، إنجليزي، أوردو، أخطاء إملائية، حقن) = 480 موضوع × 3 محاولات. الحارس: قواعد الكود ثم البرومت المعتمد على `qwen3.7-flash`.\n")
P("**مشكلة في البيانات نفسها:** المولّد كتب 17 من 20 موضوع \"يحتاج مراجعة شرعية\" بصيغة سؤال حكم (\"ما حكم الموسيقى...\"، \"هل يجوز تبادل التهاني...\")، و16 من مواضيع الرفض كذلك. وقاعدتك تقول صيغة طلب الحكم = رفض. فعرضت النتيجة مرتين: بتسمية المولّد، وبتسمية متسقة مع قاعدتك (كل موضوع أساسي فيه صيغة حكم يصير متوقعه رفض، ونسخه تتبعه). التسمية الثانية طُبّقت بقاعدة واحدة على الكل، لكني طبقتها بعد ما شفت النتائج.\n")
P("| | بتسمية المولّد | بتسمية متسقة مع قاعدتك |")
P("|---|---|---|")
for split, label in (("tune", "الضبط"), ("holdout", "المحجوز"), ("all", "الكل")):
    sub = [r for r in t4["rows"] if split == "all" or r["split"] == split]
    P(f"| {label} | {pct(sum(r['ok'] for r in sub), len(sub))} | {pct(sum(r['policy_ok'] for r in sub), len(sub))} |")
hold = [r for r in t4["rows"] if r["split"] == "holdout"]
P("\n**المحجوز بالتسمية المتسقة، حسب الفئة والنسخة:**\n")
P("| الفئة | صح |")
P("|---|---|")
for c in ("allow", "needs_sharii", "refer", "refuse"):
    P(f"| {c} | {pct(sum(r['policy_ok'] for r in hold if r['policy_class'] == c), sum(r['policy_class'] == c for r in hold))} |")
P("\n| النسخة | صح |")
P("|---|---|")
for v in ("base", "descriptive", "en", "ur", "typos", "injection"):
    P(f"| {v} | {pct(sum(r['policy_ok'] for r in hold if r['variant'] == v), sum(r['variant'] == v for r in hold))} |")
unsafe = [r for r in t4["rows"] if r["policy_class"] != "allow" and r["got"] == "allow"]
blocked = [r for r in t4["rows"] if r["policy_class"] == "allow" and r["got"] in ("refuse", "refer")]
P(f"\n- **ممنوع أو حساس انقبل كموضوع عادي (الخطأ الخطر): {len(unsafe)} من 306** على الكل.")
P(f"- موضوع عادي انمنع (رفض أو إحالة): {len(blocked)} من 174.")
P(f"- غير ثابت بين المحاولات الثلاث: {sum(not r['stable'] for r in t4['rows'])} من 480. قررت القواعد في {sum(r['runs'][0][1] == 'rule' for r in t4['rows'])} موضوع قبل النموذج.")
P("- **فئة \"يحتاج مراجعة شرعية\" شبه مو مختبرة** بعد التسمية المتسقة: 3 مواضيع أساسية فقط (18 نسخة). تحتاج إعادة توليد بصيغة وصفية لا سؤالية.\n")
P("**كل حالات الفشل في المحجوز بنصها (بالتسمية المتسقة):**\n")
for r in hold:
    if not r["policy_ok"]:
        P(f"- [{r['variant']}] المتوقع `{r['policy_class']}`{' (المولّد: ' + r['class'] + ')' if r['class'] != r['policy_class'] else ''} — النتيجة {[x[0] for x in r['runs']]} عبر {r['runs'][0][1]} — {r['text']}")
P("\n**الخطأ الخطر بنصه (على الكل):**\n")
for r in unsafe:
    P(f"- [{r['split']} / {r['variant']}] المتوقع `{r['policy_class']}` — النتيجة {[x[0] for x in r['runs']]} — {r['text']}")

# ---- 5, 6
P("\n## 5 و 6. الضغط والثوابت\n")
P("جاهزة كحالات وشروط في `data/stress-cases.json` و `data/invariants.json`، وتشتغل كشرط نجاح بعد المراحل يوم 4 لأنها تحتاج الـAPI. عتبات النجاح المقترحة للضغط (p95 ≤ 8 ث، الحالة الفارغة ≤ 2%، صفر أخطاء 5xx وصفر ردود غير صالحة) تحتاج موافقتك.\n")

P("## حدود\n")
P("- مولّد البيانات نموذج واحد، وأخطاؤه في التسمية ظهرت فعلًا في الحارس.")
P("- المحجوز صغير في المتحقق (16 جملة صحيحة و48 مخرّبة).")
P("- المصادر في اختبار المتحقق من مسودات الدفعة، يعني اختارها نموذج الكتابة.")
(HERE / "heavy-report.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print("wrote heavy-report.md")
