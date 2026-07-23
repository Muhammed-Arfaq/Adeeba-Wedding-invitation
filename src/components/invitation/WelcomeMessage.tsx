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
      className="panel pat-light paper-grain section-pad"
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
        <div className="rv card relative px-6 py-9 sm:px-10 sm:py-12">
          <span className="details-corner details-corner--tl" aria-hidden />
          <span className="details-corner details-corner--tr" aria-hidden />
          <span className="details-corner details-corner--bl" aria-hidden />
          <span className="details-corner details-corner--br" aria-hidden />

          <p className="t-fg3 text-xs tracking-[0.16em] uppercase sm:text-sm sm:tracking-[0.2em]">
            {wedding.announcement.lead}
          </p>
          <p className="mt-2.5 font-display text-2xl font-semibold leading-tight sm:mt-3 sm:text-4xl">
            <span className="shimmer">{wedding.bride.name}</span>
          </p>

          <div className="my-5 flex items-center justify-center gap-3 sm:my-6" aria-hidden>
            <span className="h-px w-8 bg-[linear-gradient(to_right,transparent,var(--rule))] sm:w-12" />
            <span className="t-fg3 text-[0.65rem] tracking-[0.22em] uppercase sm:text-xs sm:tracking-[0.3em]">
              {wedding.announcement.trailing}
            </span>
            <span className="h-px w-8 bg-[linear-gradient(to_left,transparent,var(--rule))] sm:w-12" />
          </div>

          <p className="font-display text-2xl font-semibold leading-tight sm:text-4xl">
            <span className="shimmer">{wedding.groom.name}</span>
          </p>
        </div>

        {/* Quranic verse */}
        <div className="rv mt-8 sm:mt-10">
          <p className="t-fg font-arabic text-lg leading-loose sm:text-2xl">
            {wedding.quran.welcome.arabic}
          </p>
        </div>

        <div className="rv">
          <GoldDivider />
        </div>

        <blockquote className="rv">
          <p className="t-fg2 font-display text-base italic leading-relaxed sm:text-xl">
            &ldquo;{wedding.quran.welcome.verse}&rdquo;
          </p>
          <footer className="t-accent mt-3 text-[0.6rem] tracking-[0.26em] uppercase sm:mt-4 sm:text-[0.68rem] sm:tracking-[0.38em]">
            — {wedding.quran.welcome.reference}
          </footer>
        </blockquote>

        <div className="rv">
          <GoldDivider />
        </div>

        <p className="rv t-fg2 text-sm leading-relaxed sm:text-lg">{wedding.invitation}</p>
      </div>
    </section>
  );
}
