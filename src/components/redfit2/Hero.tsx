import { useEffect, useRef, useState } from "react";
import SplitType from "split-type";
import { gsap, ScrollTrigger, initGsap } from "@/lib/gsap-init";
import SideRays from "@/components/SideRays";

const HERO_SCROLL_LENGTH = "+=250%";

function LiveCount() {
  const [n, setN] = useState(47);
  useEffect(() => {
    const id = setInterval(
      () => setN((v) => Math.max(30, Math.min(78, v + (Math.random() > 0.5 ? 1 : -1)))),
      8000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <b>{n}</b> Training now · 4.9★ on Google
    </>
  );
}

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const raysWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGsap();
    if (!rootRef.current) return;
    const root = rootRef.current;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Split only static headline lines
    const staticLines = root.querySelectorAll<HTMLElement>(".rf-hero-line.rf-hero-static-line");
    let split: SplitType | null = null;
    if (staticLines.length) {
      split = new SplitType(Array.from(staticLines), { types: "words,chars" });
      gsap.set(split.chars, { yPercent: 110, opacity: 0 });
    }

    // Swap words
    const allWords = root.querySelectorAll<HTMLElement>(".rf-hero-headline .rf-swap-word");
    gsap.set(allWords, { opacity: (i) => (i === 0 ? 1 : 0), y: 0 });
    const holder = root.querySelector<HTMLElement>(".rf-swap-word-holder");
    if (holder) gsap.set(holder, { yPercent: 100, opacity: 0 });

    // Timer-based word rotation: 1.5s interval, 0.6s crossfade
    let currentWordIdx = 0;
    let rotateInterval: number | undefined;
    if (!reduceMotion && allWords.length > 1) {
      rotateInterval = window.setInterval(() => {
        const current = allWords[currentWordIdx];
        const nextIdx = (currentWordIdx + 1) % allWords.length;
        const next = allWords[nextIdx];
        gsap.to(current, { y: -24, opacity: 0, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
        gsap.fromTo(next, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
        currentWordIdx = nextIdx;
      }, 1500);
    }

    // Cursor-reactive rays: clamped to ±2%, slow lerp
    const raysWrap = raysWrapRef.current;
    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    if (raysWrap && !reduceMotion && !("ontouchstart" in window)) {
      const MAX_OFFSET = 0.02;
      const raysX = gsap.quickTo(raysWrap, "x", { duration: 1.0, ease: "power3.out" });
      const raysY = gsap.quickTo(raysWrap, "y", { duration: 1.0, ease: "power3.out" });
      onPointerMove = (e: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const nx = gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, ((e.clientX - rect.left) / rect.width - 0.5) * MAX_OFFSET * 2);
        const ny = gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, ((e.clientY - rect.top) / rect.height - 0.5) * MAX_OFFSET * 2);
        raysX(nx * rect.width);
        raysY(ny * rect.height);
      };
      root.addEventListener("pointermove", onPointerMove);
    }

    const ctxAnim = gsap.context(() => {
      ScrollTrigger.matchMedia({
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)": () => {
          const inTl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
          if (split?.chars?.length) {
            inTl.to(split.chars, { yPercent: 0, opacity: 1, stagger: 0.024, duration: 1.1, ease: "power4.out" });
          }
          if (holder) {
            inTl.to(holder, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.6");
          }
          inTl
            .to(".rf-hero-eyebrow", { opacity: 1, y: 0, duration: 0.6 }, 0.2)
            .to(".rf-hero-counter", { opacity: 1, duration: 0.6 }, 0.4)
            .to(".rf-hero-sub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
            .to(".rf-hero-cta-row", { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
            .to(".rf-hero-scroll-hint", { opacity: 1, duration: 0.6 }, "-=0.4");

          // Dashboard
          const dash = root.querySelector<HTMLElement>(".rf-hero-dashboard");
          if (dash) {
            gsap.set(dash, { opacity: 0, x: 120, scale: 0.9, rotateY: 10, filter: "blur(10px)", transformPerspective: 900, transformOrigin: "center center" });
            gsap.to(dash, { opacity: 1, x: 0, scale: 1, rotateY: 4, filter: "blur(0px)", duration: 1.4, ease: "power3.out", delay: 0.35 });
          }
        },

        "(max-width: 767px) and (prefers-reduced-motion: no-preference)": () => {
          const inTl = gsap.timeline({ delay: 0.1, defaults: { ease: "power3.out" } });
          if (split?.chars?.length) {
            inTl.to(split.chars, { yPercent: 0, opacity: 1, stagger: 0.02, duration: 0.9 });
          }
          if (holder) {
            inTl.to(holder, { yPercent: 0, opacity: 1, duration: 0.8 }, "-=0.5");
          }
          inTl
            .to(".rf-hero-eyebrow", { opacity: 1, y: 0, duration: 0.5 }, 0.1)
            .to(".rf-hero-sub", { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
            .to(".rf-hero-cta-row", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
            .to(".rf-hero-counter", { opacity: 1, duration: 0.5 }, "-=0.3");

          const dashM = root.querySelector<HTMLElement>(".rf-hero-dashboard");
          if (dashM) {
            gsap.fromTo(dashM, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", delay: 0.3 });
          }
        },

        "(prefers-reduced-motion: reduce)": () => {
          gsap.set([".rf-hero-eyebrow", ".rf-hero-sub", ".rf-hero-cta-row", ".rf-hero-scroll-hint", ".rf-hero-counter"], { opacity: 1, y: 0 });
          gsap.set(".rf-hero-dashboard", { opacity: 1, x: 0, scale: 1, rotateY: 4, filter: "none" });
          if (split?.chars) gsap.set(split.chars, { opacity: 1, yPercent: 0 });
          if (holder) gsap.set(holder, { opacity: 1, yPercent: 0 });
          gsap.set(allWords, { opacity: (i) => (i === 0 ? 1 : 0), y: 0 });
        },
      });
    }, root);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    return () => {
      window.removeEventListener("load", onLoad);
      if (rotateInterval) window.clearInterval(rotateInterval);
      if (onPointerMove) root.removeEventListener("pointermove", onPointerMove);
      split?.revert();
      ctxAnim.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="rf-hero" aria-label="REDFIT hero">
      <div className="rf-hero-rays" ref={raysWrapRef}>
        <SideRays
          rayColor1="#8B0000"
          rayColor2="#B01030"
          origin="top-right"
          speed={2.5}
          intensity={2}
          spread={1.7}
          tilt={1}
          saturation={1.55}
          blend={1}
          falloff={4}
          opacity={1}
        />
      </div>
      <div className="rf-hero-vignette" />

      <div className="rf-hero-counter">
        <LiveCount />
      </div>

      <div className="rf-hero-content">
        <div className="rf-hero-eyebrow" style={{ transform: "translateY(10px)" }}>
          Chhatrapati Sambhajinagar · Est. Strength
        </div>

        <h1 className="rf-hero-headline">
          <span className="rf-hero-line rf-hero-static-line">Built</span>
          <span className="rf-hero-line rf-hero-static-line accent">Under</span>
          <span className="rf-hero-line">
            <span className="rf-swap-word-holder">
              <span className="rf-swap-word-ghost" aria-hidden="true">Discipline</span>
              <span className="rf-swap-word">Iron</span>
              <span className="rf-swap-word">Discipline</span>
              <span className="rf-swap-word">Pressure</span>
              <span className="rf-swap-word">Grit</span>
              <span className="rf-swap-word">Power</span>
              <span className="rf-swap-word">Strength</span>
            </span>
          </span>
        </h1>

        <p className="rf-hero-sub" style={{ transform: "translateY(10px)" }}>
          Forged to last. A premium strength gym engineered around real training — Red Strength equipment,
          certified coaches, and a room that respects the work.
        </p>

        <div className="rf-hero-cta-row" style={{ transform: "translateY(10px)" }}>
          <a href="#pricing" className="rf-btn accent">Start Free Trial →</a>
          <a href="#programs" className="rf-btn ghost">See Programs</a>
        </div>
      </div>
      <div className="rf-hero-scroll-hint">Scroll · Load the Bar</div>
    </section>
  );
}
