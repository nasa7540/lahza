import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import results from "@/content/eval/results.json";

type Json = Record<string, unknown> | null | undefined;
const num = (o: Json, key: string): string => (o && o[key] !== undefined && o[key] !== null ? String(o[key]) : "—");
const obj = (o: Json, key: string): Json => (o && typeof o[key] === "object" ? (o[key] as Json) : null);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function Section({ title, when, children }: { title: string; when: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold text-teal">{title}</h2>
        <span className="text-xs text-mute">{when}</span>
      </div>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-line py-1">
          <dt className="text-body">{k}</dt>
          <dd dir="ltr" className="font-semibold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-sm leading-relaxed text-mute">{children}</p>;
const TODAY = "قيس في أيام التحدي";
const BEFORE = "قيس يوم 3 أكتوبر، قبل التحدي";

/** Results of the automatic tests, as they came out. Rebuilt by `npm run eval`. */
export default function EvalPage() {
  const r = results as unknown as Record<string, Json> & { journeys: Record<string, unknown>[]; generated_at: string };
  const f = r.factory;
  const pre = r.pre_challenge;
  const guardGen = r.guard_generated;
  const needs = obj(obj(guardGen, "table"), "needs_sharii");
  const stress = (name: string) => ((obj(r.stress, name)?.levels as Record<string, unknown>[] | undefined) ?? []).map((l) => `${l.concurrency}: ${l.median_ms} / ${l.p95_ms} ms`).join("  ·  ") || "—";
  const invariants = r.invariants;
  const failedInvariants = ((invariants?.results as { name: string; ok: boolean }[] | undefined) ?? []).filter((x) => !x.ok);
  const base = obj(r.baseline, "summary");
  const t1 = obj(obj(pre, "verifier_planted_errors"), "held_out");
  const t2 = obj(pre, "retrieval_quran_qa_2023");
  const g480 = obj(obj(pre, "guard_480"), "all");

  return (
    <div data-eval-ready className="flex flex-col gap-5">
      <Logo />
      <div>
        <h1 className="text-2xl font-bold text-teal">نتائج الاختبارات</h1>
        <p className="text-[15px] leading-relaxed text-body">الأرقام كما خرجت من الاختبارات الآلية، بما فيها ما لم ينجح. آخر تجميع: <span dir="ltr">{r.generated_at.slice(0, 16).replace("T", " ")} UTC</span>.</p>
      </div>

      <Section title="الرحلات: ما ولّده المصنع وما راجعه إنسان" when={TODAY}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-mute">
                {["الرحلة", "مصادر", "مراجع فشل سحبها", "جمل مولّدة", "حذفها المتحقق", "ادعاءات دينية مسنودة", "معلَّمة للمراجع", "عدّلها المراجع", "معروضة"].map((h) => (
                  <th key={h} className="py-1.5 text-start font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.journeys.map((j) => {
                const shown = Object.entries(j.shown as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k);
                return (
                  <tr key={String(j.id)} className="border-t border-line">
                    <td className="py-2 font-semibold">{String(j.title_ar)}</td>
                    <td>{String(j.sources)}</td>
                    <td>{String(j.references_failed)}</td>
                    <td>{String(j.sentences_generated)}</td>
                    <td>{String(j.removed_by_verifier)}</td>
                    <td dir="ltr" className="text-end">{String(j.religious_supported)}/{String(j.religious_claims)}</td>
                    <td>{String(j.flagged_for_reviewer)}</td>
                    <td>{String(j.edited_by_reviewer)}</td>
                    <td dir="ltr" className="text-end">{shown.length ? shown.join(" ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Note>
          المجموع: {num(f, "religious_supported")} من {num(f, "religious_claims")} ادعاءً دينيًا مسنودًا بمقطع من مصدر ({pct(Number(f?.religious_supported), Number(f?.religious_claims))})، و{num(f, "removed_by_verifier")} جملة حذفها المتحقق من {num(f, "sentences_generated")}. الجملة غير المسنودة لا تُحذف آليًا إلا بحكم المتحقق؛ الباقي يُعلَّم ويظهر للمراجع أول القائمة. «معروضة» تعني أن إنسانًا اعتمد كل وحدة نصية بتلك اللغة.
        </Note>
      </Section>

      <Section title="مقارنة مع شات بوت عام" when={TODAY}>
        <Facts rows={[
          ["أسئلة الفتوى والخلاف: الشات بوت أجاب", num(obj(base, "fatwa_and_disputed"), "chatbot_answered")],
          ["منها: أعطى حكمًا أو رجّح قولًا", num(obj(base, "fatwa_and_disputed"), "chatbot_gave_a_ruling_or_took_a_side")],
          ["لحظة عرضت رحلة لهذه الأسئلة", num(obj(base, "fatwa_and_disputed"), "lahza_offered_a_journey")],
          ["خارج الموضوع والحقن: الشات بوت أجاب", num(obj(base, "off_topic_and_injection"), "chatbot_answered")],
          ["كل الأسئلة: الشات بوت كتب نص آية أو حديث من عنده", num(obj(base, "all_questions"), "chatbot_wrote_scripture_text_itself")],
          ["لحظة: نص من النموذج وصل للمستخدم", "0"],
        ]} />
        <Note>نفس الأسئلة السبعين أُرسلت لنفس النموذج ببرومت عادي بلا حارس ولا بحث ولا بوابة، ثم وسمها نموذج من عائلة أخرى. ردود الشات بوت نفسها لا تُحفظ في المستودع لأنها نص ديني غير مراجَع.</Note>
      </Section>

      <Section title="السؤال الحر: التوجيه" when={TODAY}>
        <Facts rows={[["أسئلة", num(r.classify, "n")], ["توجيه صحيح", num(r.classify, "correct")], ["مرشحات تتضمن الصحيحة", num(r.classify, "partial")], ["قبول خاطئ (فتوى، خلافي، خارج الموضوع، حقن)", num(r.classify, "false_accept") === "—" ? "0" : num(r.classify, "false_accept")], ["توجيه لرحلة خاطئة", num(r.classify, "wrong_journey") === "—" ? "0" : num(r.classify, "wrong_journey")], ["رفض خاطئ", num(r.classify, "false_reject")], ["الوسيط", `${num(r.classify, "median_ms")} ms`], ["p95", `${num(r.classify, "p95_ms")} ms`]]} />
        <Note>الأسئلة السبعون سُجّلت قبل التحدي وشوهدت أثناء التصميم، فهذه ليست نتيجة على بيانات غير مرئية. تُعاد على أسئلة موظفين حقيقيين عند وصولها.</Note>
      </Section>

      <Section title="المقيّم: الحقن والعتبة" when={TODAY}>
        <Facts rows={[["حالات حقن (كل واحدة 3 مرات)", num(r.grader, "injection_cases")], ["حالات حصلت على نقطة غير مستحقة", num(r.grader, "injection_cases_with_an_undeserved_point")], ["إجابات فصيحة خاطئة بلا نقاط", num(r.grader, "fluent_wrong_earning_no_point")], ["صياغات مختلفة تمامًا حصلت على نقطتين أو أكثر", num(r.grader, "paraphrases_earning_two_or_more_points")], ["عتبة تشابه الاقتباس", num(r.grader_threshold, "threshold")], ["الثلث المحجوز: اقتباسات سليمة أُبقيت", num(obj(r.grader_threshold, "held_out"), "good_quotes_kept")], ["الثلث المحجوز: نص ليس دليلًا ومرّ", num(obj(r.grader_threshold, "held_out"), "non_evidence_passing")]]} />
        <Note>نقطة ضعف معلنة: المقيّم صارم. من يشرح بصياغة بعيدة عن نص النقطة قد لا تُحسب له نقطة يستحقها. الضرر محصور في ملاحظة «أضِفه إلى فهمك»، ولا تُعرض درجة.</Note>
      </Section>

      <Section title="حارس المواضيع" when={TODAY}>
        <Facts rows={[["قائمة صاحب المشروع: مواضيع (كل واحد 3 مرات)", num(r.guard_owner_list, "topics")], ["كما هو متوقع", num(r.guard_owner_list, "as_expected")], ["ممنوع أو حساس قُبل كعادي", num(r.guard_owner_list, "unsafe_allows")], ["بيانات مولّدة جديدة: مطابقة", `${num(guardGen, "exact")}/${num(guardGen, "n")}`], ["فئة needs_sharii بصيغة وصفية: صُنّفت صحيحًا", `${num(needs, "needs_sharii")}/100`], ["منها رجع «عادي»", num(needs, "allow")]]} />
        <Note>
          النتيجة الأخيرة ضعيفة ونعرضها كما هي: حين يُوصف الموضوع الحساس كمشهد في العمل بلا كلمات صريحة، يمرّ أغلبه كموضوع عادي. جزء من الحالات تسمية خاطئة من مولّد البيانات، وجزء حقيقي. الأثر على هذه النسخة: لا شيء، لأن المصنع يعمل على المواضيع الستة المحددة فقط وكل نص يعتمده إنسان. <b>حارس المواضيع المفتوحة في خارطة الطريق</b>، ولا يُفتح توليد مواضيع جديدة قبل إصلاحه.
        </Note>
      </Section>

      <Section title="الحمل" when={TODAY}>
        <Facts rows={[["/api/classify — متزامن: وسيط / p95", stress("classify")], ["/api/grade — متزامن: وسيط / p95", stress("grade")]]} />
        <Note>دقيقة لكل مستوى (20 و35 و50 طلبًا متزامنًا) على نسخة إنتاج محلية. صفر أخطاء، صفر ردود غير صالحة، وصفر طلبات وصلت سقف 12 ثانية.</Note>
      </Section>

      <Section title="التقويم وخط الآيات والثوابت" when={TODAY}>
        <Facts rows={[["أيام مقارنة بجدول أم القرى (1446–1450)", num(r.calendar, "days")], ["فحوص", num(r.calendar, "checks")], ["أخطاء (تاريخ، مناسبة، عدّاد)", `${num(r.calendar, "date_errors")} / ${num(r.calendar, "occasion_errors")} / ${num(r.calendar, "countdown_errors")}`], ["آيات فُحصت رموزها في الخط", num(r.font, "verses")], ["رموز ناقصة في الخط", num(r.font, "missing")], ["ثوابت: تأكيدات", num(invariants, "assertions")], ["ثوابت: فشل", num(invariants, "failed")]]} />
        {failedInvariants.length > 0 && <Note>ثوابت لم تنجح في آخر تشغيل: {failedInvariants.map((x) => x.name).join("؛ ")}.</Note>}
        <Note>الثوابت: لا نص من النموذج في أي رد، لا مسودة غير معتمدة في أي صفحة، الموضوع الحساس لا يُعرض بلا اعتماد شرعي، التعديل يلغي الاعتماد، الشارة تظهر باعتماد الفريق وحده، والمفتاح العام لا يكتب في القاعدة.</Note>
      </Section>

      <Section title="المتحقق بأخطاء مزروعة" when={BEFORE}>
        <Facts rows={[["جمل محرّفة (الثلث المحجوز)", num(t1, "corrupt_n")], ["التُقطت", num(t1, "caught")], ["جمل سليمة", num(t1, "correct_n")], ["سليمة رُفضت بالخطأ", num(t1, "false_reject")]]} />
        <Note>أخطاء مزروعة في جمل سليمة: رقم مغيّر، اسم مغيّر، مبالغة. قيست بسكربتات بايثون قبل التحدي ولم تُعَد على مصنع TypeScript.</Note>
      </Section>

      <Section title="البحث في القرآن على Qur'an QA 2023" when={BEFORE}>
        <Facts rows={[["أسئلة لها جواب", num(obj(t2, "all"), "n")], ["الآية الصحيحة ضمن أول 5", num(obj(t2, "all"), "hit@5")], ["ضمن أول 10", num(obj(t2, "all"), "hit@10")], ["ضمن أول 20", num(obj(t2, "all"), "hit@20")], ["المحجوز: ضمن أول 20", `${num(obj(t2, "holdout"), "hit@20")}/${num(obj(t2, "holdout"), "n")}`]]} />
        <Note>متجهات bge-m3 فقط. البيانات برخصة CC BY-NC-ND 4.0: السكربت ينزّلها وقت التشغيل ولا تُخزَّن في المستودع. البحث يجد الآية ضمن أول 20 في نحو ثلثي الأسئلة، ودرجة التشابه لا تميّز الأسئلة التي لا جواب لها، لذلك لا يمتنع المصنع بالتشابه، والمتحقق والمراجع هما الحكم.</Note>
      </Section>

      <Section title="حارس المواضيع على 480 موضوعًا مولّدًا" when={BEFORE}>
        <Facts rows={[["مطابقة", `${num(g480, "correct")}/${num(g480, "n")}`], ["ممنوع قُبل كعادي", num(g480, "unsafe_allowed")], ["عادي حُجب", num(g480, "allowed_but_blocked")]]} />
        <Note>برومت الحارس عُدّل بعد هذا القياس (صيغ «هل يجوز» إشارة لا رفض)، فهذه أرقام النسخة السابقة.</Note>
      </Section>

      <Section title="RAGAS" when={BEFORE}>
        <Note>جُرّب على عيّنة صغيرة فقط ولم يكتمل تشغيله بشكل موثوق، فتُرك بقرار. لا نعرض له رقمًا.</Note>
      </Section>
    </div>
  );
}
