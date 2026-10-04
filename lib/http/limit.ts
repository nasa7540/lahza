/**
 * Small per-IP request limits. In memory, per server instance: enough to stop one client from looping or guessing
 * a passcode, not a defence against a distributed flood. LAHZA_NO_RATE_LIMIT=1 is set only by the local load check,
 * which sends everything from one address on purpose.
 */
const WINDOW_MS = 60_000;
const seen = new Map<string, number[]>();

/** Each bucket has its own budget, so anonymous counters never use up the budget of the model endpoints. */
const BUCKETS = { model: 20, event: 60, login: 5 } as const;
type Bucket = keyof typeof BUCKETS;

function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function hit(bucket: Bucket, headers: Headers): boolean {
  if (process.env.LAHZA_NO_RATE_LIMIT === "1") return false;
  const key = `${bucket}:${clientIp(headers)}`;
  const now = Date.now();
  const recent = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  seen.set(key, recent);
  if (seen.size > 5_000) for (const [k, times] of seen) if (times.every((t) => now - t >= WINDOW_MS)) seen.delete(k);
  return recent.length > BUCKETS[bucket];
}

/** For the endpoints that call a model (and the referral form): 20 requests a minute per IP. */
export function tooMany(request: Request, bucket: Bucket = "model"): boolean {
  return hit(bucket, request.headers);
}

/** For the passcode forms of /review and /dashboard: 5 attempts a minute per IP, counted before the passcode is checked. */
export function tooManyLogins(headers: Headers): boolean {
  return hit("login", headers);
}

/** User text goes between tags in a prompt; angle brackets are removed so it cannot close or open one. */
export function withoutAngleBrackets(text: string): string {
  return text.replace(/[<>]/g, " ");
}
