/** Arabic text helpers for search and matching. Never used to alter text that is shown to users. */

const HARAKAT = /[ؐ-ًؚ-ٟۖ-ۭـ]/g;
const DAGGER_ALEF = /ٰ/g;

/** Everyday spelling with letter forms unified: for search indexes and comparisons only. */
export function normalise(text: string): string {
  return text
    .replace(/وٰة/g, "اة") // الصلوٰة -> الصلاة
    .replace(DAGGER_ALEF, "ا")
    .replace(HARAKAT, "")
    .replace(/ٱ/g, "ا")
    .replace(/ءا/g, "ا")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/اا+/g, "ا")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال"];

/** Light stemming: strips the article and one-letter conjunctions. */
export function stem(word: string): string {
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length - p.length >= 3) return word.slice(p.length);
  }
  if ("وفبل".includes(word[0] ?? "") && word.length >= 5) return word.slice(1);
  return word;
}

export function stems(text: string): Set<string> {
  return new Set(normalise(text).split(" ").filter(Boolean).map(stem));
}

/** True when `phrase` occurs in `text`: multi-word phrases as a substring, single words by stem. */
export function mentions(text: string, phrase: string): boolean {
  const p = normalise(phrase);
  if (!p) return false;
  if (p.includes(" ")) return ` ${normalise(text)} `.includes(` ${p} `) || normalise(text).includes(p);
  return stems(text).has(stem(p));
}
