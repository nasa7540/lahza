import { z } from "zod";
import { ai } from "@/lib/ai/config";
import { chatJson } from "@/lib/ai/llm";
import type { JourneyText } from "@/lib/content/types";
import { deriveSystem } from "./prompts";

const plain = z.object({
  title: z.string().min(1),
  teaser: z.string().min(1),
  scene: z.string().min(1),
  options: z.array(z.object({ id: z.string(), label: z.string().min(1), reveal_headline: z.string().min(1), reveal: z.array(z.string().min(1)) })),
  explanation: z.array(z.string().min(1)),
  explain_prompt: z.string().min(1),
  tip: z.object({ headline: z.string().min(1), lead: z.string(), items: z.array(z.string().min(1)) }),
  key_points: z.array(z.string().min(1)),
  question_variants: z.array(z.string().min(1)),
});

/**
 * Derives English or Urdu from approved Arabic. Sentence by sentence, so every derived sentence keeps the
 * verdict, facts and source segment of its Arabic original. The result is a draft until a human approves it.
 */
export async function derive(ar: JourneyText, lang: "en" | "ur"): Promise<JourneyText> {
  const source = {
    title: ar.title, teaser: ar.teaser, scene: ar.scene,
    options: ar.options.map((o) => ({ id: o.id, label: o.label, reveal_headline: o.reveal_headline, reveal: o.reveal.map((s) => s.text) })),
    explanation: ar.explanation.map((s) => s.text), explain_prompt: ar.explain_prompt, tip: ar.tip, key_points: ar.key_points, question_variants: ar.question_variants,
  };
  const out = await chatJson({
    model: ai.writerModel(),
    system: deriveSystem(lang === "en" ? "English" : "Urdu"),
    user: `<journey>\n${JSON.stringify(source)}\n</journey>`,
    name: "derived",
    schema: plain,
    timeoutMs: 180_000,
  });
  const sameShape =
    out.options.length === ar.options.length &&
    out.options.every((o, i) => o.id === ar.options[i].id && o.reveal.length === ar.options[i].reveal.length) &&
    out.explanation.length === ar.explanation.length && out.tip.items.length === 3 && out.key_points.length === 3 && out.question_variants.length === 5;
  if (!sameShape) throw new Error(`derived ${lang} text does not have the same sentences as the Arabic`);
  return {
    title: out.title, teaser: out.teaser, scene: out.scene,
    options: out.options.map((o, i) => ({ id: o.id, label: o.label, reveal_headline: o.reveal_headline, reveal: o.reveal.map((text, k) => ({ ...ar.options[i].reveal[k], text })) })) as JourneyText["options"],
    explanation: out.explanation.map((text, k) => ({ ...ar.explanation[k], text })),
    explain_prompt: out.explain_prompt,
    tip: out.tip as JourneyText["tip"], key_points: out.key_points as JourneyText["key_points"], question_variants: out.question_variants as JourneyText["question_variants"],
  };
}
