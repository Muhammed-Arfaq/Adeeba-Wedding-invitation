import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import {
  GoldDivider,
  SectionLabel,
  SectionTitle,
  ArchOrnament,
} from "@/components/shared/GoldDivider";

/* The date is a constant, so resolve it once rather than per render. */
const TARGET = new Date(wedding.weddingDate).getTime();

function diff() {
  const ms = Math.max(0, TARGET - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1_000) % 60),
  };
}

function Cell({ value, label }: { value: number | null; label: string }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    prevRef.current = value;
    if (!numRef.current) return;
    if (prefersReducedMotion()) return;
    /* Reads as a flip-clock card turning over rather than a number swap. */
    gsap.fromTo(
      numRef.current,
      { yPercent: -58, opacity: 0, filter: "blur(4px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
      },
    );
  }, [value]);

  return (
    <div className="cnt-cell flex flex-col items-center">
      <div className="count-cell">
        <span ref={numRef} className="count-cell__num">
          {String(value ?? 0).padStart(2, "0")}
        </span>
      </div>
      <p className="count-label">{label}</p>
    </div>
  );
}

export function CountdownSection() {
  /* Starts null so SSR and the first client render agree — the real
     figures land on mount, before the section is ever scrolled into view. */
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setT(diff());
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(".rv", { opacity: 1, y: 0, filter: "none" });
        gsap.set(".cnt-cell", { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.fromTo(".rv", REVEAL.from, {
        ...REVEAL.to,
        stagger: REVEAL.stagger,
        scrollTrigger: { trigger: rootRef.current, start: REVEAL.start },
      });

      gsap.fromTo(
        ".cnt-cell",
        { opacity: 0, y: 26, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.07,
          delay: 0.3,
          scrollTrigger: { trigger: rootRef.current, start: "top 74%" },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="countdown"
      aria-label="Countdown to the wedding"
      className="pat-mint seam-top section-pad"
    >
      <div className="mx-auto max-w-2xl">
        <div className="rv text-center">
          <SectionLabel>Mark Your Calendar</SectionLabel>
        </div>
        <div className="rv mt-1 text-center">
          <SectionTitle>Counting the Moments</SectionTitle>
        </div>
        <div className="rv">
          <ArchOrnament />
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <Cell value={t?.d ?? null} label="Days" />
          <Cell value={t?.h ?? null} label="Hours" />
          <Cell value={t?.m ?? null} label="Minutes" />
          <Cell value={t?.s ?? null} label="Seconds" />
        </div>

        <div className="rv">
          <GoldDivider />
        </div>
        <p className="rv text-center font-display text-sm text-gold-deep sm:text-base">
          {wedding.weddingDateLabel} &nbsp;·&nbsp; {wedding.weddingTimeLabel}
        </p>
      </div>
    </section>
  );
}
