import { useMemo } from "react";

const SEEDS = [
  { left: 8, size: 3, delay: 0, dur: 14, drift: 18 },
  { left: 18, size: 2, delay: 2.4, dur: 11, drift: -12 },
  { left: 28, size: 4, delay: 0.8, dur: 16, drift: 22 },
  { left: 38, size: 2, delay: 3.5, dur: 12, drift: -8 },
  { left: 50, size: 3, delay: 1.2, dur: 15, drift: 15 },
  { left: 60, size: 2, delay: 4.0, dur: 13, drift: -20 },
  { left: 72, size: 4, delay: 0.4, dur: 17, drift: 10 },
  { left: 83, size: 2, delay: 2.8, dur: 11, drift: -16 },
  { left: 91, size: 3, delay: 1.8, dur: 14, drift: 24 },
  { left: 44, size: 2, delay: 5.2, dur: 12, drift: -6 },
  { left: 66, size: 3, delay: 3.1, dur: 16, drift: 14 },
  { left: 22, size: 2, delay: 6.0, dur: 13, drift: -18 },
];

export function Particles() {
  return (
    <div className="particles" aria-hidden>
      {SEEDS.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
