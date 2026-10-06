// Screens candidate topics before any of them enters content/topics.json. No model call, no database.
//   npm run screen:candidates
// For each candidate: the schema, a unique id not already a journey, known occasions, and the guard's code rules
// (refuse / needs_sharii / ruling phrasing). The model step of the guard runs later, inside the factory.
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { OCCASIONS } from "../lib/factory/occasions";
import { screenByRules } from "../lib/factory/guard";
import { loadTopics, topicSchema } from "../lib/factory/topics";

const FILE = "content/topics-candidates.json";
const REPORT = "content/eval/candidates-screen.json";

type Row = { id: string; status: "ready" | "needs_sharii" | "refused" | "invalid"; notes: string[] };

function main() {
  const existing = new Set(loadTopics().map((t) => t.id));
  const raw = z.array(z.unknown()).parse(JSON.parse(readFileSync(FILE, "utf8")));
  const seen = new Set<string>();
  const rows: Row[] = raw.map((item, i) => {
    const parsed = topicSchema.safeParse(item);
    if (!parsed.success) return { id: `#${i + 1}`, status: "invalid", notes: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`) };
    const t = parsed.data;
    const notes: string[] = [];
    if (existing.has(t.id)) notes.push("id is already a journey");
    if (seen.has(t.id)) notes.push("duplicate id");
    seen.add(t.id);
    const unknown = t.expected_occasions.filter((o) => !(o in OCCASIONS));
    if (unknown.length) notes.push(`unknown occasions: ${unknown.join(", ")}`);
    if (notes.length) return { id: t.id, status: "invalid", notes };
    const rule = screenByRules(t.topic);
    if (rule.ruling_phrasing) notes.push("phrased like a ruling request: the model decides");
    if (rule.decision === "refuse") return { id: t.id, status: "refused", notes: [...notes, `rule: ${rule.why}`] };
    if (rule.decision === "needs_sharii") return { id: t.id, status: "needs_sharii", notes: [...notes, `rule: ${rule.why}`] };
    return { id: t.id, status: "ready", notes };
  });

  for (const r of rows) console.log(`${r.status.padEnd(12)} ${r.id}${r.notes.length ? `  (${r.notes.join("; ")})` : ""}`);
  const count = (s: Row["status"]) => rows.filter((r) => r.status === s).length;
  const summary = { ready: count("ready"), needs_sharii: count("needs_sharii"), refused: count("refused"), invalid: count("invalid") };
  console.log(`${rows.length} candidates: ${summary.ready} ready, ${summary.needs_sharii} needs_sharii, ${summary.refused} refused, ${summary.invalid} invalid`);
  writeFileSync(REPORT, JSON.stringify({ date: new Date().toISOString(), candidates: rows.length, ...summary, rows }, null, 1) + "\n");
  if (summary.invalid) process.exit(1);
}

main();
