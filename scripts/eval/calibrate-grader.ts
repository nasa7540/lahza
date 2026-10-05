// Sets the quote-similarity threshold of the grader (decision 9): tuned on two thirds of the recorded answers,
// reported on the held-out third. Writes content/eval/grader-threshold.json, which lib/grade/grade.ts reads.
//   positives: quotes the grader model proposes (verbatim in the answer) on ladder answers written for levels 3-5 and on the paraphrases
//   negatives: text that must never count as evidence, scored against every key point of its journey:
//              the injected part of each injection, and the sentences of the fluent wrong answers and of the level-1 ladder answers
// Resumable: model results are saved per answer in content/eval/grader-calibration.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { cosine, embed } from "../../lib/ai/embed";
import { latestDrafts } from "../../lib/content/drafts";
import type { Lang } from "../../lib/content/types";
import { gradeAnswer, type Proposal } from "../../lib/grade/grade";
import { graderInput } from "../../lib/grade/input";
import { scriptDb } from "../db";

type Ladder = { journey: string; lang: Lang; old_score: number; text: string };
type Hard = { journey: string; lang: Lang; kind: string; clean: string | null; text: string | null };
type Saved = { key: string; journey: string; proposals: Proposal[] };
const RUNS = "content/eval/grader-calibration.json";
const OUT = "content/eval/grader-threshold.json";

async function main() {
  const db = scriptDb();
  const drafts = new Map((await latestDrafts(db)).map((d) => [d.journey_id, d]));
  const ladder = (JSON.parse(readFileSync("content/eval/grader-ladder.json", "utf8")) as { cases: Ladder[] }).cases;
  const hard = (JSON.parse(readFileSync("content/eval/grader-cases.json", "utf8")) as { cases: Hard[] }).cases;

  // ----- positives: what the model quotes on good answers -----
  const good = [...ladder.filter((c) => c.old_score >= 3), ...hard.filter((c) => c.kind === "paraphrase")].map((c) => ({ key: `${c.journey}/${c.lang}/${c.text}`, journey: c.journey, lang: c.lang, text: c.text as string }));
  const saved: Saved[] = existsSync(RUNS) ? (JSON.parse(readFileSync(RUNS, "utf8")).runs as Saved[]) : [];
  const todo = good.filter((g) => !saved.some((s) => s.key === g.key));
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const g = todo[next++];
      const draft = drafts.get(g.journey);
      if (!draft) throw new Error(`no draft for ${g.journey}`);
      const trace = await gradeAnswer(graderInput(draft, g.lang, g.text));
      saved.push({ key: g.key, journey: g.journey, proposals: trace.proposals });
      writeFileSync(RUNS, JSON.stringify({ runs: saved }, null, 1));
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  const positives = good.flatMap((g, i) => (saved.find((s) => s.key === g.key)?.proposals ?? []).filter((p) => p.verbatim && p.similarity !== null).map((p) => ({ sim: p.similarity as number, holdout: i % 3 === 2 })));

  // ----- negatives: text that is not evidence -----
  const pieces: { journey: string; text: string; holdout: boolean }[] = [];
  const sentences = (t: string) => t.split(/(?<=[.!?؟۔])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2);
  hard.forEach((c, i) => {
    if (!c.text) return;
    if (["pasted_injection", "self_quote", "no_ids"].includes(c.kind)) pieces.push({ journey: c.journey, text: c.text.replace(c.clean ?? "", "").trim(), holdout: i % 3 === 2 });
    if (c.kind === "give_me_5") pieces.push({ journey: c.journey, text: c.text, holdout: i % 3 === 2 });
    if (c.kind === "fluent_wrong") for (const s of sentences(c.text)) pieces.push({ journey: c.journey, text: s, holdout: i % 3 === 2 });
  });
  ladder.forEach((c, i) => {
    if (c.old_score === 1) for (const s of sentences(c.text)) pieces.push({ journey: c.journey, text: s, holdout: i % 3 === 2 });
  });
  const pointTexts = [...drafts.values()].flatMap((d) => (Object.keys(d.locales) as Lang[]).flatMap((l) => (d.locales[l]?.key_points ?? []).map((text, point) => ({ journey: d.journey_id, point, text }))));
  const vectors: number[][] = [];
  const texts = [...pieces.map((p) => p.text), ...pointTexts.map((p) => p.text)];
  for (let i = 0; i < texts.length; i += 48) vectors.push(...(await embed(texts.slice(i, i + 48))));
  const negatives = pieces.flatMap((piece, k) =>
    [0, 1, 2].map((point) => ({
      sim: Math.max(...pointTexts.map((p, j) => (p.journey === piece.journey && p.point === point ? cosine(vectors[k], vectors[pieces.length + j]) : -1))),
      holdout: piece.holdout,
    })),
  );

  // ----- threshold: best balanced accuracy on the tuning part -----
  const rate = (rows: { sim: number }[], t: number) => (rows.length ? rows.filter((r) => r.sim >= t).length / rows.length : 0);
  const part = (holdout: boolean) => ({ pos: positives.filter((p) => p.holdout === holdout), neg: negatives.filter((n) => n.holdout === holdout) });
  const tune = part(false);
  const hold = part(true);
  // `--at 0.45,0.50` only reports the rates at the given thresholds; it writes nothing and picks nothing.
  const at = process.argv.includes("--at") ? process.argv[process.argv.indexOf("--at") + 1].split(",").map(Number) : null;
  if (at) {
    for (const t of at) console.log(JSON.stringify({ threshold: t, tuned_on: { good_quotes_kept: Number(rate(tune.pos, t).toFixed(3)), non_evidence_passing: Number(rate(tune.neg, t).toFixed(3)), positives: tune.pos.length, negatives: tune.neg.length }, held_out: { good_quotes_kept: Number(rate(hold.pos, t).toFixed(3)), non_evidence_passing: Number(rate(hold.neg, t).toFixed(3)), positives: hold.pos.length, negatives: hold.neg.length } }));
    return;
  }
  let best = { t: 0.5, value: -1 };
  for (let t = 0.3; t <= 0.9001; t += 0.01) {
    const value = rate(tune.pos, t) - rate(tune.neg, t);
    if (value > best.value + 1e-9) best = { t: Number(t.toFixed(2)), value };
  }
  const report = (p: ReturnType<typeof part>) => ({ positives: p.pos.length, negatives: p.neg.length, good_quotes_kept: Number(rate(p.pos, best.t).toFixed(3)), non_evidence_passing: Number(rate(p.neg, best.t).toFixed(3)) });
  const sorted = (rows: { sim: number }[]) => rows.map((r) => r.sim).sort((a, b) => a - b);
  const q = (rows: { sim: number }[], f: number) => Number((sorted(rows)[Math.floor((rows.length - 1) * f)] ?? 0).toFixed(3));
  const result = {
    threshold: best.t,
    date: new Date().toISOString(),
    note: "Tuned on two thirds of the recorded answers, reported on the held-out third. A second line behind the verbatim-quote rule, not the only one.",
    tuned_on: report(tune),
    held_out: report(hold),
    similarity: { good_quotes: { min: q(positives, 0), median: q(positives, 0.5), max: q(positives, 1) }, non_evidence: { min: q(negatives, 0), median: q(negatives, 0.5), max: q(negatives, 1) } },
  };
  writeFileSync(OUT, JSON.stringify(result, null, 1) + "\n");
  console.log(JSON.stringify(result, null, 1));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
