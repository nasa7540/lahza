import topics from "@/content/topics.json";
import type { RouteJourney } from "./route";

/** The fixed list the classifier chooses from: id, an English title and one line per journey. Bundled at build time. */
export const ROUTE_JOURNEYS: RouteJourney[] = topics.map((t) => ({ id: t.id, title: t.route.title, description: t.route.description }));
