import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { useMusic } from "@/context/MusicContext";
import { scrollToSection } from "@/components/shared/SmoothScroll";
import { Particles } from "@/components/shared/Particles";
import { GoldDivider } from "@/components/shared/GoldDivider";
import { Emblem786 } from "@/components/shared/Emblem";

/* Pleat highlights are baked into .curtain-fabric as a gradient; these are
   the extra hairlines that give each half its own irregular fold rhythm. */
const FOLDS_LEFT = [12, 27, 44, 61, 79];
const FOLDS_RIGHT = [21, 39, 56, 73, 88];

export function InvitationCover() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const valanceRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const { startMusic } = useMusic();

  useGSAP(
    () => {
      /* Hidden regardless of motion preference — the curtains cover it either
         way, and openCurtain() is what brings it back. */
      gsap.set([contentRef.current, cueRef.current], { opacity: 0 });

      if (prefersReducedMotion()) return;

      /* Seal breathes gently until tapped */
      gsap.to(promptRef.current, {
        scale: 1.045,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "center center",
      });

      /* Drapes stir almost imperceptibly, as heavy cloth does */
      gsap.to(".curtain-fabric", {
        scaleX: 1.012,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.6, from: "edges" },
      });
    },
    { scope: rootRef },
  );

  function openCurtain() {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpened(true);
    startMusic();

    if (prefersReducedMotion()) {
      gsap.set(stageRef.current, { display: "none" });
      gsap.set([contentRef.current, cueRef.current], { opacity: 1 });
      gsap.set(".hero-line", { opacity: 1, y: 0 });
      return;
    }

    const leftFabric = leftRef.current?.querySelector(".curtain-fabric");
    const rightFabric = rightRef.current?.querySelector(".curtain-fabric");

    const tl = gsap.timeline({
      /* Once the drapes are offstage they are pure overdraw — drop them. */
      onComplete: () => gsap.set(stageRef.current, { display: "none" }),
    });

    /* 1 — the seal is pressed and gives way */
    tl.to(promptRef.current, {
      scale: 0.82,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
    });

    /* 2 — light blooms behind the seam, then settles as the room opens up */
    tl.fromTo(
      glowRef.current,
      { scale: 0.12, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.1, ease: "power2.out" },
      0.15,
    ).to(glowRef.current, { opacity: 0, duration: 1.6, ease: "power1.inOut" }, 1.35);

    /* 3 — the valance lifts away first, so the halves aren't clipped by it */
    tl.to(valanceRef.current, { yPercent: -115, duration: 1.5, ease: "power2.inOut" }, 0.2);

    /* 4 — the halves draw outward. Slightly offset starts read as two hands
           rather than one mechanism. */
    tl.to(leftRef.current, { xPercent: -101, duration: 2.1, ease: "power2.inOut" }, 0.25).to(
      rightRef.current,
      { xPercent: 101, duration: 2.1, ease: "power2.inOut" },
      0.36,
    );

    /* 5 — meanwhile the cloth gathers toward each outer edge. This is what
           sells it as fabric instead of two sliding panels. */
    tl.to([leftFabric, rightFabric], { scaleX: 0.62, duration: 2.1, ease: "power2.in" }, 0.25).to(
      [leftFabric, rightFabric],
      {
        skewX: (i) => (i === 0 ? 1.6 : -1.6),
        duration: 1.05,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      },
      0.25,
    );

    /* 6 — a specular band rakes across each drape as it travels */
    tl.fromTo(
      ".curtain-sheen",
      { xPercent: (i) => (i === 0 ? -140 : 240), opacity: 0 },
      {
        xPercent: (i) => (i === 0 ? 240 : -140),
        opacity: 1,
        duration: 1.5,
        ease: "power1.inOut",
      },
      0.3,
    ).to(".curtain-sheen", { opacity: 0, duration: 0.5 }, 1.5);

    /* 7 — the card resolves out of the light: blur is what makes a crossfade
           read as one object arriving rather than two overlapping. */
    tl.fromTo(
      contentRef.current,
      { opacity: 0, scale: 0.94, filter: "blur(12px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.out" },
      1.0,
    );

    tl.fromTo(
      ".hero-line",
      { opacity: 0, y: 30, filter: "blur(5px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
      },
      1.25,
    );

    tl.to(cueRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" }, 2.5);
  }

  return (
    <section ref={rootRef} id="cover" aria-label="Invitation cover" className="hero-scene">
      <div className="hero-bg absolute inset-0" aria-hidden />
      <div className="hero-aurora" aria-hidden />
      <div className="hero-scrim" aria-hidden />
      <div className="hero-vignette" aria-hidden />
      <Particles />

      {/* Normal flow, not `absolute inset-0` — pinned to exactly 100svh the card
          was clipped at the top on short viewports (landscape phones). This lets
          the hero grow instead. */}
      <div
        ref={contentRef}
        className="relative z-20 flex min-h-svh flex-col items-center justify-center gap-5 px-5 py-10 text-center sm:px-6 sm:py-14"
        aria-hidden={!opened}
        inert={!opened}
      >
        <div className="relative w-full max-w-[22rem] sm:max-w-md">
          <div className="hero-frame" aria-hidden>
            <span className="corner-mark corner-mark--tl" />
            <span className="corner-mark corner-mark--tr" />
            <span className="corner-mark corner-mark--bl" />
            <span className="corner-mark corner-mark--br" />
          </div>

          <div className="relative z-10 px-7 py-10 sm:px-12 sm:py-14">
            <div className="hero-line flex justify-center">
              <Emblem786 />
            </div>

            <p className="hero-line mt-4 font-arabic text-base leading-loose text-gold-deep sm:mt-5 sm:text-xl">
              {wedding.quran.cover.arabic}
            </p>

            <GoldDivider className="hero-line" />

            <p className="hero-line text-[0.55rem] tracking-[0.28em] uppercase text-forest/80 sm:text-[0.62rem] sm:tracking-[0.38em]">
              {wedding.cover.subtitle}
            </p>

            <h1 className="hero-line mt-4 font-display text-2xl font-semibold tracking-wider text-forest sm:mt-5 sm:text-4xl">
              {wedding.bride.displayName}
            </h1>
            <p
              className="hero-line my-1.5 font-arabic text-xl text-gold-deep sm:my-2 sm:text-3xl"
              aria-hidden
            >
              &amp;
            </p>
            <h1 className="hero-line font-display text-2xl font-semibold tracking-wider text-forest sm:text-4xl">
              {wedding.groom.displayName}
            </h1>

            <GoldDivider className="hero-line" />

            <p className="hero-line font-display text-sm tracking-wide text-forest/90 sm:text-base">
              {wedding.weddingDateLabel}
            </p>
            <p className="hero-line mt-1 text-[0.7rem] text-forest/80 sm:text-xs">
              {wedding.ceremonyName} &nbsp;·&nbsp; {wedding.weddingTimeLabel}
            </p>
            <p className="hero-line mt-1 text-[0.7rem] text-forest/78 sm:text-xs">
              {wedding.venue.name}, {wedding.venue.location}
            </p>

            <button
              type="button"
              onClick={() => scrollToSection("welcome")}
              className="hero-line btn-gold mt-8"
            >
              View Invitation
            </button>
          </div>
        </div>

        {/* Stacked under the card rather than pinned to the viewport floor —
            on a tall hero the two were colliding at the card's bottom edge. */}
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

      <div ref={stageRef} className="curtain-stage" aria-hidden>
        <div ref={glowRef} className="curtain-glow" />

        <div ref={leftRef} className="curtain-half left">
          <div className="curtain-fabric">
            {FOLDS_LEFT.map((pos) => (
              <span
                key={pos}
                className="absolute top-0 bottom-0 w-px bg-[#35735b]/20"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>
          <div className="curtain-sheen" style={{ left: 0 }} />
          <div className="curtain-edge" />
        </div>

        <div ref={rightRef} className="curtain-half right">
          <div className="curtain-fabric">
            {FOLDS_RIGHT.map((pos) => (
              <span
                key={pos}
                className="absolute top-0 bottom-0 w-px bg-[#35735b]/20"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>
          <div className="curtain-sheen" style={{ right: 0 }} />
          <div className="curtain-edge" />
        </div>

        <div ref={valanceRef} className="curtain-valance" />
      </div>

      {!opened && (
        <>
          <button
            type="button"
            onClick={openCurtain}
            className="curtain-hit"
            aria-label="Open the invitation"
          />

          <div ref={promptRef} className="curtain-prompt" aria-hidden>
            <div className="flex flex-col items-center gap-5">
              <div className="seal">
                <span className="seal__halo" />
                <span className="seal__halo" />
                <span className="seal__inner">
                  <span className="seal__mono">
                    {wedding.monogram.left}&amp;{wedding.monogram.right}
                  </span>
                </span>
              </div>
              <p className="text-[0.55rem] tracking-[0.25em] uppercase text-forest/80 sm:text-[0.6rem] sm:tracking-[0.35em]">
                {wedding.cover.curtainPrompt}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
