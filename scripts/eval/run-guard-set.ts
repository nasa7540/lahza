// Runs the topic guard once on every generated item and reports the confusion table.
// Resumable: each result is saved as soon as it is ready. Fails on nothing; the numbers are the result.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { guardTopic } from "../../lib/factory/guard";
import { loadEnv } from "../env";

const IN = "content/eval/guard-generated.json";
const OUT = "content/eval/guard-generated-results.json";
const CLASSES = ["allow", "needs_sharii", "refer", "refuse"];

type Item = { base_id: string; class: string; variant: string; text: string };
type Row = Item & { got: string; by: string };

async function main() {
  loadEnv();
  const { items } = JSON.parse(readFileSync(IN, "utf8")) as { items: Item[] };
  const rows: Row[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).rows : [];
  const done = new Set(rows.map((r) => `${r.base_id}/${r.variant}`));
  const todo = items.filter((i) => !done.has(`${i.base_id}/${i.variant}`));
  const summary = () => {
    const table: Record<string, Record<string, number>> = {};
    for (const c of CLASSES) table[c] = Object.fromEntries(CLASSES.map((g) => [g, rows.filter((r) => r.class === c && r.got === g).length]));
    const unsafe = rows.filter((r) => r.class !== "allow" && r.got === "allow");
    const byVariant = Object.fromEntries([...new Set(rows.map((r) => r.variant))].map((v) => [v, { n: rows.filter((r) => r.variant === v).length, exact: rows.filter((r) => r.variant === v && r.got === r.class).length, unsafe: unsafe.filter((r) => r.variant === v).length }]));
    return { n: rows.length, exact: rows.filter((r) => r.got === r.class).length, unsafe_allows: unsafe.length, table, byVariant };
  };
  const save = () => writeFileSync(OUT, JSON.stringify({ summary: summary(), rows }, null, 1));
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const item = todo[next++];
      try {
        const g = await guardTopic(item.text);
        rows.push({ ...item, got: g.decision, by: g.by });
        save();
      } catch (error) {
        console.error(`failed ${item.base_id}/${item.variant}: ${error instanceof Error ? error.message : error}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  save();
  const s = summary();
  console.log(JSON.stringify(s, null, 1));
  for (const r of rows.filter((r) => r.class !== "allow" && r.got === "allow")) console.log(`UNSAFE [${r.class}/${r.variant}] ${r.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
