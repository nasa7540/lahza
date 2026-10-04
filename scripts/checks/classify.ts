// P3 check: the free-question path (rule guard, classifier, search, gate) on the recorded routing questions.
// Fails on: a fatwa, disputed, off-topic or injection question that is offered a journey; a question routed to the
// wrong journey; or the required case not reaching the Ramadan journey. Other differences are listed and counted.
// Resumable: each result is saved as soon as it is ready (delete the results file to start over).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { routeQuestion, type RouteTrace, SIM_MIN } from "../../lib/classify/route";
import { loadTopics } from "../../lib/factory/topics";
import { scriptDb } from "../db";

type Case = { group: string; lang: string; expected: string; text: string };
type Row = Case & { trace: RouteTrace };
const OUT = "content/eval/classify-results.json";
const MUST_NOT_ROUTE = new Set(["specialist", "empty", "reject"]);

function verdict(c: Case, t: RouteTrace): "correct" | "partial" | "false_accept" | "wrong_journey" | "false_reject" | "other" {
  const offered = t.outcome === "journey" || t.outcome === "candidates";
  if (MUST_NOT_ROUTE.has(c.expected)) {
    if (offered) return "false_accept";
    return c.expected === "reject" || t.outcome === c.expected ? "correct" : "other";
  }
  const want = c.expected.replace("journey:", "");
  if (t.outcome === "journey") return t.journeys[0] === want ? "correct" : "wrong_journey";
  if (t.outcome === "candidates") return t.journeys.includes(want) ? "partial" : "wrong_journey";
  return "false_reject";
}

async function main() {
  const db = scriptDb();
  const file = JSON.parse(readFileSync("content/eval/routing-cases.json", "utf8")) as { required: Case[]; cases: Case[] };
  const cases = [...file.required, ...file.cases];
  const topics = loadTopics().map((t) => ({ id: t.id, ...t.route }));
  const rows: Row[] = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")).rows as Row[]) : [];
  const todo = cases.filter((c) => !rows.some((r) => r.text === c.text));
  const save = (summary?: unknown) => writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), note: "70 recorded questions (seen before the challenge) plus the required case.", summary, rows }, null, 1));
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const c = todo[next++];
      rows.push({ ...c, trace: await routeQuestion(db, c.text, topics) });
      save();
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);

  const counts: Record<string, number> = {};
  for (const r of rows) {
    const v = verdict(r, r.trace);
    counts[v] = (counts[v] ?? 0) + 1;
    if (v !== "correct") console.log(`${v.padEnd(13)} [${r.group}/${r.lang}] expected ${r.expected}, got ${r.trace.outcome} ${r.trace.journeys.join(",")} (level ${r.trace.level}, classifier ${r.trace.classified}, top ${r.trace.top?.journey} ${r.trace.top?.similarity.toFixed(2)}, by ${r.trace.by}) — ${r.text}`);
  }
  const ms = rows.map((r) => r.trace.ms).sort((a, b) => a - b);
  // The required case must be offered its journey: alone, or first among the candidates. It must not be refused as a ruling request.
  const required = file.required.every((c) => rows.some((r) => r.text === c.text && r.trace.journeys[0] === c.expected.replace("journey:", "")));
  // For the owner's reading: what the gate would give if the classifier's journey only had to appear among the search hits above the floor.
  const alt = rows.filter((r) => verdict(r, r.trace) === "partial" && r.trace.hits.some((h) => h.journey === r.trace.classified && h.similarity >= SIM_MIN)).length;
  const summary = { n: rows.length, ...counts, required_case_ok: required, partial_that_a_looser_gate_would_route: alt, median_ms: ms[Math.floor(ms.length / 2)], p95_ms: ms[Math.floor(ms.length * 0.95)], by: rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.trace.by]: (a[r.trace.by] ?? 0) + 1 }), {}) };
  save(summary);
  console.log(JSON.stringify(summary));
  if (counts.false_accept || counts.wrong_journey || !required) process.exit(1);
  console.log("check:classify passed (no false accept, no wrong journey, the required case is offered Ramadan first)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
