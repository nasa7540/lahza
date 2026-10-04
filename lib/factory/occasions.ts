import type { When } from "@/lib/content/types";

type Window = [[number, number], [number, number]];
type Occasion = { ar: string; en: string; when?: When; windows?: Window[]; needs_sharii_check?: string };

/** Fixed list the writer chooses from (at most two). Code, not the model, turns a choice into dates. */
export const OCCASIONS: Record<string, Occasion> = {
  none: { ar: "لا شيء منها (دائمة)", en: "None of these (always)", when: { type: "always" } },
  ramadan: { ar: "رمضان", en: "Ramadan", windows: [[[9, 1], [9, 30]]] },
  ramadan_last_ten: { ar: "العشر الأواخر من رمضان", en: "Last ten nights of Ramadan", windows: [[[9, 21], [9, 30]]] },
  zakat_al_fitr: { ar: "زكاة الفطر", en: "Zakat al-Fitr", windows: [[[9, 25], [10, 1]]] },
  eid_al_fitr: { ar: "عيد الفطر", en: "Eid al-Fitr", windows: [[[10, 1], [10, 3]]] },
  shawwal: { ar: "شوال بعد العيد", en: "Shawwal after Eid", windows: [[[10, 2], [10, 30]]] },
  hajj_season: { ar: "موسم الحج", en: "Hajj season", windows: [[[11, 15], [12, 13]]] },
  dhul_hijjah_ten: { ar: "عشر ذي الحجة", en: "First ten days of Dhul-Hijjah", windows: [[[12, 1], [12, 10]]] },
  arafah: { ar: "يوم عرفة", en: "Day of Arafah", windows: [[[12, 9], [12, 9]]] },
  eid_al_adha: { ar: "عيد الأضحى وأيام التشريق", en: "Eid al-Adha", windows: [[[12, 10], [12, 13]]] },
  after_hajj: { ar: "عودة الحجاج", en: "Pilgrims return", windows: [[[12, 14], [12, 30]]] },
  hijri_new_year: { ar: "بداية السنة الهجرية", en: "Hijri new year", windows: [[[1, 1], [1, 1]]] },
  ashura: { ar: "عاشوراء", en: "Ashura", windows: [[[1, 9], [1, 10]]] },
  white_days: {
    ar: "الأيام البيض",
    en: "The white days",
    needs_sharii_check: "13 Dhul-Hijjah is excluded (a day of tashreeq); to be confirmed by a sharia reviewer",
    windows: [
      ...[1, 2, 3, 4, 5, 6, 7, 8, 10, 11].map((m): Window => [[m, 13], [m, 15]]),
      [[12, 14], [12, 15]],
    ],
  },
  monday_thursday: { ar: "الاثنين والخميس", en: "Mondays and Thursdays", when: { type: "weekday", weekdays: [1, 4] } },
  friday: { ar: "الجمعة", en: "Fridays", when: { type: "weekday", weekdays: [5] } },
};

export const OCCASION_IDS = Object.keys(OCCASIONS) as [string, ...string[]];
export const MAX_OCCASIONS = 2;

/** Union of up to two occasions. Throws on unknown ids or on mixing weekly with Hijri occasions. */
export function toWhen(ids: string[]): When {
  const chosen = ids.filter((id) => id !== "none").slice(0, MAX_OCCASIONS);
  if (chosen.length === 0) return { type: "always" };
  const items = chosen.map((id) => {
    const o = OCCASIONS[id];
    if (!o) throw new Error(`unknown occasion: ${id}`);
    return o;
  });
  if (items.every((o) => o.when?.type === "weekday")) {
    const days = new Set<number>();
    for (const o of items) if (o.when?.type === "weekday") o.when.weekdays.forEach((d) => days.add(d));
    return { type: "weekday", weekdays: [...days].sort((a, b) => a - b) };
  }
  if (items.some((o) => o.when)) throw new Error(`cannot combine weekly and Hijri occasions: ${chosen.join(", ")}`);
  return {
    type: "hijri",
    windows: items.flatMap((o) => (o.windows ?? []).map(([from, to]) => ({ from: { month: from[0], day: from[1] }, to: { month: to[0], day: to[1] } }))),
  };
}
