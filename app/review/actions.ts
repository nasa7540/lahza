"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { langSchema } from "@/lib/content/types";
import { approvePending, recordDecision } from "@/lib/review/decide";
import { closeSession, currentReviewer, openSession, passcodeMatches } from "@/lib/review/session";
import { createServiceClient } from "@/lib/supabase/server";

const loginSchema = z.object({ passcode: z.string().min(1), name: z.string().trim().min(2).max(80), role: z.enum(["team", "sharia"]), qualified: z.string().optional() });

export async function login(form: FormData): Promise<void> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  // The sharia role is for a qualified sharia reviewer only; it needs the explicit declaration on the form.
  if (!parsed.success || !passcodeMatches(parsed.data.passcode) || (parsed.data.role === "sharia" && parsed.data.qualified !== "yes")) redirect("/review?error=1");
  await openSession({ name: parsed.data.name, role: parsed.data.role });
  redirect("/review");
}

export async function logout(): Promise<void> {
  await closeSession();
  redirect("/review");
}

const decisionSchema = z.object({
  draftId: z.string().uuid(),
  lang: langSchema,
  unitId: z.string().min(1).max(60),
  action: z.enum(["approve", "reject", "edit", "comment"]),
  text: z.string().max(2000).optional(),
  note: z.string().max(1000).optional(),
});

export async function decide(form: FormData): Promise<void> {
  const reviewer = await currentReviewer();
  const db = createServiceClient();
  const parsed = decisionSchema.safeParse(Object.fromEntries(form));
  if (!reviewer || !db || !parsed.success) redirect("/review");
  await recordDecision(db, { ...parsed.data, role: reviewer.role, reviewer: reviewer.name });
  revalidatePath(`/review/${parsed.data.draftId}`);
}

const bulkSchema = z.object({ draftId: z.string().uuid(), lang: langSchema, unitIds: z.string() });

/** Approves the listed units in one step. The page lists only units that are not flagged and not already decided by this role. */
export async function approveRest(form: FormData): Promise<void> {
  const reviewer = await currentReviewer();
  const db = createServiceClient();
  const parsed = bulkSchema.safeParse(Object.fromEntries(form));
  if (!reviewer || !db || !parsed.success) redirect("/review");
  await approvePending(db, parsed.data.draftId, parsed.data.lang, reviewer.role, reviewer.name, parsed.data.unitIds.split("|").filter(Boolean));
  revalidatePath(`/review/${parsed.data.draftId}`);
}
