import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL } from "@/lib/gsap";
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
      if (prefersReducedMotion()) {
        gsap.set(".rv", { opacity: 1, y: 0, filter: "none" });
        return;
      }

      gsap.fromTo(".rv", REVEAL.from, {
        ...REVEAL.to,
        stagger: REVEAL.stagger,
        scrollTrigger: { trigger: rootRef.current, start: REVEAL.start },
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="welcome"
      aria-label="Announcement"
      className="pat-light seam-top section-pad"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="rv">
          <SectionLabel>{wedding.greeting}</SectionLabel>
        </div>
        <div className="rv mt-1">
          <SectionTitle>A Warm Welcome</SectionTitle>
        </div>

        <div className="rv">
          <ArchOrnament />
        </div>

        {/* The announcement, as it reads on the printed card */}
        <div className="rv card-light relative px-6 py-9 sm:px-10 sm:py-12">
          <span className="details-corner details-corner--tl" aria-hidden />
          <span className="details-corner details-corner--tr" aria-hidden />
          <span className="details-corner details-corner--bl" aria-hidden />
          <span className="details-corner details-corner--br" aria-hidden />

          <p className="text-xs tracking-[0.16em] uppercase text-forest/70 sm:text-sm sm:tracking-[0.2em]">
            {wedding.announcement.lead}
          </p>
          <p className="mt-2.5 font-display text-2xl font-semibold leading-tight sm:mt-3 sm:text-4xl">
            <span className="shimmer">{wedding.bride.name}</span>
          </p>

          <div className="my-5 flex items-center justify-center gap-3 sm:my-6" aria-hidden>
            <span className="h-px w-8 bg-linear-to-r from-transparent to-[rgba(201,169,97,0.75)] sm:w-12" />
            <span className="text-[0.65rem] tracking-[0.22em] uppercase text-forest/50 sm:text-xs sm:tracking-[0.3em]">
              {wedding.announcement.trailing}
            </span>
            <span className="h-px w-8 bg-linear-to-l from-transparent to-[rgba(201,169,97,0.75)] sm:w-12" />
          </div>

          <p className="font-display text-2xl font-semibold leading-tight sm:text-4xl">
            <span className="shimmer">{wedding.groom.name}</span>
          </p>
        </div>

        {/* Quranic verse */}
        <div className="rv mt-8 sm:mt-10">
          <p className="font-arabic text-lg leading-loose text-forest sm:text-2xl">
            {wedding.quran.welcome.arabic}
          </p>
        </div>

        <div className="rv">
          <GoldDivider />
        </div>

        <blockquote className="rv">
          <p className="font-display text-base italic leading-relaxed text-forest/90 sm:text-xl">
            &ldquo;{wedding.quran.welcome.verse}&rdquo;
          </p>
          <footer className="mt-3 text-[0.6rem] tracking-[0.26em] uppercase text-gold-deep sm:mt-4 sm:text-[0.68rem] sm:tracking-[0.38em]">
            — {wedding.quran.welcome.reference}
          </footer>
        </blockquote>

        <div className="rv">
          <GoldDivider />
        </div>

        <p className="rv text-sm leading-relaxed text-forest/80 sm:text-lg">{wedding.invitation}</p>
      </div>
    </section>
  );
}
