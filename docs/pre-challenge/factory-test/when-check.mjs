// Checks each generated journey's `when` against the Umm al-Qura calendar (Asia/Riyadh).
// For every day of Hijri year 1448 it computes which journeys are active and which are upcoming (≤14 days),
// then reports: per journey, the active days found vs expected, and the home screen on a few demo dates.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const dir = new URL("./batch/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes("__alt"));
const journeys = files.map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"))).filter((d) => d.journey?.when_parsed);

const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: "Asia/Riyadh", year: "numeric", month: "numeric", day: "numeric" });
const hijri = (d) => Object.fromEntries(fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, +p.value]));
const wd = (d) => new Date(d.toLocaleString("en-US", { timeZone: "Asia/Riyadh" })).getDay();

// Hijri month lengths come from the calendar itself, so a window ending on day 30 ends with a 29-day month.
const DAY = 864e5;
const start = new Date("2026-06-01T09:00:00+03:00");
const days = [];
for (let i = 0; i < 450; i++) {
  const d = new Date(start.getTime() + i * DAY);
  days.push({ date: d.toISOString().slice(0, 10), h: hijri(d), wd: wd(d) });
}
const inWindow = (h, w) => {
  const v = h.month * 100 + h.day, a = w.from.month * 100 + w.from.day, b = w.to.month * 100 + w.to.day;
  return v >= a && v <= b;
};
const active = (when, day) =>
  when.type === "always" ? true : when.type === "weekday" ? when.weekdays.includes(day.wd) : when.windows.some((w) => inWindow(day.h, w));

const parse = (text) => {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (t === "always") return { type: "always" };
  const [kind, ...rest] = t.split(" ");
  const names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  if (kind === "weekday") return { type: "weekday", weekdays: rest.map((r) => names.indexOf(r)).sort() };
  if (kind === "hijri")
    return { type: "hijri", windows: rest.join(" ").split(",").map((p) => { const m = p.trim().match(/(\d+)\/(\d+)-(\d+)\/(\d+)/); return { from: { month: +m[1], day: +m[2] }, to: { month: +m[3], day: +m[4] } }; }) };
  return null;
};

const year = days.filter((d) => d.h.year === 1448);
const rows = journeys.map((j) => {
  const got = j.journey.when_parsed, exp = parse(j.expected_when);
  const gotDays = new Set(year.filter((d) => active(got, d)).map((d) => d.date));
  const expDays = exp ? new Set(year.filter((d) => active(exp, d)).map((d) => d.date)) : null;
  const overlap = expDays ? [...gotDays].filter((x) => expDays.has(x)).length : null;
  return {
    id: j.topic_id, suggested: j.journey.when, expected: j.expected_when, type: got.type,
    active_days_1448: gotDays.size, expected_days: expDays?.size ?? null, overlap,
    exact: expDays ? gotDays.size === expDays.size && overlap === expDays.size : null,
    first_active: [...gotDays][0] ?? null,
  };
});

const demo = ["2026-10-03", "2026-10-09", "2027-02-01", "2027-02-08", "2027-03-02", "2027-03-09", "2027-05-07", "2027-05-15", "2027-05-16", "2027-06-16"];
const home = demo.map((date) => {
  const i = days.findIndex((d) => d.date === date);
  const day = days[i];
  const act = [], soon = [];
  for (const j of journeys) {
    const w = j.journey.when_parsed;
    if (w.type === "always") continue;
    if (active(w, day)) { act.push(j.topic_id); continue; }
    for (let k = 1; k <= 14; k++) if (days[i + k] && active(w, days[i + k])) { soon.push(`${j.topic_id} (${k}d)`); break; }
  }
  return { date, hijri: `${day.h.year}/${day.h.month}/${day.h.day}`, active_now: act, upcoming_14d: soon };
});

writeFileSync(new URL("./when-report.json", import.meta.url), JSON.stringify({ rows, home }, null, 1));
const exact = rows.filter((r) => r.exact === true).length, judged = rows.filter((r) => r.exact !== null).length;
console.log(`when: ${journeys.length} journeys, exact match with expected ${exact}/${judged}`);
for (const r of rows.filter((r) => r.exact === false)) console.log(`  MISMATCH ${r.id}: suggested "${r.suggested}" expected "${r.expected}" (overlap ${r.overlap}/${r.expected_days} days)`);
for (const h of home) console.log(`  ${h.date} (${h.hijri}) active: ${h.active_now.join(", ") || "-"} | soon: ${h.upcoming_14d.join(", ") || "-"}`);
