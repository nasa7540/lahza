import { Logo } from "@/components/Logo";
import topics from "@/content/topics.json";
import { dashboardGate } from "@/lib/dashboard";
import { type EventRow, summarise } from "@/lib/dashboard-counts";
import { REFERRAL_TOPICS } from "@/lib/referral";
import { createServiceClient } from "@/lib/supabase/server";
import { enter, leave, moveReferral } from "./actions";
import { Activity, type ActivityEvent } from "./Activity";

export const dynamic = "force-dynamic";

const TOPIC: Record<(typeof REFERRAL_TOPICS)[number], string> = { personal_ruling: "حكم يخص حالته الشخصية", disputed_matter: "مسألة فيها أكثر من رأي", about_islam: "يريد أن يعرف أكثر عن الإسلام", other: "شيء آخر" };
const STATUS: Record<string, string> = { new: "جديد", accepted: "مستلَم", closed: "مغلق" };
const OUTCOME: Record<string, string> = { journey: "وُجّه إلى لحظة", candidates: "عُرضت عليه لحظات مرشحة", specialist: "أُحيل إلى مختص", empty: "لا إجابة موثّقة" };
const LANG: Record<string, string> = { ar: "العربية", en: "English", ur: "اردو" };
type Referral = { id: string; created_at: string; lang: string | null; topic: string | null; status: string; summary: string; company: string | null };

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const { error, c } = await searchParams;
  if (!(await dashboardGate.current())) {
    return (
      <>
        <Logo />
        <h1 className="text-2xl font-bold text-teal">لوحة الشركة</h1>
        {error && <p role="alert" className="rounded-xl border border-warn bg-warn/10 px-3.5 py-2.5 text-sm font-semibold text-warn">رمز الدخول غير صحيح.</p>}
        <form action={enter} className="flex max-w-[420px] flex-col gap-3.5 rounded-2xl border border-line bg-card p-5">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            رمز الدخول
            <input name="passcode" type="password" required autoComplete="off" className="h-11 w-full rounded-xl border border-sand bg-card px-3 text-base" />
          </label>
          <button type="submit" className="h-[48px] rounded-[14px] bg-teal text-base font-semibold text-white">دخول</button>
        </form>
      </>
    );
  }

  const db = createServiceClient();
  const company = typeof c === "string" && /^[a-z0-9-]{1,40}$/.test(c) ? c : null;
  let eventQuery = db?.from("events").select("type, journey_id, score, choice, company").order("id", { ascending: false }).limit(20_000);
  let referralQuery = db?.from("referrals").select("id, created_at, lang, topic, status, summary, company").order("created_at", { ascending: false }).limit(200);
  if (company) {
    eventQuery = eventQuery?.eq("company", company);
    referralQuery = referralQuery?.eq("company", company);
  }
  let recentQuery = db?.from("events").select("created_at, type, journey_id, lang, choice, score, company").order("id", { ascending: false }).limit(300);
  if (company) recentQuery = recentQuery?.eq("company", company);
  // The three reads run side by side.
  const [eventResult, referralResult, recentResult] = await Promise.all([eventQuery, referralQuery, recentQuery]);
  const events = (eventResult?.data ?? []) as EventRow[];
  const referrals = (referralResult?.data ?? []) as Referral[];
  const recent = (recentResult?.data ?? []) as ActivityEvent[];
  const { journeys, outcomes } = summarise(events);
  const waiting = referrals.filter((r) => r.status === "new").length;

  return (
    <div data-testid="dashboard" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <form action={leave}>
          <button type="submit" className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-semibold text-teal">خروج</button>
        </form>
      </header>
      <div>
        <h1 className="text-2xl font-bold text-teal">لوحة الشركة{company ? ` · ${company}` : ""}</h1>
        <p className="text-[15px] leading-relaxed text-mute">أعداد مجمّعة بلا أسماء ولا معرّفات. اللوحة لا تعرض ما كتبه الموظفون.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[17px] font-bold text-teal">
          طلبات التواصل مع مختص · <span data-testid="waiting">{waiting}</span> بانتظار الاستلام
        </h2>
        {referrals.length === 0 && <p className="text-[15px] text-mute">لا توجد طلبات.</p>}
        <ul className="flex flex-col gap-2.5">
          {referrals.map((r) => (
            <li key={r.id} data-referral={r.id} data-status={r.status} className="flex flex-col gap-2 rounded-xl border border-line bg-cream p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b className="text-ink">{TOPIC[r.topic as keyof typeof TOPIC] ?? TOPIC.other}</b>
                <span className="text-mute">{LANG[r.lang ?? ""] ?? ""}</span>
                <span className="text-mute" dir="ltr">
                  {r.created_at.slice(0, 16).replace("T", " ")}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === "new" ? "bg-gold text-white" : "bg-ic text-teal"}`}>{STATUS[r.status] ?? r.status}</span>
                {r.status !== "closed" && (
                  <form action={moveReferral} className="ms-auto">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={r.status === "new" ? "accepted" : "closed"} />
                    <button type="submit" className="h-9 rounded-lg bg-teal px-3 text-sm font-semibold text-white">{r.status === "new" ? "استلام الطلب" : "إغلاق"}</button>
                  </form>
                )}
              </div>
              {/* The summary is the employee's own text: it is shown only to the person who took the request. */}
              {r.status === "accepted" && <p className="rounded-lg bg-card px-3 py-2 text-[15px] leading-relaxed whitespace-pre-wrap text-body">{r.summary}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[17px] font-bold text-teal">اللحظات</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-[15px]">
            <thead>
              <tr className="text-start text-sm text-mute">
                <th className="py-1.5 text-start font-semibold">الموضوع</th>
                <th className="text-start font-semibold">بدأها</th>
                <th className="text-start font-semibold">أكملها</th>
                <th className="text-start font-semibold">شرحها بكلماته</th>
                <th className="text-start font-semibold">فهمها (نقطتان أو أكثر)</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => {
                const n = journeys.get(t.id) ?? { started: 0, completed: 0, explained: 0, understood: 0 };
                return (
                  <tr key={t.id} className="border-t border-line" data-journey={t.id}>
                    <td className="py-2 font-semibold text-ink">{t.route.title_ar}</td>
                    <td>{n.started}</td>
                    <td>{n.completed}</td>
                    <td>{n.explained}</td>
                    <td>{n.understood}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[17px] font-bold text-teal">«لاحظت شيئًا آخر؟»</h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Object.entries(outcomes).map(([key, n]) => (
            <li key={key} className="flex flex-col gap-0.5 rounded-xl bg-beige p-3">
              <b className="text-2xl text-teal">{n}</b>
              <span className="text-sm text-body">{OUTCOME[key]}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-mute">نص السؤال لا يُحفظ. يُسجَّل المستوى والنتيجة فقط.</p>
      </section>
      <Activity events={recent} referrals={referrals} />
    </div>
  );
}
