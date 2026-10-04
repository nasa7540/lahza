// Collects the results the checks wrote into one file for the /eval page: content/eval/results.json.
// It runs no model. Numbers per journey are read from the drafts and the review decisions (counts only, no text).
// Sections measured before the challenge are marked as such and come from docs/pre-challenge/heavy-tests.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { latestDrafts } from "../lib/content/drafts";
import { decisionsFor, visibility } from "../lib/content/review";
import type { Lang } from "../lib/content/types";
import { loadTopics } from "../lib/factory/topics";
import { scriptDb } from "./db";

const read = (path: string): Record<string, unknown> | null => (existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>) : null);
const pick = (path: string, ...keys: string[]) => {
  const o = read(path);
  return o ? Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]])) : null;
};
const PRE = "docs/pre-challenge/heavy-tests";

async function main() {
  const db = scriptDb();
  const topics = loadTopics();
  const drafts = (await latestDrafts(db)).filter((d) => topics.some((t) => t.id === d.journey_id));
  const decisions = await decisionsFor(db, drafts.map((d) => d.id));
  const journeys = topics.flatMap((t) => {
    const d = drafts.find((x) => x.journey_id === t.id);
    if (!d) return [];
    const mine = decisions.get(d.id) ?? [];
    const c = d.counters;
    return [{
      id: t.id,
      title_ar: t.route.title_ar,
      writer: d.generation.models.writer,
      verifier: d.generation.models.verifier,
      sources: d.sources.length,
      references_proposed: c.references_proposed,
      references_failed: c.references_failed,
      sentences_generated: c.sentences_generated,
      removed_by_verifier: c.removed_by_verifier,
      religious_claims: c.religious_claims,
      religious_supported: c.religious_supported,
      flagged_for_reviewer: c.flagged_sentences,
      edited_by_reviewer: new Set(mine.filter((x) => x.action === "edit").map((x) => `${x.lang}/${x.unit_id}`)).size,
      shown: Object.fromEntries((["ar", "en", "ur"] as Lang[]).map((lang) => [lang, visibility(d, lang, mine).visible])),
      sharia_approved: (["ar", "en", "ur"] as Lang[]).some((lang) => visibility(d, lang, mine).sharia),
    }];
  });
  const sum = (k: "religious_claims" | "religious_supported" | "sentences_generated" | "removed_by_verifier") => journeys.reduce((n, j) => n + j[k], 0);
  const t1 = read(`${PRE}/t1-results.json`);
  const t2 = read(`${PRE}/t2-vector-topk.json`);
  const t4 = read(`${PRE}/t4-results.json`);
  const results = {
    generated_at: new Date().toISOString(),
    journeys,
    factory: { journeys: journeys.length, sentences_generated: sum("sentences_generated"), removed_by_verifier: sum("removed_by_verifier"), religious_claims: sum("religious_claims"), religious_supported: sum("religious_supported") },
    guard_owner_list: read("content/eval/guard-owner-results.json"),
    guard_generated: (read("content/eval/guard-generated-results.json")?.summary as unknown) ?? null,
    classify: (read("content/eval/classify-results.json")?.summary as unknown) ?? null,
    grader: (read("content/eval/grader-results.json")?.summary as unknown) ?? null,
    grader_threshold: pick("content/eval/grader-threshold.json", "threshold", "tuned_on", "held_out", "date"),
    stress: { classify: read("content/eval/stress-classify.json"), grade: read("content/eval/stress-grade.json") },
    calendar: read("content/eval/when.json"),
    font: read("content/eval/font.json"),
    invariants: read("content/eval/invariants.json"),
    baseline: read("content/eval/baseline.json"),
    pre_challenge: {
      note: "Measured on Oct 3, before the challenge, with the Python experiments in docs/pre-challenge. Not re-run on the TypeScript factory.",
      verifier_planted_errors: t1 ? { held_out: t1.holdout_current_factory, calls: t1.calls } : null,
      retrieval_quran_qa_2023: t2,
      guard_480: t4 ? { all: (t4.all as Record<string, unknown>), held_out: (t4.holdout as Record<string, unknown>) } : null,
      ragas: "Tried on a small sample only on Oct 3; the run did not complete reliably and was dropped by decision. No RAGAS number is reported.",
    },
  };
  writeFileSync("content/eval/results.json", JSON.stringify(results, null, 1) + "\n");
  console.log(`eval: ${journeys.length} journeys, sections ${Object.entries(results).filter(([, v]) => v !== null).length}/${Object.keys(results).length} -> content/eval/results.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
