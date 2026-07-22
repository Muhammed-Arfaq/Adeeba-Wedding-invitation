import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { GoldDivider, SectionLabel, SectionTitle } from "@/components/shared/GoldDivider";

export function VenueExperience() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".ve-rev", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".ve-rev",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.16,
          duration: 0.9,
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
      id="venue"
      aria-label="Venue and directions"
      className="pat-light seam-top px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="ve-rev text-center">
          <SectionLabel>Join Us At</SectionLabel>
        </div>
        <div className="ve-rev mt-1 text-center">
          <SectionTitle>The Venue</SectionTitle>
        </div>
        <div className="ve-rev">
          <GoldDivider />
        </div>

        <div className="ve-rev card-light overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              src={wedding.venue.mapEmbed}
              title={`Map of ${wedding.venue.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>

          <div className="relative px-7 py-8 text-center sm:px-10">
            <h3 className="font-display text-2xl font-semibold text-forest sm:text-3xl">
              {wedding.venue.name}
            </h3>
            <p className="mt-2 text-sm text-gold">{wedding.venue.landmark}</p>
            <p className="mt-1 text-sm text-forest/70">{wedding.venue.address}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={wedding.venue.directionsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-gold"
              >
                Get Directions
              </a>
              <a
                href={wedding.venue.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost"
              >
                Open Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
