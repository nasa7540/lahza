"use client";
import { CheckIcon } from "@/components/icons";
import { useDone } from "@/lib/progress";

/** Shows on the home list once this device has completed the journey. */
export function DoneMark({ journeyId, label }: { journeyId: string; label: string }) {
  if (!useDone(journeyId)) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal">
      <CheckIcon size={13} /> {label}
    </span>
  );
}
