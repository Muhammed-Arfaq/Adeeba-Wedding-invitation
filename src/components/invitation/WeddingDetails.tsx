import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { googleCalendarUrl } from "@/lib/calendar";
import { ArchOrnament, SectionLabel, SectionTitle } from "@/components/shared/GoldDivider";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
} from "react-icons/hi2";

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
    <div className={`detail-cell ${featured ? "detail-cell--featured" : ""}`}>
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

export function WeddingDetails() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".wd-rev", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".wd-rev",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.14,
          duration: 0.85,
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
      id="details"
      aria-label="Wedding details"
      className="pat-light seam-top px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="wd-rev text-center">
          <SectionLabel>The Celebration</SectionLabel>
        </div>
        <div className="wd-rev mt-1 text-center">
          <SectionTitle>{wedding.ceremonyName} Details</SectionTitle>
        </div>
        <div className="wd-rev">
          <ArchOrnament />
        </div>

        <div className="wd-rev details-panel">
          {/* Corner ornaments */}
          <span className="details-corner details-corner--tl" aria-hidden />
          <span className="details-corner details-corner--tr" aria-hidden />
          <span className="details-corner details-corner--bl" aria-hidden />
          <span className="details-corner details-corner--br" aria-hidden />

          {/* Couple showcase */}
          <div className="details-couple">
            <div className="details-couple__person">
              <p className="details-couple__role">{wedding.bride.role}</p>
              <p className="details-couple__name">{wedding.bride.name}</p>
            </div>

            <div className="details-couple__divider" aria-hidden>
              <span className="details-couple__line" />
              <span className="details-couple__star">✦</span>
              <span className="details-couple__line" />
            </div>

            <div className="details-couple__person">
              <p className="details-couple__role">{wedding.groom.role}</p>
              <p className="details-couple__name">{wedding.groom.name}</p>
            </div>
          </div>

          <div className="details-inner-divider" aria-hidden />

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

          <div className="mt-8 flex justify-center">
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

        <div className="wd-rev mt-10 text-center">
          <p className="font-arabic text-lg leading-loose text-forest sm:text-xl">
            {wedding.quran.details.arabic}
          </p>
          <p className="mt-3 font-display text-sm italic text-forest/75 sm:text-base">
            &ldquo;{wedding.quran.details.verse}&rdquo;
          </p>
          <p className="mt-2 text-[0.65rem] tracking-[0.32em] uppercase text-gold">
            — {wedding.quran.details.reference}
          </p>
        </div>
      </div>
    </section>
  );
}
