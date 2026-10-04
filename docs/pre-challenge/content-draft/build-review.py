#!/usr/bin/env python3
"""Renders content/*.json as one readable page (review.html) for human review.

Reads only local files written by build-content.py; no network, no model.
"""
import html
import json
import pathlib

HERE = pathlib.Path(__file__).parent
CONTENT = HERE / "content"
E = html.escape

LANG = {"ar": ("العربية", "rtl"), "en": ("English", "ltr"), "ur": ("اردو", "rtl")}
MONTHS = ["", "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"]
DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

CSS = """
:root{--teal:#0F4C5C;--gold:#B8893B;--goldD:#8C6527;--sand:#D9C6A0;--cream:#FAF7F2;--card:#FFFDF8;--line:#ECE6DA;--beige:#F5EFE3;--ic:#E3EDEF;--ink:#1F2A30;--mute:#6B7378;--body:#3A464C;--red:#B3261E}
*{box-sizing:border-box}
body{margin:0;background:#EFE9DE;color:var(--ink);font-family:"IBM Plex Sans Arabic","IBM Plex Sans",-apple-system,"Geeza Pro",sans-serif;line-height:1.75;font-size:16px}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px 64px}
h1{color:var(--teal);margin:0 0 4px;font-size:28px}
.lead{color:var(--body);margin:0 0 16px;max-width:70ch}
nav{position:sticky;top:0;z-index:5;display:flex;gap:8px;flex-wrap:wrap;padding:10px 0;background:#EFE9DE}
nav a{padding:6px 14px;border-radius:20px;border:1px solid var(--line);background:var(--card);color:var(--teal);text-decoration:none;font-weight:600;font-size:14px}
nav a:hover{background:var(--ic)}
.journey{margin-top:28px;background:var(--cream);border:1px solid var(--line);border-radius:18px;padding:20px}
.journey>header{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}
.journey h2{margin:0;color:var(--teal);font-size:22px}
.chip{padding:3px 12px;border-radius:20px;background:var(--beige);border:1px solid var(--gold);color:var(--goldD);font-size:13px;font-weight:600}
.chip.id{background:var(--ic);border-color:var(--ic);color:var(--teal);direction:ltr}
.cols{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));align-items:start}
.col{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;min-width:0}
.col>h3{margin:0 0 10px;font-size:13px;color:var(--goldD);letter-spacing:.04em}
.k{display:block;margin-top:16px;font-size:12.5px;font-weight:700;color:var(--goldD)}
.scene{font-size:18px;font-weight:700;color:var(--teal);margin:4px 0 0;line-height:1.5}
.opt{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:8px;background:#fff}
.opt b.l{display:block}
.opt code{font-size:11.5px;color:var(--mute);direction:ltr;unicode-bidi:isolate}
.opt .h{display:block;color:var(--teal);font-weight:700;margin-top:6px}
.opt p{margin:2px 0 0;color:var(--body);font-size:15px}
.src{border-radius:14px;overflow:hidden;border:1px solid var(--line);margin-top:8px}
.src .t{background:var(--teal);color:#fff;padding:14px}
.src .t .ar{font-size:20px;line-height:2;margin:0;direction:rtl;text-align:right}
.src .t .tr{margin:10px 0 0;padding-top:10px;border-top:1px solid rgba(217,198,160,.4);font-size:15px;color:rgba(255,255,255,.9)}
.src .t .fn{margin:8px 0 0;font-size:12.5px;color:rgba(255,255,255,.7)}
.src .r{background:var(--beige);padding:10px 14px;display:flex;flex-wrap:wrap;gap:6px;font-size:12.5px}
.src .r span{background:#fff;border-radius:20px;padding:3px 10px}
.src .r .bad{background:var(--red);color:#fff;font-weight:700}
.ai{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:8px;background:#fff}
.ai .tag{display:inline-block;margin-bottom:6px;padding:2px 10px;border-radius:20px;background:var(--beige);border:1px solid var(--gold);color:var(--goldD);font-size:12px;font-weight:600}
.ai p{margin:0;color:var(--body)}
.tip{background:var(--teal);color:#fff;border-radius:14px;padding:14px;margin-top:8px}
.tip b{font-size:18px;display:block}
.tip span{color:rgba(255,255,255,.88)}
ul,ol{margin:6px 0 0;padding-inline-start:22px}
li{margin:2px 0}
li code{font-size:11.5px;color:var(--mute)}
.missing{color:var(--mute);font-style:italic}
"""


def when_text(w):
    if w["type"] == "always":
        return "دائمة"
    if w["type"] == "weekday":
        return "كل " + " و".join(DAYS[d] for d in w["weekdays"])
    return "، ".join(f"{x['from']['day']} {MONTHS[x['from']['month']]} إلى {x['to']['day']} {MONTHS[x['to']['month']]}" for x in w["windows"])


def source_box(s, lang):
    tr = s["translations"].get(lang)
    out = ['<div class="src"><div class="t">', f'<p class="ar" lang="ar">{E(s["text_ar"])}</p>']
    if tr:
        out.append(f'<p class="tr">{E(tr["text"])}</p>')
        if tr.get("footnotes"):
            out.append(f'<p class="fn">{E(tr["footnotes"])}</p>')
    out.append('</div><div class="r">')
    out.append(f'<span>{E(s["reference_ar"] if lang == "ar" else s["reference"])}</span>')
    if s.get("grade"):
        out.append(f'<span>{E(tr.get("grade") or s["grade"]) if tr else E(s["grade"])}</span>')
    if tr:
        ver = f' v{tr["translation_version"]}' if tr.get("translation_version") else ""
        out.append(f'<span>{E(tr["translator"])}{E(ver)}</span>')
    out.append(f'<span><a href="{E(s["source_url"])}">المصدر</a></span>')
    if not s["verified"]:
        out.append('<span class="bad">UNVERIFIED</span>')
    out.append("</div></div>")
    return "".join(out)


def column(j, lang, sources):
    name, direction = LANG[lang]
    loc, card = j["locales"].get(lang), j["card"]
    if not loc:
        return f'<div class="col" dir="rtl"><h3>{name}</h3><p class="missing">لا يوجد محتوى بهذه اللغة لهذه الرحلة.</p></div>'
    o = [f'<div class="col" dir="{direction}" lang="{lang}"><h3>{name}</h3>',
         f'<b>{E(loc["title"])}</b> — {E(loc["teaser"])}',
         f'<span class="k">المشهد</span><p class="scene">{E(loc["scene"])}</p>',
         '<span class="k">الخيارات والكشف</span>']
    for opt in loc["options"]:
        r = loc["reveals"][opt["id"]]
        o.append(f'<div class="opt"><b class="l">{E(opt["label"])} <code>{E(opt["id"])}</code></b>'
                 f'<span class="h">{E(r["headline"])}</span><p>{E(r["body"])}</p></div>')
    o.append('<span class="k">المصدر</span>')
    o += [source_box(sources[i], lang) for i in card["source_ids"]]
    o.append(f'<span class="k">الشرح المبسط</span><div class="ai"><span class="tag">مسودة ذكاء اصطناعي · {E(card["generated_by"])} · غير مراجَعة</span>'
             f'<p>{E(card["explanation"][lang])}</p></div>')
    o.append(f'<span class="k">اشرحها بكلماتك</span>{E(loc["explain_prompt"])}')
    tip = loc["tip"]
    o.append(f'<span class="k">نصيحة للدوام</span><div class="tip"><b>{E(tip["headline"])}</b><span>{E(tip["lead"])}</span></div>'
             + "<ul>" + "".join(f"<li>{E(i)}</li>" for i in tip["items"]) + "</ul>")
    o.append('<span class="k">نقاط الفهم</span><ul>' + "".join(f'<li>{E(k[lang])} <code>{k["id"]}</code></li>' for k in card["key_points"] if lang in k) + "</ul>")
    o.append('<span class="k">أسئلة الأمثلة</span><ol>' + "".join(f"<li>{E(q)}</li>" for q in card["question_variants"][lang]) + "</ol></div>")
    return "".join(o)


def main():
    sources = {s["id"]: s for s in json.loads((CONTENT / "sources.json").read_text(encoding="utf-8"))}
    journeys = sorted((json.loads(p.read_text(encoding="utf-8")) for p in (CONTENT / "journeys").glob("*.json")), key=lambda j: j["sort"])
    body = ['<div class="wrap"><h1>مراجعة محتوى الرحلات — لحظة</h1>',
            '<p class="lead">صفحة للمراجعة فقط، مولّدة من ملفات المحتوى المحلية. النصوص الشرعية منسوخة حرفيًا من quranenc.com و hadeethenc.com وكلها بعلامة UNVERIFIED لين تعتمدها. للتعديل: غيّر في journeys-draft.md ثم شغّل build-content.py.</p>',
            "<nav>" + "".join(f'<a href="#{j["id"]}">{E(j["locales"]["ar"]["title"])}</a>' for j in journeys) + "</nav>"]
    for j in journeys:
        body.append(f'<section class="journey" id="{j["id"]}"><header><h2>{j["sort"]}. {E(j["locales"]["ar"]["title"])}</h2>'
                    f'<span class="chip id">{j["id"]}</span><span class="chip">المستوى {j["level"]}</span>'
                    f'<span class="chip">التوقيت: {E(when_text(j["when"]))}</span></header><div class="cols">')
        body += [column(j, lang, sources) for lang in ("ar", "en", "ur") if lang in j["locales"] or lang != "ur"]
        body.append("</div></section>")
    body.append("</div>")
    page = ('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f"<title>مراجعة محتوى الرحلات — لحظة</title><style>{CSS}</style></head><body>{''.join(body)}</body></html>")
    out = HERE / "review.html"
    out.write_text(page, encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
