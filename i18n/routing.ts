import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ur"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

const RTL_LOCALES: readonly Locale[] = ["ar", "ur"];

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
