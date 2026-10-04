import type { Locale } from "@/i18n/routing";

/** Partner companies that distribute Lahza, keyed by the `?c=` invite code. Only these get their name on the welcome screen. */
const COMPANIES: Record<string, Record<Locale, string>> = {
  naqlah: { en: "Naqlah", ar: "«نقلة»", ur: "نقلہ" },
};

/** Rows written by the automatic checks carry this value; no visitor can claim it. */
export const CHECK_COMPANY = "check";
const CODE = /^[a-z0-9-]{1,40}$/;

export function companyName(code: string | undefined, locale: Locale): string | null {
  if (!code) return null;
  return COMPANIES[code.toLowerCase()]?.[locale] ?? null;
}

/** A company code as it may be stored: lower case, letters, digits and dashes, and never the reserved check value. */
export function companyCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toLowerCase();
  return code && CODE.test(code) && code !== CHECK_COMPANY ? code : null;
}
