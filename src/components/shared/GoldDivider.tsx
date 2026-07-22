import type { ReactNode } from "react";

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`orn-divider ${className}`} aria-hidden>
      <span className="orn-line" />
      <span className="orn-star">✦</span>
      <span className="orn-line rev" />
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-xs font-semibold tracking-[0.42em] uppercase text-gold">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <h2
      className={`mt-2 text-center font-display text-3xl font-semibold sm:text-4xl ${
        light ? "text-cream" : "text-forest"
      }`}
    >
      {children}
    </h2>
  );
}

/** Small gold eyebrow with rules either side — for sub-headings inside a section. */
export function RuledLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-linear-to-r from-transparent to-[rgba(201,168,76,0.6)]" />
      <span className="text-[0.6rem] font-semibold tracking-[0.36em] uppercase text-gold">
        {children}
      </span>
      <span className="h-px w-10 bg-linear-to-l from-transparent to-[rgba(201,168,76,0.6)]" />
    </div>
  );
}

export function ArchOrnament({ light = false }: { light?: boolean }) {
  return (
    <div className="arch-ornament" aria-hidden>
      <svg viewBox="0 0 200 56" className="w-40 sm:w-52" fill="none">
        <path
          d="M10 50 Q100 4 190 50"
          stroke={light ? "#e6cf9a" : "#c9a84c"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M28 50 Q100 14 172 50"
          stroke={light ? "#e6cf9a" : "#c9a84c"}
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="100" cy="8" r="3" fill={light ? "#e6cf9a" : "#c9a84c"} />
        <circle cx="10" cy="50" r="2" fill={light ? "#e6cf9a" : "#c9a84c"} opacity="0.6" />
        <circle cx="190" cy="50" r="2" fill={light ? "#e6cf9a" : "#c9a84c"} opacity="0.6" />
      </svg>
    </div>
  );
}
