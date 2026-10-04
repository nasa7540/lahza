import type { SupabaseClient } from "@supabase/supabase-js";
import { findDraft, updateDraft } from "@/lib/content/drafts";
import { decisionsFor, hashText, unitsOf, visibility } from "@/lib/content/review";
import { type Draft, draftSchema, type Lang, type ReviewRole } from "@/lib/content/types";
import { setUnitText } from "./units";

export type DecisionInput = { draftId: string; lang: Lang; unitId: string; role: ReviewRole; reviewer: string; action: "approve" | "reject" | "edit" | "comment"; text?: string; note?: string };

const LANGS: Lang[] = ["ar", "en", "ur"];

/**
 * One reviewer action on one unit. Approve and reject are recorded against the text as it reads now. An edit
 * rewrites the unit in the draft and is recorded with the new hash: every earlier approval of that unit, by either
 * role, stops matching and the unit is unapproved until someone approves the new text.
 */
export async function recordDecision(db: SupabaseClient, input: DecisionInput): Promise<void> {
  const draft = await findDraft(db, input.draftId);
  if (!draft) throw new Error("draft not found");
  const text = draft.locales[input.lang];
  if (!text) throw new Error(`the draft has no ${input.lang} text`);
  const unit = unitsOf(text, draft.occasions).find((u) => u.id === input.unitId);
  if (!unit) throw new Error("unit not found");
  let hash = unit.hash;
  if (input.action === "edit") {
    const value = input.text?.trim();
    if (!value) throw new Error("the new text is empty");
    if (value === unit.text) return;
    if (!setUnitText(text, input.unitId, value)) throw new Error("this unit cannot be edited");
    draft.log.push({ step: "edit", lang: input.lang, unit: input.unitId, by: input.reviewer, at: new Date().toISOString() });
    await updateDraft(db, draftSchema.parse(draft));
    hash = hashText(value);
  }
  if (input.action === "comment" && !input.note?.trim()) throw new Error("the comment is empty");
  const { error } = await db.from("review_decisions").insert({ draft_id: draft.id, lang: input.lang, unit_id: input.unitId, role: input.role, action: input.action, reviewer: input.reviewer, text_hash: hash, note: input.note?.trim() || null });
  if (error) throw new Error(`saving the decision: ${error.message}`);
  await publish(db, draft);
}

/** Approves every unit of a language that is not approved yet by this role and is not flagged or rejected by it. */
export async function approvePending(db: SupabaseClient, draftId: string, lang: Lang, role: ReviewRole, reviewer: string, unitIds: string[]): Promise<number> {
  const draft = await findDraft(db, draftId);
  const text = draft?.locales[lang];
  if (!draft || !text) throw new Error("draft not found");
  const rows = unitsOf(text, draft.occasions).filter((u) => unitIds.includes(u.id)).map((u) => ({ draft_id: draft.id, lang, unit_id: u.id, role, action: "approve", reviewer, text_hash: u.hash }));
  if (rows.length) {
    const { error } = await db.from("review_decisions").insert(rows);
    if (error) throw new Error(`saving approvals: ${error.message}`);
  }
  await publish(db, draft);
  return rows.length;
}

/**
 * Keeps the published tables in step with the review: a snapshot of every language that may be shown right now
 * (`journeys`, `cards`, `sources`). The app itself decides what to show from the drafts and decisions on every
 * request; this snapshot is the reviewed content in its final shape, for export and for anyone reading the tables.
 */
export async function publish(db: SupabaseClient, draft: Draft): Promise<Lang[]> {
  const decisions = (await decisionsFor(db, [draft.id])).get(draft.id) ?? [];
  const shown = LANGS.filter((lang) => visibility(draft, lang, decisions).visible);
  if (shown.length === 0) {
    await db.from("cards").delete().eq("journey_id", draft.journey_id);
    await db.from("journeys").delete().eq("id", draft.journey_id);
    return [];
  }
  const per = <T>(pick: (lang: Lang) => T) => Object.fromEntries(shown.map((lang) => [lang, pick(lang)]));
  const text = (lang: Lang) => draft.locales[lang] as NonNullable<Draft["locales"][Lang]>;
  const reviewers = [...new Set(decisions.filter((d) => d.action === "approve").map((d) => `${d.reviewer} (${d.role})`))].join(", ");
  const sharia = shown.some((lang) => visibility(draft, lang, decisions).sharia);
  const results = await Promise.all([
    db.from("sources").upsert(draft.sources.map((s) => ({ id: s.id, kind: s.kind, text_ar: s.text_ar, translations: s.translations, reference: s.reference, grade: s.grade, source_url: s.source_url, verified: sharia, verified_by: sharia ? reviewers : null, verified_at: sharia ? new Date().toISOString() : null, content_hash: s.content_hash }))),
    db.from("journeys").upsert({
      id: draft.journey_id,
      level: draft.level,
      sort: 0,
      unlock_rule: draft.when,
      content: { draft_id: draft.id, occasions: draft.occasions, locales: per((lang) => ({ title: text(lang).title, teaser: text(lang).teaser, scene: text(lang).scene, options: text(lang).options.map((o) => ({ id: o.id, label: o.label, reveal_headline: o.reveal_headline, reveal: o.reveal.map((s) => s.text) })), explain_prompt: text(lang).explain_prompt, tip: text(lang).tip })) },
    }),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`publishing: ${failed.error.message}`);
  const card = await db.from("cards").upsert({
    id: draft.journey_id,
    journey_id: draft.journey_id,
    source_ids: draft.sources.map((s) => s.id),
    explanation: per((lang) => text(lang).explanation.map((s) => s.text).join(" ")),
    generated_by: draft.generation.generated_by,
    reviewed: true,
    reviewed_by: reviewers,
    key_points: text(shown[0]).key_points.map((_, i) => ({ id: `kp${i + 1}`, ...per((lang) => text(lang).key_points[i]) })),
    misconceptions: text(shown[0]).options.map((o, i) => ({ id: o.id, ...per((lang) => text(lang).options[i].label) })),
    question_variants: per((lang) => text(lang).question_variants),
  });
  if (card.error) throw new Error(`publishing: ${card.error.message}`);
  return shown;
}
