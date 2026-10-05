import type { SupabaseClient } from "@supabase/supabase-js";
import { graderInput } from "@/lib/grade/input";
import { decisionsFor, unitsOf, visibility } from "./review";
import type { Draft, Lang, ReviewRole, When } from "./types";
import { type JourneyView, toView } from "./view";

const LANGS: Lang[] = ["ar", "en", "ur"];

/** What the app needs to show and grade one journey in one language, ready to serve. Built only from approved text. */
export type Served = {
  view: JourneyView;
  grading: { keyPoints: string[][]; misconceptions: string[]; scenes: string[] };
  option_ids: string[];
};
export type PublishedRow = { id: string; level: Draft["level"]; unlock_rule: When; content: { draft_id: string; app?: Partial<Record<Lang, Served>> } };

export function served(draft: Draft, lang: Lang, badge: boolean, approved: boolean): Served | null {
  const text = draft.locales[lang];
  if (!text) return null;
  const { keyPoints, misconceptions, scenes } = graderInput(draft, lang, "");
  return {
    view: toView({ id: draft.journey_id, draft_id: draft.id, level: draft.level, when: draft.when, text, locales: draft.locales, sources: draft.sources, badge, approved }, lang),
    grading: { keyPoints, misconceptions, scenes },
    option_ids: text.options.map((o) => o.id),
  };
}

/**
 * Writes what may be shown right now into `journeys`, `cards` and `sources`. The deployed app serves journeys from
 * this snapshot with one small read, so it must be rewritten by every path that can change what is shown: each
 * review decision, each edit, and every draft update (`updateDraft` calls it). A language is in the snapshot only
 * while every unit of it is approved on its current text; when no language is, the journey's rows are removed.
 */
export async function publish(db: SupabaseClient, draft: Draft): Promise<Lang[]> {
  const decisions = (await decisionsFor(db, [draft.id])).get(draft.id) ?? [];
  const state = new Map(LANGS.map((lang) => [lang, visibility(draft, lang, decisions)]));
  const shown = LANGS.filter((lang) => state.get(lang)?.visible);
  if (shown.length === 0) {
    // Remove the snapshot only if it was made from this draft; an older approved draft of the same journey stays.
    const { data } = await db.from("journeys").select("content").eq("id", draft.journey_id).maybeSingle();
    if (data && (data.content as PublishedRow["content"]).draft_id === draft.id) {
      await db.from("cards").delete().eq("journey_id", draft.journey_id);
      await db.from("journeys").delete().eq("id", draft.journey_id);
    }
    return [];
  }
  const per = <T>(pick: (lang: Lang) => T) => Object.fromEntries(shown.map((lang) => [lang, pick(lang)]));
  const text = (lang: Lang) => draft.locales[lang] as NonNullable<Draft["locales"][Lang]>;
  const reviewers = [...new Set(decisions.filter((d) => d.action === "approve").map((d) => `${d.reviewer} (${d.role})`))].join(", ");
  const sharia = shown.some((lang) => state.get(lang)?.sharia);
  const results = await Promise.all([
    db.from("sources").upsert(draft.sources.map((s) => ({ id: s.id, kind: s.kind, text_ar: s.text_ar, translations: s.translations, reference: s.reference, grade: s.grade, source_url: s.source_url, verified: sharia, verified_by: sharia ? reviewers : null, verified_at: sharia ? new Date().toISOString() : null, content_hash: s.content_hash }))),
    db.from("journeys").upsert({
      id: draft.journey_id,
      level: draft.level,
      sort: 0,
      unlock_rule: draft.when,
      content: {
        draft_id: draft.id,
        occasions: draft.occasions,
        locales: per((lang) => ({ title: text(lang).title, teaser: text(lang).teaser, scene: text(lang).scene, options: text(lang).options.map((o) => ({ id: o.id, label: o.label, reveal_headline: o.reveal_headline, reveal: o.reveal.map((s) => s.text) })), explain_prompt: text(lang).explain_prompt, tip: text(lang).tip })),
        app: per((lang) => served(draft, lang, state.get(lang)?.badge ?? true, true)),
      },
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

/** Records an approval of every unit of one language as it reads now, then rewrites the snapshot. The same rows the review panel writes. */
export async function approveAllUnits(db: SupabaseClient, draft: Draft, lang: Lang, role: ReviewRole, reviewer: string): Promise<number> {
  const text = draft.locales[lang];
  if (!text) throw new Error(`draft ${draft.id} has no ${lang} text`);
  if (!reviewer.trim()) throw new Error("a reviewer name is required");
  const rows = unitsOf(text, draft.occasions).map((u) => ({ draft_id: draft.id, lang, unit_id: u.id, role, action: "approve", reviewer: reviewer.trim(), text_hash: u.hash }));
  const { error } = await db.from("review_decisions").insert(rows);
  if (error) throw new Error(`saving approval: ${error.message}`);
  await publish(db, draft);
  return rows.length;
}
