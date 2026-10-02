const SIZES = {
  sm: { la: "text-[17px]", bar: "h-[18px] w-px", ar: "text-[22px]", gap: "gap-2" },
  lg: { la: "text-[38px]", bar: "h-[46px] w-[1.5px] opacity-70", ar: "text-[52px]", gap: "gap-4" },
} as const;

export function Logo({ size = "sm" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <div dir="ltr" className={`flex items-center ${s.gap}`} role="img" aria-label="Lahza | لحظة">
      <span className={`font-light text-teal ${s.la}`}>Lahza</span>
      <span className={`bg-gold ${s.bar}`} />
      <span lang="ar" className={`font-arabic font-bold leading-none text-teal ${s.ar}`}>
        لحظة
      </span>
    </div>
  );
}
