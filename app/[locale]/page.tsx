import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowIcon, BuildingIcon, NoAccountIcon, PhoneIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Logo } from "@/components/Logo";
import { RememberCompany } from "@/components/RememberCompany";
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
      {company && code && <RememberCompany code={code.toLowerCase()} />}
      <header className="flex flex-col items-center gap-3.5 pt-[22px] text-center">
        <Logo size="lg" />
        <span className="h-0.5 w-12 rounded-sm bg-gold" />
        <span dir="rtl" lang="ar" className="font-arabic text-[17px]">
          من لحظة فضول... إلى فهم
        </span>
        {t("tagSub") && <span className="-mt-2 text-center text-sm text-balance text-mute">{t("tagSub")}</span>}
      </header>

      <section className="flex gap-3.5 rounded-2xl border border-line bg-card p-4 shadow-[0_2px_10px_rgba(15,76,92,.04)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ic text-teal">
          <BuildingIcon />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[.08em] text-gold-d uppercase rtl:text-[13px] rtl:tracking-normal">{t("inviteK")}</span>
          <h1 className="text-[17px] leading-snug font-bold text-balance text-teal">
            {company ? t("invite", { company }) : t("inviteGeneric")}
          </h1>
          <p className="text-sm leading-[1.6] text-body rtl:text-[15px] rtl:leading-[1.8]">{t("inviteB")}</p>
        </div>
      </section>

      <LanguagePicker current={locale} label={t("langLabel")} company={company ? code : undefined} />

      <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-[0_2px_10px_rgba(15,76,92,.04)]">
        {promises.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ic text-teal">
              {icon}
            </span>
            <span className="text-base leading-snug rtl:leading-[1.7]">{text}</span>
          </li>
        ))}
      </ul>

      <aside className="flex gap-3 rounded-2xl border border-gold bg-beige px-4 py-3.5">
        <span className="mt-0.5 shrink-0 text-gold-d">
          <SparkIcon size={16} />
        </span>
        <div className="flex flex-col gap-[3px]">
          <b className="text-sm text-gold-d rtl:text-[15px]">{t("aiK")}</b>
          <span className="text-sm leading-[1.6] text-body rtl:text-[15px] rtl:leading-[1.8]">{t("aiNote")}</span>
        </div>
      </aside>

      {/* Stays in reach on short screens and long translations */}
      <div className="sticky bottom-0 z-10 -mx-[22px] mt-auto bg-linear-to-t from-cream from-75% to-transparent px-[22px] pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/home"
          className="flex h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-teal text-base font-semibold text-white transition-colors duration-150 hover:bg-teal-d active:bg-teal-d"
        >
          {t("begin")} <ArrowIcon />
        </Link>
      </div>
    </Screen>
  );
}
