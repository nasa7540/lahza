/**
 * The Qur'an text from quranenc.com uses the code points of the King Fahd Complex font, which reuse four
 * Unicode characters for marks that have their own standard characters. The Complex font's licence does not
 * clearly allow hosting it, so verses are shown in Amiri Quran (SIL OFL), which follows standard Unicode.
 * This maps the four marks to their standard characters for display only: the stored text and its hash are
 * never changed, and no letter is touched.
 */
const TO_STANDARD: Record<string, string> = {
  "ٗ": "ࣰ", // open fathatan
  "ٞ": "ࣱ", // open dammatan
  "ٖ": "ࣲ", // open kasratan
  "ْ": "۟", // small round zero over a letter that is not pronounced (the sukun itself is U+06E1 in this text)
};

export function uthmaniForDisplay(text: string): string {
  return text.replace(/[ْٖٗٞ]/g, (ch) => TO_STANDARD[ch]);
}
