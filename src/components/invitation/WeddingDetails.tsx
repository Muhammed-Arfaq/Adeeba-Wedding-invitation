import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, prefersReducedMotion, REVEAL, revealBlur } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { googleCalendarUrl } from "@/lib/calendar";
import {
  ArchOrnament,
  GoldDivider,
  SectionLabel,
  SectionTitle,
} from "@/components/shared/GoldDivider";
import { Particles } from "@/components/shared/Particles";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
} from "react-icons/hi2";

type Person = typeof wedding.bride | typeof wedding.groom;

function Row({ label, children }: { label: string; children: ReactNode }) {
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

function DetailCell({
  icon,
  label,
  value,
  featured = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div className={`dt-cell detail-cell ${featured ? "detail-cell--featured" : ""}`}>
      <div className="detail-cell__icon" aria-hidden>
        {icon}
      </div>
      <div className="detail-cell__body">
        <p className="detail-cell__label">{label}</p>
        <p className="detail-cell__value">{value}</p>
      </div>
    </div>
  );
}

/**
 * The families, the ceremony details and the venue, in one panel.
 *
 * This band is two to three screens tall, so it carries *two* reveal triggers
 * rather than one: `.fam-rv` fires off the panel top, `.det-rv` off the details
 * block's own top. With a single trigger everything below the fold would play
 * its entrance while off screen and be sitting there, already revealed, by the
 * time it was scrolled to. Both classes also carry `.rv` so the pre-hide in
 * styles.css still applies — see the note there about `html.motion-ready`.
 */
export function WeddingDetails() {
  const rootRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(".rv, .rv-l, .rv-r", { opacity: 1, x: 0, y: 0, filter: "none" });
        gsap.set(".dt-cell", { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.fromTo(".fam-rv", REVEAL.from, {
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

      gsap.fromTo(".det-rv", REVEAL.from, {
        ...REVEAL.to,
        stagger: REVEAL.stagger,
        scrollTrigger: { trigger: detailsRef.current, start: REVEAL.start },
      });

      /* The cells stagger in after the details block itself has landed. */
      gsap.fromTo(
        ".dt-cell",
        { opacity: 0, y: 22, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.35,
          scrollTrigger: { trigger: detailsRef.current, start: "top 70%" },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="details"
      aria-label="The families, the ceremony and the venue"
      className="panel pat-sage paper-grain section-pad"
    >
      <Particles />

      {/* `relative` is load-bearing: `.particles` is absolutely positioned, so
          static content would paint underneath it. */}
      <div className="relative mx-auto max-w-4xl">
        <div className="rv fam-rv text-center">
          <SectionLabel>Our Families</SectionLabel>
        </div>
        <div className="rv fam-rv mt-1 text-center">
          <SectionTitle>Bride &amp; Groom</SectionTitle>
        </div>
        <div className="rv fam-rv">
          <ArchOrnament />
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
          <PersonCard person={wedding.bride} dir="left" />
          <PersonCard person={wedding.groom} dir="right" />
        </div>

        {/* Joins the two households on wide screens */}
        <div className="rv fam-rv family-link" aria-hidden>
          <span className="family-link__line" />
          <span className="orn-star">✦</span>
          <span className="family-link__line" />
        </div>

        {/* ── The ceremony, and where it is ── */}
        <div ref={detailsRef} className="mt-16 sm:mt-20">
          <div className="rv det-rv text-center">
            <SectionLabel>The Celebration</SectionLabel>
          </div>
          <div className="rv det-rv mt-1 text-center">
            <SectionTitle>{wedding.ceremonyName} Details</SectionTitle>
          </div>
          <div className="rv det-rv">
            <ArchOrnament />
          </div>

          <div className="rv det-rv details-panel">
            {/* Corner ornaments */}
            <span className="details-corner details-corner--tl" aria-hidden />
            <span className="details-corner details-corner--tr" aria-hidden />
            <span className="details-corner details-corner--bl" aria-hidden />
            <span className="details-corner details-corner--br" aria-hidden />

            {/* Date & time — featured row */}
            <div className="details-grid">
              <DetailCell
                featured
                icon={<HiOutlineCalendarDays size={22} />}
                label="Date"
                value={wedding.weddingDateLabel}
              />
              <DetailCell
                featured
                icon={<HiOutlineClock size={22} />}
                label={wedding.ceremonyName}
                value={wedding.weddingTimeLabel}
              />
            </div>

            <div className="details-inner-divider" aria-hidden />

            {/* Venue & location */}
            <div className="details-grid">
              <DetailCell
                icon={<HiOutlineBuildingOffice2 size={20} />}
                label="Venue"
                value={wedding.venue.name}
              />
              <DetailCell
                icon={<HiOutlineMapPin size={20} />}
                label="Landmark"
                value={wedding.venue.landmark}
              />
            </div>

            {/* The map, folded in from what used to be its own panel */}
            <div className="venue-map mt-7 aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={wedding.venue.mapEmbed}
                title={`Map of ${wedding.venue.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>

            <p className="t-fg2 mx-auto mt-4 max-w-sm text-center text-[0.82rem] leading-relaxed sm:text-sm">
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
                href={googleCalendarUrl()}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost"
              >
                Add to Calendar
              </a>
            </div>
          </div>

          <div className="rv det-rv">
            <GoldDivider />
          </div>

          <div className="rv det-rv text-center">
            <p className="t-fg font-arabic text-base leading-loose sm:text-xl">
              {wedding.quran.details.arabic}
            </p>
            <p className="t-fg2 mt-3 font-display text-[0.82rem] italic sm:text-base">
              &ldquo;{wedding.quran.details.verse}&rdquo;
            </p>
            <p className="t-accent mt-2 text-[0.58rem] tracking-[0.24em] uppercase sm:text-[0.65rem] sm:tracking-[0.32em]">
              — {wedding.quran.details.reference}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
