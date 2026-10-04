import Link from "next/link";
import { Logo } from "@/components/Logo";
import { decisionsFor, visibility } from "@/lib/content/review";
import { draftSchema, type Lang } from "@/lib/content/types";
import { currentReviewer } from "@/lib/review/session";
import { createServiceClient } from "@/lib/supabase/server";
import { login, logout } from "./actions";

export const dynamic = "force-dynamic";

const LANGS: [Lang, string][] = [["ar", "العربية"], ["en", "English"], ["ur", "اردو"]];
const FIELD = "h-11 w-full rounded-xl border border-sand bg-card px-3 text-base";

export default async function ReviewHome({ searchParams }: PageProps<"/review">) {
  const reviewer = await currentReviewer();
  if (!reviewer) {
    const { error } = await searchParams;
    return (
      <>
        <Logo />
        <h1 className="text-2xl font-bold text-teal">لوحة المراجعة</h1>
        <p className="text-[15px] leading-relaxed text-body">لا يظهر أي نص للموظفين قبل أن يعتمده إنسان من هنا. سجّل باسمك ودورك.</p>
        {error && <p role="alert" className="rounded-xl border border-warn bg-warn/10 px-3.5 py-2.5 text-sm font-semibold text-warn">تعذّر الدخول. تحقق من الرمز والاسم، ودور المراجع الشرعي يتطلب الإقرار أدناه.</p>}
        <form action={login} className="flex max-w-[420px] flex-col gap-3.5 rounded-2xl border border-line bg-card p-5">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            رمز الدخول
            <input name="passcode" type="password" required autoComplete="off" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            اسمك (يُسجَّل مع كل قرار)
            <input name="name" required minLength={2} maxLength={80} className={FIELD} />
          </label>
          <fieldset className="flex flex-col gap-2 text-[15px]">
            <legend className="mb-1 text-sm font-semibold">الدور</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="team" defaultChecked /> فريق المشروع
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="sharia" /> مراجع شرعي
            </label>
            <label className="flex items-start gap-2 rounded-xl bg-beige p-3 text-sm leading-relaxed">
              <input type="checkbox" name="qualified" value="yes" className="mt-1" />
              أقرّ أنني مراجع شرعي مؤهل، وأن اعتمادي يرفع شارة «بانتظار المراجعة الشرعية» ويُظهر المواضيع الحساسة. (لدور المراجع الشرعي فقط)
            </label>
          </fieldset>
          <button type="submit" className="h-[48px] rounded-[14px] bg-teal text-base font-semibold text-white">دخول</button>
        </form>
      </>
    );
  }

  const db = createServiceClient();
  const { data } = db ? await db.from("journey_drafts").select("id, journey_id, draft, created_at").order("created_at", { ascending: false }) : { data: [] };
  const drafts = (data ?? []).flatMap((row) => {
    const parsed = draftSchema.safeParse(row.draft);
    return parsed.success ? [{ draft: parsed.data, created_at: row.created_at as string }] : [];
  });
  const decisions = db ? await decisionsFor(db, drafts.map((d) => d.draft.id)) : new Map();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span data-testid="reviewer">
            {reviewer.name} · <b className="text-teal">{reviewer.role === "sharia" ? "مراجع شرعي" : "فريق المشروع"}</b>
          </span>
          <button type="submit" className="rounded-lg border border-line bg-card px-3 py-1.5 font-semibold text-teal">خروج</button>
        </form>
      </header>
      <h1 className="text-2xl font-bold text-teal">المسودات</h1>
      <ul className="flex flex-col gap-3">
        {drafts.map(({ draft, created_at }) => (
          <li key={draft.id} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-4" data-draft={draft.journey_id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-[17px] text-ink">{draft.locales.ar.title}</b>
              <span className="text-xs text-mute" dir="ltr">
                {draft.journey_id} · {created_at.slice(0, 16).replace("T", " ")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {draft.needs_sharii && <span className="rounded-full border border-warn px-2.5 py-1 font-semibold text-warn">موضوع حساس: لا يُعرض قبل الاعتماد الشرعي</span>}
              {draft.status !== "draft" && <span className="rounded-full border border-warn px-2.5 py-1 font-semibold text-warn">{draft.status}</span>}
              {LANGS.map(([lang, name]) => {
                if (!draft.locales[lang]) return null;
                const v = visibility(draft, lang, decisions.get(draft.id) ?? []);
                return (
                  <Link key={lang} href={`/review/${draft.id}?lang=${lang}`} className={`rounded-full border px-3 py-1 font-semibold ${v.visible ? "border-teal bg-ic text-teal" : "border-line bg-cream text-body"}`}>
                    {name}: {v.visible ? (v.sharia ? "معتمد شرعيًا" : "معروض بالشارة") : v.team ? "معتمد من الفريق" : `${v.pending} بانتظار الفريق`}
                  </Link>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
