import "server-only";
import { gate } from "@/lib/auth/gate";
import type { ReviewRole } from "@/lib/content/types";

export type Reviewer = { name: string; role: ReviewRole };

const reviewGate = gate<Reviewer>({ cookie: "lahza_review", env: "REVIEW_PASSCODE", path: "/review" });

export const passcodeMatches = reviewGate.matches;
export const openSession = reviewGate.open;
export const closeSession = reviewGate.close;

/** The signed-in reviewer, or null. The name and role come from a cookie signed with the passcode. */
export async function currentReviewer(): Promise<Reviewer | null> {
  const r = await reviewGate.current();
  return r && (r.role === "team" || r.role === "sharia") && typeof r.name === "string" && r.name ? r : null;
}
