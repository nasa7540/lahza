// Test 3: occasion windows over five Hijri years (1446-1450) against the official Umm al-Qura table
// (hijri-converter, independent of Intl). Checks three instants per day (00:30, 12:00, 23:30 Riyadh),
// a naive UTC implementation for comparison, 29-day months, and the 14-day countdown.
import { readFileSync, writeFileSync } from "node:fs";

const ref = JSON.parse(readFileSync(new URL("./data/umalqura-1446-1450.json", import.meta.url)));
const occ = JSON.parse(readFileSync(new URL("./data/occasions.json", import.meta.url)));
const fmt = (tz) => new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", weekday: "short" });
const RIYADH = fmt("Asia/Riyadh"), UTC = fmt("UTC");
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const parts = (f, d) => { const p = Object.fromEntries(f.formatToParts(d).filter((x) => x.type !== "literal").map((x) => [x.type, x.value])); return { y: +p.year, m: +p.month, d: +p.day, wd: WD[p.weekday] }; };

// implementation under test (what the product will do): Hijri date in Riyadh, windows compared as month*100+day
const inWin = (h, w) => { const v = h.m * 100 + h.d; return v >= w.from.month * 100 + w.from.day && v <= w.to.month * 100 + w.to.day; };
const active = (when, h) => when.type === "always" ? true : when.type === "weekday" ? when.weekdays.includes(h.wd) : when.windows.some((w) => inWin(h, w));

const instants = [["00:30", "T00:30:00+03:00"], ["12:00", "T12:00:00+03:00"], ["23:30", "T23:30:00+03:00"]];
const fails = [], utcDiff = { dateMismatch: 0, occasionMismatch: 0 };
let checks = 0, dateChecks = 0, dateFails = 0;
for (const r of ref) {
  const exp = { y: r.y, m: r.m, d: r.d, wd: r.wd };
  for (const [label, suffix] of instants) {
    const t = new Date(r.g + suffix);
    const got = parts(RIYADH, t);
    dateChecks++;
    if (got.y !== exp.y || got.m !== exp.m || got.d !== exp.d || got.wd !== exp.wd) { dateFails++; fails.push({ type: "date", g: r.g, at: label, expected: exp, got }); }
    const naive = parts(UTC, t);
    if (naive.m !== exp.m || naive.d !== exp.d) utcDiff.dateMismatch++;
    for (const [id, when] of Object.entries(occ)) {
      checks++;
      const e = active(when, exp), g = active(when, got);
      if (e !== g) fails.push({ type: "occasion", id, g: r.g, at: label, expected: e, got: g });
      if (active(when, naive) !== e) utcDiff.occasionMismatch++;
    }
  }
}
// 29-day months: windows that end on day 30 must end with the month (day 30 never exists there)
const months29 = ref.filter((r) => r.d === 1 && r.ml === 29).length;
const ramadan29 = ref.filter((r) => r.m === 9 && r.d === 1 && r.ml === 29).map((r) => r.y);
// 14-day countdown: for every day, days until the next active day of each Hijri occasion, implementation (Intl) vs reference
let cdChecks = 0, cdFails = 0;
for (let i = 0; i + 14 < ref.length; i++) {
  for (const [id, when] of Object.entries(occ)) {
    if (when.type !== "hijri") continue;
    const expK = [...Array(15).keys()].find((k) => active(when, ref[i + k])) ?? null;
    const gotK = [...Array(15).keys()].find((k) => active(when, parts(RIYADH, new Date(ref[i + k].g + "T12:00:00+03:00")))) ?? null;
    cdChecks++;
    if (expK !== gotK) { cdFails++; if (fails.length < 400) fails.push({ type: "countdown", id, g: ref[i].g, expected: expK, got: gotK }); }
  }
}
const res = { days: ref.length, range: [ref[0].g, ref.at(-1).g], instants: instants.map((x) => x[0]), dateChecks, dateFails, occasionChecks: checks,
  occasionFails: fails.filter((f) => f.type === "occasion").length, countdownChecks: cdChecks, countdownFails: cdFails,
  months29, ramadan29, naiveUtc: utcDiff, fails: fails.slice(0, 200) };
writeFileSync(new URL("./t3-results.json", import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, fails: res.fails.slice(0, 10) }, null, 1));
