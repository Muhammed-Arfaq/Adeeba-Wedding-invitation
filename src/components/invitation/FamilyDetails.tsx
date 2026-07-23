import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL, revealBlur } from "@/lib/gsap";
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
    <article className={`h-full ${dir === "left" ? "rv-l" : "rv-r"}`}>
      <div className="card person-card flex flex-col text-center">
        <div className="person-card__crest" aria-hidden>
          {person.shortName.charAt(0)}
        </div>

        <p className="t-accent mt-3.5 text-[0.56rem] tracking-[0.3em] uppercase sm:mt-4 sm:text-[0.62rem] sm:tracking-[0.38em]">
          {person.role}
        </p>
        <h3 className="t-fg mt-1.5 font-display text-xl font-semibold sm:mt-2 sm:text-3xl">
          {person.name}
        </h3>

        <div className="mt-6 text-left sm:mt-7">
          <Row label={isBride ? "Daughter of" : "Son of"}>
            <p className="t-fg font-display text-sm sm:text-base">{person.parents.father}</p>
            <p className="t-fg font-display text-sm sm:text-base">&amp; {person.parents.mother}</p>
          </Row>

          <Row label="Residence">
            <p className="t-fg2 text-[0.82rem] leading-relaxed sm:text-sm">
              {person.residence.house}
              <br />
              {person.residence.location}
            </p>
          </Row>

          <Row label={isBride ? "Granddaughter of" : "Grandson of"}>
            {person.grandparents.map((pair) => (
              <p key={pair.first} className="t-fg2 text-[0.82rem] leading-relaxed sm:text-sm">
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
      if (prefersReducedMotion()) {
        gsap.set(".rv, .rv-l, .rv-r", { opacity: 1, x: 0, y: 0, filter: "none" });
        return;
      }

      gsap.fromTo(".rv", REVEAL.from, {
        ...REVEAL.to,
        stagger: REVEAL.stagger,
        scrollTrigger: { trigger: rootRef.current, start: REVEAL.start },
      });

      /* The bride's card enters from the left, the groom's from the right —
         they meet in the middle, which is the whole point of the section. */
      gsap.fromTo(
        ".rv-l, .rv-r",
        {
          opacity: 0,
          x: (i: number) => (i === 0 ? -56 : 56),
          ...revealBlur(8),
        },
        {
          opacity: 1,
          x: 0,
          ...revealBlur(0),
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: rootRef.current, start: "top 76%" },
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
      className="panel panel--dark pat-dark paper-grain section-pad"
    >
      <div className="mx-auto max-w-4xl">
        <div className="rv text-center">
          <SectionLabel>Our Families</SectionLabel>
        </div>
        <div className="rv mt-1 text-center">
          <SectionTitle>Bride &amp; Groom</SectionTitle>
        </div>
        <div className="rv">
          <ArchOrnament />
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
          <PersonCard person={wedding.bride} dir="left" />
          <PersonCard person={wedding.groom} dir="right" />
        </div>

        {/* Joins the two households on wide screens */}
        <div className="rv family-link" aria-hidden>
          <span className="family-link__line" />
          <span className="orn-star">✦</span>
          <span className="family-link__line" />
        </div>
      </div>
    </section>
  );
}
