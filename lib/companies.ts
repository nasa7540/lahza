import type { Locale } from "@/i18n/routing";

/** Partner companies that distribute Lahza, keyed by the `?c=` invite code. */
const COMPANIES: Record<string, Record<Locale, string>> = {
  naqlah: { en: "Naqlah", ar: "«نقلة»", ur: "نقلہ" },
};

export function companyName(code: string | undefined, locale: Locale): string | null {
  if (!code) return null;
  return COMPANIES[code.toLowerCase()]?.[locale] ?? null;
}
