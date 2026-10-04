import type { Draft, Lang } from "@/lib/content/types";

type Texts = Pick<Draft, "locales">;

/** Grader input for one journey: key points and the scene in every language the draft has, the reader's language first. */
export function graderInput(draft: Texts, lang: Lang, text: string) {
  const own = draft.locales[lang] ?? draft.locales.ar;
  const others = (Object.keys(draft.locales) as Lang[]).filter((l) => l !== lang).map((l) => draft.locales[l]).filter((t) => t !== undefined);
  return {
    text,
    keyPoints: own.key_points.map((k, i) => [k, ...others.map((t) => t.key_points[i])]),
    misconceptions: own.options.map((o) => o.label),
    scenes: [own.scene, ...others.map((t) => t.scene)],
  };
}
