import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABELS: Record<Locale, string> = { en: "English", ar: "العربية", ur: "اردو" };

/** Switches locale while staying on the same page (and keeping the company code). */
export function LanguagePicker({
  current,
  label,
  company,
}: {
  current: Locale;
  label: string;
  company?: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <b className="text-[13px]">{label}</b>
      <div className="grid grid-cols-3 gap-2">
        {routing.locales.map((locale) => {
          const on = locale === current;
          return (
            <Link
              key={locale}
              href={company ? { pathname: "/", query: { c: company } } : "/"}
              locale={locale}
              lang={locale}
              aria-current={on ? "true" : undefined}
              className={`flex h-11 items-center justify-center rounded-[14px] text-[15px] font-semibold text-ink ${
                locale === "en" ? "font-sans" : "font-arabic"
              } ${on ? "border-[1.5px] border-teal bg-ic" : "border border-line bg-card"}`}
            >
              {LABELS[locale]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
