"use client";
import { useSyncExternalStore } from "react";

/** Progress lives on the device only: which journeys were completed. No account, no server copy. */
const KEY = "lahza.done";
const EVENT = "lahza:progress";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function markDone(journeyId: string): void {
  try {
    const done = new Set(read().split(",").filter(Boolean));
    done.add(journeyId);
    localStorage.setItem(KEY, [...done].join(","));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage can be unavailable (private mode); the journey still works without saved progress.
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useDone(journeyId: string): boolean {
  const all = useSyncExternalStore(subscribe, read, () => "");
  return all.split(",").includes(journeyId);
}

/** Anonymous usage event: ids and enums only, never what the reader wrote. */
export function track(event: { type: "start" | "choice" | "complete"; journey_id: string; lang: string; choice?: string }): void {
  let company: string | undefined;
  try {
    company = localStorage.getItem("lahza.company") ?? undefined;
  } catch {
    company = undefined;
  }
  void fetch("/api/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...event, company }), keepalive: true }).catch(() => undefined);
}
