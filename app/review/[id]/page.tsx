import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findDraft } from "@/lib/content/drafts";
import { decisionsFor, visibility } from "@/lib/content/review";
import { langSchema, type Lang } from "@/lib/content/types";
import { OCCASIONS } from "@/lib/factory/occasions";
import { currentReviewer } from "@/lib/review/session";
import { type ReviewUnit, reviewUnits, unitState } from "@/lib/review/units";
import { createServiceClient } from "@/lib/supabase/server";
import { uthmaniForDisplay } from "@/lib/text/uthmani";
import { approveRest, decide } from "../actions";

export const dynamic = "force-dynamic";

const LANGS: [Lang, string][] = [["ar", "العربية"], ["en", "English"], ["ur", "اردو"]];
const GROUPS: Record<ReviewUnit["group"], string> = { frame: "الإطار", option: "خيار", reveal: "كشف", explanation: "الشرح", tip: "نصيحة الدوام", key_point: "نقطة فهم", occasion: "المناسبة" };
const KIND: Record<string, string> = { quran: "آية", hadith: "حديث", term: "تعريف" };
const VERDICT: Record<string, string> = { supported: "مسنودة", general: "عامة بلا ادعاء ديني", general_religious: "ادعاء ديني بلا سند", unsupported: "غير مسنودة" };
const BUTTON = "h-10 rounded-lg px-3.5 text-sm font-semibold";

function questions(unit: ReviewUnit): string[] {
  if (unit.group === "occasion") return ["هل هذه المناسبة هي الوقت الصحيح لعرض هذه الرحلة؟"];
  if (!unit.sentence) return unit.group === "tip" ? ["هل هذا صحيح في السعودية اليوم؟"] : [];
  const q = unit.support ? ["هل هذا المصدر مناسب للبطاقة؟", "هل الجملة تمثّله بلا زيادة؟"] : ["هل في الجملة ادعاء ديني يحتاج سندًا؟"];
  if (unit.support?.kind === "quran") q.push("هل النص العربي يطابق المصحف؟");
  if (unit.sentence.kind === "workplace") q.push("هل هذا صحيح في السعودية اليوم؟");
  return q;
}

export default async function ReviewDraft({ params, searchParams }: PageProps<"/review/[id]">) {
  const reviewer = await currentReviewer();
  if (!reviewer) redirect("/review");
  const db = createServiceClient();
  const { id } = await params;
  const draft = db && /^[0-9a-f-]{36}$/.test(id) ? await findDraft(db, id) : null;
  if (!db || !draft) notFound();
  const wanted = langSchema.safeParse((await searchParams).lang);
  const lang: Lang = wanted.success && draft.locales[wanted.data] ? wanted.data : "ar";
  const text = draft.locales[lang];
  if (!text) notFound();

  const decisions = (await decisionsFor(db, [draft.id])).get(draft.id) ?? [];
  const units = reviewUnits(draft, lang);
  const v = visibility(draft, lang, decisions);
  const states = new Map(units.map((u) => [u.id, unitState(u, lang, decisions)]));
  const mine = (u: ReviewUnit) => states.get(u.id)?.[reviewer.role] ?? null;
  const rest = units.filter((u) => !u.flagged && !mine(u));
  const edited = new Set(decisions.filter((d) => d.lang === lang && d.action === "edit").map((d) => d.unit_id)).size;
  const lastDerive = draft.log.filter((l) => l.step === "derive" && l.lang === lang).map((l) => String(l.at)).sort().at(-1);
  const stale = lang !== "ar" && lastDerive !== undefined && draft.log.some((l) => l.step === "edit" && l.lang === "ar" && String(l.at) > lastDerive);
  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href="/review" className="self-start text-sm font-semibold text-teal underline underline-offset-4">
          كل المسودات
        </Link>
        <h1 className="text-2xl leading-snug font-bold text-teal">{draft.locales.ar.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {LANGS.map(([l, name]) =>
            draft.locales[l] ? (
              <Link key={l} href={`/review/${draft.id}?lang=${l}`} aria-current={l === lang ? "page" : undefined} className={`rounded-full border px-3 py-1 font-semibold ${l === lang ? "border-teal bg-teal text-white" : "border-line bg-card text-teal"}`}>
                {name}
              </Link>
            ) : null,
          )}
        </div>
        <p className="text-[15px] text-body" data-testid="status">
          أنت: {reviewer.name} ({reviewer.role === "sharia" ? "مراجع شرعي" : "فريق المشروع"}) · الحالة:{" "}
          <b className={v.visible ? "text-teal" : "text-warn"}>{v.visible ? (v.badge ? "معروضة للموظفين بشارة «بانتظار المراجعة الشرعية»" : "معروضة للموظفين باعتماد شرعي") : draft.needs_sharii && v.team ? "معتمدة من الفريق، ولا تُعرض قبل الاعتماد الشرعي" : `غير معروضة · ${v.pending} وحدة بانتظار الفريق`}</b>
          {" · "}جمل عدّلها المراجع: <b data-testid="edited">{edited}</b>
        </p>
        {stale && <p className="rounded-xl border border-warn bg-warn/10 px-3.5 py-2.5 text-sm font-semibold text-warn">العربي عُدّل بعد اشتقاق هذه اللغة. أعد الاشتقاق قبل اعتمادها.</p>}
        {lang !== "ar" && <p className="text-sm text-mute">هذه اللغة مشتقة من العربي وتُعتمد ببصمتها الخاصة. اعتماد العربي لا يعتمدها.</p>}
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
        <b className="text-sm text-teal">المصادر (منقولة حرفيًا، سحبها الكود لا النموذج)</b>
        {draft.sources.map((s) => (
          <details key={s.id} className="rounded-xl bg-beige px-3 py-2 text-[15px]">
            <summary className="cursor-pointer font-semibold">
              {KIND[s.kind]} · {s.kind === "quran" ? s.reference : s.reference_ar}
              {s.grade ? ` · ${s.grade}` : ""}
            </summary>
            <p dir="rtl" lang="ar" className={s.kind === "quran" ? "pt-2 font-quran text-[20px] leading-[2.2]" : "pt-2 leading-[1.9]"}>
              {s.kind === "quran" ? uthmaniForDisplay(s.text_ar) : s.text_ar}
            </p>
            {lang !== "ar" && <p dir={dir} className="pt-2 leading-relaxed text-body">{s.translations[lang].text}</p>}
            <a href={s.source_url} target="_blank" rel="noreferrer" className="text-sm text-teal underline underline-offset-4">
              افتح المصدر
            </a>
          </details>
        ))}
      </section>

      {rest.length > 0 && (
        <form action={approveRest} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold bg-beige p-4">
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="unitIds" value={rest.map((u) => u.id).join("|")} />
          <span className="grow text-[15px] leading-relaxed">بعد القراءة: اعتمد دفعة واحدة {rest.length} وحدة غير معلَّمة لم تقرر فيها بعد. الجمل المعلَّمة تُعتمد واحدة واحدة.</span>
          <button type="submit" data-testid="approve-rest" className={`${BUTTON} bg-teal text-white`}>
            اعتمد الباقي ({rest.length})
          </button>
        </form>
      )}

      <ol className="flex flex-col gap-3">
        {units.map((u) => {
          const s = states.get(u.id);
          const own = mine(u);
          return (
            <li key={u.id} data-unit={u.id} data-flagged={u.flagged} data-mine={own?.action ?? ""} className={`flex flex-col gap-2.5 rounded-2xl border p-4 ${u.flagged ? "border-warn bg-warn/5" : "border-line bg-card"}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-ic px-2.5 py-1 text-teal">
                  {GROUPS[u.group]}
                  {u.where ? ` ${u.where}` : ""}
                </span>
                {u.sentence?.label && <span className={`rounded-full px-2.5 py-1 ${u.sentence.label === "supported" ? "bg-ic text-teal" : u.flagged ? "bg-warn text-white" : "bg-beige text-gold-d"}`}>{VERDICT[u.sentence.label]}</span>}
                {u.sentence && <span className="rounded-full bg-beige px-2.5 py-1 text-gold-d">{u.sentence.kind === "workplace" ? "جملة دوام" : "جملة دينية"}</span>}
                {s?.team && <span className={`rounded-full px-2.5 py-1 ${s.team.action === "approve" ? "bg-teal text-white" : "bg-warn text-white"}`}>الفريق: {s.team.action === "approve" ? "معتمد" : "مرفوض"} ({s.team.reviewer})</span>}
                {s?.sharia && <span className={`rounded-full px-2.5 py-1 ${s.sharia.action === "approve" ? "bg-gold-d text-white" : "bg-warn text-white"}`}>الشرعي: {s.sharia.action === "approve" ? "معتمد" : "مرفوض"} ({s.sharia.reviewer})</span>}
                {s && s.edits > 0 && <span className="rounded-full border border-line px-2.5 py-1 text-mute">عُدّلت {s.edits}</span>}
              </div>

              <p dir={u.group === "occasion" ? "rtl" : dir} className="text-[17px] leading-[1.8] text-ink">
                {u.group === "occasion" ? draft.occasions.map((o) => OCCASIONS[o]?.ar ?? o).join("، ") || OCCASIONS.none.ar : u.text}
              </p>
              {u.sentence?.flags.map((f) => (
                <p key={f} dir="ltr" className="text-left text-sm text-warn">
                  ⚑ {f}
                </p>
              ))}
              {u.support && (
                <blockquote className="rounded-xl border-s-4 border-gold bg-beige px-3 py-2">
                  <span className="text-xs font-semibold text-gold-d">
                    السند · {KIND[u.support.kind]} · {u.support.reference}
                    {u.support.grade ? ` · ${u.support.grade}` : ""}
                  </span>
                  <p dir="rtl" lang="ar" className={u.support.kind === "quran" ? "font-quran text-[19px] leading-[2.2]" : "text-[15px] leading-[1.9]"}>
                    {u.support.kind === "quran" ? uthmaniForDisplay(u.support.text) : u.support.text}
                  </p>
                </blockquote>
              )}
              {questions(u).length > 0 && (
                <ul className="list-inside list-disc text-sm leading-relaxed text-mute">
                  {questions(u).map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              )}
              {s?.comments.map((c) => (
                <p key={c.created_at + c.reviewer} className="rounded-lg bg-cream px-3 py-2 text-sm text-body">
                  <b>{c.reviewer}:</b> {c.note}
                </p>
              ))}

              <div className="flex flex-wrap items-start gap-2">
                {(["approve", "reject"] as const).map((action) => (
                  <form key={action} action={decide}>
                    <input type="hidden" name="draftId" value={draft.id} />
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="unitId" value={u.id} />
                    <input type="hidden" name="action" value={action} />
                    <button type="submit" disabled={own?.action === action} className={`${BUTTON} disabled:opacity-40 ${action === "approve" ? "bg-teal text-white" : "border border-warn bg-card text-warn"}`}>
                      {action === "approve" ? "اعتماد" : "رفض"}
                    </button>
                  </form>
                ))}
                {u.editable && (
                  <details className="grow basis-full sm:basis-auto">
                    <summary className={`${BUTTON} inline-flex cursor-pointer items-center border border-line bg-card text-teal`}>تعديل</summary>
                    <form action={decide} className="flex flex-col gap-2 pt-2">
                      <input type="hidden" name="draftId" value={draft.id} />
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="unitId" value={u.id} />
                      <input type="hidden" name="action" value="edit" />
                      <textarea name="text" dir={dir} defaultValue={u.text} rows={3} required className="w-full rounded-xl border border-sand bg-card px-3 py-2 text-base leading-[1.8]" />
                      <span className="text-xs text-mute">التعديل يلغي أي اعتماد سابق لهذه الوحدة من الدورين، وتحتاج اعتمادًا جديدًا.</span>
                      <button type="submit" className={`${BUTTON} self-start bg-gold-d text-white`}>احفظ التعديل</button>
                    </form>
                  </details>
                )}
                <details className="grow basis-full sm:basis-auto">
                  <summary className={`${BUTTON} inline-flex cursor-pointer items-center border border-line bg-card text-teal`}>تعليق</summary>
                  <form action={decide} className="flex flex-col gap-2 pt-2">
                    <input type="hidden" name="draftId" value={draft.id} />
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="unitId" value={u.id} />
                    <input type="hidden" name="action" value="comment" />
                    <textarea name="note" rows={2} required className="w-full rounded-xl border border-sand bg-card px-3 py-2 text-base" />
                    <button type="submit" className={`${BUTTON} self-start border border-teal bg-card text-teal`}>أضف التعليق</button>
                  </form>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
