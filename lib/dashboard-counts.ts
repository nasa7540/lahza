export type EventRow = { type: string | null; journey_id: string | null; score: number | null; choice: string | null; company: string | null };
export type JourneyCounts = { started: number; completed: number; explained: number; understood: number };

/** Counts only. The dashboard never reads what an employee wrote. A score of 4 or 5 counts as understood. */
export function summarise(events: EventRow[]) {
  const journeys = new Map<string, JourneyCounts>();
  const outcomes: Record<string, number> = { journey: 0, candidates: 0, specialist: 0, empty: 0 };
  const at = (id: string) => journeys.get(id) ?? journeys.set(id, { started: 0, completed: 0, explained: 0, understood: 0 }).get(id)!;
  for (const e of events) {
    if (e.type === "classify" && e.choice && e.choice in outcomes) outcomes[e.choice]++;
    if (!e.journey_id) continue;
    if (e.type === "start") at(e.journey_id).started++;
    if (e.type === "complete") at(e.journey_id).completed++;
    if (e.type === "grade") {
      at(e.journey_id).explained++;
      if ((e.score ?? 0) >= 4) at(e.journey_id).understood++;
    }
  }
  return { journeys, outcomes };
}
