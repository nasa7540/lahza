// Prints the newest draft of a journey for reading in the terminal:  npm run draft:show -- ramadan [ar|en|ur]
import { latestDraft } from "../lib/content/drafts";
import type { Lang, Sentence } from "../lib/content/types";
import { scriptDb } from "./db";

function line(s: Sentence): string {
  return `     [${s.label}${s.segment ? ` ${s.segment}` : ""}] ${s.text}${s.flags.length ? `  ⚑ ${s.flags.join("; ")}` : ""}`;
}

async function main() {
  const [id, lang = "ar"] = process.argv.slice(2);
  const d = await latestDraft(scriptDb(), id);
  const t = d?.locales[lang as Lang];
  if (!d || !t) throw new Error(`no ${lang} draft for "${id}"`);
  console.log(`draft ${d.id} — status ${d.status}, level ${d.level}, occasions [${d.occasions.join(", ") || "none"}], needs_sharii ${d.needs_sharii}`);
  console.log(`sources: ${d.sources.map((s) => `${s.id} (${s.kind}${s.grade ? `, ${s.grade}` : ""})`).join(" · ")}`);
  for (const l of d.log.filter((x) => x.event === "dropped")) console.log(`dropped: ${l.ref ?? l.statement} — ${l.why}`);
  console.log(`research: ${d.log.filter((l) => l.stage === "research").map((l) => `${l.tool ?? l.event}${l.query ? ` "${l.query}"` : ""}`).join(" | ")}`);
  console.log(`counters: ${JSON.stringify(d.counters)}\n`);
  console.log(`${t.title} — ${t.teaser}\n\n${t.scene}\n`);
  for (const o of t.options) {
    console.log(` • ${o.label}  →  ${o.reveal_headline}`);
    o.reveal.forEach((s) => console.log(line(s)));
  }
  console.log("\n explanation:");
  t.explanation.forEach((s) => console.log(line(s)));
  console.log(`\n tip: ${t.tip.headline} — ${t.tip.lead}`);
  t.tip.items.forEach((i) => console.log(`     - ${i}`));
  console.log(`\n key points:\n${t.key_points.map((k) => `     - ${k}`).join("\n")}`);
  console.log(`\n example questions:\n${t.question_variants.map((k) => `     - ${k}`).join("\n")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
