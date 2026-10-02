import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { Screen } from "@/components/Screen";
import { routing } from "@/i18n/routing";

export default async function HomePage({ params }: PageProps<"/[locale]/home">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <Screen>
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[17px] font-bold text-teal">{t("jTitle")}</h1>
        <span className="h-0.5 w-7 rounded-sm bg-gold" />
      </div>
      <p className="text-sm text-mute">{t("soon")}</p>
    </Screen>
  );
}
