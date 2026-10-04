import { z } from "zod";

/** Languages the app shows. Arabic is the original; the others are derived after Arabic is approved. */
export const LANGS = ["ar", "en", "ur"] as const;
export const langSchema = z.enum(LANGS);
export type Lang = z.infer<typeof langSchema>;

// ---------- timing ----------
const hijriDay = z.object({ month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(30) });
export const whenSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("weekday"), weekdays: z.array(z.number().int().min(0).max(6)).min(1) }),
  z.object({ type: z.literal("hijri"), windows: z.array(z.object({ from: hijriDay, to: hijriDay })).min(1) }),
]);
export type When = z.infer<typeof whenSchema>;

// ---------- sources ----------
export const sourceKindSchema = z.enum(["quran", "hadith", "term"]);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const segmentSchema = z.object({ seg: z.string(), text: z.string(), kind: sourceKindSchema });
export type Segment = z.infer<typeof segmentSchema>;

const translationSchema = z.object({ text: z.string(), translation_key: z.string(), translation_version: z.string().nullable() });

/** A verbatim text fetched by code from an approved source. Never written by a model. */
export const sourceSchema = z.object({
  id: z.string(),
  kind: sourceKindSchema,
  text_ar: z.string().min(1),
  reference: z.string(),
  reference_ar: z.string(),
  grade: z.string().nullable(),
  source_url: z.string().url(),
  translations: z.object({ en: translationSchema, ur: translationSchema }),
  segments: z.array(segmentSchema).min(1),
  fetched_at: z.string(),
  content_hash: z.string().length(64),
});
export type Source = z.infer<typeof sourceSchema>;

export const factSchema = z.object({
  id: z.string(),
  statement: z.string(),
  segments: z.array(z.string()).min(1),
  kind: sourceKindSchema,
});
export type Fact = z.infer<typeof factSchema>;

// ---------- journey text ----------
export const verdictSchema = z.enum(["supported", "general", "general_religious", "unsupported"]);
export type Verdict = z.infer<typeof verdictSchema>;

/** One written sentence of a reveal or the explanation, with how it was checked. */
export const sentenceSchema = z.object({
  text: z.string().min(1),
  kind: z.enum(["religious", "workplace"]),
  facts: z.array(z.string()),
  label: verdictSchema.nullable(),
  segment: z.string().nullable(),
  flags: z.array(z.string()),
});
export type Sentence = z.infer<typeof sentenceSchema>;

export const optionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  reveal_headline: z.string().min(1),
  reveal: z.array(sentenceSchema),
});

/** The text of one journey in one language. Same shape for the Arabic original and derived languages. */
export const journeyTextSchema = z.object({
  title: z.string().min(1),
  teaser: z.string().min(1),
  scene: z.string().min(1),
  options: z.array(optionSchema).length(4),
  explanation: z.array(sentenceSchema),
  explain_prompt: z.string().min(1),
  tip: z.object({ headline: z.string().min(1), lead: z.string(), items: z.array(z.string().min(1)).length(3) }),
  key_points: z.array(z.string().min(1)).length(3),
  question_variants: z.array(z.string().min(1)).length(5),
});
export type JourneyText = z.infer<typeof journeyTextSchema>;

// ---------- drafts and review ----------
export const guardDecisionSchema = z.enum(["allow", "needs_sharii", "refer", "refuse"]);
export type GuardDecision = z.infer<typeof guardDecisionSchema>;

export const draftStatusSchema = z.enum(["draft", "incomplete", "failed"]);

export const generationSchema = z.object({
  prompt_version: z.string(),
  date: z.string(),
  models: z.object({ guard: z.string(), writer: z.string(), verifier: z.string() }),
  generated_by: z.string(),
});

export const countersSchema = z.object({
  references_proposed: z.number().int(),
  references_failed: z.number().int(),
  facts: z.number().int(),
  sentences_generated: z.number().int(),
  removed_by_verifier: z.number().int(),
  religious_claims: z.number().int(),
  religious_supported: z.number().int(),
  flagged_sentences: z.number().int(),
  reveals_regenerated: z.number().int(),
});
export type Counters = z.infer<typeof countersSchema>;

/** A journey as the factory writes it: Arabic first, other languages added once Arabic is approved. */
export const draftSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string(),
  status: draftStatusSchema,
  needs_sharii: z.boolean(),
  level: z.enum(["A", "B"]),
  occasions: z.array(z.string()).max(2),
  when: whenSchema,
  character_names: z.array(z.string()),
  locales: z.object({ ar: journeyTextSchema, en: journeyTextSchema.optional(), ur: journeyTextSchema.optional() }),
  sources: z.array(sourceSchema).min(1),
  facts: z.array(factSchema),
  generation: generationSchema,
  counters: countersSchema,
  log: z.array(z.record(z.string(), z.unknown())),
});
export type Draft = z.infer<typeof draftSchema>;

export const reviewRoleSchema = z.enum(["team", "sharia"]);
export type ReviewRole = z.infer<typeof reviewRoleSchema>;
export const reviewActionSchema = z.enum(["approve", "reject", "edit", "comment"]);

/** One reviewer decision on one unit of text. Approval holds only while text_hash matches the current text. */
export const reviewDecisionSchema = z.object({
  draft_id: z.string().uuid(),
  lang: langSchema,
  unit_id: z.string(),
  role: reviewRoleSchema,
  action: reviewActionSchema,
  reviewer: z.string().min(1),
  text_hash: z.string().length(64),
  note: z.string().nullable(),
});
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;
