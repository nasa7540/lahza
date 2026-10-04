/**
 * A small per-IP request limit for the two endpoints that call a model. In memory, per server instance: enough to
 * stop one client from looping, not a defence against a distributed flood. LAHZA_NO_RATE_LIMIT=1 is set only by
 * the local load check, which sends everything from one address on purpose.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const seen = new Map<string, number[]>();

export function tooMany(request: Request): boolean {
  if (process.env.LAHZA_NO_RATE_LIMIT === "1") return false;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  seen.set(ip, recent);
  if (seen.size > 5_000) for (const [key, times] of seen) if (times.every((t) => now - t >= WINDOW_MS)) seen.delete(key);
  return recent.length > MAX_PER_WINDOW;
}

/** User text goes between tags in a prompt; angle brackets are removed so it cannot close or open one. */
export function withoutAngleBrackets(text: string): string {
  return text.replace(/[<>]/g, " ");
}
