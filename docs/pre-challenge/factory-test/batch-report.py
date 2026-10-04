#!/usr/bin/env python3
"""Summarises batch/*.json into batch-report.md and batch-review.html (blind A/B for Ramadan in ab.html)."""
import collections
import html
import json
import pathlib
import random
import statistics

HERE = pathlib.Path(__file__).parent
B = HERE / "batch"
E = html.escape
docs = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(B.glob("*.json")) if "__alt" not in p.stem}
alt = json.loads((B / "ramadan__alt.json").read_text(encoding="utf-8")) if (B / "ramadan__alt.json").exists() else None
when = json.loads((HERE / "when-report.json").read_text(encoding="utf-8")) if (HERE / "when-report.json").exists() else None
from topics import TOPICS  # noqa: E402

expected_refuse = {t[0] for t in TOPICS if t[2] is None}
L = []
P = L.append


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "0/0"


drafts = [d for d in docs.values() if d["status"] == "draft"]
status = collections.Counter(d["status"] for d in docs.values())
P("# تقرير الدفعة — مصنع الرحلات (تجربة)\n")
m = next(iter(drafts), {}).get("generation", {}).get("models", {})
P(f"النماذج: الحارس `{m.get('guard')}` · البحث والكتابة `{m.get('research_and_writer')}` · المتحقق `{m.get('verifier')}`. الكتابة والتحقق بالعربي. لم يُعدَّل أي برومت أثناء الدفعة.\n")
P(f"- المواضيع: {len(docs)} · مسودات: {status['draft']} · مرفوضة من الحارس: {status['refused']} · فشل (لا مصدر): {status['failed']} · أخطاء: {status['error']}\n")

P("## 1. الحارس (من الجولة الأولى، قبل أي تجاوز)\n")
pass1 = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((HERE / "batch-pass1").glob("*.json")) if "__alt" not in p.stem}
refused = {k for k, d in pass1.items() if d["status"] == "refused"}
skipped = sorted(k for k, d in docs.items() if "skipped" in str(d.get("guard", {}).get("by", "")))
P(f"- الجولة الثانية: {len(skipped)} موضوع سليم رفضه حارس النموذج أُعيد تشغيله بحارس القواعد فقط، لقياس باقي المراحل. هذا تجاوز للقياس فقط، وفشل الحارس يبقى نتيجة.")
P(f"- المواضيع الممنوعة المتوقعة ({len(expected_refuse)}) اللي انرفضت: {pct(len(expected_refuse & refused), len(expected_refuse))}")
P(f"- مواضيع سليمة انرفضت بالغلط: **{pct(len(refused - expected_refuse), len(docs) - len(expected_refuse))}**")
for k in sorted(refused - expected_refuse):
    P(f"  - `{k}` — {pass1[k]['topic']} — صنّفه {pass1[k]['guard']['category']} ({pass1[k]['guard']['by']})")
for k in sorted(expected_refuse - refused):
    P(f"  - ممنوع وما انرفض: `{k}` — {docs[k]['topic']}")

P("\n## 2. البحث والمصادر\n")
kinds = collections.Counter(s["kind"] for d in drafts for s in d.get("sources", []))
P(f"- مصادر مسحوبة: قرآن {kinds['quran']}، حديث {kinds['hadith']}، مصطلحات {kinds['term']}.")
P(f"- مراجع اقترحها النموذج وفشل سحبها: {sum(d['counters']['references_failed'] for d in docs.values() if 'counters' in d)} من {sum(d['counters']['references_proposed'] for d in docs.values() if 'counters' in d)}.")
reasons = collections.Counter(l["why"].split(" ")[0] if l.get("why") else "?" for d in docs.values() for l in d.get("log", []) if l.get("stage") == "fetch")
if reasons:
    P("- أسباب الفشل: " + "، ".join(f"{k} ({v})" for k, v in reasons.most_common()))
noq = [k for k, d in docs.items() if d["status"] == "draft" and not any(s["kind"] == "quran" for s in d["sources"])]
P(f"- مسودات بدون آية: {len(noq)}" + (f" ({', '.join(noq)})" if noq else ""))
steps = [d["counters"]["research_steps"] for d in docs.values() if "counters" in d]
if steps:
    P(f"- خطوات البحث لكل موضوع: وسيط {statistics.median(steps)}، أقصى {max(steps)}.")

P("\n## 3. التحقق\n")
sent = [s for d in drafts for s in d["sentences"]]
removed = [s for s in sent if not s["kept"]]
P(f"- جمل مولّدة: {len(sent)} · محذوفة: **{pct(len(removed), len(sent))}** · مسنودة ومقبولة: {sum(s['label'] == 'supported' for s in sent)} · عامة: {sum(s['label'] == 'general' for s in sent)} · عامة فيها ادعاء ديني (معلَّمة): **{pct(sum(s['flagged'] for s in sent), len(sent))}**")
rc = collections.Counter(s.get("reason") for s in removed)
P("- أسباب الحذف: " + "، ".join(f"{k} ({v})" for k, v in rc.most_common()))
qs = [s["quote_similarity"] for s in sent if "quote_similarity" in s]
if qs:
    P(f"- تشابه الاقتباس مع الجملة (للمقتبسة حرفيًا): أدنى {min(qs):.2f}، وسيط {statistics.median(qs):.2f}، أعلى {max(qs):.2f}. العتبة المؤقتة 0.55.")
empty = [k for k, d in docs.items() if d["status"] == "draft" and not d["checks"]["reveals_nonempty"]]
P(f"- مسودات صار فيها كشف أو شرح فاضي بعد الحذف: {len(empty)}" + (f" ({', '.join(empty)})" if empty else ""))

P("\n## 4. الفحوص الآلية\n")
for c in ("shape", "scene_without_title_words", "variants_without_names", "when_valid", "reveals_nonempty", "no_forbidden_text", "all_pass"):
    P(f"- {c}: {pct(sum(bool(d['checks'][c]) for d in drafts), len(drafts))}")
bad = [(k, d) for k, d in docs.items() if d["status"] == "draft" and not d["checks"]["all_pass"]]
for k, d in bad:
    ch = d["checks"]
    why = [x for x in ("shape", "scene_without_title_words", "variants_without_names", "when_valid", "reveals_nonempty", "no_forbidden_text") if not ch[x]]
    extra = (f" كلمات العنوان في المشهد: {ch['scene_title_words_found']}" if ch["scene_title_words_found"] else "") + (f" أسماء في الأسئلة: {ch['variant_names_found']}" if ch["variant_names_found"] else "")
    P(f"  - `{k}`: {', '.join(why)}.{extra}")

P("\n## 5. التوقيت\n")
wm = [d for d in drafts if d["checks"]["when_matches_expected"] is not None]
P(f"- اقتراح `when` يطابق المتوقع بالضبط: **{pct(sum(d['checks']['when_matches_expected'] for d in wm), len(wm))}**")
by_type = collections.defaultdict(list)
for d in wm:
    by_type[(d["expected_when"] or "").split(" ")[0]].append(d["checks"]["when_matches_expected"])
P("- حسب النوع المتوقع: " + "، ".join(f"{k} {sum(v)}/{len(v)}" for k, v in sorted(by_type.items())))
P("\n| الموضوع | المقترح | المتوقع |")
P("|---|---|---|")
for d in wm:
    if not d["checks"]["when_matches_expected"]:
        P(f"| `{d['topic_id']}` | `{d['journey']['when']}` | `{d['expected_when']}` |")
if when:
    P("\n**شكل الرئيسية في تواريخ للمحاكاة (تقويم أم القرى، الرياض)، حسب `when` المقترح:**\n")
    P("| التاريخ | الهجري | نشطة الآن | قادمة خلال 14 يومًا |")
    P("|---|---|---|---|")
    for h in when["home"]:
        P(f"| {h['date']} | {h['hijri']} | {', '.join(h['active_now']) or '—'} | {', '.join(h['upcoming_14d']) or '—'} |")

P("\n## 6. الزمن والتكلفة\n")
secs = [d["seconds"] for d in drafts]
tin = sum(d["counters"]["tokens_in"] for d in drafts)
tout = sum(d["counters"]["tokens_out"] for d in drafts)
if secs:
    P(f"- زمن الرحلة: وسيط {statistics.median(secs):.0f} ث، أقصى {max(secs):.0f} ث.")
P(f"- الرموز (كل النداءات): إدخال {tin:,}، إخراج {tout:,}. بأسعار `qwen3.7-plus` كحد أعلى (0.32 / 1.28 دولار للمليون): أقل من {tin / 1e6 * 0.32 + tout / 1e6 * 1.28:.2f} دولار.")

P("\n## 7. حدود التجربة\n")
P("- الجودة الفعلية (هل المشهد واقعي، هل الخيارات مفاهيم خاطئة حقيقية، هل العربي سليم) ما تنقاس آليًا. صفحة المراجعة لحكمك.")
P("- أمثلة المفاهيم الخاطئة في برومت الكاتب من مسودات غير مراجعة.")
P("- عتبتا التشابه (0.55) والكلمات المفتاحية (0.4) مؤقتتان وغير مضبوطتين.")
P("- التوقيت المتوقع لكل موضوع كتبته أنا، وبعضه قابل للنقاش (مثل نافذة زكاة الفطر).")
(HERE / "batch-report.md").write_text("\n".join(L) + "\n", encoding="utf-8")

# ---------- review page ----------
CSS = """body{margin:0;background:#EFE9DE;color:#1F2A30;font-family:"IBM Plex Sans Arabic","Geeza Pro",sans-serif;line-height:1.8;font-size:16px}
.w{max-width:960px;margin:0 auto;padding:20px 16px 60px}h1{color:#0F4C5C}
details{background:#FAF7F2;border:1px solid #ECE6DA;border-radius:14px;margin:10px 0;padding:10px 16px}
summary{cursor:pointer;font-weight:700;color:#0F4C5C}summary span{font-weight:400;color:#6B7378;font-size:13px;margin-inline-start:8px}
.chip{display:inline-block;padding:1px 10px;border-radius:20px;font-size:12px;margin-inline-start:4px;background:#F5EFE3;border:1px solid #B8893B;color:#8C6527}
.bad{background:#B3261E;color:#fff;border-color:#B3261E}.ok{background:#E3EDEF;color:#0F4C5C;border-color:#E3EDEF}
.scene{font-weight:700;color:#0F4C5C}.opt{background:#fff;border:1px solid #ECE6DA;border-radius:10px;padding:8px 12px;margin:6px 0}
.rm{color:#B3261E;text-decoration:line-through}.fl{background:#FFF3CD}.src{background:#0F4C5C;color:#fff;border-radius:10px;padding:10px 12px;margin:6px 0;font-size:15px}
.k{display:block;margin-top:12px;font-size:12.5px;font-weight:700;color:#8C6527}"""


def sentence_html(s):
    cls = "rm" if not s["kept"] else ("fl" if s["flagged"] else "")
    tag = f"<span class='chip'>{E(s['label'])}{(' · ' + E(s['reason'])) if s.get('reason') else ''}</span>"
    return f"<span class='{cls}'>{E(s['text'])}</span>{tag} "


def journey_html(d, label=None):
    if d["status"] != "draft":
        return f"<details><summary>{E(label or d['topic_id'])} <span>{E(d['topic'])}</span> <span class='chip bad'>{E(d['status'])} {E(str(d.get('guard', {}).get('category', d.get('reason', d.get('error', '')))))}</span></summary></details>"
    j, ch, c = d["journey"], d["checks"], d["counters"]
    chips = "".join(f"<span class='chip {'ok' if ch[k] else 'bad'}'>{k}</span>" for k in ("shape", "scene_without_title_words", "variants_without_names", "when_valid", "reveals_nonempty"))
    wm = ch["when_matches_expected"]
    chips += f"<span class='chip {'ok' if wm else 'bad'}'>when {E(j['when'])}{'' if wm else ' (المتوقع ' + E(str(d['expected_when'])) + ')'}</span>"
    sents = collections.defaultdict(list)
    for s in d["sentences"]:
        sents[s["where"]].append(s)
    h = [f"<details><summary>{E(label or d['topic_id'])} — {E(j['title'])} <span>{E(d['topic'])} · محذوف {c['removed_by_verifier']}/{c['sentences_generated']} · معلَّم {c['flagged_general_religious']}</span></summary>{chips}",
         f"<span class='k'>المشهد</span><p class='scene'>{E(j['scene'])}</p><span class='k'>الخيارات والكشف</span>"]
    for o in j["options"]:
        h.append(f"<div class='opt'><b>{E(o['label'])}</b> — <i>{E(o['reveal_headline'])}</i><br>{''.join(sentence_html(s) for s in sents[f'reveal:' + o['id']])}</div>")
    h.append(f"<span class='k'>الشرح المبسط</span><p>{''.join(sentence_html(s) for s in sents['explanation'])}</p><span class='k'>المصادر</span>")
    h += [f"<div class='src'>{E(s['text_ar'])}<br><small>{E(s['kind'])} · {E(s['reference'])} {E(s.get('grade') or '')}</small></div>" for s in d["sources"]]
    h.append(f"<span class='k'>نقاط الفهم</span><ul>{''.join(f'<li>{E(k)}</li>' for k in j['key_points'])}</ul>")
    h.append(f"<span class='k'>نصيحة للدوام: {E(j['tip']['headline'])}</span><ul>{''.join(f'<li>{E(k)}</li>' for k in j['tip']['items'])}</ul>")
    h.append(f"<span class='k'>أسئلة الأمثلة</span><ul>{''.join(f'<li>{E(k)}</li>' for k in j['question_variants'])}</ul></details>")
    return "".join(h)


page = [f"<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>مراجعة دفعة المصنع</title><style>{CSS}</style><div class='w'>",
        "<h1>مراجعة دفعة المصنع</h1><p>مسودات تجربة، غير معتمدة. الأحمر المشطوب: جمل حذفها التحقق آليًا. الأصفر: جمل عامة فيها ادعاء ديني بلا سند (معلَّمة للمراجع). النصوص الشرعية منسوخة حرفيًا من المصادر بالكود.</p>"]
page += [journey_html(d) for d in docs.values()]
page.append("</div>")
(HERE / "batch-review.html").write_text("".join(page), encoding="utf-8")

if alt and "ramadan" in docs:
    pair = [("ramadan", docs["ramadan"]), ("ramadan__alt", alt)]
    random.Random(1448).shuffle(pair)
    (HERE / "ab-key.json").write_text(json.dumps({"أ": pair[0][1]["generation"]["models"]["research_and_writer"], "ب": pair[1][1]["generation"]["models"]["research_and_writer"]}, ensure_ascii=False, indent=1), encoding="utf-8")
    ab = [f"<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>مقارنة عمياء</title><style>{CSS}</style><div class='w'><h1>رمضان: نسخة أ ونسخة ب</h1><p>نفس البرومت ونفس المصادر ونفس المتحقق، والفرق في نموذج الكتابة فقط. مفتاح التسمية في ab-key.json، افتحه بعد ما تحكم.</p>",
          journey_html(pair[0][1], "نسخة أ").replace("<details>", "<details open>"), journey_html(pair[1][1], "نسخة ب").replace("<details>", "<details open>"), "</div>"]
    (HERE / "ab.html").write_text("".join(ab), encoding="utf-8")
print("wrote batch-report.md, batch-review.html" + (", ab.html" if alt else ""))
