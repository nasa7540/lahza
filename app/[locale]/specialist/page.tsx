import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BackIcon } from "@/components/icons";
import { Screen } from "@/components/Screen";
import { ReferralForm } from "@/components/specialist/ReferralForm";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function SpecialistPage({ params }: PageProps<"/[locale]/specialist">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("specialist");
  return (
    <Screen>
      <Link href="/ask" aria-label={t("back")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-teal">
        <BackIcon />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-[23px] leading-[1.4] font-bold text-teal">{t("title")}</h1>
        <span className="h-0.5 w-9 rounded-sm bg-gold" />
        <p className="text-[15px] leading-relaxed text-mute">{t("sub")}</p>
      </div>
      <ReferralForm />
    </Screen>
  );
}
