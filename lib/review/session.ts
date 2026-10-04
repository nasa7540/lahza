import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { ReviewRole } from "@/lib/content/types";

const COOKIE = "lahza_review";
export type Reviewer = { name: string; role: ReviewRole };

/** The panel's passcode. `next dev` falls back to a fixed development value so the panel can be tried locally; a deployed build has no fallback. */
function passcode(): string | null {
  return process.env.REVIEW_PASSCODE ?? (process.env.NODE_ENV !== "production" ? "lahza-dev" : null);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function passcodeMatches(given: string): boolean {
  const key = passcode();
  if (!key) return false;
  const a = Buffer.from(sign(given, "compare"));
  const b = Buffer.from(sign(key, "compare"));
  return timingSafeEqual(a, b);
}

export async function openSession(reviewer: Reviewer): Promise<void> {
  const key = passcode();
  if (!key) throw new Error("review passcode is not configured");
  const payload = Buffer.from(JSON.stringify(reviewer)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, key)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/review", maxAge: 60 * 60 * 12 });
}

export async function closeSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/review" });
}

/** The signed-in reviewer, or null. The name and role come from a cookie signed with the passcode. */
export async function currentReviewer(): Promise<Reviewer | null> {
  const key = passcode();
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!key || !raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || signature !== sign(payload, key)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Reviewer;
    return (parsed.role === "team" || parsed.role === "sharia") && typeof parsed.name === "string" && parsed.name ? parsed : null;
  } catch {
    return null;
  }
}
