import type { ReactNode } from "react";

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`orn-divider ${className}`} aria-hidden>
      <span className="orn-line" />
      <span className="orn-star">✦</span>
      {/* `orn-line--rev`, not `rev` — `.rev` used to collide with the
          scroll-reveal class and left this half permanently invisible. */}
      <span className="orn-line orn-line--rev" />
    </div>
  );
}

/* Colours come from the panel these sit in (--fg / --accent), so nothing
   here needs a light/dark prop — see the `.panel` block in styles.css. */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="t-accent text-center text-[0.62rem] font-semibold tracking-[0.3em] uppercase sm:text-xs sm:tracking-[0.42em]">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="t-fg mt-2 text-center font-display text-2xl font-semibold sm:text-4xl">
      {children}
    </h2>
  );
}

/** Small gold eyebrow with rules either side — for sub-headings inside a section. */
export function RuledLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-[linear-gradient(to_right,transparent,var(--rule))]" />
      <span className="t-accent text-[0.6rem] font-semibold tracking-[0.36em] uppercase">
        {children}
      </span>
      <span className="h-px w-10 bg-[linear-gradient(to_left,transparent,var(--rule))]" />
    </div>
  );
}

export function ArchOrnament() {
  return (
    <div className="arch-ornament" aria-hidden>
      <svg
        viewBox="0 0 220 58"
        className="w-32 sm:w-52"
        fill="none"
        stroke="currentColor"
        style={{ color: "var(--accent)" }}
      >
        {/* Apex of the outer arc lands at y=34, so the medallion below is
            seated on the line rather than floating above it. */}
        <path d="M22 52 Q110 16 198 52" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M50 52 Q110 30 170 52" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
        <g transform="translate(110 26)">
          <rect x="-6.5" y="-6.5" width="13" height="13" strokeWidth="1" />
          <rect x="-6.5" y="-6.5" width="13" height="13" strokeWidth="1" transform="rotate(45)" />
          <circle r="2" fill="currentColor" stroke="none" />
        </g>
        <circle cx="22" cy="52" r="2.5" fill="currentColor" stroke="none" opacity="0.75" />
        <circle cx="198" cy="52" r="2.5" fill="currentColor" stroke="none" opacity="0.75" />
        <circle cx="66" cy="38" r="1.4" fill="currentColor" stroke="none" opacity="0.5" />
        <circle cx="154" cy="38" r="1.4" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    </div>
  );
}
