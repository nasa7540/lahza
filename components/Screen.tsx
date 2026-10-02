import type { ReactNode } from "react";
import { Ornament } from "./Ornament";

/** Mobile-first app column: cream surface with corner ornaments. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-clip bg-cream sm:shadow-[0_30px_60px_rgba(15,76,92,.25)]">
      <Ornament corner="tr" />
      <Ornament corner="bl" />
      <div className="relative z-[1] flex min-h-dvh flex-col gap-4 px-[22px] pt-[22px] pb-3">
        {children}
      </div>
    </main>
  );
}
