import { readFileSync } from "node:fs";
import { z } from "zod";

const topicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string().min(1),
  /** Words that name the practice itself; the scene must not contain them. */
  practice_names: z.array(z.string()),
  /** True where what the employee hears is itself the thing to explain (a phrase, a question to a waiter): the words may appear inside quoted speech. */
  allow_in_quotes: z.boolean(),
  expected_occasions: z.array(z.string()),
  /** Hadith ids (hadeethenc) the project owner chose for this topic; tried before what the research step proposes. Same eligibility rules apply. */
  /** What the free-question classifier sees for this journey: a fixed English title and one line. Never the journey text. */
  route: z.object({ title: z.string().min(1), title_ar: z.string().min(1), description: z.string().min(1) }),
  pinned_hadith_ids: z.array(z.number().int()).default([]),
});
export type Topic = z.infer<typeof topicSchema>;

export function loadTopics(): Topic[] {
  return z.array(topicSchema).parse(JSON.parse(readFileSync("content/topics.json", "utf8")));
}
