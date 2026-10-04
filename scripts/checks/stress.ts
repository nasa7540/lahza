// Load check on a runtime endpoint: 20, 35 and 50 requests at a time against a production build started here.
//   npm run check:stress -- classify [seconds per level, default 60]
// Pass: median <= 3 s, p95 <= 8 s, answers that hit the 12 s cap <= 2%, no HTTP error, no invalid body.
// Run `npm run build` first. Results are written to content/eval/stress-<endpoint>.json.
import { type ChildProcess, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { loadEnv } from "../env";

const PORT = 3212;
const BASE = `http://localhost:${PORT}`;
const LEVELS = [20, 35, 50];
const LIMITS = { median_ms: 3_000, p95_ms: 8_000, capped_share: 0.02 };

type Target = { path: string; bodies: unknown[]; valid: (body: unknown) => boolean; header: string };

function target(name: string): Target {
  if (name === "classify") {
    const { cases } = JSON.parse(readFileSync("content/eval/routing-cases.json", "utf8")) as { cases: { text: string; lang: string }[] };
    const body = z.object({ outcome: z.enum(["journey", "candidates", "specialist", "empty"]), journeys: z.array(z.string().regex(/^[a-z0-9-]+$/)) }).strict();
    return { path: "/api/classify", bodies: cases.map((c) => ({ text: c.text, lang: c.lang === "ar" || c.lang === "ur" ? c.lang : "en" })), valid: (b) => body.safeParse(b).success, header: "x-lahza-route" };
  }
  if (name === "grade") {
    const { cases } = JSON.parse(readFileSync("content/eval/grader-ladder.json", "utf8")) as { cases: { journey: string; lang: string; text: string }[] };
    const body = z.object({ covered: z.array(z.number().int()), missing: z.array(z.number().int()), status: z.enum(["graded", "rejected", "unavailable"]) }).strict();
    return { path: "/api/grade", bodies: cases.map((c) => ({ journey_id: c.journey, lang: c.lang, text: c.text })), valid: (b) => body.safeParse(b).success, header: "x-lahza-route" };
  }
  throw new Error("usage: npm run check:stress -- classify|grade [seconds]");
}

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (await fetch(`${BASE}/api/health`).then((r) => r.ok, () => false)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("the production server did not start (run `npm run build` first)");
}

async function main() {
  loadEnv();
  const name = process.argv[2] ?? "";
  const seconds = Number(process.argv[3] ?? 60);
  const t = target(name);
  // The full path runs for every request (rule guard, model, search); which journeys are approved does not change the load.
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "production" }, stdio: "ignore" });
  const levels: Record<string, unknown>[] = [];
  let failed = false;
  try {
    await waitForServer();
    for (const concurrency of LEVELS) {
      const until = Date.now() + seconds * 1000;
      const ms: number[] = [];
      const by: Record<string, number> = {};
      let httpErrors = 0;
      let invalid = 0;
      const worker = async () => {
        while (Date.now() < until) {
          const started = Date.now();
          try {
            const res = await fetch(`${BASE}${t.path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(t.bodies[Math.floor(Math.random() * t.bodies.length)]) });
            const body: unknown = await res.json().catch(() => null);
            if (!res.ok) httpErrors++;
            else if (!t.valid(body)) invalid++;
            const route = res.headers.get(t.header) ?? "none";
            by[route] = (by[route] ?? 0) + 1;
          } catch {
            httpErrors++;
          }
          ms.push(Date.now() - started);
        }
      };
      await Promise.all(Array.from({ length: concurrency }, worker));
      ms.sort((a, b) => a - b);
      const capped = ((by.timeout ?? 0) + (by.failed ?? 0)) / ms.length;
      const level = { concurrency, requests: ms.length, median_ms: ms[Math.floor(ms.length / 2)], p95_ms: ms[Math.floor(ms.length * 0.95)], max_ms: ms.at(-1), http_errors: httpErrors, invalid_bodies: invalid, capped_share: Number(capped.toFixed(4)), by };
      const ok = level.median_ms <= LIMITS.median_ms && level.p95_ms <= LIMITS.p95_ms && capped <= LIMITS.capped_share && httpErrors === 0 && invalid === 0;
      console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(level)}`);
      if (!ok) failed = true;
      levels.push({ ...level, ok });
    }
  } finally {
    server.kill();
    writeFileSync(`content/eval/stress-${name}.json`, JSON.stringify({ date: new Date().toISOString(), seconds_per_level: seconds, limits: LIMITS, levels }, null, 1));
  }
  if (failed) process.exit(1);
  console.log(`check:stress ${name} passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
