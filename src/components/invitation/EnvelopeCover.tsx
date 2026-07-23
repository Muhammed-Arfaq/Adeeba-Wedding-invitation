import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { useMusic } from "@/context/MusicContext";
import { scrollToSection, setScrollLocked } from "@/components/shared/SmoothScroll";
import { Particles } from "@/components/shared/Particles";
import { GoldDivider } from "@/components/shared/GoldDivider";
import { Emblem786 } from "@/components/shared/Emblem";

/** Interlocking rings, pressed into the wax. */
function SealMark() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden>
      {/* The light pass sits 1.3px lower than the dark pass, so the rings
          read as debossed into the wax rather than drawn on top of it. */}
      <g className="env-seal__ring env-seal__ring--hi">
        <circle cx="50" cy="50" r="33" />
        <circle cx="41" cy="52" r="15" />
        <circle cx="59" cy="52" r="15" />
      </g>
      <g className="env-seal__ring">
        <circle cx="50" cy="50" r="33" />
        <circle cx="41" cy="52" r="15" />
        <circle cx="59" cy="52" r="15" />
      </g>
    </svg>
  );
}

export function EnvelopeCover() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  /* Photographic envelope — phones only, see the media query in styles.css */
  const photoRef = useRef<HTMLDivElement>(null);
  const photoFlapRef = useRef<HTMLImageElement>(null);
  const photoPocketRef = useRef<HTMLDivElement>(null);
  const photoSealRef = useRef<HTMLButtonElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const { startMusic } = useMusic();

  /* Hold the page on the sealed envelope until it is opened — nothing below
     is reachable until the wax breaks. */
  useEffect(() => {
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, []);

  useGSAP(
    () => {
      gsap.set([cardRef.current, cueRef.current], { opacity: 0 });
      if (prefersReducedMotion()) return;

      /* The seal breathes until it is pressed. */
      gsap.to(sealRef.current, {
        scale: 1.04,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "center center",
      });

      /* Both envelopes drift a degree or two, as though resting on a table.
         Whichever is display:none simply isn't painted. */
      gsap.to([stageRef.current, photoRef.current], {
        rotateZ: 0.6,
        rotateX: 1.4,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: rootRef },
  );

  function openEnvelope() {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpened(true);
    startMusic();
    setScrollLocked(false); // the page is now free to scroll

    if (prefersReducedMotion()) {
      gsap.set([stageRef.current, photoRef.current], { display: "none" });
      gsap.set([cardRef.current, cueRef.current], { opacity: 1 });
      gsap.set(".hero-line", { opacity: 1, y: 0 });
      return;
    }

    /* Which envelope is on screen is a CSS decision; mirror it here so the
       timeline drives the one the user can actually see. */
    const usePhoto = window.matchMedia("(max-width: 639px)").matches;

    const tl = gsap.timeline({
      onComplete: () => gsap.set([stageRef.current, photoRef.current], { display: "none" }),
    });

    if (usePhoto) {
      /* 1 — the wax gives */
      tl.to(photoSealRef.current, { scale: 0.93, duration: 0.14, ease: "power2.in" })
        .to(".env-hint", { opacity: 0, duration: 0.2 }, 0)
        .to(photoSealRef.current, { opacity: 0, duration: 0.3 }, 0.14);

      /* 2 — the flap swings back on its right-hand fold, the seal riding
             with it. Past halfway it drops behind the pocket. */
      tl.to(
        photoFlapRef.current,
        {
          rotateY: -164,
          duration: 1.25,
          ease: "power2.inOut",
          onUpdate: function () {
            gsap.set(photoFlapRef.current, { zIndex: this.progress() > 0.5 ? 0 : 3 });
          },
        },
        0.28,
      );

      /* 3 — the card inside eases forward now that it is uncovered */
      tl.fromTo(
        photoPocketRef.current,
        { opacity: 0, xPercent: 0, scale: 0.97 },
        { opacity: 1, xPercent: 6, scale: 1.04, duration: 0.9, ease: "power2.out" },
        0.95,
      );

      /* 4 — hand off to the real card */
      tl.to(
        photoRef.current,
        { opacity: 0, scale: 1.14, filter: "blur(10px)", duration: 0.7, ease: "power2.in" },
        1.7,
      );
    } else {
      /* 1 — the wax gives, tips off its seat and falls away */
      tl.to(sealRef.current, { scale: 0.92, duration: 0.12, ease: "power2.in" })
        .to(".env-hint", { opacity: 0, duration: 0.2 }, 0)
        .to(
          sealRef.current,
          {
            rotate: -22,
            y: 46,
            x: -14,
            scale: 0.86,
            opacity: 0,
            duration: 0.55,
            ease: "power2.in",
          },
          0.12,
        );

      /* 2 — the flap hinges back on its fold. Its z-index has to drop as it
             passes vertical, or it keeps painting over the letter. */
      tl.to(
        flapRef.current,
        {
          rotateX: -172,
          duration: 1.15,
          ease: "power2.inOut",
          onUpdate: function () {
            const past = this.progress() > 0.5;
            gsap.set(flapRef.current, { zIndex: past ? 0 : 5 });
          },
        },
        0.35,
      );

      /* 3 — the letter draws up out of the pocket */
      tl.to(
        letterRef.current,
        { yPercent: -62, scale: 1.03, duration: 1, ease: "power2.out" },
        1.05,
      ).to(letterRef.current, { zIndex: 8, duration: 0 }, 1.05);

      /* 4 — hand off from the paper letter to the real card. Blur across the
             swap so it reads as one object resolving, not two crossfading. */
      tl.to(
        stageRef.current,
        { opacity: 0, scale: 1.12, filter: "blur(10px)", duration: 0.7, ease: "power2.in" },
        1.85,
      );
    }

    tl.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.94, filter: "blur(12px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "power2.out" },
      2.0,
    );

    tl.fromTo(
      ".hero-line",
      { opacity: 0, y: 26, filter: "blur(5px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.09,
        duration: 0.75,
        ease: "power3.out",
      },
      2.2,
    );

    tl.to(cueRef.current, { opacity: 1, duration: 0.5 }, 3.1);
  }

  return (
    <section
      ref={rootRef}
      id="cover"
      aria-label="Invitation cover"
      className={`panel panel--dark env-scene paper-grain${opened ? "" : " env-sealed"}`}
    >
      <div className="env-glow" aria-hidden />
      <Particles />

      {/* ── The envelope, from the supplied artwork (phones) ──
          Two keyed plates: kraft body, then the black flap carrying the wax.
          The flap hinges on its own right edge — x=884 of 941 in the source. */}
      <div ref={photoRef} className="env-photo" aria-hidden={opened}>
        {/* The sized, aspect-locked envelope. The hint below sits outside it so
            the two centre together as one group. */}
        <div className="env-photo__frame">
          {/* WebP is ~92% smaller than the keyed PNG (327KB vs 4.2MB for the
              pair); the PNG stays as a fallback for pre-2020 browsers. */}
          <picture>
            <source srcSet="/images/envelope-body.webp" type="image/webp" />
            <img
              src="/images/envelope-body.png"
              alt=""
              className="env-photo__plate env-photo__body"
              draggable={false}
              fetchPriority="high"
            />
          </picture>

          <div ref={photoPocketRef} className="env-photo__pocket">
            <p className="text-[0.46rem] tracking-[0.28em] uppercase text-[#8a6a2a]">
              {wedding.cover.subtitle}
            </p>
            <p className="font-display text-base font-semibold tracking-wide text-[#26231b]">
              {wedding.bride.shortName}
            </p>
            <p className="font-arabic text-xs text-[#8a6a2a]">&amp;</p>
            <p className="font-display text-base font-semibold tracking-wide text-[#26231b]">
              {wedding.groom.shortName}
            </p>
            <span className="mt-0.5 block h-px w-8 bg-[rgba(120,90,29,0.45)]" />
            <p className="text-[0.44rem] tracking-[0.2em] uppercase text-[#6b5b42]">
              {wedding.weddingDateLabel}
            </p>
          </div>

          <picture>
            <source srcSet="/images/envelope-flap.webp" type="image/webp" />
            <img
              ref={photoFlapRef}
              src="/images/envelope-flap.png"
              alt=""
              className="env-photo__plate env-photo__flap"
              draggable={false}
              fetchPriority="high"
            />
          </picture>

          <button
            ref={photoSealRef}
            type="button"
            onClick={openEnvelope}
            className="env-photo__seal"
            aria-label="Open the invitation"
            disabled={opened}
          >
            {!opened && (
              <>
                <span className="env-photo__halo" aria-hidden />
                <span className="env-photo__halo" aria-hidden />
              </>
            )}
          </button>
        </div>

        <p className="env-hint env-photo__hint" aria-hidden>
          {wedding.cover.curtainPrompt}
        </p>
      </div>

      {/* ── The CSS envelope (tablet and up) ── */}
      <div ref={stageRef} className="env-stage" aria-hidden={opened}>
        <div className="envelope">
          <div className="env-body" />
          <span className="env-fold env-fold--left" aria-hidden />
          <span className="env-fold env-fold--right" aria-hidden />

          <div ref={letterRef} className="env-letter">
            <p className="text-[0.5rem] tracking-[0.3em] uppercase text-[#8a6a2a]">
              {wedding.cover.subtitle}
            </p>
            <p className="font-display text-lg font-semibold tracking-wide text-[#26231b]">
              {wedding.bride.shortName}
            </p>
            <p className="font-arabic text-sm text-[#8a6a2a]">&amp;</p>
            <p className="font-display text-lg font-semibold tracking-wide text-[#26231b]">
              {wedding.groom.shortName}
            </p>
            <span className="mt-1 block h-px w-10 bg-[rgba(120,90,29,0.45)]" />
            <p className="text-[0.5rem] tracking-[0.22em] uppercase text-[#6b5b42]">
              {wedding.weddingDateLabel}
            </p>
          </div>

          <span className="env-fold env-fold--bottom" aria-hidden />
          <div ref={flapRef} className="env-flap">
            <span className="env-flap__face env-flap__face--front" />
            <span className="env-flap__face env-flap__face--back" />
          </div>

          <button
            ref={sealRef}
            type="button"
            onClick={openEnvelope}
            className="env-seal"
            aria-label="Open the invitation"
            disabled={opened}
          >
            {!opened && (
              <>
                <span className="env-halo" aria-hidden />
                <span className="env-halo" aria-hidden />
              </>
            )}
            <SealMark />
          </button>

          <p ref={hintRef} className="env-hint" aria-hidden>
            {wedding.cover.curtainPrompt}
          </p>
        </div>
      </div>

      {/* ── What the letter becomes ── */}
      <div
        ref={cardRef}
        className="env-slot flex w-full flex-col items-center gap-5 text-center"
        aria-hidden={!opened}
        inert={!opened}
      >
        <div className="hero-card w-full max-w-84 px-6 py-9 sm:max-w-md sm:px-11 sm:py-12">
          <span className="corner-mark corner-mark--tl" aria-hidden />
          <span className="corner-mark corner-mark--tr" aria-hidden />
          <span className="corner-mark corner-mark--bl" aria-hidden />
          <span className="corner-mark corner-mark--br" aria-hidden />

          <div className="relative z-1">
            <div className="hero-line flex justify-center">
              <Emblem786 />
            </div>

            <p className="hero-line mt-4 font-arabic text-base leading-loose text-gold-deep sm:mt-5 sm:text-xl">
              {wedding.quran.cover.arabic}
            </p>

            <GoldDivider className="hero-line" />

            <p className="hero-line text-[0.55rem] tracking-[0.28em] uppercase text-[#26231b]/80 sm:text-[0.62rem] sm:tracking-[0.38em]">
              {wedding.cover.subtitle}
            </p>

            <h1 className="hero-line mt-4 font-display text-2xl font-semibold tracking-wider text-[#26231b] sm:mt-5 sm:text-4xl">
              {wedding.bride.displayName}
            </h1>
            <p
              className="hero-line my-1.5 font-arabic text-xl text-gold-deep sm:my-2 sm:text-3xl"
              aria-hidden
            >
              &amp;
            </p>
            <h1 className="hero-line font-display text-2xl font-semibold tracking-wider text-[#26231b] sm:text-4xl">
              {wedding.groom.displayName}
            </h1>

            <GoldDivider className="hero-line" />

            <p className="hero-line font-display text-sm tracking-wide text-[#26231b]/90 sm:text-base">
              {wedding.weddingDateLabel}
            </p>
            <p className="hero-line mt-1 text-[0.7rem] text-[#26231b]/80 sm:text-xs">
              {wedding.ceremonyName} &nbsp;·&nbsp; {wedding.weddingTimeLabel}
            </p>
            <p className="hero-line mt-1 text-[0.7rem] text-[#26231b]/78 sm:text-xs">
              {wedding.venue.name}, {wedding.venue.location}
            </p>

            <button
              type="button"
              onClick={() => scrollToSection("welcome")}
              className="hero-line btn-gold mt-7"
            >
              View Invitation
            </button>
          </div>
        </div>

        <div ref={cueRef} className="flex shrink-0 justify-center">
          <button
            type="button"
            onClick={() => scrollToSection("welcome")}
            className="scroll-cue"
            aria-label="Scroll to the invitation"
          >
            <span className="scroll-cue__line" aria-hidden />
            <span className="text-[0.55rem] tracking-[0.3em] uppercase">Scroll</span>
          </button>
        </div>
      </div>
    </section>
  );
}
