import topics from "@/content/topics.json";

export type ActivityEvent = { created_at: string; type: string | null; journey_id: string | null; lang: string | null; choice: string | null; score: number | null; company: string | null };
export type ActivityReferral = { created_at: string; lang: string | null; topic: string | null; status: string; company: string | null };

const TITLE = new Map(topics.map((t) => [t.id, t.route.title_ar]));
const LANG: Record<string, string> = { ar: "العربية", en: "English", ur: "اردو" };
const OUTCOME: Record<string, string> = { journey: "وُجّه إلى لحظة", candidates: "عُرضت عليه لحظات مرشحة", specialist: "أُحيل إلى مختص", empty: "لا إجابة موثّقة" };
const TOPIC: Record<string, string> = { personal_ruling: "حكم يخص حالته الشخصية", disputed_matter: "مسألة فيها أكثر من رأي", about_islam: "يريد أن يعرف أكثر عن الإسلام", other: "شيء آخر" };
const STATUS: Record<string, string> = { new: "جديد", accepted: "مستلَم", closed: "مغلق" };
const POINTS = ["", "ذكر مفهومًا خاطئًا", "لم يذكر أي نقطة", "نقطة واحدة", "نقطتان", "النقاط الثلاث"];

type Row = { at: string; what: string; journey: string; detail: string; lang: string; company: string };

function fromEvent(e: ActivityEvent): Row {
  const journey = e.journey_id ? (TITLE.get(e.journey_id) ?? e.journey_id) : "";
  const base = { at: e.created_at, journey, lang: LANG[e.lang ?? ""] ?? "", company: e.company ?? "" };
  if (e.type === "start") return { ...base, what: "بدأ لحظة", detail: "" };
  if (e.type === "choice") return { ...base, what: "اختار في المشهد", detail: e.choice === "other" ? "شيء آخر" : `الخيار ${e.choice ?? ""}` };
  if (e.type === "complete") return { ...base, what: "أكمل لحظة", detail: "" };
  if (e.type === "grade") return { ...base, what: "شرحها بكلماته", detail: POINTS[e.score ?? 0] ?? "" };
  if (e.type === "classify") return { ...base, what: "سأل سؤالًا حرًا", detail: OUTCOME[e.choice ?? ""] ?? "" };
  return { ...base, what: e.type ?? "", detail: "" };
}

const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Everything that happened, newest first, as dated rows. Counts and fixed labels only: never what an employee wrote. */
export function Activity({ events, referrals }: { events: ActivityEvent[]; referrals: ActivityReferral[] }) {
  const rows: Row[] = [
    ...events.map(fromEvent),
    ...referrals.map((r) => ({ at: r.created_at, what: "طلب التواصل مع مختص", journey: "", detail: `${TOPIC[r.topic ?? ""] ?? TOPIC.other} · ${STATUS[r.status] ?? r.status}`, lang: LANG[r.lang ?? ""] ?? "", company: r.company ?? "" })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4" data-testid="activity">
      <h2 className="text-[17px] font-bold text-teal">سجل النشاط · آخر {rows.length}</h2>
      {rows.length === 0 ? (
        <p className="text-[15px] text-mute">لا يوجد نشاط بعد.</p>
      ) : (
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="text-mute">
                {["الوقت (الرياض)", "الحدث", "اللحظة", "التفاصيل", "اللغة", "الشركة"].map((h) => (
                  <th key={h} className="py-1.5 text-start font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.at}-${i}`} className="border-t border-line">
                  <td dir="ltr" className="py-1.5 text-end whitespace-nowrap text-mute">{time.format(new Date(r.at))}</td>
                  <td className="font-semibold text-ink">{r.what}</td>
                  <td>{r.journey}</td>
                  <td className="text-body">{r.detail}</td>
                  <td>{r.lang}</td>
                  <td dir="ltr" className="text-end text-mute">{r.company}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-mute">كل صف حدث واحد بلا اسم ولا معرّف. نصوص الأسئلة والشروح لا تُحفظ.</p>
    </section>
  );
}
