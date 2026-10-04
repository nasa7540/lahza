// P2 check: the calendar the app uses (lib/when.ts) against the official Umm al-Qura table for 1446-1450,
// at three instants per day in Riyadh, for every occasion in the fixed list, plus the 14-day countdown.
import { readFileSync } from "node:fs";
import { OCCASIONS, toWhen } from "../../lib/factory/occasions";
import { daysUntil, hijri, type HijriDate, isActive, resolveNow, SOON_DAYS } from "../../lib/when";

type Ref = { g: string; y: number; m: number; d: number; wd: number };
const ref = JSON.parse(readFileSync("docs/pre-challenge/heavy-tests/data/umalqura-1446-1450.json", "utf8")) as Ref[];
const whens = Object.keys(OCCASIONS).map((id) => [id, toWhen([id])] as const);
const asHijri = (r: Ref): HijriDate => ({ year: r.y, month: r.m, day: r.d, weekday: r.wd });

let dateFails = 0;
let occasionFails = 0;
let countdownFails = 0;
let checks = 0;
const examples: string[] = [];
for (const [i, r] of ref.entries()) {
  for (const time of ["00:30", "12:00", "23:30"]) {
    const got = hijri(new Date(`${r.g}T${time}:00+03:00`));
    checks++;
    if (got.year !== r.y || got.month !== r.m || got.day !== r.d || got.weekday !== r.wd) {
      dateFails++;
      if (examples.length < 10) examples.push(`date ${r.g} ${time}: expected ${r.y}-${r.m}-${r.d}, got ${got.year}-${got.month}-${got.day}`);
    }
    for (const [id, when] of whens) {
      checks++;
      if (isActive(when, got) !== isActive(when, asHijri(r))) {
        occasionFails++;
        if (examples.length < 10) examples.push(`occasion ${id} on ${r.g} ${time}`);
      }
    }
  }
  if (i + SOON_DAYS >= ref.length) continue;
  for (const [id, when] of whens) {
    if (when.type !== "hijri") continue;
    const k = [...Array(SOON_DAYS + 1).keys()].find((n) => isActive(when, asHijri(ref[i + n])));
    checks++;
    if (daysUntil(when, resolveNow(r.g)) !== (k ?? null)) {
      countdownFails++;
      if (examples.length < 10) examples.push(`countdown ${id} from ${r.g}`);
    }
  }
}
console.log(`${ref.length} days (${ref[0].g} to ${ref.at(-1)?.g}), ${whens.length} occasions, ${checks} checks: ${dateFails} date errors, ${occasionFails} occasion errors, ${countdownFails} countdown errors`);
for (const e of examples) console.log(`FAIL ${e}`);
if (dateFails + occasionFails + countdownFails) process.exit(1);
console.log("check:when passed");
