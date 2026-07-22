import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      numRef.current,
      { yPercent: -55, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
    );
  }, [value]);

  return (
    <div className="flex flex-col items-center">
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
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".cd-rev", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".cd-rev",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.14,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 76%" },
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
      className="pat-dark seam-top px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-2xl">
        <div className="cd-rev text-center">
          <SectionLabel>Mark Your Calendar</SectionLabel>
        </div>
        <div className="cd-rev mt-1 text-center">
          <SectionTitle light>Counting the Moments</SectionTitle>
        </div>
        <div className="cd-rev">
          <ArchOrnament light />
        </div>

        <div className="cd-rev grid grid-cols-4 gap-3 sm:gap-4">
          <Cell value={t?.d ?? null} label="Days" />
          <Cell value={t?.h ?? null} label="Hours" />
          <Cell value={t?.m ?? null} label="Minutes" />
          <Cell value={t?.s ?? null} label="Seconds" />
        </div>

        <div className="cd-rev">
          <GoldDivider />
        </div>
        <p className="cd-rev text-center font-display text-base text-gold-soft">
          {wedding.weddingDateLabel} &nbsp;·&nbsp; {wedding.weddingTimeLabel}
        </p>
      </div>
    </section>
  );
}
