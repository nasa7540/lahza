"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { companyCode } from "@/lib/companies";

/**
 * Keeps the invite code on the device so anonymous counters can be grouped by company. It runs on every page,
 * because an invitation or a reminder can link straight to the home screen or to a journey with `?c=`.
 */
export function RememberCompany() {
  const pathname = usePathname();
  useEffect(() => {
    const code = companyCode(new URLSearchParams(window.location.search).get("c"));
    if (!code) return;
    try {
      localStorage.setItem("lahza.company", code);
    } catch {
      // Without storage the events simply carry no company.
    }
  }, [pathname]);
  return null;
}
