import { wedding } from "@/config/wedding";

/**
 * The "786" emblem printed at the head of the card — an abjad numeral
 * standing in for the Bismillah.
 */
export function Emblem786({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="emblem" role="img" aria-label={wedding.bismillah.translit}>
        <span className="emblem__ring emblem__ring--outer" aria-hidden />
        <span className="emblem__ring" aria-hidden />
        <span className="emblem__num" aria-hidden>
          {wedding.bismillah.numeric}
        </span>
      </div>
    </div>
  );
}

/** Interlocking initials used on the seal and in the finale. */
export function Monogram({ light = false }: { light?: boolean }) {
  const { left, right } = wedding.monogram;
  return (
    <span
      className={`font-display text-lg font-semibold tracking-[0.25em] ${
        light ? "text-gold-soft" : "text-forest"
      }`}
      aria-hidden
    >
      {left} <span className="text-gold">✦</span> {right}
    </span>
  );
}
