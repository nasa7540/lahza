#!/usr/bin/env python3
"""Reading page for the six sources-first drafts (experiment output, not the product's review panel)."""
import collections, html, json, pathlib
HERE = pathlib.Path(__file__).parent
E = html.escape
SIX = ["ramadan", "prayer", "friday", "eid-fitr", "team-dinner", "inshallah"]
KIND = {"quran": "آية", "hadith": "حديث", "term": "تعريف", None: ""}
LAB = {"supported": "مسنودة", "general": "دوام", "general_religious": "دينية بلا سند", "unsupported": "بلا سند"}
CSS = """body{margin:0;background:#EFE9DE;color:#1F2A30;font-family:"IBM Plex Sans Arabic","Geeza Pro",sans-serif;line-height:1.85;font-size:16px}.w{max-width:940px;margin:0 auto;padding:20px 16px 60px}h1,h2{color:#0F4C5C}
section{background:#FAF7F2;border:1px solid #ECE6DA;border-radius:14px;margin:16px 0;padding:14px 18px}.k{display:block;margin-top:12px;font-size:12.5px;font-weight:700;color:#8C6527}
.chip{display:inline-block;padding:0 9px;border-radius:20px;font-size:12px;margin-inline-start:4px;background:#F5EFE3;border:1px solid #B8893B;color:#8C6527}.ok{background:#E3EDEF;color:#0F4C5C;border-color:#E3EDEF}.bad{background:#B3261E;color:#fff;border-color:#B3261E}
.opt{background:#fff;border:1px solid #ECE6DA;border-radius:10px;padding:8px 12px;margin:6px 0}.rm{color:#B3261E;text-decoration:line-through}.fl{background:#FFF3CD}.src{background:#0F4C5C;color:#fff;border-radius:10px;padding:10px 12px;margin:6px 0;font-size:15px}
.seg{display:block;font-size:13px;color:#6B7378;margin-inline-start:14px}.scene{font-weight:700;color:#0F4C5C}"""


def sent(s):
    cls = "rm" if not s["kept"] else ("fl" if s["flags"] else "")
    out = f"<span class='{cls}'>{E(s['text'])}</span><span class='chip'>{LAB[s['label']]}{' · ' + E(' '.join(s['facts'])) if s['facts'] else ''}</span>"
    if s.get("segment_text"):
        out += f"<span class='seg'>السند — {KIND.get(s.get('source_kind'), '')} ({E(s['segment'])}): {E(s['segment_text'])}</span>"
    for x in s["flags"]:
        out += f"<span class='seg'>تنبيه: {E(x)}</span>"
    return out + "<br>"


H = [f"<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>المصادر أولًا: الرحلات الست</title><style>{CSS}</style><div class='w'>"
     "<h1>المصادر أولًا: الرحلات الست</h1><p>مسودات تجربة يوم 3 أكتوبر (قبل البداية)، غير معتمدة. الكاتب claude-opus-5.5 والمتحقق qwen3.7-plus. تحت كل جملة مسنودة نص المقطع ونوعه (آية / حديث / تعريف)، منسوخ بالكود من المصدر. الأصفر: جملة عليها تنبيه. الأحمر المشطوب: حذفها المتحقق. الصلاة والعيد هما النسخة الثانية بعد القواعد الجديدة.</p>"]
for t in SIX:
    d = json.loads((HERE / "sources-first" / f"{t}.json").read_text(encoding="utf-8"))
    j, c, ch = d["journey"], d["counters"], d["checks"]
    by = collections.defaultdict(list)
    for s in d["sentences"]:
        by[s["where"]].append(s)
    H.append(f"<section><h2>{E(j['title'])} <span class='chip'>{t}</span></h2><span class='chip ok'>مسنودة {c['religious_supported']}/{c['religious_claims']}</span><span class='chip'>محذوفة {c['removed_by_verifier']}</span>"
             f"<span class='chip'>المناسبة: {E('، '.join(j['occasions']))}</span><span class='chip {'ok' if ch['when_matches_expected'] else 'bad'}'>التوقيت {'يطابق' if ch['when_matches_expected'] else 'لا يطابق المتوقع'}</span>")
    H.append(f"<span class='k'>المشهد</span><p class='scene'>{E(j['scene'])}</p><span class='k'>الخيارات والكشف</span>")
    for o in j["options"]:
        H.append(f"<div class='opt'><b>{E(o['label'])}</b> — <i>{E(o['reveal_headline'])}</i><br>{''.join(sent(s) for s in by['reveal:' + o['id']])}</div>")
    H.append(f"<span class='k'>الشرح المبسط</span><div class='opt'>{''.join(sent(s) for s in by['explanation'])}</div>")
    H.append("<span class='k'>الحقائق المستخرجة</span><ul>" + "".join(f"<li><b>{x['id']}</b> <span class='chip'>{KIND.get(x.get('kind'), '')}</span> {E(x['statement'])}<span class='seg'>{E(x['quote'])}</span></li>" for x in d["facts"]) + "</ul>")
    H.append("<span class='k'>المصادر</span>" + "".join(f"<div class='src'>{E(s['text_ar'])}<br><small>{KIND[s['kind']]} · {E(s['reference'])} {E(s.get('grade') or '')}</small></div>" for s in d["sources"]))
    H.append(f"<span class='k'>نصيحة للدوام: {E(j['tip']['headline'])}</span><ul>{''.join(f'<li>{E(x)}</li>' for x in j['tip']['items'])}</ul><span class='k'>نقاط الفهم</span><ul>{''.join(f'<li>{E(x)}</li>' for x in j['key_points'])}</ul>"
             f"<span class='k'>أسئلة الأمثلة</span><ul>{''.join(f'<li>{E(x)}</li>' for x in j['question_variants'])}</ul></section>")
(HERE / "sources-first.html").write_text("".join(H) + "</div>", encoding="utf-8")
print("wrote sources-first.html")
