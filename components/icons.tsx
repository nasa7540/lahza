import type { ReactNode } from "react";

type IconProps = { size?: number; className?: string };

function Icon({
  size = 18,
  strokeWidth = 1.5,
  className,
  children,
}: IconProps & { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Points forward in the reading direction (flips in RTL). */
export function ArrowIcon({ size }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className="rtl:-scale-x-100">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function BuildingIcon({ size = 20 }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </Icon>
  );
}

export function NoAccountIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a7 7 0 0 1 11-5.7" />
      <path d="m17 17 4 4M21 17l-4 4" />
    </Icon>
  );
}

export function ShieldIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Icon>
  );
}

export function PhoneIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </Icon>
  );
}

export function SparkIcon({ size = 14 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </Icon>
  );
}

/** Points back against the reading direction (flips in RTL). */
export function BackIcon({ size = 20 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className="rtl:-scale-x-100">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Icon>
  );
}

export function CheckIcon({ size = 15 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <path d="m5 12 5 5L20 7" />
    </Icon>
  );
}

export function InfoIcon({ size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5v.5" />
    </Icon>
  );
}

export function QuoteLockIcon({ size = 12 }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function CupIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3v2M12 3v2" />
    </Icon>
  );
}

export function MomentIcon({ size = 20 }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="6" y="6" width="12" height="12" />
      <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
    </Icon>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function PersonIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  );
}
