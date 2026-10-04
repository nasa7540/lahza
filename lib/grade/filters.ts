/** First line of the grader, in code, before any model call. */

const ID_OR_JSON = [/\bkp\s?-?\d+\b/i, /[{}]/, /"\s*:\s*["\[\dtfn]/, /\b(score|covered|missing)\s*[=:]/i];

/** Answers that carry ids, JSON or score assignments are attempts to speak to the grader, not explanations. */
export function looksLikeGraderInput(text: string, ids: string[]): boolean {
  return ID_OR_JSON.some((p) => p.test(text)) || ids.some((id) => text.includes(id));
}

export function squash(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function shingles(text: string, n = 4): Set<string> {
  const words = squash(text).split(" ").filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

/** True when at least half of the answer's four-word runs are lifted from a scene. Retelling the scene is not explaining it. */
export function copiesScene(answer: string, scenes: string[]): boolean {
  const a = shingles(answer);
  if (a.size < 3) return false;
  return scenes.some((scene) => {
    const s = shingles(scene);
    let shared = 0;
    for (const x of a) if (s.has(x)) shared++;
    return shared / a.size >= 0.5;
  });
}

/** The quote must be the learner's own words: found in the answer as written (spacing aside) and more than a single word. */
export function isVerbatim(quote: string, answer: string): boolean {
  const flat = (s: string) => s.replace(/\s+/g, " ").trim();
  const q = flat(quote);
  return q.split(" ").length >= 2 && flat(answer).includes(q);
}
