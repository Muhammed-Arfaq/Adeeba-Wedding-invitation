import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { GoldDivider, ArchOrnament } from "@/components/shared/GoldDivider";
import { Particles } from "@/components/shared/Particles";

export function FinalBlessing() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".fb-rev", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".fb-rev",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.16,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 72%" },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="finale"
      aria-label="Closing blessing"
      className="pat-dark seam-top relative overflow-hidden px-6 py-24 text-center sm:py-32"
    >
      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 80%, rgba(201,168,76,0.12) 0%, transparent 60%)",
        }}
      />

      <Particles />

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="fb-rev">
          <ArchOrnament light />
        </div>

        <p className="fb-rev font-arabic text-2xl leading-relaxed text-gold-soft sm:text-3xl">
          {wedding.blessing.arabic}
        </p>
        <p className="fb-rev mx-auto mt-4 max-w-md text-sm italic leading-relaxed text-cream/70">
          {wedding.blessing.translation}
        </p>

        <div className="fb-rev">
          <GoldDivider />
        </div>

        <p className="fb-rev font-display text-xl text-cream/90 sm:text-2xl">{wedding.thankYou}</p>
        <p className="fb-rev mx-auto mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
          {wedding.closingNote}
        </p>

        <div className="fb-rev">
          <GoldDivider />
        </div>

        {/* The couple */}
        <p className="fb-rev text-[0.62rem] uppercase tracking-[0.4em] text-gold">
          With love &amp; duas
        </p>
        <p className="fb-rev mt-4 font-display text-2xl font-semibold text-cream sm:text-3xl">
          {wedding.bride.shortName}
        </p>
        <p className="fb-rev my-2 font-arabic text-xl text-gold" aria-hidden>
          &amp;
        </p>
        <p className="fb-rev font-display text-2xl font-semibold text-cream sm:text-3xl">
          {wedding.groom.shortName}
        </p>

        {/* Hosts — as signed at the foot of the card */}
        <div className="fb-rev signature mt-12 text-center">
          <p className="font-display text-base italic text-gold-soft">{wedding.hosts.salutation}</p>
          <p className="mt-3 font-display text-lg font-semibold text-cream sm:text-xl">
            {wedding.hosts.names}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            {wedding.hosts.house}
            <br />
            {wedding.hosts.location}
          </p>
          <a
            href={`tel:${wedding.hosts.phone.replace(/\s/g, "")}`}
            className="mt-3 inline-block text-sm font-medium text-gold-soft transition-colors hover:text-gold"
          >
            {wedding.hosts.phone}
          </a>
        </div>

        {/* Well-wishers */}
        <div className="fb-rev mt-10">
          <p className="text-[0.62rem] uppercase tracking-[0.4em] text-gold">
            {wedding.wellWishers.label}
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
            {wedding.wellWishers.names.map((name) => (
              <li key={name} className="wisher">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
