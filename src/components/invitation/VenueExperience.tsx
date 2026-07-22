import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { GoldDivider, SectionLabel, SectionTitle } from "@/components/shared/GoldDivider";

export function VenueExperience() {
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
      id="venue"
      aria-label="Venue and directions"
      className="pat-light seam-top section-pad"
    >
      <div className="mx-auto max-w-3xl">
        <div className="rv text-center">
          <SectionLabel>Join Us At</SectionLabel>
        </div>
        <div className="rv mt-1 text-center">
          <SectionTitle>The Venue</SectionTitle>
        </div>
        <div className="rv">
          <GoldDivider />
        </div>

        <div className="rv card-light overflow-hidden">
          <div className="venue-map aspect-video w-full">
            <iframe
              src={wedding.venue.mapEmbed}
              title={`Map of ${wedding.venue.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>

          <div className="relative px-5 py-7 text-center sm:px-10 sm:py-9">
            <h3 className="font-display text-xl font-semibold text-forest sm:text-3xl">
              {wedding.venue.name}
            </h3>
            <p className="mt-2 text-[0.82rem] text-gold-deep sm:text-sm">
              {wedding.venue.landmark}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[0.82rem] leading-relaxed text-forest/80 sm:text-sm">
              {wedding.venue.address}
            </p>

            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
