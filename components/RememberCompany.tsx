"use client";
import { useEffect } from "react";

/** Keeps the invite code on the device so anonymous counters can be grouped by company. */
export function RememberCompany({ code }: { code: string }) {
  useEffect(() => {
    try {
      localStorage.setItem("lahza.company", code);
    } catch {
      // Without storage the events simply carry no company.
    }
  }, [code]);
  return null;
}
