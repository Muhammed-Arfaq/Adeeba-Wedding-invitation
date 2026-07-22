import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { GoldDivider, ArchOrnament } from "@/components/shared/GoldDivider";
import { Particles } from "@/components/shared/Particles";

export function FinalBlessing() {
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
        scrollTrigger: { trigger: rootRef.current, start: "top 78%" },
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="finale"
      aria-label="Closing blessing"
      className="pat-mint seam-top section-pad relative overflow-hidden text-center"
    >
      {/* Ambient gold glow rising from the foot of the page */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 88%, rgba(201,169,97,0.22) 0%, transparent 62%)",
        }}
      />

      <Particles />

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rv">
          <ArchOrnament />
        </div>

        <p className="rv font-arabic text-xl leading-relaxed text-gold-deep sm:text-3xl">
          {wedding.blessing.arabic}
        </p>
        <p className="rv mx-auto mt-3 max-w-md text-[0.82rem] italic leading-relaxed text-forest/80 sm:mt-4 sm:text-sm">
          {wedding.blessing.translation}
        </p>

        <div className="rv">
          <GoldDivider />
        </div>

        <p className="rv font-display text-lg text-forest/90 sm:text-2xl">{wedding.thankYou}</p>
        <p className="rv mx-auto mt-3 max-w-sm text-[0.82rem] leading-relaxed text-forest/80 sm:mt-4 sm:text-sm">
          {wedding.closingNote}
        </p>

        <div className="rv">
          <GoldDivider />
        </div>

        {/* The couple */}
        <p className="rv text-[0.56rem] uppercase tracking-[0.3em] text-gold-deep sm:text-[0.62rem] sm:tracking-[0.4em]">
          With love &amp; duas
        </p>
        <p className="rv mt-3 font-display text-xl font-semibold text-forest sm:mt-4 sm:text-3xl">
          {wedding.bride.shortName}
        </p>
        <p className="rv my-1.5 font-arabic text-lg text-gold-deep sm:my-2 sm:text-xl" aria-hidden>
          &amp;
        </p>
        <p className="rv font-display text-xl font-semibold text-forest sm:text-3xl">
          {wedding.groom.shortName}
        </p>

        {/* Hosts — as signed at the foot of the card */}
        <div className="rv signature mt-10 text-center sm:mt-12">
          <p className="font-display text-sm italic text-gold-deep sm:text-base">
            {wedding.hosts.salutation}
          </p>
          <p className="mt-2.5 font-display text-base font-semibold text-forest sm:mt-3 sm:text-xl">
            {wedding.hosts.names}
          </p>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-forest/80 sm:text-sm">
            {wedding.hosts.house}
            <br />
            {wedding.hosts.location}
          </p>
          <a
            href={`tel:${wedding.hosts.phone.replace(/\s/g, "")}`}
            className="mt-3 inline-flex min-h-11 items-center text-[0.82rem] font-medium text-gold-deep underline-offset-4 transition-colors hover:text-forest hover:underline sm:mt-4 sm:text-sm"
          >
            {wedding.hosts.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
