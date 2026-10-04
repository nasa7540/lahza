import type { SupabaseClient } from "@supabase/supabase-js";
import { findDraft, updateDraft } from "@/lib/content/drafts";
import { publish } from "@/lib/content/publish";
import { hashText, unitsOf } from "@/lib/content/review";
import { draftSchema, type Lang, type ReviewRole } from "@/lib/content/types";
import { setUnitText } from "./units";

export type DecisionInput = { draftId: string; lang: Lang; unitId: string; role: ReviewRole; reviewer: string; action: "approve" | "reject" | "edit" | "comment"; text?: string; note?: string };

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
