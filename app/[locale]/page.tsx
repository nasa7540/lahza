import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowIcon, BuildingIcon, NoAccountIcon, PhoneIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Logo } from "@/components/Logo";
import { Screen } from "@/components/Screen";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { companyName } from "@/lib/companies";

export default async function WelcomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { c } = await searchParams;
  const code = typeof c === "string" ? c : undefined;
  const company = companyName(code, locale);
  const t = await getTranslations("welcome");

  const promises: [ReactNode, string][] = [
    [<NoAccountIcon key="a" />, t("p1")],
    [<ShieldIcon key="s" />, t("p2")],
    [<PhoneIcon key="p" />, t("p3")],
  ];

  return (
    <Screen>
      <header className="flex flex-col items-center gap-3.5 pt-[22px]">
        <Logo size="lg" />
        <span className="h-0.5 w-12 rounded-sm bg-gold" />
        <span dir="rtl" lang="ar" className="font-arabic text-[17px]">
          من لحظة فضول... إلى فهم
        </span>
        {t("tagSub") && <span className="-mt-2 text-[13px] text-mute">{t("tagSub")}</span>}
      </header>

      <section className="flex gap-3.5 rounded-2xl border border-line bg-card p-4 shadow-[0_2px_10px_rgba(15,76,92,.04)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ic text-teal">
          <BuildingIcon />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[.08em] text-gold-d uppercase">{t("inviteK")}</span>
          <h1 className="text-base font-bold text-teal">
            {company ? t("invite", { company }) : t("inviteGeneric")}
          </h1>
          <p className="text-[13px] leading-[1.55] text-mute">{t("inviteB")}</p>
        </div>
      </section>

      <LanguagePicker current={locale} label={t("langLabel")} company={company ? code : undefined} />

      <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-[0_2px_10px_rgba(15,76,92,.04)]">
        {promises.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ic text-teal">
              {icon}
            </span>
            <span className="text-sm">{text}</span>
          </li>
        ))}
      </ul>

      <aside className="flex gap-3 rounded-2xl border border-gold bg-beige px-4 py-3.5">
        <span className="text-gold-d">
          <SparkIcon />
        </span>
        <div className="flex flex-col gap-[3px]">
          <b className="text-[13px] text-gold-d">{t("aiK")}</b>
          <span className="text-[12.5px] leading-[1.55]">{t("aiNote")}</span>
        </div>
      </aside>

      <Link
        href="/home"
        className="flex h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-teal text-[15.5px] font-semibold text-white"
      >
        {t("begin")} <ArrowIcon />
      </Link>
    </Screen>
  );
}
