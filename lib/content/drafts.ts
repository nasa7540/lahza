import type { SupabaseClient } from "@supabase/supabase-js";
import { type Draft, draftSchema } from "./types";

export async function saveDraft(db: SupabaseClient, draft: Draft): Promise<void> {
  const { error } = await db.from("journey_drafts").insert({ id: draft.id, journey_id: draft.journey_id, topic: draft.topic, status: draft.status, needs_sharii: draft.needs_sharii, draft });
  if (error) throw new Error(`saving draft: ${error.message}`);
}

export async function updateDraft(db: SupabaseClient, draft: Draft): Promise<void> {
  const { error } = await db.from("journey_drafts").update({ status: draft.status, draft, updated_at: new Date().toISOString() }).eq("id", draft.id);
  if (error) throw new Error(`updating draft: ${error.message}`);
}

/** The newest draft of each journey. */
export async function latestDrafts(db: SupabaseClient): Promise<Draft[]> {
  const { data, error } = await db.from("journey_drafts").select("journey_id, draft, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const seen = new Set<string>();
  const out: Draft[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.journey_id)) continue;
    seen.add(row.journey_id);
    out.push(draftSchema.parse(row.draft));
  }
  return out;
}

export async function latestDraft(db: SupabaseClient, journeyId: string): Promise<Draft | null> {
  const { data, error } = await db.from("journey_drafts").select("draft").eq("journey_id", journeyId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? draftSchema.parse(data.draft) : null;
}
