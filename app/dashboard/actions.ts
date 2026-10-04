"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardGate } from "@/lib/dashboard";
import { createServiceClient } from "@/lib/supabase/server";

export async function enter(form: FormData): Promise<void> {
  const given = form.get("passcode");
  if (typeof given !== "string" || !dashboardGate.matches(given)) redirect("/dashboard?error=1");
  await dashboardGate.open({ in: true });
  redirect("/dashboard");
}

export async function leave(): Promise<void> {
  await dashboardGate.close();
  redirect("/dashboard");
}

const moveSchema = z.object({ id: z.string().uuid(), status: z.enum(["accepted", "closed"]) });

/** Takes a request from the queue, or closes it. */
export async function moveReferral(form: FormData): Promise<void> {
  const db = createServiceClient();
  const parsed = moveSchema.safeParse(Object.fromEntries(form));
  if (!(await dashboardGate.current()) || !db || !parsed.success) redirect("/dashboard");
  const { error } = await db.from("referrals").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
