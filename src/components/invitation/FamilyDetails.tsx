import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { SectionLabel, SectionTitle, ArchOrnament } from "@/components/shared/GoldDivider";

type Person = typeof wedding.bride | typeof wedding.groom;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="person-row">
      <p className="person-row__label">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function PersonCard({ person, dir }: { person: Person; dir: "left" | "right" }) {
  const isBride = person.role === "Bride";

  return (
    <article className={`fd-card-${dir}`}>
      <div className="card-dark person-card text-center">
        <div className="person-card__crest" aria-hidden>
          {person.shortName.charAt(0)}
        </div>

        <p className="mt-4 text-[0.62rem] tracking-[0.38em] uppercase text-gold">{person.role}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-cream sm:text-3xl">
          {person.name}
        </h3>

        <div className="mt-7 text-left">
          <Row label={isBride ? "Daughter of" : "Son of"}>
            <p className="font-display text-base text-cream/90">{person.parents.father}</p>
            <p className="font-display text-base text-cream/90">&amp; {person.parents.mother}</p>
          </Row>

          <Row label="Residence">
            <p className="text-sm leading-relaxed text-cream/80">
              {person.residence.house}
              <br />
              {person.residence.location}
            </p>
          </Row>

          <Row label={isBride ? "Granddaughter of" : "Grandson of"}>
            {person.grandparents.map((pair) => (
              <p key={pair.first} className="text-sm leading-relaxed text-cream/80">
                {pair.first} &amp; {pair.second}
              </p>
            ))}
          </Row>
        </div>
      </div>
    </article>
  );
}

export function FamilyDetails() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const reset = (sel: string) => gsap.set(sel, { opacity: 1, x: 0, y: 0 });
      if (reduced) {
        reset(".fd-head");
        reset(".fd-card-left");
        reset(".fd-card-right");
        return;
      }

      gsap.fromTo(
        ".fd-head",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 78%" },
        },
      );

      /* bride's card enters from the left, groom's from the right */
      gsap.fromTo(
        ".fd-card-left",
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 72%" },
        },
      );

      gsap.fromTo(
        ".fd-card-right",
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 72%" },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="families"
      aria-label="The families"
      className="pat-dark seam-top px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-4xl">
        <div className="fd-head text-center">
          <SectionLabel>Our Families</SectionLabel>
        </div>
        <div className="fd-head mt-1 text-center">
          <SectionTitle light>Bride &amp; Groom</SectionTitle>
        </div>
        <div className="fd-head">
          <ArchOrnament light />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PersonCard person={wedding.bride} dir="left" />
          <PersonCard person={wedding.groom} dir="right" />
        </div>
      </div>
    </section>
  );
}
