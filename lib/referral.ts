import { z } from "zod";

/** Why someone asks for a person instead of a journey. A fixed list: the topic shown on the dashboard is never free text. */
export const REFERRAL_TOPICS = ["personal_ruling", "disputed_matter", "about_islam", "other"] as const;
export type ReferralTopic = (typeof REFERRAL_TOPICS)[number];

export const referralSchema = z.object({
  lang: z.enum(["ar", "en", "ur"]),
  topic: z.enum(REFERRAL_TOPICS),
  /** Written by the user: starts from a fixed template, never from a model. */
  summary: z.string().trim().min(10).max(1000),
  /** The user must switch this on themselves. */
  consent: z.literal(true),
  company: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});
