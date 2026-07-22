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

/** Gold eyebrow above a section title. Every band is light now, so gold
    text always needs the deeper shade to clear 4.5:1. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-[0.62rem] font-semibold tracking-[0.3em] uppercase text-gold-deep sm:text-xs sm:tracking-[0.42em]">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 text-center font-display text-2xl font-semibold text-forest sm:text-4xl">
      {children}
    </h2>
  );
}

/** Small gold eyebrow with rules either side — for sub-headings inside a section. */
export function RuledLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-linear-to-r from-transparent to-[rgba(201,169,97,0.7)]" />
      <span className="text-[0.6rem] font-semibold tracking-[0.36em] uppercase text-gold-deep">
        {children}
      </span>
      <span className="h-px w-10 bg-linear-to-l from-transparent to-[rgba(201,169,97,0.7)]" />
    </div>
  );
}

export function ArchOrnament() {
  const gold = "#96793a";
  const faint = "#c9a961";

  return (
    <div className="arch-ornament" aria-hidden>
      <svg viewBox="0 0 220 58" className="w-32 sm:w-52" fill="none">
        {/* Sweeping arcs. The apex of the outer arc lands at y=34, so the
            medallion below sits *on* the line rather than floating over it. */}
        <path d="M22 52 Q110 16 198 52" stroke={gold} strokeWidth="1.2" strokeLinecap="round" />
        <path
          d="M50 52 Q110 30 170 52"
          stroke={faint}
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Centre medallion — an eight-point star, echoing the background tile,
            seated as a finial at the crown of the arc. */}
        <g transform="translate(110 26)">
          <rect x="-6.5" y="-6.5" width="13" height="13" stroke={gold} strokeWidth="1" />
          <rect
            x="-6.5"
            y="-6.5"
            width="13"
            height="13"
            stroke={gold}
            strokeWidth="1"
            transform="rotate(45)"
          />
          <circle r="2" fill={gold} />
        </g>
        {/* terminal beads */}
        <circle cx="22" cy="52" r="2.5" fill={gold} opacity="0.75" />
        <circle cx="198" cy="52" r="2.5" fill={gold} opacity="0.75" />
        <circle cx="66" cy="38" r="1.4" fill={faint} opacity="0.5" />
        <circle cx="154" cy="38" r="1.4" fill={faint} opacity="0.5" />
      </svg>
    </div>
  );
}
