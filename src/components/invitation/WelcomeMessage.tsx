import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import {
  GoldDivider,
  SectionLabel,
  SectionTitle,
  ArchOrnament,
} from "@/components/shared/GoldDivider";

export function WelcomeMessage() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".wm-rev", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".wm-rev",
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.18,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 78%",
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="welcome"
      aria-label="Announcement"
      className="pat-light seam-top px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="wm-rev">
          <SectionLabel>{wedding.greeting}</SectionLabel>
        </div>
        <div className="wm-rev mt-1">
          <SectionTitle>A Warm Welcome</SectionTitle>
        </div>

        <div className="wm-rev">
          <ArchOrnament />
        </div>

        {/* The announcement, as it reads on the printed card */}
        <div className="wm-rev card-light px-7 py-9 sm:px-10 sm:py-11">
          <p className="text-sm tracking-[0.2em] uppercase text-forest/55">
            {wedding.announcement.lead}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            <span className="shimmer">{wedding.bride.name}</span>
          </p>

          <div className="my-6 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-12 bg-linear-to-r from-transparent to-[rgba(201,168,76,0.7)]" />
            <span className="text-xs tracking-[0.3em] uppercase text-forest/50">
              {wedding.announcement.trailing}
            </span>
            <span className="h-px w-12 bg-linear-to-l from-transparent to-[rgba(201,168,76,0.7)]" />
          </div>

          <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            <span className="shimmer">{wedding.groom.name}</span>
          </p>
        </div>

        {/* Quranic verse */}
        <div className="wm-rev mt-10">
          <p className="font-arabic text-xl leading-loose text-forest sm:text-2xl">
            {wedding.quran.welcome.arabic}
          </p>
        </div>

        <div className="wm-rev">
          <GoldDivider />
        </div>

        <blockquote className="wm-rev">
          <p className="font-display text-lg italic leading-relaxed text-forest/90 sm:text-xl">
            &ldquo;{wedding.quran.welcome.verse}&rdquo;
          </p>
          <footer className="mt-4 text-[0.68rem] tracking-[0.38em] uppercase text-gold">
            — {wedding.quran.welcome.reference}
          </footer>
        </blockquote>

        <div className="wm-rev">
          <GoldDivider />
        </div>

        <p className="wm-rev text-base leading-relaxed text-forest/80 sm:text-lg">
          {wedding.invitation}
        </p>
      </div>
    </section>
  );
}
