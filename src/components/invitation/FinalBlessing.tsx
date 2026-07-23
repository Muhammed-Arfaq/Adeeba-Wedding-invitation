import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { GoldDivider, ArchOrnament } from "@/components/shared/GoldDivider";
import { Particles } from "@/components/shared/Particles";
import { FaWhatsapp } from "react-icons/fa6";

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
      className="panel panel--dark pat-dark paper-grain section-pad relative overflow-hidden text-center"
    >
      {/* Ambient gold glow rising from the foot of the page */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 88%, rgba(201,164,76,0.2) 0%, transparent 62%)",
        }}
      />

      <Particles />

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rv">
          <ArchOrnament />
        </div>

        <p className="rv t-accent font-arabic text-xl leading-relaxed sm:text-3xl">
          {wedding.blessing.arabic}
        </p>
        <p className="rv t-fg2 mx-auto mt-3 max-w-md text-[0.82rem] italic leading-relaxed sm:mt-4 sm:text-sm">
          {wedding.blessing.translation}
        </p>

        <div className="rv">
          <GoldDivider />
        </div>

        <p className="rv t-fg font-display text-lg sm:text-2xl">{wedding.thankYou}</p>
        <p className="rv t-fg2 mx-auto mt-3 max-w-sm text-[0.82rem] leading-relaxed sm:mt-4 sm:text-sm">
          {wedding.closingNote}
        </p>

        <div className="rv">
          <GoldDivider />
        </div>

        {/* The couple */}
        <p className="rv t-accent text-[0.56rem] uppercase tracking-[0.3em] sm:text-[0.62rem] sm:tracking-[0.4em]">
          With love &amp; duas
        </p>
        <p className="rv t-fg mt-3 font-display text-xl font-semibold sm:mt-4 sm:text-3xl">
          {wedding.groom.shortName}
        </p>
        <p className="rv t-accent my-1.5 font-arabic text-lg sm:my-2 sm:text-xl" aria-hidden>
          &amp;
        </p>
        <p className="rv t-fg font-display text-xl font-semibold sm:text-3xl">
          {wedding.bride.shortName}
        </p>

        {/* Quiet credit — an invitation to commission one */}
        <div className="rv mt-14 sm:mt-16">
          <GoldDivider />
          <p className="t-accent text-[0.56rem] uppercase tracking-[0.3em] sm:text-[0.6rem] sm:tracking-[0.4em]">
            {wedding.credit.label}
          </p>
          <p className="t-fg2 mx-auto mt-3 max-w-xs text-[0.82rem] leading-relaxed sm:max-w-sm sm:text-sm">
            {wedding.credit.message}
          </p>
          <a
            href={wedding.credit.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-gold mt-5"
          >
            <FaWhatsapp size={16} aria-hidden />
            {wedding.credit.cta}
          </a>
          <a
            href={`tel:${wedding.credit.phone.replace(/\s/g, "")}`}
            className="t-fg3 mt-3 block text-[0.82rem] transition-colors hover:text-[color:var(--accent)] sm:text-sm"
          >
            {wedding.credit.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
