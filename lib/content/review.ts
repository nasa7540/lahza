import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Draft, JourneyText, Lang, ReviewRole } from "./types";

export type Unit = { id: string; text: string; hash: string };
export type DecisionRow = { unit_id: string; lang: Lang; role: ReviewRole; action: string; reviewer: string; text_hash: string; note: string | null; created_at: string };

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Every piece of text a user can see, each reviewed on its own. Example questions feed search only and are not shown. */
export function unitsOf(text: JourneyText, occasions: string[]): Unit[] {
  const list: [string, string][] = [
    ["title", text.title],
    ["teaser", text.teaser],
    ["scene", text.scene],
    ...text.options.flatMap((o): [string, string][] => [
      [`option:${o.id}:label`, o.label],
      [`option:${o.id}:headline`, o.reveal_headline],
      ...o.reveal.map((s, k): [string, string] => [`reveal:${o.id}:${k}`, s.text]),
    ]),
    ...text.explanation.map((s, k): [string, string] => [`explanation:${k}`, s.text]),
    ["explain_prompt", text.explain_prompt],
    ["tip:headline", text.tip.headline],
    ...(text.tip.lead ? ([["tip:lead", text.tip.lead]] as [string, string][]) : []),
    ...text.tip.items.map((t, k): [string, string] => [`tip:item:${k}`, t]),
    ...text.key_points.map((t, k): [string, string] => [`key_point:${k}`, t]),
    ["occasions", occasions.join(",") || "none"],
  ];
  return list.map(([id, t]) => ({ id, text: t, hash: hashText(t) }));
}

/** A unit is approved by a role when that role's latest decision on it is "approve" and was made on the current text. */
export function approvedUnits(units: Unit[], decisions: DecisionRow[], lang: Lang, role: ReviewRole): Set<string> {
  const latest = new Map<string, DecisionRow>();
  for (const d of [...decisions].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (d.lang === lang && d.role === role && d.action !== "comment") latest.set(d.unit_id, d);
  }
  return new Set(units.filter((u) => latest.get(u.id)?.action === "approve" && latest.get(u.id)?.text_hash === u.hash).map((u) => u.id));
}

export type Visibility = { visible: boolean; badge: boolean; team: boolean; sharia: boolean; pending: number };

/**
 * Display rule. Ordinary journeys show once the team approved every unit, with a badge until a sharia reviewer
 * approves too. needs_sharii journeys show only after a sharia reviewer approved every unit.
 */
export function visibility(draft: Draft, lang: Lang, decisions: DecisionRow[]): Visibility {
  const text = draft.locales[lang];
  if (!text) return { visible: false, badge: false, team: false, sharia: false, pending: 0 };
  const units = unitsOf(text, draft.occasions);
  const team = approvedUnits(units, decisions, lang, "team").size === units.length;
  const sharia = approvedUnits(units, decisions, lang, "sharia").size === units.length;
  return { visible: draft.status === "draft" && team && (!draft.needs_sharii || sharia), badge: !sharia, team, sharia, pending: units.length - approvedUnits(units, decisions, lang, "team").size };
}

export async function decisionsFor(db: SupabaseClient, draftIds: string[]): Promise<Map<string, DecisionRow[]>> {
  const out = new Map<string, DecisionRow[]>();
  if (draftIds.length === 0) return out;
  const { data, error } = await db.from("review_decisions").select("draft_id, unit_id, lang, role, action, reviewer, text_hash, note, created_at").in("draft_id", draftIds).order("created_at");
  if (error) throw new Error(error.message);
  for (const row of data ?? []) out.set(row.draft_id, [...(out.get(row.draft_id) ?? []), row as DecisionRow]);
  return out;
}
