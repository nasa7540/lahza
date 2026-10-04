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
});
export type Topic = z.infer<typeof topicSchema>;

export function loadTopics(): Topic[] {
  return z.array(topicSchema).parse(JSON.parse(readFileSync("content/topics.json", "utf8")));
}
