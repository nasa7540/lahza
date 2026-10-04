// P2 check: every letter and mark of the stored Qur'an text, as it is shown (see lib/text/uthmani.ts), has a glyph in the verse font.
import { readFileSync, writeFileSync } from "node:fs";
import * as fontkit from "fontkit";
import { uthmaniForDisplay } from "../../lib/text/uthmani";
import { scriptDb } from "../db";

const FONT = "app/fonts/AmiriQuran-Regular.ttf";

async function main() {
  const db = scriptDb();
  const chars = new Map<number, string>();
  let verses = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("quran_verses").select("sura, aya, text_uthmani").order("sura").order("aya").range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const v of data ?? []) {
      verses++;
      for (const ch of uthmaniForDisplay(v.text_uthmani as string)) if (!chars.has(ch.codePointAt(0)!)) chars.set(ch.codePointAt(0)!, `${v.sura}:${v.aya}`);
    }
    if (!data || data.length < 1000) break;
  }
  const font = fontkit.create(readFileSync(FONT)) as fontkit.Font;
  const missing = [...chars].filter(([cp]) => cp !== 0x20 && !font.hasGlyphForCodePoint(cp));
  console.log(`${verses} verses, ${chars.size} distinct characters, font ${font.fullName}`);
  for (const [cp, where] of missing) console.log(`MISSING U+${cp.toString(16).toUpperCase().padStart(4, "0")} first seen in ${where}`);
  writeFileSync("content/eval/font.json", JSON.stringify({ date: new Date().toISOString(), font: font.fullName, verses, distinct_characters: chars.size, missing: missing.length }, null, 1) + "\n");
  if (verses !== 6236 || missing.length) process.exit(1);
  console.log("check:font passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
