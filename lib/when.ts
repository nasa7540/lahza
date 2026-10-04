import type { When } from "@/lib/content/types";

/** A Hijri date as Umm al-Qura counts it, for the day it currently is in Riyadh. weekday: 0 = Sunday. */
export type HijriDate = { year: number; month: number; day: number; weekday: number };

const RIYADH = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: "Asia/Riyadh", year: "numeric", month: "numeric", day: "numeric", weekday: "short" });
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_MS = 86_400_000;
export const SOON_DAYS = 14;

export function hijri(date: Date): HijriDate {
  const p = Object.fromEntries(RIYADH.formatToParts(date).map((x) => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), weekday: WEEKDAYS[p.weekday] };
}

export function isActive(when: When, h: HijriDate): boolean {
  if (when.type === "always") return true;
  if (when.type === "weekday") return when.weekdays.includes(h.weekday);
  const v = h.month * 100 + h.day;
  return when.windows.some((w) => v >= w.from.month * 100 + w.from.day && v <= w.to.month * 100 + w.to.day);
}

/** Days until the next active day, looking `max` days ahead: 0 when active today, null when further away. */
export function daysUntil(when: When, from: Date, max = SOON_DAYS): number | null {
  for (let k = 0; k <= max; k++) if (isActive(when, hijri(new Date(from.getTime() + k * DAY_MS)))) return k;
  return null;
}

/** The moment to treat as "now". `date=YYYY-MM-DD` simulates noon of that day in Riyadh; anything else is ignored. */
export function resolveNow(dateParam: string | string[] | undefined, now = new Date()): Date {
  if (typeof dateParam !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return now;
  const simulated = new Date(`${dateParam}T12:00:00+03:00`);
  return Number.isNaN(simulated.getTime()) ? now : simulated;
}

export type Slot = "now" | "soon" | "always" | "library";
const ORDER: Record<Slot, number> = { now: 0, soon: 1, always: 2, library: 3 };

/** Where a journey sits on the home screen: tied to today, coming within 14 days, always relevant, or the rest. */
export function slotOf(when: When, now: Date): { slot: Slot; days: number } {
  if (when.type === "always") return { slot: "always", days: 0 };
  const days = daysUntil(when, now);
  if (days === 0) return { slot: "now", days: 0 };
  return days === null ? { slot: "library", days: 0 } : { slot: "soon", days };
}

export function byWhen<T extends { when: When }>(items: T[], now: Date): (T & { slot: Slot; days: number })[] {
  return items
    .map((item) => ({ ...item, ...slotOf(item.when, now) }))
    .sort((a, b) => ORDER[a.slot] - ORDER[b.slot] || a.days - b.days); // Array.sort is stable: ties keep the given order
}
