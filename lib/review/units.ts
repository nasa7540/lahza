import { type DecisionRow, unitsOf } from "@/lib/content/review";
import type { Draft, JourneyText, Lang, ReviewRole, Sentence, Source } from "@/lib/content/types";

export type UnitGroup = "frame" | "option" | "reveal" | "explanation" | "tip" | "key_point" | "occasion";
export type ReviewUnit = {
  id: string;
  text: string;
  hash: string;
  group: UnitGroup;
  /** Where the unit sits, for the reviewer: an option letter or a position. */
  where: string;
  sentence: Sentence | null;
  /** The source segment the sentence rests on, verbatim. */
  support: { kind: Source["kind"]; reference: string; text: string; grade: string | null } | null;
  flagged: boolean;
  editable: boolean;
};

function groupOf(id: string): UnitGroup {
  if (id.startsWith("reveal:")) return "reveal";
  if (id.startsWith("explanation:")) return "explanation";
  if (id.startsWith("option:")) return "option";
  if (id.startsWith("tip:")) return "tip";
  if (id.startsWith("key_point:")) return "key_point";
  return id === "occasions" ? "occasion" : "frame";
}

function sentenceOf(text: JourneyText, id: string): Sentence | null {
  const [kind, a, b] = id.split(":");
  if (kind === "reveal") return text.options.find((o) => o.id === a)?.reveal[Number(b)] ?? null;
  if (kind === "explanation") return text.explanation[Number(a)] ?? null;
  return null;
}

/** Every reviewable unit of one language with what a reviewer needs beside it. Flagged sentences come first. */
export function reviewUnits(draft: Draft, lang: Lang): ReviewUnit[] {
  const text = draft.locales[lang];
  if (!text) return [];
  const units = unitsOf(text, draft.occasions).map((u): ReviewUnit => {
    const sentence = sentenceOf(text, u.id);
    const source = sentence?.segment ? draft.sources.find((s) => s.id === sentence.segment?.split("#")[0]) : undefined;
    const segment = source?.segments.find((g) => g.seg === sentence?.segment);
    const [, a] = u.id.split(":");
    return {
      ...u,
      group: groupOf(u.id),
      where: u.id.startsWith("reveal:") || u.id.startsWith("option:") ? a : "",
      sentence,
      support: source && segment ? { kind: source.kind, reference: source.kind === "quran" ? source.reference : source.reference_ar, text: segment.text, grade: source.grade } : null,
      flagged: Boolean(sentence && (sentence.flags.length > 0 || sentence.label === "general_religious" || sentence.label === "unsupported")),
      editable: u.id !== "occasions",
    };
  });
  return [...units.filter((u) => u.flagged), ...units.filter((u) => !u.flagged)];
}

export type UnitState = { team: DecisionRow | null; sharia: DecisionRow | null; comments: DecisionRow[]; edits: number };

/** The latest standing decision of each role on a unit, valid only while it was made on the current text. */
export function unitState(unit: { id: string; hash: string }, lang: Lang, decisions: DecisionRow[]): UnitState {
  const mine = decisions.filter((d) => d.unit_id === unit.id && d.lang === lang).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const latest = (role: ReviewRole) => {
    const d = mine.filter((x) => x.role === role && x.action !== "comment").at(-1);
    return d && d.text_hash === unit.hash && (d.action === "approve" || d.action === "reject") ? d : null;
  };
  return { team: latest("team"), sharia: latest("sharia"), comments: mine.filter((d) => d.action === "comment" || (d.note && d.action !== "comment")), edits: mine.filter((d) => d.action === "edit").length };
}

/** Writes a new text into the unit's place in the journey text. Returns false for units that cannot be edited. */
export function setUnitText(text: JourneyText, unitId: string, value: string): boolean {
  const [kind, a, b] = unitId.split(":");
  const option = text.options.find((o) => o.id === a);
  if (unitId === "title") text.title = value;
  else if (unitId === "teaser") text.teaser = value;
  else if (unitId === "scene") text.scene = value;
  else if (unitId === "explain_prompt") text.explain_prompt = value;
  else if (kind === "option" && option && b === "label") option.label = value;
  else if (kind === "option" && option && b === "headline") option.reveal_headline = value;
  else if (kind === "reveal" && option?.reveal[Number(b)]) option.reveal[Number(b)].text = value;
  else if (kind === "explanation" && text.explanation[Number(a)]) text.explanation[Number(a)].text = value;
  else if (unitId === "tip:headline") text.tip.headline = value;
  else if (unitId === "tip:lead") text.tip.lead = value;
  else if (kind === "tip" && a === "item" && text.tip.items[Number(b)] !== undefined) text.tip.items[Number(b)] = value;
  else if (kind === "key_point" && text.key_points[Number(a)] !== undefined) text.key_points[Number(a)] = value;
  else return false;
  return true;
}
