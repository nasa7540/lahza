// P6 check: the referral endpoint against a production build started here. Run `npm run build` first.
// A request is stored only with consent, with a topic from the fixed list, and the answer is {ok} only.
import { type ChildProcess, spawn } from "node:child_process";
import { summarise } from "../../lib/dashboard-counts";
import { scriptDb } from "../db";
import { loadEnv } from "../env";

const PORT = 3213;
const BASE = `http://localhost:${PORT}`;
const MARK = "check-referral";

async function main() {
  loadEnv();
  const db = scriptDb();
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "production" }, stdio: "ignore" });
  const results: [string, boolean][] = [];
  const post = (body: unknown) => fetch(`${BASE}/api/referral`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const good = { lang: "en", topic: "personal_ruling", summary: `I would like to speak with a specialist. ${MARK}`, consent: true, company: "naqlah" };
  try {
    for (let i = 0; i < 60 && !(await fetch(`${BASE}/api/health`).then((r) => r.status > 0, () => false)); i++) await new Promise((r) => setTimeout(r, 500));
    results.push(["without consent: refused", (await post({ ...good, consent: false })).status === 400]);
    results.push(["topic outside the fixed list: refused", (await post({ ...good, topic: "anything I type" })).status === 400]);
    results.push(["summary too short: refused", (await post({ ...good, summary: "hi" })).status === 400]);
    const stored = async () => ((await db.from("referrals").select("id, status, topic, lang, company").like("summary", `%${MARK}%`)).data ?? []) as { id: string; status: string; topic: string; lang: string; company: string }[];
    results.push(["nothing stored by the refused requests", (await stored()).length === 0]);
    const ok = await post(good);
    const body = (await ok.json()) as Record<string, unknown>;
    results.push(["with consent: accepted, answer is {ok} only", ok.ok && Object.keys(body).join() === "ok" && body.ok === true]);
    const rows = await stored();
    results.push(["stored once as new, with topic, language and company", rows.length === 1 && rows[0].status === "new" && rows[0].topic === "personal_ruling" && rows[0].lang === "en" && rows[0].company === "naqlah"]);
    const page = await fetch(`${BASE}/dashboard`).then((r) => r.text());
    results.push(["the dashboard shows nothing without the passcode", !page.includes('data-testid="dashboard"') && !page.includes(MARK)]);
    const counts = summarise([{ type: "start", journey_id: "ramadan", score: null, choice: null, company: null }, { type: "grade", journey_id: "ramadan", score: 4, choice: null, company: null }, { type: "grade", journey_id: "ramadan", score: 2, choice: null, company: null }, { type: "classify", journey_id: null, score: null, choice: "specialist", company: null }]);
    const r = counts.journeys.get("ramadan");
    results.push(["dashboard counts: starts, explanations, understood (score 4+), outcomes", r?.started === 1 && r.explained === 2 && r.understood === 1 && counts.outcomes.specialist === 1]);
  } finally {
    server.kill();
    await db.from("referrals").delete().like("summary", `%${MARK}%`);
  }
  for (const [name, ok] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (results.some(([, ok]) => !ok)) process.exit(1);
  console.log("check:referral passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
