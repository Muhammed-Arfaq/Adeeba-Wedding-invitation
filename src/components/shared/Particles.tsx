/**
 * Ambient gold motes drifting up behind a panel.
 *
 * `from` is where a mote starts, as a percentage of the panel's height. It
 * exists because `particle-rise` travels a fixed `-110vh`: with every mote
 * starting at the foot, a panel taller than the viewport only ever has motes
 * in its bottom screenful. The details panel runs two to three screens, so
 * without spreading the starts the effect simply isn't there for most of it.
 *
 * Spread also means the field looks settled immediately rather than filling
 * from the bottom over the first cycle — which matters now that this is on
 * every panel and most of them are scrolled to rather than landed on.
 */
const SEEDS = [
  { left: 8, from: 4, size: 5, delay: 0, dur: 14, drift: 18 },
  { left: 18, from: 62, size: 3, delay: 2.4, dur: 11, drift: -12 },
  { left: 28, from: 26, size: 6, delay: 0.8, dur: 16, drift: 22 },
  { left: 38, from: 81, size: 3, delay: 3.5, dur: 12, drift: -8 },
  { left: 50, from: 12, size: 5, delay: 1.2, dur: 15, drift: 15 },
  { left: 60, from: 47, size: 3, delay: 4.0, dur: 13, drift: -20 },
  { left: 72, from: 90, size: 6, delay: 0.4, dur: 17, drift: 10 },
  { left: 83, from: 34, size: 3, delay: 2.8, dur: 11, drift: -16 },
  { left: 91, from: 70, size: 5, delay: 1.8, dur: 14, drift: 24 },
  { left: 44, from: 55, size: 3, delay: 5.2, dur: 12, drift: -6 },
  { left: 66, from: 18, size: 5, delay: 3.1, dur: 16, drift: 14 },
  { left: 22, from: 95, size: 3, delay: 6.0, dur: 13, drift: -18 },
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
              "--y0": `${p.from}%`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
