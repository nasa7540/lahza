import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

type GateOptions = { cookie: string; env: string; path: string };

/**
 * A passcode gate for an internal page: a cookie holding a small payload, signed with the passcode.
 * `next dev` falls back to a fixed development passcode so the page can be tried locally; a deployed build has no fallback.
 */
export function gate<T extends object>({ cookie, env, path }: GateOptions) {
  const passcode = (): string | null => process.env[env] ?? (process.env.NODE_ENV !== "production" ? "lahza-dev" : null);
  const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");
  return {
    matches(given: string): boolean {
      const key = passcode();
      return key !== null && timingSafeEqual(Buffer.from(sign(given, "compare")), Buffer.from(sign(key, "compare")));
    },
    async open(payload: T): Promise<void> {
      const key = passcode();
      if (!key) throw new Error(`${env} is not configured`);
      const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
      (await cookies()).set(cookie, `${body}.${sign(body, key)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path, maxAge: 60 * 60 * 12 });
    },
    async close(): Promise<void> {
      (await cookies()).delete({ name: cookie, path });
    },
    async current(): Promise<T | null> {
      const key = passcode();
      const raw = (await cookies()).get(cookie)?.value;
      if (!key || !raw) return null;
      const [body, signature] = raw.split(".");
      if (!body || !signature || signature !== sign(body, key)) return null;
      try {
        return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
      } catch {
        return null;
      }
    },
  };
}
