/** Faint geometric corner pattern from the prototype. */
export function Ornament({ corner }: { corner: "tr" | "bl" }) {
  const tr = corner === "tr";
  return (
    <svg
      viewBox="0 0 220 220"
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 h-[220px] w-[220px] opacity-[.11] ${
        tr ? "-top-6 -right-11" : "-bottom-6 -left-11"
      }`}
    >
      <defs>
        <pattern id={`orn-p-${corner}`} width="44" height="44" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#0F4C5C" strokeWidth="1">
            <rect x="12" y="12" width="20" height="20" />
            <rect x="12" y="12" width="20" height="20" transform="rotate(45 22 22)" />
            <path d="M0 22h6M38 22h6M22 0v6M22 38v6" />
          </g>
        </pattern>
        <radialGradient id={`orn-g-${corner}`} cx={tr ? 1 : 0} cy={tr ? 0 : 1} r="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`orn-m-${corner}`}>
          <rect width="220" height="220" fill={`url(#orn-g-${corner})`} />
        </mask>
      </defs>
      <rect width="220" height="220" fill={`url(#orn-p-${corner})`} mask={`url(#orn-m-${corner})`} />
    </svg>
  );
}
