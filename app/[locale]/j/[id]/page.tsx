import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Player } from "@/components/journey/Player";
import { Screen } from "@/components/Screen";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getJourney } from "@/lib/content/journeys";
import { toView } from "@/lib/content/view";

export const dynamic = "force-dynamic";

export default async function JourneyPage({ params }: PageProps<"/[locale]/j/[id]">) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const journey = await getJourney(locale, id);
  if (!journey) {
    const t = await getTranslations("journey");
    return (
      <Screen>
        <p className="pt-10 text-base text-mute">{t("notFound")}</p>
        <Link href="/home" className="self-start py-2 font-semibold text-teal underline underline-offset-4">
          {t("home")}
        </Link>
      </Screen>
    );
  }
  return (
    <Screen>
      <Player journey={toView(journey, locale)} />
    </Screen>
  );
}
