import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowIcon, MomentIcon, SearchIcon } from "@/components/icons";
import { DoneMark } from "@/components/journey/DoneMark";
import { Logo } from "@/components/Logo";
import { Screen } from "@/components/Screen";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listJourneys } from "@/lib/content/journeys";
import { byWhen, resolveNow, type Slot } from "@/lib/when";

export const dynamic = "force-dynamic";

const FEATURED: Record<Slot, "featNow" | "featSoon" | "featAlways"> = { now: "featNow", soon: "featSoon", always: "featAlways", library: "featAlways" };

export default async function HomePage({ params, searchParams }: PageProps<"/[locale]/home">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const ta = await getTranslations("ask");
  const format = await getFormatter();

  const { date } = await searchParams;
  const now = resolveNow(date);
  const simulated = typeof date === "string" && now.toISOString().startsWith(date);
  const journeys = byWhen(await listJourneys(locale), now);
  const [first] = journeys;
  const hijriToday = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { timeZone: "Asia/Riyadh", day: "numeric", month: "long", year: "numeric" }).format(now);
  const slotLabel = (slot: Slot, days: number) => (slot === "now" ? t("slotNow") : slot === "soon" ? t("slotSoon", { days }) : slot === "always" ? t("slotAlways") : t("slotLibrary"));

  return (
    <Screen>
      <Logo />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-teal">{t("hello")}</h1>
        <span className="text-[15px] text-mute">{t("helloSub")}</span>
        <span className="text-sm text-mute" data-testid="today">
          {simulated ? t("simulated", { date: `${format.dateTime(now, { dateStyle: "medium", timeZone: "Asia/Riyadh" })} · ${hijriToday}` }) : t("today", { date: hijriToday })}
        </span>
      </div>

      {!first ? (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-4" data-testid="empty">
          <b className="text-base text-teal">{t("empty")}</b>
          <span className="text-[15px] leading-relaxed text-mute">{t("emptySub")}</span>
        </div>
      ) : (
        <>
          <section className="relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-teal p-5 text-white shadow-[0_10px_24px_rgba(15,76,92,.18)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[.08em] text-sand uppercase rtl:text-[13px] rtl:tracking-normal">{t(FEATURED[first.slot])}</span>
              <span className="rounded-full bg-sand/15 px-2.5 py-1 text-xs font-semibold text-sand rtl:text-[13px]">{t("minutes")}</span>
            </div>
            <h2 className="text-2xl leading-[1.3] font-bold rtl:leading-[1.5]">{first.view.title}</h2>
            <p className="text-base leading-[1.6] text-white/85 rtl:leading-[1.85]">{first.view.teaser}</p>
            <Link href={`/j/${first.id}`} className="flex h-[46px] items-center gap-2 self-start rounded-xl bg-cream px-[18px] text-base font-bold text-teal">
              {t("start")} <ArrowIcon />
            </Link>
          </section>

          <div className="flex flex-col gap-1.5 pt-1">
            <h2 className="text-[17px] font-bold text-teal">{t("jTitle")}</h2>
            <span className="h-0.5 w-7 rounded-sm bg-gold" />
          </div>
          <ul className="flex flex-col gap-2.5" data-testid="journeys">
            {journeys.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/j/${j.id}`}
                  data-journey={j.id}
                  data-slot={j.slot}
                  className={`flex items-center gap-3.5 rounded-[14px] px-3.5 py-3 ${j.slot === "now" ? "border border-gold bg-beige" : "border border-line bg-card hover:border-sand"}`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${j.slot === "now" ? "bg-teal text-white" : "bg-ic text-teal"}`}>
                    <MomentIcon />
                  </span>
                  <span className="flex grow flex-col gap-0.5">
                    <b className="text-base leading-snug font-semibold text-ink">{j.view.title}</b>
                    <span className="flex flex-wrap items-center gap-x-3 text-sm">
                      <span className={j.slot === "now" || j.slot === "soon" ? "font-semibold text-gold-d" : "text-mute"}>{slotLabel(j.slot, j.days)}</span>
                      <DoneMark journeyId={j.id} label={t("done")} />
                      {!j.approved && <span className="font-semibold text-warn">●</span>}
                    </span>
                  </span>
                  <span className="text-teal">
                    <ArrowIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link href="/ask" className="flex items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-[0_2px_10px_rgba(15,76,92,.04)] hover:border-sand">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ic text-teal">
          <SearchIcon />
        </span>
        <span className="flex grow flex-col gap-0.5">
          <b className="text-base text-teal">{ta("homeCard")}</b>
          <span className="text-sm text-mute">{ta("homeCardSub")}</span>
        </span>
        <span className="text-teal">
          <ArrowIcon />
        </span>
      </Link>
    </Screen>
  );
}
